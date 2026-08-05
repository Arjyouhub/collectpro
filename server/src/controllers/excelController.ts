import { FastifyRequest, FastifyReply } from 'fastify';
import { ExcelService } from '../services/excelService';
import Case from '../models/Case';
import Portfolio from '../models/Portfolio';

export async function previewExcel(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No Excel or CSV file provided' });
    }

    const buffer = await data.toBuffer();
    const { headers, previewRows, totalRows, isMissingRequired, suggestedMapping } = ExcelService.parsePreview(buffer);

    return reply.send({
      filename: data.filename,
      headers,
      previewRows,
      totalRows,
      isMissingRequired,
      suggestedMapping
    });
  } catch (error: any) {
    return reply.status(500).send({ error: 'Failed to preview Excel file', message: error.message });
  }
}

export async function commitExcel(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any).id;
    const parts = request.parts();

    let fileBuffer: Buffer | null = null;
    let payload: any = {};

    for await (const part of parts) {
      if (part.type === 'file') {
        fileBuffer = await part.toBuffer();
      } else {
        payload[part.fieldname] = part.value;
      }
    }

    if (!fileBuffer) {
      return reply.status(400).send({ error: 'Excel file buffer missing' });
    }

    let mapping = payload.mapping ? (typeof payload.mapping === 'string' ? JSON.parse(payload.mapping) : payload.mapping) : null;
    if (!mapping) {
      const preview = ExcelService.parsePreview(fileBuffer);
      mapping = preview.suggestedMapping;
    }

    const portfolioName = payload.portfolioName || 'General Portfolio';
    const bankName = payload.bankName || 'Financial Institution';

    const { processedCases, summary } = ExcelService.processRows(fileBuffer, mapping, portfolioName, userId);

    if (processedCases.length > 0) {
      // Bulk upsert into MongoDB based on accountNo & user
      const bulkOps = processedCases.map(c => ({
        updateOne: {
          filter: { user: userId, accountNo: c.accountNo },
          update: { $set: c },
          upsert: true
        }
      }));

      await Case.bulkWrite(bulkOps);

      // Update or create Portfolio summary
      const totalPOS = processedCases.reduce((acc, c) => acc + (c.totalPOS || 0), 0);
      await Portfolio.findOneAndUpdate(
        { user: userId, name: portfolioName },
        {
          $set: { bankName },
          $inc: { totalCases: processedCases.length, totalPOS }
        },
        { upsert: true, new: true }
      );
    }

    return reply.send({
      message: `Processed ${summary.totalRows} rows: ${summary.importedRows} imported, ${summary.skippedRows} skipped.`,
      summary,
      portfolioName
    });
  } catch (error: any) {
    return reply.status(500).send({ error: 'Failed to commit Excel import', message: error.message });
  }
}
