export interface User {
  id: string;
  name: string;
  email: string;
  agentCode: string;
  role: 'Executive' | 'TeamLead' | 'Admin';
}

export interface CollectionCase {
  _id: string;
  accountNo: string;
  feName?: string;
  portfolioName: string;
  bankName?: string;
  customerName: string;
  phone: string;
  altPhone?: string;
  email?: string;
  address: string;
  city: string;
  pincode: string;
  location?: {
    coordinates: [number, number]; // [lng, lat]
  };
  totalPOS: number;
  tos?: number;
  principalDue: number;
  interestDue: number;
  penaltyCharges: number;
  dpd: number;
  bucket: '1-30 DPD' | '31-60 DPD' | '61-90 DPD' | '90+ DPD (NPA)';
  emiAmount: number;
  minDue?: number;
  coBorrowerName?: string;
  coBorrowerPhone?: string;
  coBorrowerRelation?: string;
  status: 'Pending' | 'Visited' | 'Call_Done' | 'PTP' | 'Broken_PTP' | 'Paid' | 'Settlement_Requested' | 'Dispute' | 'Unreachable' | 'Escalated';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  lastActionDate?: string;
  nextFollowUpDate?: string;
  ptpDate?: string;
  ptpAmount?: number;
  recoveryLikelihoodScore?: number;
  aiSummary?: string;
  aiRecommendation?: string;
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CallLog {
  _id: string;
  case: string;
  callDate: string;
  callType: 'Incoming' | 'Outgoing';
  outcome: 'PTP' | 'No_Answer' | 'Refused_To_Pay' | 'Callback_Requested' | 'Wrong_Number' | 'Paid';
  remarks: string;
  ptpAmount?: number;
  ptpDate?: string;
}

export interface VisitLog {
  _id: string;
  case: string;
  visitDate: string;
  addressVisited: string;
  personMet: string;
  outcome: 'PTP' | 'Premises_Locked' | 'Customer_Not_Available' | 'Paid_Cash' | 'Paid_Digital' | 'Refused' | 'Dispute';
  paymentReceived: number;
  paymentMode?: string;
  receiptNo?: string;
  remarks: string;
}

export interface Payment {
  _id: string;
  case: string;
  amount: number;
  paymentDate: string;
  paymentMode: string;
  receiptNo: string;
  status: string;
}

export interface DashboardKPIs {
  totalCases: number;
  totalPOS: number;
  totalCollected: number;
  ptpCasesCount: number;
  paidCasesCount: number;
  recoveryPercentage: number;
}

export interface PortfolioSummary {
  _id: string;
  name: string;
  bankName?: string;
  totalCases: number;
  totalPOS: number;
}

export interface OptimizedRoute {
  sortedWaypoints: {
    id: string;
    customerName: string;
    address: string;
    lat: number;
    lng: number;
    totalPOS: number;
    dpd: number;
  }[];
  totalDistanceKm: number;
  estimatedDurationMin: number;
  googleNavUrl: string;
}

export interface AIPriorityScore {
  score: number; // 0-100
  badge: 'Critical' | 'High' | 'Medium' | 'Low';
  badgeColor: string;
  recommendedTimeSlot: string;
  recoveryChancePct: number;
}

export interface MissionSummary {
  targetVisits: number;
  estimatedCollection: number;
  expectedCompletionTime: string;
  totalDistanceKm: number;
  fuelEstimateRs: number;
  recoveryProbabilityPct: number;
  highPriorityCasesCount: number;
  settlementFollowupsCount: number;
  ptpDueTodayCount: number;
  brokenPtpCount: number;
  highDpdCasesCount: number;
  highPosCasesCount: number;
  unvisitedCasesCount: number;
  nearGpsCasesCount: number;
  aiCompletionConfidencePct: number;
}

export interface LiveProgress {
  completedVisits: number;
  remainingVisits: number;
  distanceCoveredKm: number;
  distanceRemainingKm: number;
  collectionTodayRs: number;
  avgVisitTimeMin: number;
  avgTravelTimeMin: number;
  currentLocationName: string;
  nextCustomerName: string;
  estimatedFinishTime: string;
}

export interface VisitTimelineItem {
  id: string;
  timeSlot: string;
  timeBlock: 'Morning' | 'Afternoon' | 'Evening';
  customerName: string;
  accountNo: string;
  phone: string;
  address: string;
  city: string;
  totalPOS: number;
  tos?: number;
  dpd: number;
  status: string;
  priorityScore: number;
  priorityBadge: 'Critical' | 'High' | 'Medium' | 'Low';
  actionType: 'Visit immediately' | 'Call before visit' | 'Settlement follow-up' | 'PTP reminder';
  lat: number;
  lng: number;
  isCompleted?: boolean;
  isSkipped?: boolean;
}

export interface EndOfDayReport {
  completedVisits: number;
  pendingVisits: number;
  totalPaymentsCollected: number;
  ptpSecuredCount: number;
  settlementsAgreedCount: number;
  distanceCoveredKm: number;
  travelTimeMins: number;
  fuelCostRs: number;
  recoveryPercentage: number;
  aiPerformanceScore: number;
  tomorrowSuggestedPlanSummary: string;
}

export interface DayRoutePlan {
  dayNumber: number;
  title: string;
  routeClusterName: string;
  totalCases: number;
  totalPOS: number;
  targetCollection: number;
  estimatedKm: number;
  fuelRs: number;
  criticalCasesCount: number;
  cases: CollectionCase[];
}

export interface MultiDayVisitPlan {
  totalPendingCases: number;
  totalDaysNeeded: number;
  totalPortfolioPOS: number;
  totalTargetCollection: number;
  dailyCapacity: number;
  dayPlans: DayRoutePlan[];
}
