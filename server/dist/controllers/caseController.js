"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCases = getCases;
exports.getCaseById = getCaseById;
exports.createCase = createCase;
exports.updateCase = updateCase;
exports.deleteCase = deleteCase;
exports.analyzeCaseAI = analyzeCaseAI;
const Case_1 = __importDefault(require("../models/Case"));
const CallLog_1 = __importDefault(require("../models/CallLog"));
const VisitLog_1 = __importDefault(require("../models/VisitLog"));
const Payment_1 = __importDefault(require("../models/Payment"));
const aiService_1 = require("../services/aiService");
async function getCases(request, reply) {
    try {
        const userId = request.user.id;
        const { search = '', portfolio = '', bucket = '', status = '', priority = '', pincode = '', minPOS = 0, maxPOS = 100000000, sortBy = 'updatedAt', sortOrder = 'desc', page = 1, limit = 50 } = request.query;
        const query = { user: userId };
        if (portfolio && portfolio !== 'All') {
            query.portfolioName = portfolio;
        }
        if (bucket && bucket !== 'All') {
            query.bucket = bucket;
        }
        if (status && status !== 'All') {
            query.status = status;
        }
        if (priority && priority !== 'All') {
            query.priority = priority;
        }
        if (pincode) {
            query.pincode = pincode;
        }
        if (minPOS > 0 || maxPOS < 100000000) {
            query.totalPOS = { $gte: Number(minPOS), $lte: Number(maxPOS) };
        }
        if (search) {
            query.$or = [
                { customerName: { $regex: search, $options: 'i' } },
                { accountNo: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } },
                { pincode: { $regex: search, $options: 'i' } }
            ];
        }
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(200, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;
        const [cases, totalCount] = await Promise.all([
            Case_1.default.find(query).sort(sortOptions).skip(skip).limit(limitNum).lean(),
            Case_1.default.countDocuments(query)
        ]);
        return reply.send({
            cases,
            pagination: {
                total: totalCount,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(totalCount / limitNum)
            }
        });
    }
    catch (error) {
        return reply.status(500).send({ error: 'Failed to fetch cases', message: error.message });
    }
}
async function getCaseById(request, reply) {
    try {
        const userId = request.user.id;
        const { id } = request.params;
        const caseDoc = await Case_1.default.findOne({ _id: id, user: userId }).lean();
        if (!caseDoc) {
            return reply.status(404).send({ error: 'Case not found' });
        }
        const [callLogs, visitLogs, payments] = await Promise.all([
            CallLog_1.default.find({ case: id, user: userId }).sort({ createdAt: -1 }).lean(),
            VisitLog_1.default.find({ case: id, user: userId }).sort({ createdAt: -1 }).lean(),
            Payment_1.default.find({ case: id, user: userId }).sort({ createdAt: -1 }).lean()
        ]);
        return reply.send({
            case: caseDoc,
            history: {
                callLogs,
                visitLogs,
                payments
            }
        });
    }
    catch (error) {
        return reply.status(500).send({ error: 'Failed to fetch case details', message: error.message });
    }
}
async function createCase(request, reply) {
    try {
        const userId = request.user.id;
        const body = request.body;
        const newCase = await Case_1.default.create({
            ...body,
            user: userId
        });
        return reply.status(201).send({ message: 'Case created successfully', case: newCase });
    }
    catch (error) {
        return reply.status(500).send({ error: 'Failed to create case', message: error.message });
    }
}
async function updateCase(request, reply) {
    try {
        const userId = request.user.id;
        const { id } = request.params;
        const body = request.body;
        const updatedCase = await Case_1.default.findOneAndUpdate({ _id: id, user: userId }, { $set: body }, { new: true });
        if (!updatedCase) {
            return reply.status(404).send({ error: 'Case not found' });
        }
        return reply.send({ message: 'Case updated successfully', case: updatedCase });
    }
    catch (error) {
        return reply.status(500).send({ error: 'Failed to update case', message: error.message });
    }
}
async function deleteCase(request, reply) {
    try {
        const userId = request.user.id;
        const { id } = request.params;
        const deleted = await Case_1.default.findOneAndDelete({ _id: id, user: userId });
        if (!deleted) {
            return reply.status(404).send({ error: 'Case not found' });
        }
        return reply.send({ message: 'Case deleted successfully' });
    }
    catch (error) {
        return reply.status(500).send({ error: 'Failed to delete case', message: error.message });
    }
}
async function analyzeCaseAI(request, reply) {
    try {
        const userId = request.user.id;
        const { id } = request.params;
        const caseDoc = await Case_1.default.findOne({ _id: id, user: userId });
        if (!caseDoc) {
            return reply.status(404).send({ error: 'Case not found' });
        }
        const lastCall = await CallLog_1.default.findOne({ case: id }).sort({ createdAt: -1 });
        const aiAnalysis = await aiService_1.AIService.analyzeCase({
            customerName: caseDoc.customerName,
            totalPOS: caseDoc.totalPOS,
            dpd: caseDoc.dpd,
            bucket: caseDoc.bucket,
            status: caseDoc.status,
            portfolioName: caseDoc.portfolioName,
            lastRemarks: lastCall?.remarks
        });
        caseDoc.recoveryLikelihoodScore = aiAnalysis.score;
        caseDoc.aiSummary = aiAnalysis.summary;
        caseDoc.aiRecommendation = aiAnalysis.recommendation;
        await caseDoc.save();
        return reply.send({
            message: 'AI Analysis complete',
            analysis: aiAnalysis,
            case: caseDoc
        });
    }
    catch (error) {
        return reply.status(500).send({ error: 'AI analysis failed', message: error.message });
    }
}
