import mongoose, { Schema, Document } from 'mongoose';

export interface IPortfolio extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  bankName?: string;
  totalCases: number;
  totalPOS: number;
  activeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    bankName: { type: String, trim: true },
    totalCases: { type: Number, default: 0 },
    totalPOS: { type: Number, default: 0 },
    activeCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

PortfolioSchema.index({ user: 1, name: 1 }, { unique: true });

export default mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);
