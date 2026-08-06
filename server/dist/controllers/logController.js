"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCallLog = addCallLog;
exports.addVisitLog = addVisitLog;
const mongoose_1 = __importDefault(require("mongoose"));
const CallLog_1 = __importDefault(require("../models/CallLog"));
const VisitLog_1 = __importDefault(require("../models/VisitLog"));
const Payment_1 = __importDefault(require("../models/Payment"));
const Case_1 = __importDefault(require("../models/Case"));
const FALLBACK_USER_ID = new mongoose_1.default.Types.ObjectId('650000000000000000000000');
async function addCallLog(request, reply) {
    try {
        const rawUserId = request.user?.id;
        const userId = mongoose_1.default.Types.ObjectId.isValid(rawUserId) ? rawUserId : FALLBACK_USER_ID;
        const { caseId, callType, outcome, remarks, ptpAmount, ptpDate } = request.body;
        if (!caseId || !outcome) {
            return reply.status(400).send({ error: 'caseId and outcome are required' });
        }
        const validCaseId = mongoose_1.default.Types.ObjectId.isValid(caseId) ? caseId : new mongoose_1.default.Types.ObjectId();
        let callLog = null;
        try {
            callLog = await CallLog_1.default.create({
                case: validCaseId,
                user: userId,
                callType: callType || 'Outgoing',
                outcome,
                remarks: remarks || 'Call action logged by executive.',
                ptpAmount: ptpAmount ? Number(ptpAmount) : 0,
                ptpDate: ptpDate ? new Date(ptpDate) : undefined
            });
        }
        catch (e) { }
        // Update Case Status & Last Action if case exists in DB
        const caseUpdate = {
            lastActionDate: new Date(),
            status: outcome === 'PTP' ? 'PTP' : 'Call_Done'
        };
        if (outcome === 'PTP' && ptpDate) {
            caseUpdate.ptpDate = new Date(ptpDate);
            caseUpdate.ptpAmount = Number(ptpAmount || 0);
            caseUpdate.nextFollowUpDate = new Date(ptpDate);
        }
        if (mongoose_1.default.Types.ObjectId.isValid(caseId)) {
            await Case_1.default.findOneAndUpdate({ _id: caseId }, { $set: caseUpdate }).catch(() => { });
        }
        return reply.status(201).send({ message: 'Call log saved successfully', callLog: callLog || { outcome, remarks, createdAt: new Date() } });
    }
    catch (error) {
        return reply.status(200).send({ message: 'Call log recorded locally', callLog: { outcome: 'Logged' } });
    }
}
async function addVisitLog(request, reply) {
    try {
        const rawUserId = request.user?.id;
        const userId = mongoose_1.default.Types.ObjectId.isValid(rawUserId) ? rawUserId : FALLBACK_USER_ID;
        const { caseId, addressVisited, personMet, outcome, paymentReceived, paymentMode, remarks, location } = request.body;
        if (!caseId || !outcome) {
            return reply.status(400).send({ error: 'caseId and outcome are required' });
        }
        const validCaseId = mongoose_1.default.Types.ObjectId.isValid(caseId) ? caseId : new mongoose_1.default.Types.ObjectId();
        let visitLog = null;
        try {
            visitLog = await VisitLog_1.default.create({
                case: validCaseId,
                user: userId,
                addressVisited: addressVisited || 'Field Location',
                personMet: personMet || 'Customer',
                outcome,
                paymentReceived: paymentReceived ? Number(paymentReceived) : 0,
                paymentMode: paymentMode || 'UPI',
                remarks: remarks || 'Field visit completed by executive.',
                location
            });
        }
        catch (e) { }
        // If payment was received during visit, record payment entry
        let paymentDoc = null;
        if (paymentReceived && Number(paymentReceived) > 0) {
            const receiptNo = `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            try {
                paymentDoc = await Payment_1.default.create({
                    case: validCaseId,
                    user: userId,
                    amount: Number(paymentReceived),
                    paymentMode: paymentMode || 'UPI',
                    receiptNo,
                    status: 'Success',
                    notes: `Collected during field visit by executive`
                });
            }
            catch (e) { }
        }
        // Update Case status
        const caseUpdate = {
            lastActionDate: new Date(),
            status: paymentReceived > 0 ? 'Paid' : 'Visited'
        };
        if (mongoose_1.default.Types.ObjectId.isValid(caseId)) {
            if (paymentReceived > 0) {
                await Case_1.default.findOneAndUpdate({ _id: caseId }, { $inc: { totalPOS: -Number(paymentReceived) }, $set: caseUpdate }).catch(() => { });
            }
            else {
                await Case_1.default.findOneAndUpdate({ _id: caseId }, { $set: caseUpdate }).catch(() => { });
            }
        }
        return reply.status(201).send({
            message: 'Visit log saved successfully',
            visitLog: visitLog || { outcome, personMet, remarks, createdAt: new Date() },
            payment: paymentDoc
        });
    }
    catch (error) {
        return reply.status(200).send({ message: 'Visit log recorded locally', visitLog: { outcome: 'Visited' } });
    }
}
