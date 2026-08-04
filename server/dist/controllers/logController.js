"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCallLog = addCallLog;
exports.addVisitLog = addVisitLog;
const CallLog_1 = __importDefault(require("../models/CallLog"));
const VisitLog_1 = __importDefault(require("../models/VisitLog"));
const Payment_1 = __importDefault(require("../models/Payment"));
const Case_1 = __importDefault(require("../models/Case"));
async function addCallLog(request, reply) {
    try {
        const userId = request.user.id;
        const { caseId, callType, outcome, remarks, ptpAmount, ptpDate } = request.body;
        if (!caseId || !outcome || !remarks) {
            return reply.status(400).send({ error: 'caseId, outcome, and remarks are required' });
        }
        const callLog = await CallLog_1.default.create({
            case: caseId,
            user: userId,
            callType: callType || 'Outgoing',
            outcome,
            remarks,
            ptpAmount: ptpAmount ? Number(ptpAmount) : 0,
            ptpDate: ptpDate ? new Date(ptpDate) : undefined
        });
        // Update Case Status & Last Action
        const caseUpdate = {
            lastActionDate: new Date(),
            status: outcome === 'PTP' ? 'PTP' : 'Call_Done'
        };
        if (outcome === 'PTP' && ptpDate) {
            caseUpdate.ptpDate = new Date(ptpDate);
            caseUpdate.ptpAmount = Number(ptpAmount || 0);
            caseUpdate.nextFollowUpDate = new Date(ptpDate);
        }
        await Case_1.default.findOneAndUpdate({ _id: caseId, user: userId }, { $set: caseUpdate });
        return reply.status(201).send({ message: 'Call log saved successfully', callLog });
    }
    catch (error) {
        return reply.status(500).send({ error: 'Failed to add call log', message: error.message });
    }
}
async function addVisitLog(request, reply) {
    try {
        const userId = request.user.id;
        const { caseId, addressVisited, personMet, outcome, paymentReceived, paymentMode, remarks, location } = request.body;
        if (!caseId || !outcome || !remarks) {
            return reply.status(400).send({ error: 'caseId, outcome, and remarks are required' });
        }
        const visitLog = await VisitLog_1.default.create({
            case: caseId,
            user: userId,
            addressVisited,
            personMet,
            outcome,
            paymentReceived: paymentReceived ? Number(paymentReceived) : 0,
            paymentMode,
            remarks,
            location
        });
        // If payment was received during visit, record payment entry
        let paymentDoc = null;
        if (paymentReceived && Number(paymentReceived) > 0) {
            const receiptNo = `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            paymentDoc = await Payment_1.default.create({
                case: caseId,
                user: userId,
                amount: Number(paymentReceived),
                paymentMode: paymentMode || 'Cash',
                receiptNo,
                status: 'Success',
                notes: `Collected during field visit by executive`
            });
        }
        // Update Case status
        const caseUpdate = {
            lastActionDate: new Date(),
            status: paymentReceived > 0 ? 'Paid' : 'Visited'
        };
        if (paymentReceived > 0) {
            await Case_1.default.findOneAndUpdate({ _id: caseId, user: userId }, { $inc: { totalPOS: -Number(paymentReceived) }, $set: caseUpdate });
        }
        else {
            await Case_1.default.findOneAndUpdate({ _id: caseId, user: userId }, { $set: caseUpdate });
        }
        return reply.status(201).send({ message: 'Visit log saved successfully', visitLog, payment: paymentDoc });
    }
    catch (error) {
        return reply.status(500).send({ error: 'Failed to add visit log', message: error.message });
    }
}
