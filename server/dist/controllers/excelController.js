"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.previewExcel = previewExcel;
exports.commitExcel = commitExcel;
const excelService_1 = require("../services/excelService");
const Case_1 = __importDefault(require("../models/Case"));
const Portfolio_1 = __importDefault(require("../models/Portfolio"));
async function previewExcel(request, reply) {
    try {
        const data = await request.file();
        if (!data) {
            return reply.status(400).send({ error: 'No Excel or CSV file provided' });
        }
        const buffer = await data.toBuffer();
        const { headers, previewRows, totalRows, isMissingRequired, suggestedMapping } = excelService_1.ExcelService.parsePreview(buffer);
        return reply.send({
            filename: data.filename,
            headers,
            previewRows,
            totalRows,
            isMissingRequired,
            suggestedMapping
        });
    }
    catch (error) {
        return reply.status(500).send({ error: 'Failed to preview Excel file', message: error.message });
    }
}
async function commitExcel(request, reply) {
    try {
        const userId = request.user.id;
        const parts = request.parts();
        let fileBuffer = null;
        let payload = {};
        for await (const part of parts) {
            if (part.type === 'file') {
                fileBuffer = await part.toBuffer();
            }
            else {
                payload[part.fieldname] = part.value;
            }
        }
        if (!fileBuffer) {
            return reply.status(400).send({ error: 'Excel file buffer missing' });
        }
        const mapping = typeof payload.mapping === 'string' ? JSON.parse(payload.mapping) : payload.mapping;
        const portfolioName = payload.portfolioName || 'General Portfolio';
        const bankName = payload.bankName || 'Financial Institution';
        const { processedCases, summary } = excelService_1.ExcelService.processRows(fileBuffer, mapping, portfolioName, userId);
        if (processedCases.length > 0) {
            // Bulk upsert into MongoDB based on accountNo & user
            const bulkOps = processedCases.map(c => ({
                updateOne: {
                    filter: { user: userId, accountNo: c.accountNo },
                    update: { $set: c },
                    upsert: true
                }
            }));
            await Case_1.default.bulkWrite(bulkOps);
            // Update or create Portfolio summary
            const totalPOS = processedCases.reduce((acc, c) => acc + (c.totalPOS || 0), 0);
            await Portfolio_1.default.findOneAndUpdate({ user: userId, name: portfolioName }, {
                $set: { bankName },
                $inc: { totalCases: processedCases.length, totalPOS }
            }, { upsert: true, new: true });
        }
        return reply.send({
            message: `Processed ${summary.totalRows} rows: ${summary.importedRows} imported, ${summary.skippedRows} skipped.`,
            summary,
            portfolioName
        });
    }
    catch (error) {
        return reply.status(500).send({ error: 'Failed to commit Excel import', message: error.message });
    }
}
