import { ForwardingMode, PhilippineArea, PerformanceResult } from '../types';

/**
 * Calculates the difference in days between two date strings (YYYY-MM-DD).
 */
export function calculateDaysBetween(startDateStr?: string, endDateStr?: string): number {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  
  // Normalizing to UTC midnight to avoid DST offset inaccuracies
  const utc1 = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utc2 = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  
  const diffTime = utc2 - utc1;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Business Rules Engine for OFII Forwarding Lead Times:
 * 
 * COMPANY RULE:
 * If:
 *   Mode of Shipment = RORO
 *   Client = Intelligent Skin Care Inc. (or ISCI)
 *   Area = Visayas
 * Then:
 *   Delivery Lead Time = 13 days
 */
export function getAutoDeliveryLeadTime(
  clientName: string,
  modeOfShipment: ForwardingMode,
  area: PhilippineArea
): number {
  const normalizedClient = (clientName || '').trim().toLowerCase();
  const isISCI = 
    normalizedClient.includes('intelligent skin care') || 
    normalizedClient.includes('isci') ||
    normalizedClient === 'intelligent skin care inc.';

  const isRORO = modeOfShipment === 'RORO';
  const isVisayas = area === 'Visayas';

  // Company defined explicit business rule
  if (isISCI && isRORO && isVisayas) {
    return 13;
  }

  // Sensible default lead times based on standard logistics operational baselines
  switch (modeOfShipment) {
    case 'Air Freight':
      return 2;
    case 'Land Freight':
      return area === 'NCR' ? 1 : 2;
    case 'Sea Freight':
      return area === 'Visayas' ? 6 : (area === 'Mindanao' ? 8 : 4);
    case 'RORO':
      return area === 'Visayas' ? 6 : (area === 'Mindanao' ? 9 : 5);
    default:
      return 5;
  }
}

/**
 * Calculates Delivery TAT and compares with Delivery Lead Time.
 */
export function computeDeliveryPerformance(
  actualDispatchDate: string,
  actualDeliveryDate: string,
  deliveryLeadTimeDays: number
): { tatDays: number; performance: PerformanceResult } {
  if (!actualDispatchDate || !actualDeliveryDate) {
    return { tatDays: 0, performance: 'PENDING' };
  }

  const tatDays = calculateDaysBetween(actualDispatchDate, actualDeliveryDate);
  const performance: PerformanceResult = tatDays <= deliveryLeadTimeDays ? 'HIT' : 'MISSED';

  return { tatDays, performance };
}

/**
 * Calculates POD TAT and compares with POD Lead Time.
 */
export function computePodPerformance(
  actualDeliveryDate: string,
  dateOfPodReturn: string,
  podLeadTimeDays: number = 3
): { podTatDays: number; podPerformance: PerformanceResult } {
  if (!actualDeliveryDate || !dateOfPodReturn) {
    return { podTatDays: 0, podPerformance: 'PENDING' };
  }

  const podTatDays = calculateDaysBetween(actualDeliveryDate, dateOfPodReturn);
  const podPerformance: PerformanceResult = podTatDays <= podLeadTimeDays ? 'HIT' : 'MISSED';

  return { podTatDays, podPerformance };
}
