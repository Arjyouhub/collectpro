"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = getDashboardStats;
const mongoose_1 = __importDefault(require("mongoose"));
const Case_1 = __importDefault(require("../models/Case"));
const Payment_1 = __importDefault(require("../models/Payment"));
const Portfolio_1 = __importDefault(require("../models/Portfolio"));
async function getDashboardStats(request, reply) {
    try {
        const userId = request.user.id;
        const userObjectId = mongoose_1.default.Types.ObjectId.isValid(userId) ? new mongoose_1.default.Types.ObjectId(userId) : userId;
        const [totalCases, ptpCasesCount, paidCasesCount, portfolioList, bucketAgg, statusAgg, paymentsAgg, totalPOSAgg] = await Promise.all([
            Case_1.default.countDocuments({ user: userId }),
            Case_1.default.countDocuments({ user: userId, status: 'PTP' }),
            Case_1.default.countDocuments({ user: userId, status: 'Paid' }),
            Portfolio_1.default.find({ user: userId }).lean(),
            Case_1.default.aggregate([
                { $match: { user: userObjectId } },
                { $group: { _id: '$bucket', count: { $sum: 1 }, totalPOS: { $sum: '$totalPOS' } } }
            ]),
            Case_1.default.aggregate([
                { $match: { user: userObjectId } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Payment_1.default.aggregate([
                { $match: { user: userObjectId, status: 'Success' } },
                { $group: { _id: null, totalCollected: { $sum: '$amount' } } }
            ]),
            Case_1.default.aggregate([
                { $match: { user: userObjectId } },
                { $group: { _id: null, totalPOS: { $sum: '$totalPOS' } } }
            ])
        ]);
        const totalPOS = totalPOSAgg[0]?.totalPOS || 0;
        const totalCollected = paymentsAgg[0]?.totalCollected || 0;
        const recoveryPercentage = totalPOS + totalCollected > 0 ? parseFloat(((totalCollected / (totalPOS + totalCollected)) * 100).toFixed(1)) : 0;
        return reply.send({
            kpis: {
                totalCases,
                totalPOS,
                totalCollected,
                ptpCasesCount,
                paidCasesCount,
                recoveryPercentage
            },
            portfolios: portfolioList,
            bucketBreakdown: bucketAgg,
            statusBreakdown: statusAgg
        });
    }
    catch (error) {
        return reply.status(500).send({ error: 'Failed to fetch analytics', message: error.message });
    }
}
