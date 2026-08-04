"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const openai_1 = __importDefault(require("openai"));
let openaiClient = null;
if (process.env.OPENAI_API_KEY) {
    openaiClient = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
}
class AIService {
    /**
     * Evaluates recovery likelihood score & action plan
     */
    static async analyzeCase(caseData) {
        if (openaiClient) {
            try {
                const prompt = `You are an expert debt recovery AI consultant for field collection executives.
Analyze the following loan case:
- Customer: ${caseData.customerName}
- Outstanding POS: ₹${caseData.totalPOS}
- DPD: ${caseData.dpd} (${caseData.bucket})
- Current Status: ${caseData.status}
- Portfolio: ${caseData.portfolioName}
- Recent Remarks: ${caseData.lastRemarks || 'No recent remarks'}

Respond strictly in valid JSON format:
{
  "score": number between 10 and 95,
  "summary": "3-bullet concise case summary",
  "recommendation": "Next strategic step for field visit/call",
  "script": "Empathetic yet firm negotiation script for executive"
}`;
                const response = await openaiClient.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }],
                    response_format: { type: 'json_object' }
                });
                const content = response.choices[0]?.message?.content;
                if (content) {
                    const parsed = JSON.parse(content);
                    return {
                        score: parsed.score || 50,
                        summary: parsed.summary || 'Case imported recently.',
                        recommendation: parsed.recommendation || 'Plan field visit within 48 hours.',
                        script: parsed.script || 'Negotiate settlement or EMI structure.'
                    };
                }
            }
            catch (err) {
                console.warn('[AI Service] OpenAI API error, using heuristic fallback:', err);
            }
        }
        // Heuristic AI Fallback Algorithm
        let score = 85;
        if (caseData.dpd > 90)
            score -= 40;
        else if (caseData.dpd > 60)
            score -= 25;
        else if (caseData.dpd > 30)
            score -= 10;
        if (caseData.status === 'PTP')
            score += 15;
        if (caseData.status === 'Unreachable')
            score -= 20;
        if (caseData.status === 'Dispute')
            score -= 25;
        score = Math.max(10, Math.min(98, score));
        const summary = `1. ${caseData.bucket} case with ₹${caseData.totalPOS.toLocaleString('en-IN')} outstanding. 2. Current status: ${caseData.status}. 3. Priority focus area: ${caseData.dpd > 60 ? 'Immediate hard recovery / co-borrower escalation' : 'PTP conversion and settlement discussion'}.`;
        let recommendation = 'Schedule personal home/office visit with Google Maps navigation.';
        if (caseData.dpd > 90) {
            recommendation = 'Involve Team Lead for formal legal notice reminder & co-borrower meeting.';
        }
        else if (caseData.status === 'PTP') {
            recommendation = 'Send WhatsApp reminder for promise date and collect via UPI / QR.';
        }
        const script = `Hello Mr./Ms. ${caseData.customerName}, I am reaching out regarding your account under ${caseData.portfolioName} with an overdue balance of ₹${caseData.totalPOS.toLocaleString('en-IN')}. We understand unexpected financial situations arise, but resolving this balance today prevents credit score impact. Let's set up a partial payment or immediate EMI structure right now.`;
        return {
            score,
            summary,
            recommendation,
            script
        };
    }
    /**
     * Generates custom negotiation script based on customer objection
     */
    static async generateScript(objectionType, customerName, amount) {
        const scriptsMap = {
            'Job Loss': `Mr./Ms. ${customerName}, we genuinely empathize with your employment transition. However, to keep your loan account out of legal NPA status, our risk committee allows a token payment of ₹${(amount * 0.2).toFixed(0)} today with rest rescheduled over 3 months. Let me issue a formal acknowledgment receipt immediately.`,
            'Medical Emergency': `Mr./Ms. ${customerName}, health is the priority. To ensure no recovery team visits your home during this sensitive time, let's lock in a temporary grace period by clearing just the principal overdue of ₹${(amount * 0.15).toFixed(0)} right now online.`,
            'Dispute on Charges': `Mr./Ms. ${customerName}, I hear your concern regarding penalty charges. I am authorizing a waiver request for up to 50% of penalty fees right here in my executive app, provided you clear the core principal of ₹${amount.toLocaleString('en-IN')} today.`,
            'Refused to Pay': `Mr./Ms. ${customerName}, please note that non-cooperation on this ₹${amount.toLocaleString('en-IN')} balance triggers automated credit bureau reporting and legal notice dispatch to your employer and co-borrower address. Let us avoid this today by agreeing on a structured resolution.`
        };
        return scriptsMap[objectionType] || scriptsMap['Refused to Pay'];
    }
}
exports.AIService = AIService;
