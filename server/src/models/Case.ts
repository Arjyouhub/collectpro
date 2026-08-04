import mongoose, { Schema, Document } from 'mongoose';

export interface ICase extends Document {
  user: mongoose.Types.ObjectId;
  accountNo: string; // Loan ID / Card No / Account No
  feName?: string; // Field Executive Name
  portfolioName: string;
  bankName?: string;
  customerName: string;
  phone: string;
  altPhone?: string;
  email?: string;
  address: string;
  city: string;
  state?: string;
  pincode: string;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  totalPOS: number;
  tos?: number;
  principalDue: number;
  interestDue: number;
  penaltyCharges: number;
  dpd: number; // Days past due
  bucket: '1-30 DPD' | '31-60 DPD' | '61-90 DPD' | '90+ DPD (NPA)';
  emiAmount: number;
  minDue?: number;
  coBorrowerName?: string;
  coBorrowerPhone?: string;
  coBorrowerRelation?: string;
  status: 'Pending' | 'Visited' | 'Call_Done' | 'PTP' | 'Paid' | 'Settlement_Requested' | 'Dispute' | 'Unreachable' | 'Escalated';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  lastActionDate?: Date;
  nextFollowUpDate?: Date;
  ptpDate?: Date;
  ptpAmount?: number;
  recoveryLikelihoodScore?: number; // 0 to 100
  aiSummary?: string;
  aiRecommendation?: string;
  customFields?: Map<string, string | number>;
  createdAt: Date;
  updatedAt: Date;
}

const CaseSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountNo: { type: String, required: true, trim: true },
    feName: { type: String, trim: true },
    portfolioName: { type: String, required: true, trim: true, index: true },
    bankName: { type: String, trim: true },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    altPhone: { type: String, trim: true },
    email: { type: String, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    state: { type: String, trim: true },
    pincode: { type: String, required: true, trim: true, index: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [77.209, 28.6139] } // Default Delhi center [lng, lat]
    },
    totalPOS: { type: Number, required: true, default: 0, index: true },
    tos: { type: Number, default: 0 },
    principalDue: { type: Number, default: 0 },
    interestDue: { type: Number, default: 0 },
    penaltyCharges: { type: Number, default: 0 },
    dpd: { type: Number, required: true, default: 0, index: true },
    bucket: {
      type: String,
      enum: ['1-30 DPD', '31-60 DPD', '61-90 DPD', '90+ DPD (NPA)'],
      default: '1-30 DPD',
      index: true
    },
    emiAmount: { type: Number, default: 0 },
    minDue: { type: Number, default: 0 },
    coBorrowerName: { type: String, trim: true },
    coBorrowerPhone: { type: String, trim: true },
    coBorrowerRelation: { type: String, trim: true },
    status: {
      type: String,
      enum: ['Pending', 'Visited', 'Call_Done', 'PTP', 'Paid', 'Settlement_Requested', 'Dispute', 'Unreachable', 'Escalated'],
      default: 'Pending',
      index: true
    },
    priority: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low'],
      default: 'Medium',
      index: true
    },
    lastActionDate: { type: Date },
    nextFollowUpDate: { type: Date, index: true },
    ptpDate: { type: Date, index: true },
    ptpAmount: { type: Number, default: 0 },
    recoveryLikelihoodScore: { type: Number, default: 50 },
    aiSummary: { type: String },
    aiRecommendation: { type: String },
    customFields: { type: Map, of: Schema.Types.Mixed }
  },
  { timestamps: true }
);

// Compound indexes for ultra-fast queries & filtering
CaseSchema.index({ user: 1, accountNo: 1 }, { unique: true });
CaseSchema.index({ user: 1, portfolioName: 1, status: 1 });
CaseSchema.index({ user: 1, bucket: 1, totalPOS: -1 });
CaseSchema.index({ user: 1, pincode: 1 });
CaseSchema.index({ customerName: 'text', accountNo: 'text', phone: 'text', address: 'text' });
CaseSchema.index({ location: '2dsphere' });

export default mongoose.model<ICase>('Case', CaseSchema);
