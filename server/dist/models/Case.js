"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const CaseSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
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
        enum: ['Pending', 'Visited', 'Call_Done', 'PTP', 'Broken_PTP', 'Paid', 'Settlement_Requested', 'Dispute', 'Unreachable', 'Escalated'],
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
    customFields: { type: Map, of: mongoose_1.Schema.Types.Mixed }
}, { timestamps: true });
// Compound indexes for ultra-fast queries & filtering
CaseSchema.index({ user: 1, accountNo: 1 }, { unique: true });
CaseSchema.index({ user: 1, portfolioName: 1, status: 1 });
CaseSchema.index({ user: 1, bucket: 1, totalPOS: -1 });
CaseSchema.index({ user: 1, pincode: 1 });
CaseSchema.index({ user: 1, updatedAt: -1 });
CaseSchema.index({ user: 1, priority: 1 });
CaseSchema.index({ customerName: 'text', accountNo: 'text', phone: 'text', address: 'text' });
CaseSchema.index({ location: '2dsphere' });
exports.default = mongoose_1.default.model('Case', CaseSchema);
