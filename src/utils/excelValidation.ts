import { 
  ForwardingProgressiveRecord, 
  ClientSummary, 
  DispatchRecord,
  ForwardingMode, 
  PhilippineArea, 
  ForwardingDeliveryStatus, 
  PODStatus,
  PerformanceResult,
  OFIIFieldKey 
} from '../types';
import { 
  getAutoDeliveryLeadTime, 
  computeDeliveryPerformance, 
  computePodPerformance 
} from './forwardingCalculations';
import { getClientAssignedCoordinator } from './dataSync';
import { parseExcelDate, parseExcelNumber } from './excelParser';

export type RowValidationStatus = 'VALID' | 'WARNING' | 'INVALID' | 'DUPLICATE';

export interface ValidatedImportRow {
  rowIndex: number;
  originalRow: Record<string, any>;
  mappedRecord: ForwardingProgressiveRecord;
  status: RowValidationStatus;
  errors: string[];
  warnings: string[];
  isDuplicate: boolean;
  duplicateReason?: string;
  isClientRecognized: boolean;
  recognizedClient?: ClientSummary;
  assignedCoordinator: string;
  isSelectedForImport: boolean;
  duplicateAction: 'skip' | 'import_anyway';
}

export interface ValidationSummary {
  totalRows: number;
  validCount: number;
  warningCount: number;
  invalidCount: number;
  duplicateCount: number;
  readyToImportCount: number;
  rows: ValidatedImportRow[];
}

/**
 * Normalizes Mode of Shipment from loose Excel text.
 */
export function normalizeModeOfShipment(raw: any): { mode: ForwardingMode; isRecognized: boolean } {
  if (!raw) return { mode: 'Land Freight', isRecognized: false };
  const str = String(raw).trim().toLowerCase();

  if (str.includes('roro') || str.includes('roll-on') || str.includes('roll on')) {
    return { mode: 'RORO', isRecognized: true };
  }
  if (str.includes('air') || str.includes('plane') || str.includes('flight')) {
    return { mode: 'Air Freight', isRecognized: true };
  }
  if (str.includes('sea') || str.includes('vessel') || str.includes('boat') || str.includes('marine') || str.includes('ocean')) {
    return { mode: 'Sea Freight', isRecognized: true };
  }
  if (str.includes('land') || str.includes('truck') || str.includes('road') || str.includes('ground') || str.includes('ftl') || str.includes('ltl')) {
    return { mode: 'Land Freight', isRecognized: true };
  }

  return { mode: 'Land Freight', isRecognized: false };
}

/**
 * Normalizes Area from loose Excel text.
 */
export function normalizeArea(raw: any): { area: PhilippineArea; isRecognized: boolean } {
  if (!raw) return { area: 'Luzon', isRecognized: false };
  const str = String(raw).trim().toLowerCase();

  if (str.includes('ncr') || str.includes('metro manila') || str.includes('manila')) {
    return { area: 'NCR', isRecognized: true };
  }
  if (str.includes('vis') || str.includes('cebu') || str.includes('iloilo') || str.includes('bacolod') || str.includes('tacloban') || str.includes('bohol')) {
    return { area: 'Visayas', isRecognized: true };
  }
  if (str.includes('min') || str.includes('davao') || str.includes('cagayan') || str.includes('cdo') || str.includes('gensan') || str.includes('zamboanga')) {
    return { area: 'Mindanao', isRecognized: true };
  }
  if (str.includes('luz') || str.includes('pampanga') || str.includes('batangas') || str.includes('cavite') || str.includes('laguna') || str.includes('baguio') || str.includes('north') || str.includes('south')) {
    return { area: 'Luzon', isRecognized: true };
  }

  return { area: 'Luzon', isRecognized: false };
}

/**
 * Normalizes Delivery Status.
 */
export function normalizeDeliveryStatus(raw: any, hasActualDeliveryDate: boolean): ForwardingDeliveryStatus {
  if (!raw && hasActualDeliveryDate) return 'Delivered';
  if (!raw) return 'In Transit';

  const str = String(raw).trim().toLowerCase();
  if (str.includes('deliv') || str.includes('received') || str.includes('complete') || str.includes('done')) {
    return 'Delivered';
  }
  if (str.includes('delay') || str.includes('late') || str.includes('slipped') || str.includes('failed')) {
    return 'Delayed';
  }
  if (str.includes('transit') || str.includes('route') || str.includes('shipping') || str.includes('dispatched')) {
    return 'In Transit';
  }
  if (str.includes('pending') || str.includes('booked') || str.includes('queue')) {
    return 'Pending Delivery';
  }

  return hasActualDeliveryDate ? 'Delivered' : 'In Transit';
}

/**
 * Finds a matching client from the shared client dataset.
 */
export function matchClient(
  rawClientName: string,
  clients: ClientSummary[]
): { client: ClientSummary | null; isRecognized: boolean } {
  if (!rawClientName) return { client: null, isRecognized: false };
  const clean = rawClientName.trim().toLowerCase();

  // Alias dictionary for common corporate abbreviations
  const aliases: Record<string, string> = {
    'pcso': 'philippine charity sweepstake office',
    'gadc': 'golden archers development corporation',
    'acwc': 'alexandria and centers of wisdom corporation',
    'om': 'oriental merchants',
    'vamsler': 'vamsler philippines',
    'refamed': 'refamed',
    'dk': 'dunsk kuhner',
    'isci': 'intelligent skin care inc.',
    'bhi': 'intelligent skin care inc.',
    'belo': 'intelligent skin care inc.',
  };

  // 1. Direct name or code match
  const directMatch = clients.find(
    (c) => c.name.trim().toLowerCase() === clean || c.code.toLowerCase() === clean
  );
  if (directMatch) return { client: directMatch, isRecognized: true };

  // 2. Alias match
  const mappedAlias = aliases[clean];
  if (mappedAlias) {
    const aliasMatch = clients.find((c) => c.name.trim().toLowerCase() === mappedAlias);
    if (aliasMatch) return { client: aliasMatch, isRecognized: true };
  }

  // 3. Substring / partial match
  const partialMatch = clients.find((c) => {
    const cName = c.name.trim().toLowerCase();
    return cName.includes(clean) || clean.includes(cName);
  });
  if (partialMatch) return { client: partialMatch, isRecognized: true };

  return { client: null, isRecognized: false };
}

/**
 * Validates all parsed Excel rows against mapping, schema requirements, and business rules.
 */
export function validateImportRows(
  rows: Record<string, any>[],
  columnMapping: Record<string, OFIIFieldKey>,
  clients: ClientSummary[],
  existingForwardingRecords: ForwardingProgressiveRecord[],
  existingDispatches: DispatchRecord[] = []
): ValidationSummary {
  // Sets of existing identifiers for duplicate detection
  const existingRefs = new Set<string>();
  const existingPods = new Set<string>();
  const existingAwbs = new Set<string>();

  existingForwardingRecords.forEach((r) => {
    if (r.referenceNumber) existingRefs.add(r.referenceNumber.trim().toLowerCase());
    if (r.podNumber) existingPods.add(r.podNumber.trim().toLowerCase());
    if (r.awbCourierRefNumber) existingAwbs.add(r.awbCourierRefNumber.trim().toLowerCase());
  });

  existingDispatches.forEach((d) => {
    if (d.podNumber) existingPods.add(d.podNumber.trim().toLowerCase());
  });

  // Track batch internal duplicates
  const batchRefs = new Map<string, number>();
  const batchPods = new Map<string, number>();

  const validatedRows: ValidatedImportRow[] = rows.map((row, index) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Extract values based on mapping
    const extracted: Partial<Record<OFIIFieldKey, any>> = {};
    Object.entries(columnMapping).forEach(([excelCol, fieldKey]) => {
      if (fieldKey && fieldKey !== 'none') {
        extracted[fieldKey] = row[excelCol];
      }
    });

    // 1. Validate Client
    const rawClient = String(extracted.client || '').trim();
    let clientName = rawClient;
    let clientId: string | undefined = undefined;
    let coordinator = 'Alodia Manalansan';
    let isClientRecognized = false;
    let recognizedClient: ClientSummary | undefined = undefined;

    if (!rawClient) {
      errors.push('Missing Client Name (Required field)');
    } else {
      const matchRes = matchClient(rawClient, clients);
      if (matchRes.isRecognized && matchRes.client) {
        isClientRecognized = true;
        recognizedClient = matchRes.client;
        clientName = matchRes.client.name;
        clientId = matchRes.client.id;
        coordinator = matchRes.client.assignedCoordinator || matchRes.client.accountManager || 'Alodia Manalansan';
      } else {
        isClientRecognized = false;
        warnings.push(`Unknown Client: "${rawClient}". Please map to an existing client or add a new client.`);
        coordinator = getClientAssignedCoordinator(clients, rawClient, 'Alodia Manalansan');
      }
    }

    // 2. Validate Consignee
    const consignee = String(extracted.consignee || '').trim();
    if (!consignee) {
      errors.push('Missing Consignee / Recipient (Required field)');
    }

    // 3. Validate Mode of Shipment
    const modeRes = normalizeModeOfShipment(extracted.modeOfShipment);
    const modeOfShipment: ForwardingMode = modeRes.mode;
    if (!extracted.modeOfShipment) {
      errors.push('Missing Mode of Shipment (Required field)');
    } else if (!modeRes.isRecognized) {
      warnings.push(`Unrecognized Mode of Shipment "${extracted.modeOfShipment}", defaulted to "${modeOfShipment}"`);
    }

    // 4. Validate Area
    const areaRes = normalizeArea(extracted.area);
    const area: PhilippineArea = areaRes.area;
    if (!extracted.area) {
      errors.push('Missing Philippine Area (Required field)');
    } else if (!areaRes.isRecognized) {
      warnings.push(`Unrecognized Area "${extracted.area}", defaulted to "${area}"`);
    }

    // 5. Validate Reference Number
    const rawRef = String(extracted.referenceNumber || '').trim();
    let referenceNumber = rawRef;
    if (!rawRef) {
      errors.push('Missing Reference Number (Required field)');
      referenceNumber = `PRJ-${clientName ? clientName.slice(0, 3).toUpperCase() : 'OFII'}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // 6. Validate Actual Dispatched Date
    const rawDispatchDate = extracted.actualDispatchDate;
    const actualDispatchDate = parseExcelDate(rawDispatchDate);
    if (!rawDispatchDate || !actualDispatchDate) {
      errors.push('Missing or Invalid Actual Dispatched Date (Required field)');
    }

    // 7. Parse dates & numbers
    const actualDeliveryDate = parseExcelDate(extracted.actualDeliveryDate);
    const dateOfPodReturn = parseExcelDate(extracted.dateOfPodReturn);
    const quantity = parseExcelNumber(extracted.quantity, 100);
    const cbm = extracted.cbm !== undefined && extracted.cbm !== '' ? parseExcelNumber(extracted.cbm, 0) : undefined;
    const actualWeightKg = extracted.actualWeightKg !== undefined && extracted.actualWeightKg !== ''
      ? parseExcelNumber(extracted.actualWeightKg, quantity * 12)
      : quantity * 12;
    const volumeWeightKg = extracted.volumeWeightKg !== undefined && extracted.volumeWeightKg !== ''
      ? parseExcelNumber(extracted.volumeWeightKg, 0)
      : undefined;

    // 8. References
    const podNumber = String(extracted.podNumber || '').trim() || `POD-${Math.floor(100000 + Math.random() * 900000)}`;
    const awbCourierRefNumber = String(extracted.awbCourierRefNumber || '').trim() || `AWB-${Math.floor(10000 + Math.random() * 90000)}`;
    const destinationCode = String(extracted.destinationCode || '').trim() || (area === 'NCR' ? 'MNL-01' : (area === 'Visayas' ? 'CEB-01' : 'DVO-01'));
    const courier = String(extracted.courier || '').trim() || 'OFII Fleet Logistics';
    const receiversName = String(extracted.receiversName || '').trim();
    const unit = String(extracted.unit || '').trim() || 'Boxes';
    const chargeableWeightFees = String(extracted.chargeableWeightFees || '').trim() || 'PHP 25,000.00';
    const declaredValue = String(extracted.declaredValue || '').trim() || 'PHP 1,000,000.00';
    const month = String(extracted.month || '').trim() || 'August 2026';
    const deliveryStatus = normalizeDeliveryStatus(extracted.deliveryStatus, !!actualDeliveryDate);

    // 9. Automated Lead Time & SLA Calculations
    const deliveryLeadTimeDays = getAutoDeliveryLeadTime(clientName, modeOfShipment, area);

    let deliveryTatDays = 0;
    let deliveryPerformance: PerformanceResult = 'PENDING';
    if (actualDispatchDate && actualDeliveryDate) {
      const perfRes = computeDeliveryPerformance(actualDispatchDate, actualDeliveryDate, deliveryLeadTimeDays);
      deliveryTatDays = perfRes.tatDays;
      deliveryPerformance = perfRes.performance;
    }

    let podTatDays = 0;
    let podPerformance: PerformanceResult = 'PENDING';
    if (actualDeliveryDate && dateOfPodReturn) {
      const podRes = computePodPerformance(actualDeliveryDate, dateOfPodReturn, 3);
      podTatDays = podRes.podTatDays;
      podPerformance = podRes.podPerformance;
    }

    // 10. Duplicate Checks
    let isDuplicate = false;
    let duplicateReason: string | undefined = undefined;

    if (rawRef && existingRefs.has(rawRef.toLowerCase())) {
      isDuplicate = true;
      duplicateReason = `Reference Number "${rawRef}" already exists in the system.`;
    } else if (extracted.podNumber && existingPods.has(String(extracted.podNumber).trim().toLowerCase())) {
      isDuplicate = true;
      duplicateReason = `POD Number "${extracted.podNumber}" already exists in the system.`;
    } else if (extracted.awbCourierRefNumber && existingAwbs.has(String(extracted.awbCourierRefNumber).trim().toLowerCase())) {
      isDuplicate = true;
      duplicateReason = `AWB / Courier Ref "${extracted.awbCourierRefNumber}" already exists in the system.`;
    }

    // Batch duplicate check
    if (rawRef) {
      const refKey = rawRef.toLowerCase();
      const prevIndex = batchRefs.get(refKey);
      if (prevIndex !== undefined) {
        isDuplicate = true;
        duplicateReason = `Duplicate Reference Number "${rawRef}" detected in Row ${prevIndex + 1} of this Excel file.`;
      } else {
        batchRefs.set(refKey, index);
      }
    }

    if (extracted.podNumber) {
      const podKey = String(extracted.podNumber).trim().toLowerCase();
      const prevPodIndex = batchPods.get(podKey);
      if (prevPodIndex !== undefined) {
        isDuplicate = true;
        duplicateReason = `Duplicate POD Number "${extracted.podNumber}" detected in Row ${prevPodIndex + 1} of this Excel file.`;
      } else {
        batchPods.set(podKey, index);
      }
    }

    // Determine Row Status
    let status: RowValidationStatus = 'VALID';
    if (errors.length > 0) {
      status = 'INVALID';
    } else if (isDuplicate) {
      status = 'DUPLICATE';
    } else if (warnings.length > 0) {
      status = 'WARNING';
    }

    const mappedRecord: ForwardingProgressiveRecord = {
      id: `FPR-IMP-${Date.now().toString().slice(-6)}-${index + 1}`,
      month,
      coordinator,
      client: clientName,
      clientId,
      modeOfShipment,
      area,
      referenceNumber,
      actualDispatchDate,
      consignee,
      destinationCode,
      quantity,
      unit,
      courier,
      cbm,
      volumeWeightKg,
      actualWeightKg,
      chargeableWeightFees,
      declaredValue,
      podNumber,
      awbCourierRefNumber,
      deliveryStatus,
      receiversName,
      actualDeliveryDate,
      deliveryLeadTimeDays,
      deliveryTatDays,
      deliveryPerformance,
      reasonForDelay: extracted.reasonForDelay ? String(extracted.reasonForDelay) : undefined,
      podStatus: dateOfPodReturn ? 'Returned' : (actualDeliveryDate ? 'Pending Return' : 'Under Review'),
      dateOfPodReturn,
      podLeadTimeDays: 3,
      podTatDays,
      podPerformance,
      podReasonForDelay: extracted.podReasonForDelay ? String(extracted.podReasonForDelay) : undefined,
      isDeleted: false,
    };

    return {
      rowIndex: index + 1,
      originalRow: row,
      mappedRecord,
      status,
      errors,
      warnings,
      isDuplicate,
      duplicateReason,
      isClientRecognized,
      recognizedClient,
      assignedCoordinator: coordinator,
      isSelectedForImport: status === 'VALID' || status === 'WARNING',
      duplicateAction: 'skip',
    };
  });

  const totalRows = validatedRows.length;
  const validCount = validatedRows.filter((r) => r.status === 'VALID').length;
  const warningCount = validatedRows.filter((r) => r.status === 'WARNING').length;
  const invalidCount = validatedRows.filter((r) => r.status === 'INVALID').length;
  const duplicateCount = validatedRows.filter((r) => r.status === 'DUPLICATE').length;
  const readyToImportCount = validatedRows.filter((r) => r.isSelectedForImport && r.status !== 'INVALID').length;

  return {
    totalRows,
    validCount,
    warningCount,
    invalidCount,
    duplicateCount,
    readyToImportCount,
    rows: validatedRows,
  };
}
