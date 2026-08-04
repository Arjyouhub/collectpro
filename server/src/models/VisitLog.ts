import mongoose, { Schema, Document } from 'mongoose';

export interface IVisitLog extends Document {
  case: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  visitDate: Date;
  location?: {
    lat: number;
    lng: number;
  };
  addressVisited: string;
  personMet: string;
  outcome: 'PTP' | 'Premises_Locked' | 'Customer_Not_Available' | 'Paid_Cash' | 'Paid_Digital' | 'Refused' | 'Dispute';
  paymentReceived: number;
  paymentMode?: string;
  receiptNo?: string;
  remarks: string;
  photoUrl?: string;
  createdAt: Date;
}

const VisitLogSchema: Schema = new Schema(
  {
    case: { type: Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    visitDate: { type: Date, default: Date.now },
    location: {
      lat: { type: Number },
      lng: { type: Number }
    },
    addressVisited: { type: String, required: true },
    personMet: { type: String, required: true },
    outcome: {
      type: String,
      enum: ['PTP', 'Premises_Locked', 'Customer_Not_Available', 'Paid_Cash', 'Paid_Digital', 'Refused', 'Dispute'],
      required: true
    },
    paymentReceived: { type: Number, default: 0 },
    paymentMode: { type: String },
    receiptNo: { type: String },
    remarks: { type: String, required: true },
    photoUrl: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<IVisitLog>('VisitLog', VisitLogSchema);
