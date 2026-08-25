import * as XLSX from 'xlsx';
import { OFIIFieldKey } from '../types';

export interface OFIIFieldDefinition {
  key: OFIIFieldKey;
  label: string;
  required: boolean;
  category: 'Required' | 'Identification' | 'Cargo' | 'Delivery' | 'POD';
  description: string;
  aliases: string[];
}

export const OFII_FIELD_DEFINITIONS: OFIIFieldDefinition[] = [
  {
    key: 'client',
    label: 'Client / Account',
    required: true,
    category: 'Required',
    description: 'Name of the client enterprise (e.g. Vamsler, RefaMED, PCSO)',
    aliases: ['client', 'client name', 'customer', 'customer name', 'account', 'shipper', 'principal'],
  },
  {
    key: 'consignee',
    label: 'Consignee',
    required: true,
    category: 'Required',
    description: 'Recipient business or store name',
    aliases: ['consignee', 'receiver', 'recipient', 'deliver to', 'consignee name', 'destination store', 'store'],
  },
  {
    key: 'modeOfShipment',
    label: 'Mode of Shipment',
    required: true,
    category: 'Required',
    description: 'Transport method: Sea Freight, Air Freight, RORO, or Land Freight',
    aliases: ['mode', 'mode of shipment', 'shipment mode', 'transport mode', 'freight mode', 'service type', 'shipping mode'],
  },
  {
    key: 'area',
    label: 'Area',
    required: true,
    category: 'Required',
    description: 'Philippine destination zone: Luzon, Visayas, Mindanao, or NCR',
    aliases: ['area', 'region', 'destination area', 'zone', 'island group', 'philippine area'],
  },
  {
    key: 'referenceNumber',
    label: 'Reference Number',
    required: true,
    category: 'Required',
    description: 'Unique project code or shipment reference (e.g. PRJ-ISCI-101)',
    aliases: ['reference number', 'ref no', 'ref no.', 'ref number', 'reference no', 'reference no.', 'project code', 'ref', 'so number', 'sales order'],
  },
  {
    key: 'actualDispatchDate',
    label: 'Actual Dispatched Date',
    required: true,
    category: 'Required',
    description: 'Date freight left origin hub (YYYY-MM-DD)',
    aliases: ['dispatch date', 'actual dispatch date', 'actual dispatched date', 'dispatched date', 'departure date', 'date dispatched', 'ship date', 'etd'],
  },
  {
    key: 'podNumber',
    label: 'POD Number',
    required: false,
    category: 'Identification',
    description: 'Proof of Delivery document number (e.g. POD-10293)',
    aliases: ['pod', 'pod number', 'pod no', 'pod no.', 'dr number', 'dr no', 'delivery receipt'],
  },
  {
    key: 'awbCourierRefNumber',
    label: 'AWB / Courier Ref No.',
    required: false,
    category: 'Identification',
    description: 'Air Waybill, Bill of Lading, or carrier tracking number',
    aliases: ['awb', 'awb number', 'air waybill', 'waybill', 'courier ref', 'courier reference', 'tracking number', 'bl number', 'bill of lading'],
  },
  {
    key: 'quantity',
    label: 'Quantity (Cases / Boxes)',
    required: false,
    category: 'Cargo',
    description: 'Number of boxes or packages',
    aliases: ['quantity', 'qty', 'cases', 'boxes', 'packages', 'pkgs', 'pieces', 'units', 'cartons'],
  },
  {
    key: 'unit',
    label: 'Unit of Measure',
    required: false,
    category: 'Cargo',
    description: 'Package unit (Boxes, Cases, Pallets, Bundles)',
    aliases: ['unit', 'uom', 'package unit', 'unit of measure'],
  },
  {
    key: 'destinationCode',
    label: 'Destination / Port Code',
    required: false,
    category: 'Cargo',
    description: 'Specific port or city code (e.g. CEB-01, DVO-HUB, ILO-02)',
    aliases: ['destination', 'destination code', 'dest code', 'port code', 'city', 'hub', 'destination city', 'terminal'],
  },
  {
    key: 'courier',
    label: 'Courier / Forwarder',
    required: false,
    category: 'Cargo',
    description: 'Logistics provider or trucker (e.g. OFII Fleet, 2GO, LBC)',
    aliases: ['courier', 'forwarder', 'carrier', 'trucker', 'logistics provider', 'transporter'],
  },
  {
    key: 'deliveryStatus',
    label: 'Delivery Status',
    required: false,
    category: 'Delivery',
    description: 'Delivered, In Transit, Pending Delivery, or Delayed',
    aliases: ['delivery status', 'status', 'shipment status', 'current status'],
  },
  {
    key: 'actualDeliveryDate',
    label: 'Actual Delivery Date',
    required: false,
    category: 'Delivery',
    description: 'Date package was received by consignee (YYYY-MM-DD)',
    aliases: ['actual delivery date', 'delivery date', 'date delivered', 'delivered date', 'received date'],
  },
  {
    key: 'receiversName',
    label: "Receiver's Name",
    required: false,
    category: 'Delivery',
    description: 'Name of the person who signed at destination',
    aliases: ['receiver', 'receivers name', "receiver's name", 'received by', 'signatory', 'consignee receiver'],
  },
  {
    key: 'dateOfPodReturn',
    label: 'Date of POD Return',
    required: false,
    category: 'POD',
    description: 'Date signed hardcopy POD was returned to OFII hub',
    aliases: ['pod return date', 'date of pod return', 'pod date', 'pod received date', 'date pod returned'],
  },
  {
    key: 'cbm',
    label: 'CBM (Cubic Meters)',
    required: false,
    category: 'Cargo',
    description: 'Cubic volume for Sea Freight',
    aliases: ['cbm', 'volume cbm', 'cubic meter', 'cubic meters'],
  },
  {
    key: 'actualWeightKg',
    label: 'Actual Weight (KG)',
    required: false,
    category: 'Cargo',
    description: 'Gross cargo weight in kilograms',
    aliases: ['actual weight', 'weight', 'weight kg', 'weight (kg)', 'gross weight', 'actual weight kg'],
  },
  {
    key: 'volumeWeightKg',
    label: 'Volume Weight (KG)',
    required: false,
    category: 'Cargo',
    description: 'Volumetric weight for Air Freight',
    aliases: ['volume weight', 'volumetric weight', 'vol weight', 'volume weight kg'],
  },
  {
    key: 'chargeableWeightFees',
    label: 'Chargeable Fees / Freight Rate',
    required: false,
    category: 'Cargo',
    description: 'Billed amount (e.g. PHP 25,000.00)',
    aliases: ['fees', 'chargeable fees', 'freight fee', 'rate', 'freight charges', 'chargeable weight fees', 'billing amount', 'amount'],
  },
  {
    key: 'declaredValue',
    label: 'Declared Value',
    required: false,
    category: 'Cargo',
    description: 'Declared commercial value for insurance',
    aliases: ['declared value', 'cargo value', 'invoice value', 'commercial value'],
  },
  {
    key: 'reasonForDelay',
    label: 'Reason for Delivery Delay',
    required: false,
    category: 'Delivery',
    description: 'Explanation for delivery SLA slip',
    aliases: ['reason for delay', 'delivery delay reason', 'delay remark', 'delivery exception'],
  },
  {
    key: 'month',
    label: 'Billing Month',
    required: false,
    category: 'Identification',
    description: 'Operational tracking month (e.g. August 2026)',
    aliases: ['month', 'billing month', 'period', 'cycle'],
  },
];

/**
 * Normalizes string for matching (lowercase, strips special chars).
 */
function cleanHeaderString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[._\-–—/()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Auto-maps Excel columns to OFII fields based on intelligent heuristic analysis.
 */
export function autoMapHeaders(headers: string[]): Record<string, OFIIFieldKey> {
  const mapping: Record<string, OFIIFieldKey> = {};
  const usedFields = new Set<OFIIFieldKey>();

  // Pass 1: Exact and alias matches
  headers.forEach((header) => {
    const clean = cleanHeaderString(header);
    if (!clean) {
      mapping[header] = 'none';
      return;
    }

    let matchedField: OFIIFieldKey = 'none';

    for (const def of OFII_FIELD_DEFINITIONS) {
      if (usedFields.has(def.key)) continue;

      // Check exact label match
      if (clean === cleanHeaderString(def.label)) {
        matchedField = def.key;
        break;
      }

      // Check aliases
      for (const alias of def.aliases) {
        if (clean === cleanHeaderString(alias)) {
          matchedField = def.key;
          break;
        }
      }

      if (matchedField !== 'none') break;
    }

    // Pass 2: Fuzzy / substring matches if not matched yet
    if (matchedField === 'none') {
      for (const def of OFII_FIELD_DEFINITIONS) {
        if (usedFields.has(def.key)) continue;

        for (const alias of def.aliases) {
          const cleanAlias = cleanHeaderString(alias);
          if (clean.includes(cleanAlias) || cleanAlias.includes(clean)) {
            // Avoid matching 'dispatch date' to 'delivery date'
            if (clean.includes('dispatch') && def.key === 'actualDeliveryDate') continue;
            if (clean.includes('delivery') && def.key === 'actualDispatchDate') continue;
            if (clean.includes('pod') && clean.includes('return') && def.key === 'podNumber') continue;

            matchedField = def.key;
            break;
          }
        }
        if (matchedField !== 'none') break;
      }
    }

    if (matchedField !== 'none') {
      usedFields.add(matchedField);
      mapping[header] = matchedField;
    } else {
      mapping[header] = 'none';
    }
  });

  return mapping;
}

/**
 * Parses dates from Excel (handles numeric serials, ISO strings, slash/dash dates).
 */
export function parseExcelDate(val: any): string {
  if (val === null || val === undefined || val === '') return '';

  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }

  // Handle Excel Serial Number (e.g. 45894)
  if (typeof val === 'number') {
    // 25569 is days between 1900-01-01 and 1970-01-01, plus Excel leap year bug adjustment
    const date = new Date((val - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  const str = String(val).trim();
  if (!str) return '';

  // Check YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Handle MM/DD/YYYY or DD/MM/YYYY
  const parts = str.split(/[/.-]/);
  if (parts.length === 3) {
    let year = parts[2];
    let month = parts[0];
    let day = parts[1];

    if (year.length === 2) year = `20${year}`;
    if (parts[0].length === 4) {
      year = parts[0];
      month = parts[1];
      day = parts[2];
    }

    const m = month.padStart(2, '0');
    const d = day.padStart(2, '0');
    const iso = `${year}-${m}-${d}`;
    const testDate = new Date(iso);
    if (!isNaN(testDate.getTime())) {
      return iso;
    }
  }

  // Standard Date parse fallback
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return str;
}

/**
 * Cleans numbers from Excel cells (currency symbols, commas, whitespace).
 */
export function parseExcelNumber(val: any, defaultVal = 0): number {
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
  if (!val) return defaultVal;
  const str = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? defaultVal : num;
}

/**
 * Reads an uploaded Excel file (.xlsx or .xls) and extracts raw headers & rows.
 */
export async function readExcelFile(file: File): Promise<{
  headers: string[];
  rows: Record<string, any>[];
  fileName: string;
  fileSizeFormatted: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, {
          type: 'array',
          cellDates: true,
          cellNF: false,
          cellText: false,
        });

        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('No worksheets found in this Excel file.');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        if (!worksheet) {
          throw new Error('Unable to read the first worksheet.');
        }

        // Convert to JSON array of objects
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: false,
        });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('No shipment records were found in this file.');
        }

        // Find header row (first non-empty row)
        let headerRowIndex = -1;
        for (let i = 0; i < rawJson.length; i++) {
          const row = rawJson[i];
          if (Array.isArray(row) && row.some((cell) => cell !== undefined && String(cell).trim() !== '')) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          throw new Error('No shipment records were found in this file.');
        }

        const rawHeaderRow = rawJson[headerRowIndex] as any[];
        const headers: string[] = rawHeaderRow
          .map((h, idx) => (h !== undefined && String(h).trim() !== '' ? String(h).trim() : `Column_${idx + 1}`))
          .filter(Boolean);

        const rows: Record<string, any>[] = [];

        for (let r = headerRowIndex + 1; r < rawJson.length; r++) {
          const rowArray = rawJson[r] as any[];
          if (!rowArray || !Array.isArray(rowArray)) continue;

          // Skip completely blank rows
          const hasData = rowArray.some((cell) => cell !== undefined && String(cell).trim() !== '');
          if (!hasData) continue;

          const rowObj: Record<string, any> = {};
          headers.forEach((header, colIdx) => {
            rowObj[header] = rowArray[colIdx] !== undefined ? rowArray[colIdx] : '';
          });
          rows.push(rowObj);
        }

        if (rows.length === 0) {
          throw new Error('No shipment records were found in this file.');
        }

        // Format file size
        const sizeKb = (file.size / 1024).toFixed(1);
        const fileSizeFormatted = file.size > 1024 * 1024 
          ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
          : `${sizeKb} KB`;

        resolve({
          headers,
          rows,
          fileName: file.name,
          fileSizeFormatted,
        });
      } catch (err: any) {
        reject(new Error(err.message || 'Unable to read this Excel file.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Unable to read this Excel file.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generates and triggers download of a standardized OFII Bulk Import Excel Template.
 */
export function downloadSampleExcelTemplate(): void {
  const templateData = [
    {
      'Client Name': 'Vamsler Philippines',
      'Consignee': 'Mercury Drug - Cebu Main',
      'Mode': 'Sea Freight',
      'Area': 'Visayas',
      'Reference Number': 'PRJ-VAM-801',
      'Dispatch Date': '2026-08-25',
      'POD Number': 'POD-94101',
      'AWB Number': 'AWB-55410',
      'Quantity': 120,
      'Unit': 'Boxes',
      'Destination Code': 'CEB-01',
      'Courier': 'OFII Fleet Logistics',
      'Delivery Status': 'In Transit',
      'Actual Delivery Date': '',
      'Receiver Name': '',
      'Date of POD Return': '',
      'CBM': 4.5,
      'Actual Weight (kg)': 1440,
      'Chargeable Fees': 'PHP 38,000.00',
      'Declared Value': 'PHP 1,200,000.00',
    },
    {
      'Client Name': 'RefaMED',
      'Consignee': 'Davao Doctors Hospital Pharmacy',
      'Mode': 'Air Freight',
      'Area': 'Mindanao',
      'Reference Number': 'PRJ-RFM-802',
      'Dispatch Date': '2026-08-25',
      'POD Number': 'POD-94102',
      'AWB Number': 'AWB-55411',
      'Quantity': 65,
      'Unit': 'Cases',
      'Destination Code': 'DVO-02',
      'Courier': 'Philippine Airlines Cargo',
      'Delivery Status': 'In Transit',
      'Actual Delivery Date': '',
      'Receiver Name': '',
      'Date of POD Return': '',
      'CBM': 1.8,
      'Actual Weight (kg)': 420,
      'Chargeable Fees': 'PHP 26,500.00',
      'Declared Value': 'PHP 850,000.00',
    },
    {
      'Client Name': 'Golden Archers Development Corporation',
      'Consignee': 'McDonalds Iloilo Regional DC',
      'Mode': 'RORO',
      'Area': 'Visayas',
      'Reference Number': 'PRJ-GADC-803',
      'Dispatch Date': '2026-08-24',
      'POD Number': 'POD-94103',
      'AWB Number': 'AWB-55412',
      'Quantity': 350,
      'Unit': 'Boxes',
      'Destination Code': 'ILO-01',
      'Courier': 'OFII RORO Logistics',
      'Delivery Status': 'Delivered',
      'Actual Delivery Date': '2026-08-26',
      'Receiver Name': 'Ramon Bautista',
      'Date of POD Return': '2026-08-28',
      'CBM': 12.0,
      'Actual Weight (kg)': 4200,
      'Chargeable Fees': 'PHP 95,000.00',
      'Declared Value': 'PHP 2,800,000.00',
    },
    {
      'Client Name': 'Philippine Charity Sweepstake Office',
      'Consignee': 'PCSO Cagayan De Oro Branch Office',
      'Mode': 'Sea Freight',
      'Area': 'Mindanao',
      'Reference Number': 'PRJ-PCSO-804',
      'Dispatch Date': '2026-08-25',
      'POD Number': 'POD-94104',
      'AWB Number': 'AWB-55413',
      'Quantity': 200,
      'Unit': 'Boxes',
      'Destination Code': 'CDO-01',
      'Courier': 'OFII Marine Transport',
      'Delivery Status': 'In Transit',
      'Actual Delivery Date': '',
      'Receiver Name': '',
      'Date of POD Return': '',
      'CBM': 6.2,
      'Actual Weight (kg)': 2100,
      'Chargeable Fees': 'PHP 52,000.00',
      'Declared Value': 'PHP 1,500,000.00',
    },
    {
      'Client Name': 'Intelligent Skin Care Inc.',
      'Consignee': 'Belo Medical Clinic - Bacolod',
      'Mode': 'RORO',
      'Area': 'Visayas',
      'Reference Number': 'PRJ-ISCI-805',
      'Dispatch Date': '2026-08-25',
      'POD Number': 'POD-94105',
      'AWB Number': 'AWB-55414',
      'Quantity': 80,
      'Unit': 'Cases',
      'Destination Code': 'BCD-01',
      'Courier': 'OFII RORO Express',
      'Delivery Status': 'In Transit',
      'Actual Delivery Date': '',
      'Receiver Name': '',
      'Date of POD Return': '',
      'CBM': 2.4,
      'Actual Weight (kg)': 720,
      'Chargeable Fees': 'PHP 28,000.00',
      'Declared Value': 'PHP 980,000.00',
    },
    {
      'Client Name': 'Dunsk Kuhner',
      'Consignee': 'Robinson Supermarket - Pampanga',
      'Mode': 'Land Freight',
      'Area': 'Luzon',
      'Reference Number': 'PRJ-DK-806',
      'Dispatch Date': '2026-08-25',
      'POD Number': 'POD-94106',
      'AWB Number': 'AWB-55415',
      'Quantity': 150,
      'Unit': 'Boxes',
      'Destination Code': 'PMP-01',
      'Courier': 'OFII North Luzon Fleet',
      'Delivery Status': 'Delivered',
      'Actual Delivery Date': '2026-08-25',
      'Receiver Name': 'Maricel Santos',
      'Date of POD Return': '2026-08-26',
      'CBM': 5.0,
      'Actual Weight (kg)': 1800,
      'Chargeable Fees': 'PHP 22,000.00',
      'Declared Value': 'PHP 650,000.00',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Shipments');

  // Column widths
  worksheet['!cols'] = [
    { wch: 32 }, // Client Name
    { wch: 30 }, // Consignee
    { wch: 15 }, // Mode
    { wch: 12 }, // Area
    { wch: 18 }, // Reference Number
    { wch: 14 }, // Dispatch Date
    { wch: 14 }, // POD Number
    { wch: 14 }, // AWB Number
    { wch: 10 }, // Quantity
    { wch: 10 }, // Unit
    { wch: 16 }, // Destination Code
    { wch: 22 }, // Courier
    { wch: 16 }, // Delivery Status
    { wch: 18 }, // Actual Delivery Date
    { wch: 20 }, // Receiver Name
    { wch: 18 }, // Date of POD Return
    { wch: 10 }, // CBM
    { wch: 18 }, // Actual Weight
    { wch: 18 }, // Chargeable Fees
    { wch: 18 }, // Declared Value
  ];

  XLSX.writeFile(workbook, 'OFII_Shipments_Bulk_Import_Template.xlsx');
}
