import { CollectionCase, AIPriorityScore, MissionSummary, LiveProgress, VisitTimelineItem, EndOfDayReport } from '../types';

export class AIPriorityEngine {
  /**
   * Calculate 0-100 AI Priority Score and Badge for a case
   */
  static calculatePriorityScore(c: CollectionCase, distanceKm?: number): AIPriorityScore {
    const posVal = c.totalPOS || 0;
    const dpdVal = c.dpd || 0;

    // 1. POS Weight (Max 30 points)
    const posScore = Math.min(30, (posVal / 100000) * 30);

    // 2. DPD Urgency Weight (Max 30 points)
    const dpdScore = Math.min(30, (dpdVal / 180) * 30);

    // 3. Status & PTP Commitment Weight (Max 25 points)
    let statusScore = 10;
    if (c.status === 'PTP') statusScore = 25;
    else if (c.status === 'Pending') statusScore = 18;
    else if (c.status === 'Visited') statusScore = 12;

    // 4. Proximity Distance Weight (Max 15 points)
    const distScore = distanceKm !== undefined ? Math.max(0, 15 - distanceKm * 0.75) : 10;

    const totalScore = Math.min(99, Math.max(15, Math.round(posScore + dpdScore + statusScore + distScore)));

    let badge: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';
    let badgeColor = '#06b6d4';

    if (totalScore >= 78 || dpdVal >= 90) {
      badge = 'Critical';
      badgeColor = '#ef4444';
    } else if (totalScore >= 60 || posVal >= 75000) {
      badge = 'High';
      badgeColor = '#f59e0b';
    } else if (totalScore >= 40) {
      badge = 'Medium';
      badgeColor = '#06b6d4';
    } else {
      badge = 'Low';
      badgeColor = '#64748b';
    }

    const recoveryChancePct = Math.min(95, Math.max(20, Math.round(100 - dpdVal * 0.45)));
    const timeSlots = ['09:00 AM - 09:45 AM', '10:00 AM - 10:45 AM', '11:15 AM - 12:00 PM', '02:00 PM - 02:45 PM', '04:15 PM - 05:00 PM'];
    const slotIdx = Math.abs(totalScore) % timeSlots.length;

    return {
      score: totalScore,
      badge,
      badgeColor,
      recommendedTimeSlot: timeSlots[slotIdx],
      recoveryChancePct
    };
  }

  /**
   * Generate Mission Summary Metrics for Today's Command Center
   */
  static generateMissionSummary(cases: CollectionCase[], targetVisitsCount: number = 12): MissionSummary {
    const totalPOS = cases.reduce((sum, c) => sum + (c.totalPOS || 0), 0);
    const estimatedCollection = Math.round(totalPOS * 0.28);
    const totalDist = Math.round(cases.length * 2.8 + 12);
    const fuelEst = Math.round(totalDist * 3.8); // ₹3.8 per km fuel estimate

    const highPriorityCasesCount = cases.filter((c) => (c.dpd || 0) >= 60 || (c.totalPOS || 0) >= 50000).length;
    const settlementFollowupsCount = cases.filter((c) => c.status === 'Settlement_Requested' || (c.dpd || 0) >= 90).length;
    const ptpDueTodayCount = cases.filter((c) => c.status === 'PTP').length;
    const brokenPtpCount = cases.filter((c) => c.status === 'PTP' && (c.dpd || 0) >= 90).length;
    const highDpdCasesCount = cases.filter((c) => (c.dpd || 0) >= 90).length;
    const highPosCasesCount = cases.filter((c) => (c.totalPOS || 0) >= 100000).length;
    const unvisitedCasesCount = cases.filter((c) => c.status === 'Pending').length;
    const nearGpsCasesCount = Math.min(cases.length, 6);

    return {
      targetVisits: targetVisitsCount,
      estimatedCollection,
      expectedCompletionTime: '05:30 PM',
      totalDistanceKm: totalDist,
      fuelEstimateRs: fuelEst,
      recoveryProbabilityPct: 78,
      highPriorityCasesCount,
      settlementFollowupsCount,
      ptpDueTodayCount,
      brokenPtpCount,
      highDpdCasesCount,
      highPosCasesCount,
      unvisitedCasesCount,
      nearGpsCasesCount,
      aiCompletionConfidencePct: 92
    };
  }

  /**
   * Generate Structured Visit Timeline Items
   */
  static generateVisitTimeline(cases: CollectionCase[]): VisitTimelineItem[] {
    const timeSchedule = [
      { slot: '09:00 AM', block: 'Morning' as const },
      { slot: '09:45 AM', block: 'Morning' as const },
      { slot: '10:30 AM', block: 'Morning' as const },
      { slot: '11:15 AM', block: 'Morning' as const },
      { slot: '12:00 PM', block: 'Afternoon' as const },
      { slot: '02:00 PM', block: 'Afternoon' as const },
      { slot: '02:45 PM', block: 'Afternoon' as const },
      { slot: '03:30 PM', block: 'Afternoon' as const },
      { slot: '04:30 PM', block: 'Evening' as const },
      { slot: '05:15 PM', block: 'Evening' as const }
    ];

    return cases.slice(0, 10).map((c, idx) => {
      const schedule = timeSchedule[idx % timeSchedule.length];
      const priorityInfo = this.calculatePriorityScore(c);

      let action: 'Visit immediately' | 'Call before visit' | 'Settlement follow-up' | 'PTP reminder' = 'Visit immediately';
      if (c.status === 'PTP') action = 'PTP reminder';
      else if ((c.dpd || 0) >= 90) action = 'Settlement follow-up';
      else if ((c.totalPOS || 0) >= 75000) action = 'Call before visit';

      return {
        id: c._id,
        timeSlot: schedule.slot,
        timeBlock: schedule.block,
        customerName: c.customerName,
        accountNo: c.accountNo,
        phone: c.phone || '9876543210',
        address: c.address,
        city: c.city || 'Kozhikode',
        totalPOS: c.totalPOS,
        tos: c.tos,
        dpd: c.dpd,
        status: c.status,
        priorityScore: priorityInfo.score,
        priorityBadge: priorityInfo.badge,
        actionType: action,
        lat: c.location?.coordinates?.[1] || 11.2588,
        lng: c.location?.coordinates?.[0] || 75.7804
      };
    });
  }

  /**
   * Generate End of Day Performance Summary Report
   */
  static generateEndOfDayReport(cases: CollectionCase[], completedCount: number, collectedAmount: number): EndOfDayReport {
    const totalVisits = cases.length || 10;
    const pendingVisits = Math.max(0, totalVisits - completedCount);
    const distKm = Math.round(completedCount * 3.4);
    const travelMins = Math.round(distKm * 2.8);
    const fuelCost = Math.round(distKm * 3.8);
    const recoveryPct = Math.min(100, Math.round((collectedAmount / Math.max(1, cases.reduce((s, c) => s + c.totalPOS, 0))) * 100));

    return {
      completedVisits: completedCount,
      pendingVisits,
      totalPaymentsCollected: collectedAmount,
      ptpSecuredCount: Math.round(completedCount * 0.4),
      settlementsAgreedCount: Math.round(completedCount * 0.2),
      distanceCoveredKm: distKm,
      travelTimeMins: travelMins,
      fuelCostRs: fuelCost,
      recoveryPercentage: recoveryPct,
      aiPerformanceScore: 88,
      tomorrowSuggestedPlanSummary: `Prioritize 4 broken PTP cases in Kozhikode North. Recommended starting time: 08:45 AM to maximize morning contact rate.`
    };
  }
}
