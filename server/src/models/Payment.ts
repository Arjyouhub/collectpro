import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  case: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  amount: number;
  paymentDate: Date;
  paymentMode: 'UPI' | 'Cash' | 'Cheque' | 'NetBanking' | 'Card';
  transactionId?: string;
  receiptNo: string;
  status: 'Success' | 'Pending' | 'Failed';
  notes?: string;
  createdAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    case: { type: Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now },
    paymentMode: { type: String, enum: ['UPI', 'Cash', 'Cheque', 'NetBanking', 'Card'], required: true },
    transactionId: { type: String, trim: true },
    receiptNo: { type: String, required: true, unique: true },
    status: { type: String, enum: ['Success', 'Pending', 'Failed'], default: 'Success' },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

export default mongoose.model<IPayment>('Payment', PaymentSchema);
