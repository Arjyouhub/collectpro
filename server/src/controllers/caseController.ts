import { FastifyRequest, FastifyReply } from 'fastify';
import Case from '../models/Case';
import CallLog from '../models/CallLog';
import VisitLog from '../models/VisitLog';
import Payment from '../models/Payment';
import { AIService } from '../services/aiService';

export async function getCases(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any).id;
    const {
      search = '',
      portfolio = '',
      bucket = '',
      status = '',
      priority = '',
      pincode = '',
      minPOS = 0,
      maxPOS = 100000000,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      page = 1,
      limit = 50
    } = request.query as any;

    const query: any = { user: userId };

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
      const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { customerName: { $regex: escaped, $options: 'i' } },
        { accountNo: { $regex: escaped, $options: 'i' } },
        { phone: { $regex: escaped, $options: 'i' } },
        { address: { $regex: escaped, $options: 'i' } },
        { pincode: { $regex: escaped, $options: 'i' } }
      ];
    }

    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(200, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [cases, totalCount] = await Promise.all([
      Case.find(query).sort(sortOptions).skip(skip).limit(limitNum).lean(),
      Case.countDocuments(query)
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
  } catch (error: any) {
    return reply.status(500).send({ error: 'Failed to fetch cases', message: error.message });
  }
}

export async function getCaseById(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any).id;
    const { id } = request.params as any;

    const caseDoc = await Case.findOne({ _id: id, user: userId }).lean();
    if (!caseDoc) {
      return reply.status(404).send({ error: 'Case not found' });
    }

    const [callLogs, visitLogs, payments] = await Promise.all([
      CallLog.find({ case: id, user: userId }).sort({ createdAt: -1 }).lean(),
      VisitLog.find({ case: id, user: userId }).sort({ createdAt: -1 }).lean(),
      Payment.find({ case: id, user: userId }).sort({ createdAt: -1 }).lean()
    ]);

    return reply.send({
      case: caseDoc,
      history: {
        callLogs,
        visitLogs,
        payments
      }
    });
  } catch (error: any) {
    return reply.status(500).send({ error: 'Failed to fetch case details', message: error.message });
  }
}

export async function createCase(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any).id;
    const body = request.body as any;

    const newCase = await Case.create({
      ...body,
      user: userId
    });

    return reply.status(201).send({ message: 'Case created successfully', case: newCase });
  } catch (error: any) {
    return reply.status(500).send({ error: 'Failed to create case', message: error.message });
  }
}

export async function updateCase(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any).id;
    const { id } = request.params as any;
    const body = request.body as any;

    const updatedCase = await Case.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: body },
      { new: true }
    );

    if (!updatedCase) {
      return reply.status(404).send({ error: 'Case not found' });
    }

    return reply.send({ message: 'Case updated successfully', case: updatedCase });
  } catch (error: any) {
    return reply.status(500).send({ error: 'Failed to update case', message: error.message });
  }
}

export async function deleteCase(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any).id;
    const { id } = request.params as any;

    const deleted = await Case.findOneAndDelete({ _id: id, user: userId });
    if (!deleted) {
      return reply.status(404).send({ error: 'Case not found' });
    }

    return reply.send({ message: 'Case deleted successfully' });
  } catch (error: any) {
    return reply.status(500).send({ error: 'Failed to delete case', message: error.message });
  }
}

export async function analyzeCaseAI(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any).id;
    const { id } = request.params as any;

    const caseDoc = await Case.findOne({ _id: id, user: userId });
    if (!caseDoc) {
      return reply.status(404).send({ error: 'Case not found' });
    }

    const lastCall = await CallLog.findOne({ case: id }).sort({ createdAt: -1 });

    const aiAnalysis = await AIService.analyzeCase({
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
  } catch (error: any) {
    return reply.status(500).send({ error: 'AI analysis failed', message: error.message });
  }
}
