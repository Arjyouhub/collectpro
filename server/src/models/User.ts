import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'Executive' | 'TeamLead' | 'Admin';
  agentCode: string;
  activePortfolio?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, trim: true },
    role: { type: String, enum: ['Executive', 'TeamLead', 'Admin'], default: 'Executive' },
    agentCode: { type: String, required: true, unique: true, trim: true },
    activePortfolio: { type: String, default: 'All' }
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
