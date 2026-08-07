import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import Case from '../models/Case';
import Payment from '../models/Payment';
import Portfolio from '../models/Portfolio';

export async function getDashboardStats(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any).id;
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;

    const [
      totalCases,
      ptpCasesCount,
      paidCasesCount,
      portfolioList,
      bucketAgg,
      statusAgg,
      paymentsAgg,
      totalPOSAgg
    ] = await Promise.all([
      Case.countDocuments({ user: userId }),
      Case.countDocuments({ user: userId, status: 'PTP' }),
      Case.countDocuments({ user: userId, status: 'Paid' }),
      Portfolio.find({ user: userId }).lean(),
      Case.aggregate([
        { $match: { user: userObjectId } },
        { $group: { _id: '$bucket', count: { $sum: 1 }, totalPOS: { $sum: '$totalPOS' } } }
      ]),
      Case.aggregate([
        { $match: { user: userObjectId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Payment.aggregate([
        { $match: { user: userObjectId, status: 'Success' } },
        { $group: { _id: null, totalCollected: { $sum: '$amount' } } }
      ]),
      Case.aggregate([
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
  } catch (error: any) {
    return reply.status(500).send({ error: 'Failed to fetch analytics', message: error.message });
  }
}
