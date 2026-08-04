import mongoose, { Schema, Document } from 'mongoose';

export interface ICallLog extends Document {
  case: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  callDate: Date;
  callType: 'Incoming' | 'Outgoing';
  outcome: 'PTP' | 'No_Answer' | 'Refused_To_Pay' | 'Callback_Requested' | 'Wrong_Number' | 'Paid';
  remarks: string;
  ptpAmount?: number;
  ptpDate?: Date;
  aiExtractedKeywords?: string[];
  createdAt: Date;
}

const CallLogSchema: Schema = new Schema(
  {
    case: { type: Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    callDate: { type: Date, default: Date.now },
    callType: { type: String, enum: ['Incoming', 'Outgoing'], default: 'Outgoing' },
    outcome: {
      type: String,
      enum: ['PTP', 'No_Answer', 'Refused_To_Pay', 'Callback_Requested', 'Wrong_Number', 'Paid'],
      required: true
    },
    remarks: { type: String, required: true, trim: true },
    ptpAmount: { type: Number, default: 0 },
    ptpDate: { type: Date },
    aiExtractedKeywords: [{ type: String }]
  },
  { timestamps: true }
);

export default mongoose.model<ICallLog>('CallLog', CallLogSchema);
