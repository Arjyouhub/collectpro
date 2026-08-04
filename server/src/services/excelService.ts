import * as XLSX from 'xlsx';

export interface ExcelRow {
  [key: string]: any;
}

export interface ColumnMapping {
  feName?: string;       // FE NAME -> feName
  accountNo: string;     // KBLoanID -> accountNo
  customerName: string;  // CX NAME -> customerName
  phone: string;         // PH NUMBER -> phone
  totalPOS: string;      // POS -> totalPOS
  tos?: string;          // TOS -> tos
  dpd: string;           // DPD -> dpd
  city: string;          // CITY -> city
  pincode: string;       // Pincode -> pincode
  address: string;       // ADDRESS -> address
  portfolioName?: string;
  bankName?: string;
}

export interface ImportSummary {
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  duplicateRows: number;
  validationErrors: string[];
}

export class ExcelService {
  /**
   * Reads raw buffer of uploaded Excel / CSV file and returns worksheet headers & preview rows
   */
  static parsePreview(buffer: Buffer): { headers: string[]; previewRows: ExcelRow[]; totalRows: number; isMissingRequired: boolean; suggestedMapping: ColumnMapping } {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const rawData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    if (!rawData || rawData.length === 0) {
      throw new Error('Excel file is empty or invalid.');
    }

    const headers = Object.keys(rawData[0]);
    const previewRows = rawData.slice(0, 5);
    const suggestedMapping = this.autoMapHeaders(headers);

    // Required fields check: customerName and accountNo MUST be mapped
    const isMissingRequired = !suggestedMapping.customerName || !suggestedMapping.accountNo;

    return {
      headers,
      previewRows,
      totalRows: rawData.length,
      isMissingRequired,
      suggestedMapping
    };
  }

  /**
   * Header Auto-Mapper strictly adhering to naming rules
   * NEVER maps "FE NAME" as customerName.
   * ALWAYS uses "CX NAME" for customerName.
   */
  static autoMapHeaders(headers: string[]): ColumnMapping {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

    const mapping: ColumnMapping = {
      feName: '',
      accountNo: '',
      customerName: '',
      phone: '',
      address: '',
      pincode: '',
      city: '',
      totalPOS: '',
      tos: '',
      dpd: ''
    };

    headers.forEach((h) => {
      const norm = normalize(h);

      // 1. Field Executive Name (FE NAME)
      if (!mapping.feName && (norm === 'fename' || norm.startsWith('fe') || norm.includes('fieldexecutive') || norm.includes('agentname'))) {
        mapping.feName = h;
      }
      // 2. Customer Name (CX NAME - CRITICAL: Exclude FE NAME!)
      else if (!mapping.customerName && (norm === 'cxname' || norm.includes('cx') || norm.includes('customername') || norm.includes('borrowername')) && !norm.includes('fe')) {
        mapping.customerName = h;
      }
      // 3. Account / Loan ID (KBLoanID)
      else if (!mapping.accountNo && (norm === 'kbloanid' || norm.includes('loanid') || norm.includes('accountno') || norm.includes('accno') || norm.includes('caseid'))) {
        mapping.accountNo = h;
      }
      // 4. Phone Number (PH NUMBER)
      else if (!mapping.phone && (norm === 'phnumber' || norm.includes('phone') || norm.includes('mobile') || norm.includes('contact'))) {
        mapping.phone = h;
      }
      // 5. Address (ADDRESS)
      else if (!mapping.address && (norm === 'address' || norm.includes('location') || norm.includes('residence'))) {
        mapping.address = h;
      }
      // 6. Pincode (Pincode)
      else if (!mapping.pincode && (norm === 'pincode' || norm.includes('zip') || norm.includes('pin'))) {
        mapping.pincode = h;
      }
      // 7. City (CITY)
      else if (!mapping.city && (norm === 'city' || norm.includes('town') || norm.includes('district'))) {
        mapping.city = h;
      }
      // 8. Principal Outstanding (POS)
      else if (!mapping.totalPOS && (norm === 'pos' || norm.includes('outstanding') || norm.includes('balance') || norm.includes('due'))) {
        mapping.totalPOS = h;
      }
      // 9. Total Outstanding (TOS)
      else if (!mapping.tos && (norm === 'tos' || norm.includes('totaloutstanding'))) {
        mapping.tos = h;
      }
      // 10. Days Past Due (DPD)
      else if (!mapping.dpd && (norm === 'dpd' || norm.includes('overdue') || norm.includes('days') || norm.includes('bucket'))) {
        mapping.dpd = h;
      }
    });

    // Fallback search if exact "CX NAME" wasn't caught by norm check above
    if (!mapping.customerName) {
      const cxHeader = headers.find(h => {
        const n = normalize(h);
        return (n.includes('cx') || n.includes('customer') || n.includes('client')) && !n.includes('fe');
      });
      if (cxHeader) mapping.customerName = cxHeader;
    }

    // NO arbitrary position fallbacks! If not mapped, keep blank so mapping UI opens.
    return mapping;
  }

  /**
   * Processes Excel rows with strict row-by-row validation & summary accounting
   */
  static processRows(
    buffer: Buffer,
    mapping: ColumnMapping,
    defaultPortfolioName: string,
    userId: string
  ): { processedCases: any[]; summary: ImportSummary } {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    const totalRows = rawRows.length;
    const processedCases: any[] = [];
    const seenLoanIds = new Set<string>();
    const validationErrors: string[] = [];

    let skippedRows = 0;
    let duplicateRows = 0;

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2; // Excel row index 1-based header is line 1

      // 1. Extract Customer Name (CX NAME)
      const customerName = mapping.customerName && row[mapping.customerName]
        ? String(row[mapping.customerName]).trim()
        : '';

      // VALIDATION RULE: If Customer Name is empty, skip that row and display an error
      if (!customerName) {
        skippedRows++;
        validationErrors.push(`Row ${rowNum}: Skipped due to missing Customer Name (${mapping.customerName || 'CX NAME'}).`);
        return;
      }

      // 2. Extract Loan ID (KBLoanID)
      const accountNo = mapping.accountNo && row[mapping.accountNo]
        ? String(row[mapping.accountNo]).trim()
        : `ACC-${Date.now()}-${idx}`;

      // VALIDATION RULE: Check for duplicate Loan IDs within the sheet
      if (seenLoanIds.has(accountNo)) {
        duplicateRows++;
        skippedRows++;
        validationErrors.push(`Row ${rowNum}: Duplicate Loan ID "${accountNo}" found in file.`);
        return;
      }
      seenLoanIds.add(accountNo);

      // 3. Extract FE Name (FE NAME - Field Executive)
      const feName = mapping.feName && row[mapping.feName]
        ? String(row[mapping.feName]).trim()
        : '';

      // 4. Other fields
      const phone = mapping.phone && row[mapping.phone] ? String(row[mapping.phone]).trim() : '9999999999';
      const address = mapping.address && row[mapping.address] ? String(row[mapping.address]).trim() : 'Address Pending';
      const city = mapping.city && row[mapping.city] ? String(row[mapping.city]).trim() : 'Delhi';
      const pincode = mapping.pincode && row[mapping.pincode] ? String(row[mapping.pincode]).trim() : '110001';

      const rawPOS = parseFloat(String(row[mapping.totalPOS || ''] || '0').replace(/[^0-9.]/g, '')) || 0;
      const rawTOS = parseFloat(String(row[mapping.tos || ''] || '0').replace(/[^0-9.]/g, '')) || rawPOS;
      const rawDPD = parseInt(String(row[mapping.dpd || ''] || '0').replace(/[^0-9]/g, '')) || 15;

      let bucket: '1-30 DPD' | '31-60 DPD' | '61-90 DPD' | '90+ DPD (NPA)' = '1-30 DPD';
      if (rawDPD > 90) bucket = '90+ DPD (NPA)';
      else if (rawDPD > 60) bucket = '61-90 DPD';
      else if (rawDPD > 30) bucket = '31-60 DPD';

      let priority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';
      if (rawDPD > 90 || rawPOS > 100000) priority = 'Critical';
      else if (rawDPD > 60 || rawPOS > 50000) priority = 'High';

      processedCases.push({
        user: userId,
        accountNo,
        feName,
        portfolioName: defaultPortfolioName,
        bankName: mapping.bankName ? String(row[mapping.bankName] || '').trim() : 'Bank/NBFC',
        customerName, // CX NAME ONLY
        phone,
        address,
        city,
        pincode,
        location: {
          type: 'Point',
          coordinates: [77.209 + (Math.random() - 0.5) * 0.1, 28.6139 + (Math.random() - 0.5) * 0.1]
        },
        totalPOS: rawPOS,
        tos: rawTOS,
        principalDue: Math.round(rawPOS * 0.85),
        interestDue: Math.round(rawPOS * 0.1),
        penaltyCharges: Math.round(rawPOS * 0.05),
        dpd: rawDPD,
        bucket,
        status: 'Pending',
        priority
      });
    });

    const summary: ImportSummary = {
      totalRows,
      importedRows: processedCases.length,
      skippedRows,
      duplicateRows,
      validationErrors
    };

    return { processedCases, summary };
  }
}
