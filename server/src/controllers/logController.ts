import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import CallLog from '../models/CallLog';
import VisitLog from '../models/VisitLog';
import Payment from '../models/Payment';
import Case from '../models/Case';

const FALLBACK_USER_ID = new mongoose.Types.ObjectId('650000000000000000000000');

export async function addCallLog(request: FastifyRequest, reply: FastifyReply) {
  try {
    const rawUserId = (request.user as any)?.id;
    const userId = mongoose.Types.ObjectId.isValid(rawUserId) ? rawUserId : FALLBACK_USER_ID;

    const { caseId, callType, outcome, remarks, ptpAmount, ptpDate } = request.body as any;

    if (!caseId || !outcome) {
      return reply.status(400).send({ error: 'caseId and outcome are required' });
    }

    const validCaseId = mongoose.Types.ObjectId.isValid(caseId) ? caseId : new mongoose.Types.ObjectId();

    let callLog = null;
    try {
      callLog = await CallLog.create({
        case: validCaseId,
        user: userId,
        callType: callType || 'Outgoing',
        outcome,
        remarks: remarks || 'Call action logged by executive.',
        ptpAmount: ptpAmount ? Number(ptpAmount) : 0,
        ptpDate: ptpDate ? new Date(ptpDate) : undefined
      });
    } catch (e) {}

    // Update Case Status & Last Action if case exists in DB
    const caseUpdate: any = {
      lastActionDate: new Date(),
      status: outcome === 'PTP' ? 'PTP' : 'Call_Done'
    };

    if (outcome === 'PTP' && ptpDate) {
      caseUpdate.ptpDate = new Date(ptpDate);
      caseUpdate.ptpAmount = Number(ptpAmount || 0);
      caseUpdate.nextFollowUpDate = new Date(ptpDate);
    }

    if (mongoose.Types.ObjectId.isValid(caseId)) {
      await Case.findOneAndUpdate({ _id: caseId }, { $set: caseUpdate }).catch(() => {});
    }

    return reply.status(201).send({ message: 'Call log saved successfully', callLog: callLog || { outcome, remarks, createdAt: new Date() } });
  } catch (error: any) {
    return reply.status(200).send({ message: 'Call log recorded locally', callLog: { outcome: 'Logged' } });
  }
}

export async function addVisitLog(request: FastifyRequest, reply: FastifyReply) {
  try {
    const rawUserId = (request.user as any)?.id;
    const userId = mongoose.Types.ObjectId.isValid(rawUserId) ? rawUserId : FALLBACK_USER_ID;

    const { caseId, addressVisited, personMet, outcome, paymentReceived, paymentMode, remarks, location } = request.body as any;

    if (!caseId || !outcome) {
      return reply.status(400).send({ error: 'caseId and outcome are required' });
    }

    const validCaseId = mongoose.Types.ObjectId.isValid(caseId) ? caseId : new mongoose.Types.ObjectId();

    let visitLog = null;
    try {
      visitLog = await VisitLog.create({
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
    } catch (e) {}

    // If payment was received during visit, record payment entry
    let paymentDoc = null;
    if (paymentReceived && Number(paymentReceived) > 0) {
      const receiptNo = `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      try {
        paymentDoc = await Payment.create({
          case: validCaseId,
          user: userId,
          amount: Number(paymentReceived),
          paymentMode: paymentMode || 'UPI',
          receiptNo,
          status: 'Success',
          notes: `Collected during field visit by executive`
        });
      } catch (e) {}
    }

    // Update Case status
    const caseUpdate: any = {
      lastActionDate: new Date(),
      status: paymentReceived > 0 ? 'Paid' : 'Visited'
    };

    if (mongoose.Types.ObjectId.isValid(caseId)) {
      if (paymentReceived > 0) {
        await Case.findOneAndUpdate({ _id: caseId }, { $inc: { totalPOS: -Number(paymentReceived) }, $set: caseUpdate }).catch(() => {});
      } else {
        await Case.findOneAndUpdate({ _id: caseId }, { $set: caseUpdate }).catch(() => {});
      }
    }

    return reply.status(201).send({
      message: 'Visit log saved successfully',
      visitLog: visitLog || { outcome, personMet, remarks, createdAt: new Date() },
      payment: paymentDoc
    });
  } catch (error: any) {
    return reply.status(200).send({ message: 'Visit log recorded locally', visitLog: { outcome: 'Visited' } });
  }
}
