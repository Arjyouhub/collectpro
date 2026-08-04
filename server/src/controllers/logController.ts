import { FastifyRequest, FastifyReply } from 'fastify';
import CallLog from '../models/CallLog';
import VisitLog from '../models/VisitLog';
import Payment from '../models/Payment';
import Case from '../models/Case';

export async function addCallLog(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any).id;
    const { caseId, callType, outcome, remarks, ptpAmount, ptpDate } = request.body as any;

    if (!caseId || !outcome || !remarks) {
      return reply.status(400).send({ error: 'caseId, outcome, and remarks are required' });
    }

    const callLog = await CallLog.create({
      case: caseId,
      user: userId,
      callType: callType || 'Outgoing',
      outcome,
      remarks,
      ptpAmount: ptpAmount ? Number(ptpAmount) : 0,
      ptpDate: ptpDate ? new Date(ptpDate) : undefined
    });

    // Update Case Status & Last Action
    const caseUpdate: any = {
      lastActionDate: new Date(),
      status: outcome === 'PTP' ? 'PTP' : 'Call_Done'
    };

    if (outcome === 'PTP' && ptpDate) {
      caseUpdate.ptpDate = new Date(ptpDate);
      caseUpdate.ptpAmount = Number(ptpAmount || 0);
      caseUpdate.nextFollowUpDate = new Date(ptpDate);
    }

    await Case.findOneAndUpdate({ _id: caseId, user: userId }, { $set: caseUpdate });

    return reply.status(201).send({ message: 'Call log saved successfully', callLog });
  } catch (error: any) {
    return reply.status(500).send({ error: 'Failed to add call log', message: error.message });
  }
}

export async function addVisitLog(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any).id;
    const { caseId, addressVisited, personMet, outcome, paymentReceived, paymentMode, remarks, location } = request.body as any;

    if (!caseId || !outcome || !remarks) {
      return reply.status(400).send({ error: 'caseId, outcome, and remarks are required' });
    }

    const visitLog = await VisitLog.create({
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
      paymentDoc = await Payment.create({
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
    const caseUpdate: any = {
      lastActionDate: new Date(),
      status: paymentReceived > 0 ? 'Paid' : 'Visited'
    };

    if (paymentReceived > 0) {
      await Case.findOneAndUpdate({ _id: caseId, user: userId }, { $inc: { totalPOS: -Number(paymentReceived) }, $set: caseUpdate });
    } else {
      await Case.findOneAndUpdate({ _id: caseId, user: userId }, { $set: caseUpdate });
    }

    return reply.status(201).send({ message: 'Visit log saved successfully', visitLog, payment: paymentDoc });
  } catch (error: any) {
    return reply.status(500).send({ error: 'Failed to add visit log', message: error.message });
  }
}
