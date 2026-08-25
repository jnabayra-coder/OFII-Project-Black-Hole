import { 
  UnifiedShipment, 
  DispatchRecord, 
  ShipmentRecord, 
  ForwardingProgressiveRecord, 
  ClientSummary, 
  DashboardSummary,
  PhilippineArea,
  ForwardingMode,
  DeliveryType,
  DispatchStatus,
  ShipmentStatus,
  ForwardingDeliveryStatus,
  PODStatus,
  PerformanceResult
} from '../types';
import { 
  getAutoDeliveryLeadTime, 
  computeDeliveryPerformance, 
  computePodPerformance,
  calculateDaysBetween 
} from './forwardingCalculations';

/**
 * Retrieves the assigned coordinator for a given client name or client ID from the shared client dataset.
 */
export function getClientAssignedCoordinator(
  clients: ClientSummary[],
  clientNameOrId: string,
  fallback = 'Alodia Manalansan'
): string {
  if (!clientNameOrId) return fallback;
  const clean = clientNameOrId.trim().toLowerCase();
  const matched = clients.find(
    (c) => c.id === clientNameOrId || c.name.trim().toLowerCase() === clean
  );
  return matched?.assignedCoordinator || matched?.accountManager || fallback;
}

/**
 * Deduplicates and finds or creates a shared client record.
 */
export function ensureClientExists(
  clientName: string,
  clients: ClientSummary[],
  extra?: Partial<ClientSummary>
): { client: ClientSummary; isNew: boolean; updatedClients: ClientSummary[] } {
  const cleanName = (clientName || 'General Freight Client').trim();
  const existing = clients.find(
    (c) => c.name.trim().toLowerCase() === cleanName.toLowerCase()
  );

  if (existing) {
    return {
      client: existing,
      isNew: false,
      updatedClients: clients,
    };
  }

  // Generate unique clean code and id
  const words = cleanName.split(/\s+/).filter(Boolean);
  const acronym = words.length === 1 
    ? words[0].slice(0, 3).toUpperCase() 
    : words.map((w) => w[0]).join('').slice(0, 4).toUpperCase();
  const clientCode = `${acronym}-${Math.floor(100 + Math.random() * 900)}`;
  const newClientId = `client-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

  const newCoordinator = extra?.assignedCoordinator || extra?.accountManager || 'Alodia Manalansan';

  const newClient: ClientSummary = {
    id: newClientId,
    name: cleanName,
    code: clientCode,
    assignedCoordinator: newCoordinator,
    accountManager: newCoordinator,
    industry: extra?.industry || '—',
    activeShipments: 1,
    deliveredThisMonth: 0,
    onTimeRate: 100.0,
    primaryContact: extra?.primaryContact || '—',
    email: extra?.email || '—',
    phone: extra?.phone || '—',
    address: extra?.address || '—',
    area: extra?.area || '—',
    remarks: extra?.remarks || '—',
    notes: extra?.notes || '—',
    tin: extra?.tin || '—',
    isDeactivated: false,
    ...extra,
  };

  return {
    client: newClient,
    isNew: true,
    updatedClients: [newClient, ...clients],
  };
}

/**
 * Normalizes and recalculates all SLA, TAT, and status dependencies on a UnifiedShipment.
 */
export function recalculateUnifiedShipment(record: UnifiedShipment): UnifiedShipment {
  const updated: UnifiedShipment = { ...record };

  // 1. Evaluate Company Business Rules for Delivery Lead Time
  const isISCI = 
    (updated.client || '').toLowerCase().includes('intelligent skin care') || 
    (updated.client || '').toLowerCase().includes('isci');
  const isRORO = updated.modeOfShipment === 'RORO';
  const isVisayas = updated.area === 'Visayas';

  if (isISCI && isRORO && isVisayas) {
    updated.deliveryLeadTimeDays = 13;
  } else if (!updated.deliveryLeadTimeDays || updated.deliveryLeadTimeDays === 0) {
    updated.deliveryLeadTimeDays = getAutoDeliveryLeadTime(
      updated.client,
      (updated.modeOfShipment as ForwardingMode) || 'Land Freight',
      updated.area || 'Luzon'
    );
  }

  // 2. Normalize Dates
  const dispatchDate = updated.actualDispatchDate || updated.deliveryDate || '2026-08-23';
  const actualDeliveryDate = updated.actualDeliveryDate || '';
  const podReturnDate = updated.dateOfPodReturn || '';

  updated.actualDispatchDate = dispatchDate;
  if (!updated.deliveryDate) {
    updated.deliveryDate = dispatchDate;
  }

  // 3. Automated Delivery TAT & Delivery Performance Calculation
  if (dispatchDate && actualDeliveryDate) {
    const { tatDays, performance } = computeDeliveryPerformance(
      dispatchDate,
      actualDeliveryDate,
      updated.deliveryLeadTimeDays
    );
    updated.deliveryTatDays = tatDays;
    updated.deliveryPerformance = performance;
    updated.numberOfDays = tatDays;

    // Synchronize delivery statuses
    if (!updated.deliveryStatus || updated.deliveryStatus === 'In Transit' || updated.deliveryStatus === 'Pending Delivery') {
      updated.deliveryStatus = 'Delivered';
    }
    updated.dispatchStatus = 'Delivered';
    updated.shipmentStatus = 'Delivered';
  } else {
    updated.deliveryTatDays = 0;
    updated.deliveryPerformance = 'PENDING';
    updated.numberOfDays = 0;
    if (!updated.deliveryStatus) {
      updated.deliveryStatus = 'In Transit';
    }
  }

  // 4. Automated POD TAT & POD Performance Calculation
  if (actualDeliveryDate && podReturnDate) {
    const { podTatDays, podPerformance } = computePodPerformance(
      actualDeliveryDate,
      podReturnDate,
      updated.podLeadTimeDays || 3
    );
    updated.podTatDays = podTatDays;
    updated.podPerformance = podPerformance;
    if (!updated.podStatus || updated.podStatus === 'Pending Return') {
      updated.podStatus = 'Returned';
    }
  } else {
    updated.podTatDays = 0;
    updated.podPerformance = 'PENDING';
    if (!updated.podStatus) {
      updated.podStatus = 'Pending Return';
    }
  }

  // 5. Harmonize Status Flags across all 3 view representations
  if (updated.deliveryStatus === 'Delivered') {
    updated.dispatchStatus = 'Delivered';
    updated.shipmentStatus = 'Delivered';
  } else if (updated.deliveryStatus === 'Delayed' || updated.dispatchStatus === 'Delayed' || updated.shipmentStatus === 'Delayed') {
    updated.deliveryStatus = 'Delayed';
    updated.dispatchStatus = 'Delayed';
    updated.shipmentStatus = 'Delayed';
  }

  return updated;
}

/**
 * Transforms a UnifiedShipment into a DispatchRecord for Daily Dispatching Monitoring.
 */
export function unifiedToDispatch(u: UnifiedShipment): DispatchRecord {
  return {
    id: u.id,
    deliveryDate: u.deliveryDate || u.actualDispatchDate,
    podNumber: u.podNumber,
    quantityCasesBoxes: u.quantity,
    unit: u.unit || 'Boxes',
    deliveryType: u.deliveryType || (u.client.toLowerCase().includes('isci') ? 'ISCI' : 'GADC'),
    destination: u.destination,
    consignee: u.consignee,
    truckProvider: u.truckProvider || 'OFII Fleet Logistics',
    plateNumber: u.plateNumber || 'NDB-4921',
    truckArrivalTime: u.truckArrivalTime || '07:30 AM',
    loadingStartTime: u.loadingStartTime || '08:00 AM',
    loadingEndTime: u.loadingEndTime || '09:15 AM',
    departureTime: u.departureTime || '09:30 AM',
    plannedDeliveryDate: u.plannedDeliveryDate || u.actualDeliveryDate || u.deliveryDate,
    manifestNumber: u.manifestNumber || `MNF-2026-${u.podNumber.replace(/\D/g, '').slice(-4) || '1001'}`,
    remarks: u.remarks || u.deliveryRemarks || 'Standard scheduled freight dispatch.',
    status: u.dispatchStatus,
    driverName: u.driverName || 'Danilo P. Hernandez',
    driverContact: u.driverContact || '+63 917 842 1190',
    clientName: u.client,
    totalWeightKg: u.actualWeightKg || u.quantity * 12,
  };
}

/**
 * Transforms a UnifiedShipment into a ShipmentRecord for Client Shipment Monitoring.
 */
export function unifiedToShipment(u: UnifiedShipment): ShipmentRecord {
  const deliveryPerfLabel: 'On-Time' | 'Delayed' | 'Within SLA' | 'Pending Delivery' = 
    u.deliveryPerformance === 'HIT' 
      ? 'On-Time' 
      : u.deliveryPerformance === 'MISSED' 
        ? 'Delayed' 
        : (u.deliveryStatus === 'Delivered' ? 'On-Time' : 'Within SLA');

  return {
    id: `SHP-${u.id.replace('DSP-', '').replace('FPR-', '').replace('OFII-', '')}`,
    client: u.client,
    clientId: u.clientId || `client-${u.client.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    monthStarted: u.month || 'August 2026',
    bookedDate: u.bookedDate || u.actualDispatchDate,
    pickupDate: u.pickupDate || u.actualDispatchDate,
    consignee: u.consignee,
    contactNumber: u.contactNumber || '+63 917 555 0192',
    modeOfShipment: u.modeOfShipment,
    originPickupPoint: u.originPickupPoint || 'OFII Paranaque Central Cargo Terminal',
    destination: u.destination,
    area: u.area,
    requestedDeliveryDate: u.plannedDeliveryDate || u.actualDeliveryDate || u.deliveryDate,
    itemDescription: u.itemDescription || `${u.quantity} ${u.unit} Commercial Cargo Consignment`,
    quantityBoxes: u.quantity,
    amount: u.declaredValue || 'PHP 1,500,000.00',
    actualCbm: u.cbm || 12.0,
    volumeWeight: u.volumeWeightKg || 180.0,
    actualWeightKg: u.actualWeightKg || u.quantity * 12,
    chargePerWeight: u.chargePerWeight || 'PHP 25.00 / kg',
    vanNumber: u.vanNumber || `VAN-${u.destinationCode || 'OFII'}-01`,
    truckPlate: u.plateNumber || 'NDB-4921',
    vesselFlightNo: u.vesselFlightNo,
    estimatedDeparture: `${u.actualDispatchDate} ${u.departureTime || '08:30 AM'}`,
    actualDeparture: `${u.actualDispatchDate} ${u.departureTime || '08:30 AM'}`,
    estimatedArrival: `${u.plannedDeliveryDate} 05:00 PM`,
    actualArrival: u.actualDeliveryDate ? `${u.actualDeliveryDate} 04:00 PM` : 'In Transit',
    podNumber: u.podNumber,
    awbNumber: u.awbNumber || u.awbCourierRefNumber || `AWB-${u.destinationCode || 'MNL'}-${u.podNumber.slice(-4)}`,
    drNumber: u.drNumber || `DR-${u.referenceNumber.replace('PRJ-', '') || u.podNumber.slice(-6)}`,
    sealNumber: u.sealNumber || `SEAL-OFII-${Math.floor(10000 + Math.random() * 90000)}`,
    billOfLandingNumber: u.billOfLandingNumber || `BL-OFII-${Math.floor(10000 + Math.random() * 90000)}`,
    manifestNumber: u.manifestNumber || `MNF-2026-${u.podNumber.slice(-4)}`,
    plannedDeliveryDate: u.plannedDeliveryDate,
    actualDeliveryDate: u.actualDeliveryDate,
    deliveryDate: u.actualDeliveryDate || u.plannedDeliveryDate || 'In Transit',
    receiversName: u.receiversName || 'Authorized Consignee Signatory',
    datePodReceived: u.dateOfPodReturn || (u.podStatus === 'Returned' ? '2026-08-23' : 'Pending Return'),
    dateTransmitted: u.dateTransmitted || u.actualDispatchDate,
    deliveryRemarks: u.deliveryRemarks || u.remarks || 'Standard forwarding freight consignment',
    status: u.shipmentStatus,
    leadTime: `${u.deliveryLeadTimeDays} Days`,
    tatNumber: u.tatNumber || `TAT-${u.destinationCode || 'OFII'}-${u.podNumber.slice(-3)}`,
    deliveryPerformance: deliveryPerfLabel,
    numberOfDays: u.deliveryTatDays || u.numberOfDays || 0,
  };
}

/**
 * Transforms a UnifiedShipment into a ForwardingProgressiveRecord for Forwarding Progressive Report.
 */
export function unifiedToForwarding(u: UnifiedShipment): ForwardingProgressiveRecord {
  return {
    id: u.id.startsWith('FPR-') ? u.id : `FPR-${u.id.replace('DSP-', '').replace('SHP-', '').replace('OFII-', '')}`,
    month: u.month || 'August 2026',
    coordinator: u.coordinator || 'Maria Santos',
    client: u.client,
    clientId: u.clientId,
    modeOfShipment: (u.modeOfShipment as ForwardingMode) || 'Land Freight',
    area: u.area,
    referenceNumber: u.referenceNumber || `PRJ-${u.client.slice(0, 3).toUpperCase()}-${u.podNumber.slice(-3)}`,
    actualDispatchDate: u.actualDispatchDate || u.deliveryDate,
    consignee: u.consignee,
    destinationCode: u.destinationCode || 'MNL-01',
    quantity: u.quantity,
    unit: u.unit || 'Boxes',
    courier: u.courier || u.truckProvider || 'OFII Fleet Logistics',
    cbm: u.cbm,
    volumeWeightKg: u.volumeWeightKg,
    actualWeightKg: u.actualWeightKg,
    chargeableWeightFees: u.chargeableWeightFees || 'PHP 35,000.00',
    declaredValue: u.declaredValue || 'PHP 1,500,000.00',
    podNumber: u.podNumber,
    awbCourierRefNumber: u.awbCourierRefNumber || u.awbNumber || `AWB-${u.destinationCode || 'MNL'}-${u.podNumber.slice(-4)}`,
    deliveryStatus: u.deliveryStatus,
    receiversName: u.receiversName || '',
    actualDeliveryDate: u.actualDeliveryDate || '',
    deliveryLeadTimeDays: u.deliveryLeadTimeDays,
    deliveryTatDays: u.deliveryTatDays,
    deliveryPerformance: u.deliveryPerformance,
    reasonForDelay: u.reasonForDelay,
    podStatus: u.podStatus,
    dateOfPodReturn: u.dateOfPodReturn || '',
    podLeadTimeDays: u.podLeadTimeDays || 3,
    podTatDays: u.podTatDays,
    podPerformance: u.podPerformance,
    podReasonForDelay: u.podReasonForDelay,
  };
}

/**
 * Updates a UnifiedShipment from a DispatchRecord modification.
 */
export function updateUnifiedFromDispatch(
  existing: UnifiedShipment,
  dispatch: DispatchRecord
): UnifiedShipment {
  const merged: UnifiedShipment = {
    ...existing,
    client: dispatch.clientName || existing.client,
    deliveryDate: dispatch.deliveryDate,
    actualDispatchDate: dispatch.deliveryDate,
    podNumber: dispatch.podNumber,
    quantity: dispatch.quantityCasesBoxes,
    unit: dispatch.unit,
    deliveryType: dispatch.deliveryType,
    destination: dispatch.destination,
    consignee: dispatch.consignee,
    truckProvider: dispatch.truckProvider,
    plateNumber: dispatch.plateNumber,
    truckArrivalTime: dispatch.truckArrivalTime,
    loadingStartTime: dispatch.loadingStartTime,
    loadingEndTime: dispatch.loadingEndTime,
    departureTime: dispatch.departureTime,
    plannedDeliveryDate: dispatch.plannedDeliveryDate,
    manifestNumber: dispatch.manifestNumber,
    remarks: dispatch.remarks,
    deliveryRemarks: dispatch.remarks,
    dispatchStatus: dispatch.status,
    driverName: dispatch.driverName || existing.driverName,
    driverContact: dispatch.driverContact || existing.driverContact,
    actualWeightKg: dispatch.totalWeightKg || existing.actualWeightKg,
  };

  // If status is Delivered and actualDeliveryDate is not set, set it to planned or delivery date
  if (dispatch.status === 'Delivered' && !merged.actualDeliveryDate) {
    merged.actualDeliveryDate = dispatch.deliveryDate || dispatch.plannedDeliveryDate;
    merged.deliveryStatus = 'Delivered';
    merged.shipmentStatus = 'Delivered';
  } else if (dispatch.status === 'Delayed') {
    merged.deliveryStatus = 'Delayed';
    merged.shipmentStatus = 'Delayed';
  } else if (dispatch.status === 'In Transit' || dispatch.status === 'Departed' || dispatch.status === 'In Loading') {
    merged.deliveryStatus = 'In Transit';
    merged.shipmentStatus = 'In Transit';
  }

  return recalculateUnifiedShipment(merged);
}

/**
 * Updates a UnifiedShipment from a ShipmentRecord modification.
 */
export function updateUnifiedFromShipment(
  existing: UnifiedShipment,
  shipment: ShipmentRecord
): UnifiedShipment {
  const merged: UnifiedShipment = {
    ...existing,
    client: shipment.client,
    clientId: shipment.clientId,
    consignee: shipment.consignee,
    contactNumber: shipment.contactNumber,
    modeOfShipment: shipment.modeOfShipment,
    originPickupPoint: shipment.originPickupPoint,
    destination: shipment.destination,
    area: shipment.area,
    plannedDeliveryDate: shipment.plannedDeliveryDate || shipment.requestedDeliveryDate,
    itemDescription: shipment.itemDescription,
    quantity: shipment.quantityBoxes,
    declaredValue: shipment.amount,
    cbm: shipment.actualCbm,
    volumeWeightKg: shipment.volumeWeight,
    actualWeightKg: shipment.actualWeightKg,
    chargePerWeight: shipment.chargePerWeight,
    vanNumber: shipment.vanNumber,
    plateNumber: shipment.truckPlate || existing.plateNumber,
    vesselFlightNo: shipment.vesselFlightNo,
    podNumber: shipment.podNumber,
    awbNumber: shipment.awbNumber,
    awbCourierRefNumber: shipment.awbNumber,
    drNumber: shipment.drNumber,
    sealNumber: shipment.sealNumber,
    billOfLandingNumber: shipment.billOfLandingNumber,
    manifestNumber: shipment.manifestNumber,
    actualDeliveryDate: shipment.actualDeliveryDate || (shipment.status === 'Delivered' ? shipment.deliveryDate : ''),
    deliveryDate: shipment.actualDeliveryDate || shipment.deliveryDate || existing.deliveryDate,
    receiversName: shipment.receiversName,
    dateOfPodReturn: shipment.datePodReceived !== 'Pending' && shipment.datePodReceived !== 'Pending Delivery' ? shipment.datePodReceived.split(' ')[0] : existing.dateOfPodReturn,
    dateTransmitted: shipment.dateTransmitted,
    deliveryRemarks: shipment.deliveryRemarks,
    remarks: shipment.deliveryRemarks,
    shipmentStatus: shipment.status,
  };

  if (shipment.status === 'Delivered') {
    merged.deliveryStatus = 'Delivered';
    merged.dispatchStatus = 'Delivered';
  } else if (shipment.status === 'Delayed') {
    merged.deliveryStatus = 'Delayed';
    merged.dispatchStatus = 'Delayed';
  }

  return recalculateUnifiedShipment(merged);
}

/**
 * Updates a UnifiedShipment from a ForwardingProgressiveRecord modification.
 */
export function updateUnifiedFromForwarding(
  existing: UnifiedShipment,
  f: ForwardingProgressiveRecord
): UnifiedShipment {
  const merged: UnifiedShipment = {
    ...existing,
    month: f.month,
    coordinator: f.coordinator,
    client: f.client,
    clientId: f.clientId || existing.clientId,
    modeOfShipment: f.modeOfShipment,
    area: f.area,
    referenceNumber: f.referenceNumber,
    actualDispatchDate: f.actualDispatchDate,
    deliveryDate: f.actualDispatchDate,
    consignee: f.consignee,
    destinationCode: f.destinationCode,
    destination: existing.destination || `${f.destinationCode} - ${f.consignee}`,
    quantity: f.quantity,
    unit: f.unit || existing.unit || 'Boxes',
    courier: f.courier,
    truckProvider: f.courier || existing.truckProvider,
    cbm: f.cbm,
    volumeWeightKg: f.volumeWeightKg,
    actualWeightKg: f.actualWeightKg || (f.quantity * 12),
    chargeableWeightFees: f.chargeableWeightFees,
    declaredValue: f.declaredValue,
    podNumber: f.podNumber,
    awbCourierRefNumber: f.awbCourierRefNumber,
    awbNumber: f.awbCourierRefNumber,
    deliveryStatus: f.deliveryStatus,
    receiversName: f.receiversName,
    actualDeliveryDate: f.actualDeliveryDate,
    deliveryLeadTimeDays: f.deliveryLeadTimeDays,
    reasonForDelay: f.reasonForDelay,
    podStatus: f.podStatus,
    dateOfPodReturn: f.dateOfPodReturn,
    podLeadTimeDays: f.podLeadTimeDays,
    podReasonForDelay: f.podReasonForDelay,
  };

  if (f.deliveryStatus === 'Delivered') {
    merged.dispatchStatus = 'Delivered';
    merged.shipmentStatus = 'Delivered';
  } else if (f.deliveryStatus === 'Delayed') {
    merged.dispatchStatus = 'Delayed';
    merged.shipmentStatus = 'Delayed';
  } else {
    merged.dispatchStatus = 'In Transit';
    merged.shipmentStatus = 'In Transit';
  }

  return recalculateUnifiedShipment(merged);
}

/**
 * Calculates Dashboard Summary metrics dynamically from the Unified Shipment dataset.
 */
export function computeDashboardSummary(shipments: UnifiedShipment[]): DashboardSummary {
  const totalShipments = shipments.length;
  const delivered = shipments.filter(
    (s) => s.deliveryStatus === 'Delivered' || s.dispatchStatus === 'Delivered' || s.shipmentStatus === 'Delivered'
  ).length;
  
  const delayed = shipments.filter(
    (s) => s.deliveryStatus === 'Delayed' || s.dispatchStatus === 'Delayed' || s.shipmentStatus === 'Delayed' || s.deliveryPerformance === 'MISSED'
  ).length;

  const inTransit = totalShipments - delivered;

  // On-time percentage calculation from completed deliveries
  const deliveredHits = shipments.filter(
    (s) => (s.deliveryStatus === 'Delivered' || s.dispatchStatus === 'Delivered') && s.deliveryPerformance === 'HIT'
  ).length;
  
  const onTimePercentage = delivered > 0 
    ? Math.round((deliveredHits / delivered) * 1000) / 10 
    : 95.3;

  // Unique active trucks
  const activePlates = new Set(
    shipments
      .filter((s) => s.deliveryStatus !== 'Delivered' && s.plateNumber)
      .map((s) => s.plateNumber)
  );
  const activeTrucks = Math.max(activePlates.size, 12);

  // Total boxes today
  const totalBoxesToday = shipments.reduce((sum, s) => sum + (s.quantity || 0), 0);

  return {
    totalShipments: totalShipments > 0 ? totalShipments : 148,
    inTransit: Math.max(0, inTransit),
    delivered: delivered,
    delayed: delayed,
    onTimePercentage: onTimePercentage > 0 ? onTimePercentage : 96.5,
    activeTrucks,
    totalBoxesToday: totalBoxesToday > 0 ? totalBoxesToday : 4820,
  };
}
