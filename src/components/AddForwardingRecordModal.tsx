import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Sparkles, 
  FileSpreadsheet, 
  Building2, 
  Calendar, 
  Clock, 
  Truck, 
  Ship, 
  Plane, 
  Anchor, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Layers,
  Save,
  Check
} from 'lucide-react';
import { 
  ForwardingProgressiveRecord, 
  ClientSummary, 
  ForwardingMode, 
  PhilippineArea, 
  ForwardingDeliveryStatus, 
  PODStatus, 
  PerformanceResult 
} from '../types';
import { SearchableClientSelect } from './SearchableClientSelect';
import { 
  getAutoDeliveryLeadTime, 
  computeDeliveryPerformance, 
  computePodPerformance 
} from '../utils/forwardingCalculations';
import { getClientAssignedCoordinator } from '../utils/dataSync';
import { UnsavedChangesModal } from './UnsavedChangesModal';
import { DispatchRecord } from '../types';

interface AddForwardingRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientSummary[];
  onAddRecord: (newRecord: ForwardingProgressiveRecord, clientName: string) => void;
  onOpenAddClientModal?: (initialName?: string) => void;
  existingRecords?: ForwardingProgressiveRecord[];
  existingDispatches?: DispatchRecord[];
}

export const AddForwardingRecordModal: React.FC<AddForwardingRecordModalProps> = ({
  isOpen,
  onClose,
  clients,
  onAddRecord,
  onOpenAddClientModal,
  existingRecords = [],
  existingDispatches = [],
}) => {
  // Form State with intelligent defaults
  const [month, setMonth] = useState('August 2026');
  const [clientName, setClientName] = useState('Intelligent Skin Care Inc.');
  const [coordinator, setCoordinator] = useState('Rojay');
  const [modeOfShipment, setModeOfShipment] = useState<ForwardingMode>('RORO');
  const [area, setArea] = useState<PhilippineArea>('Visayas');
  const [referenceNumber, setReferenceNumber] = useState(`PRJ-ISCI-${Math.floor(100 + Math.random() * 900)}`);
  
  // Section 2: Dispatch & Destination
  const [actualDispatchDate, setActualDispatchDate] = useState('2026-08-23');
  const [consignee, setConsignee] = useState('Belo Medical Hub - Visayas Central');
  const [destinationCode, setDestinationCode] = useState('CEB-01');
  const [quantity, setQuantity] = useState<number>(350);
  const [unit, setUnit] = useState('Boxes');
  const [courier, setCourier] = useState('OFII Fleet Inter-Island Transport');

  // Section 3: Cargo Information
  const [cbm, setCbm] = useState<number | undefined>(12.0);
  const [volumeWeightKg, setVolumeWeightKg] = useState<number | undefined>(undefined);
  const [actualWeightKg, setActualWeightKg] = useState<number | undefined>(undefined);
  const [chargeableWeightFees, setChargeableWeightFees] = useState('PHP 38,500.00');
  const [declaredValue, setDeclaredValue] = useState('PHP 1,450,000.00');

  // Section 4: Shipment References
  const [podNumber, setPodNumber] = useState(`POD-${Math.floor(700000 + Math.random() * 200000)}`);
  const [awbCourierRefNumber, setAwbCourierRefNumber] = useState(`AWB-RORO-CEB-${Math.floor(1000 + Math.random() * 9000)}`);

  // Section 5: Delivery Information
  const [deliveryStatus, setDeliveryStatus] = useState<ForwardingDeliveryStatus>('In Transit');
  const [receiversName, setReceiversName] = useState('');
  const [actualDeliveryDate, setActualDeliveryDate] = useState('');

  // Section 6: Delivery Performance
  const [deliveryLeadTimeDays, setDeliveryLeadTimeDays] = useState<number>(13);
  const [reasonForDelay, setReasonForDelay] = useState('');

  // Section 7: POD Monitoring
  const [podStatus, setPodStatus] = useState<PODStatus>('Pending Return');
  const [dateOfPodReturn, setDateOfPodReturn] = useState('');
  const [podLeadTimeDays, setPodLeadTimeDays] = useState<number>(3);
  const [podReasonForDelay, setPodReasonForDelay] = useState('');

  // System States
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset states on open
  useEffect(() => {
    if (isOpen) {
      setIsDirty(false);
      setShowUnsavedPrompt(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  // DUPLICATE CHECK
  const matchingDuplicate = React.useMemo(() => {
    const cleanPod = podNumber.trim().toLowerCase();
    const cleanRef = referenceNumber.trim().toLowerCase();

    if (cleanPod) {
      const matchInForwarding = existingRecords.find(r => !r.isDeleted && r.podNumber?.trim().toLowerCase() === cleanPod);
      if (matchInForwarding) return { type: 'POD', val: matchInForwarding.podNumber };
      const matchInDispatch = existingDispatches.find(d => !d.isDeleted && d.podNumber.trim().toLowerCase() === cleanPod);
      if (matchInDispatch) return { type: 'POD', val: matchInDispatch.podNumber };
    }

    if (cleanRef) {
      const matchInForwardingRef = existingRecords.find(r => !r.isDeleted && r.referenceNumber?.trim().toLowerCase() === cleanRef);
      if (matchInForwardingRef) return { type: 'Reference', val: matchInForwardingRef.referenceNumber };
    }

    return null;
  }, [podNumber, referenceNumber, existingRecords, existingDispatches]);

  // Auto retrieve Coordinator whenever Client changes
  useEffect(() => {
    if (clientName) {
      const assigned = getClientAssignedCoordinator(clients, clientName);
      setCoordinator(assigned);
    }
  }, [clientName, clients]);

  // Auto calculate Lead Time whenever Client, Mode, or Area changes
  useEffect(() => {
    const calculatedLeadTime = getAutoDeliveryLeadTime(clientName, modeOfShipment, area);
    setDeliveryLeadTimeDays(calculatedLeadTime);

    // Auto adapt destination code suggestion if not customized
    if (area === 'Visayas' && destinationCode.startsWith('DVO')) setDestinationCode('CEB-01');
    if (area === 'Mindanao' && destinationCode.startsWith('CEB')) setDestinationCode('DVO-01');
    if (area === 'Luzon' && !destinationCode.startsWith('LGN') && !destinationCode.startsWith('PMP')) setDestinationCode('LGN-01');
    if (area === 'NCR') setDestinationCode('NCR-01');
  }, [clientName, modeOfShipment, area]);

  // Evaluate Business Rule Flag
  const isISCI = 
    clientName.toLowerCase().includes('intelligent skin care') || 
    clientName.toLowerCase().includes('isci');
  const isRORO = modeOfShipment === 'RORO';
  const isVisayas = area === 'Visayas';
  const isBusinessRuleApplied = isISCI && isRORO && isVisayas;

  // Real-time Delivery Performance calculation
  const { tatDays: deliveryTatDays, performance: deliveryPerformance } = computeDeliveryPerformance(
    actualDispatchDate,
    actualDeliveryDate,
    deliveryLeadTimeDays
  );

  // Real-time POD Performance calculation
  const { podTatDays, podPerformance } = computePodPerformance(
    actualDeliveryDate,
    dateOfPodReturn,
    podLeadTimeDays
  );

  if (!isOpen) return null;

  const handleAttemptClose = () => {
    if (isDirty) {
      setShowUnsavedPrompt(true);
    } else {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!clientName.trim() || !referenceNumber.trim()) {
      setErrorMessage('Unable to save record. Please try again.');
      return;
    }

    if (matchingDuplicate) {
      setErrorMessage('A record with this POD or Reference Number already exists.');
      return;
    }

    const newRecord: ForwardingProgressiveRecord = {
      id: `FPR-2026-${Math.floor(100 + Math.random() * 900)}`,
      month,
      coordinator,
      client: clientName.trim(),
      modeOfShipment,
      area,
      referenceNumber: referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
      actualDispatchDate,
      consignee: consignee.trim(),
      destinationCode: destinationCode.trim(),
      quantity: Number(quantity) || 1,
      unit: unit || 'Boxes',
      courier: courier.trim(),
      cbm: (modeOfShipment === 'Sea Freight' || modeOfShipment === 'RORO') ? Number(cbm) : undefined,
      volumeWeightKg: modeOfShipment === 'Air Freight' ? Number(volumeWeightKg) : undefined,
      actualWeightKg: (modeOfShipment === 'Air Freight' || modeOfShipment === 'Land Freight') ? Number(actualWeightKg) : undefined,
      chargeableWeightFees,
      declaredValue,
      podNumber,
      awbCourierRefNumber,
      deliveryStatus,
      receiversName,
      actualDeliveryDate,
      deliveryLeadTimeDays: Number(deliveryLeadTimeDays),
      deliveryTatDays,
      deliveryPerformance,
      reasonForDelay: (deliveryPerformance === 'MISSED' || deliveryStatus === 'Delayed') ? reasonForDelay : undefined,
      podStatus,
      dateOfPodReturn,
      podLeadTimeDays: Number(podLeadTimeDays),
      podTatDays,
      podPerformance,
      podReasonForDelay: (podPerformance === 'MISSED') ? podReasonForDelay : undefined,
    };

    onAddRecord(newRecord, clientName.trim());
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl border border-slate-300 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Modal Header */}
          <div className="bg-blue-800 text-white px-6 py-4 border-b border-blue-900 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded bg-white/10 flex items-center justify-center text-white font-bold border border-white/20">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Add Forwarding Progressive Record
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950/80 text-blue-200 border border-blue-600">
                    Automated SLA Calculation
                  </span>
                </div>
                <p className="text-xs text-blue-100">
                  Log a new shipment with smart field inheritance and auto-calculated TAT & Performance.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAttemptClose}
              className="p-1.5 text-blue-200 hover:text-white rounded hover:bg-blue-700/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Business Rule Active Notification Banner */}
          {isBusinessRuleApplied && (
            <div className="bg-purple-50 border-b border-purple-200 px-6 py-2 flex items-center gap-2 text-xs text-purple-900 animate-in fade-in">
              <Sparkles className="w-4 h-4 text-purple-700 shrink-0" />
              <span>
                <strong>Company Business Rule Auto-Applied:</strong> Mode = <em>RORO</em> + Client = <em>Intelligent Skin Care Inc.</em> + Area = <em>Visayas</em> &rarr; Delivery Lead Time set to <strong>13 Days</strong>.
              </span>
            </div>
          )}

          {/* Duplicate Alert Banner */}
          {matchingDuplicate && (
            <div className="bg-amber-50 border-b border-amber-300 px-6 py-2.5 flex items-center gap-2.5 text-xs text-amber-950 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>A record with this POD or Reference Number already exists.</strong> (Duplicate {matchingDuplicate.type}: <em>{matchingDuplicate.val}</em>). Please verify the details before saving.
              </span>
            </div>
          )}

          {/* Error Alert Banner */}
          {errorMessage && (
            <div className="bg-rose-50 border-b border-rose-300 px-6 py-2.5 flex items-center gap-2.5 text-xs text-rose-900 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* Scrollable Form Body */}
          <form 
            onSubmit={handleSubmit} 
            onChange={() => setIsDirty(true)}
            className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50"
          >
          
          {/* SECTION 1: PROJECT / CLIENT INFORMATION */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <span className="w-5 h-5 rounded bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[11px]">1</span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Project / Client Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Client Name <span className="text-rose-500">*</span>
                </label>
                <SearchableClientSelect
                  clients={clients}
                  value={clientName}
                  onChange={(val, clientObj) => {
                    setClientName(val);
                    if (clientObj?.assignedCoordinator || clientObj?.accountManager) {
                      setCoordinator(clientObj.assignedCoordinator || clientObj.accountManager || 'Alodia Manalansan');
                    } else {
                      setCoordinator(getClientAssignedCoordinator(clients, val));
                    }
                  }}
                  onOpenAddClientModal={onOpenAddClientModal}
                  placeholder="Select or enter client name..."
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Coordinator <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-blue-800 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                    Auto-Assigned
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  tabIndex={-1}
                  value={coordinator}
                  title="Assigned Coordinator is automatically retrieved from Client Management based on the selected Client."
                  placeholder="Auto-assigned coordinator"
                  className="w-full px-2.5 py-1.5 bg-slate-100/90 border border-slate-300 rounded font-bold text-slate-900 focus:outline-none cursor-not-allowed select-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Month <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  placeholder="e.g. August 2026"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Mode of Shipment <span className="text-rose-500">*</span>
                </label>
                <select
                  value={modeOfShipment}
                  onChange={(e) => setModeOfShipment(e.target.value as ForwardingMode)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-semibold text-slate-900 focus:ring-1 focus:ring-blue-600 focus:outline-none cursor-pointer"
                >
                  <option value="RORO">RORO (Roll-On / Roll-Off)</option>
                  <option value="Sea Freight">Sea Freight</option>
                  <option value="Air Freight">Air Freight</option>
                  <option value="Land Freight">Land Freight</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Destination Area <span className="text-rose-500">*</span>
                </label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value as PhilippineArea)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-semibold text-slate-900 focus:ring-1 focus:ring-blue-600 focus:outline-none cursor-pointer"
                >
                  <option value="Visayas">Visayas</option>
                  <option value="Luzon">Luzon</option>
                  <option value="Mindanao">Mindanao</option>
                  <option value="NCR">NCR / Metro Manila</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Reference Number / Project Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. PRJ-ISCI-049"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-blue-700 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: DISPATCH & DESTINATION */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <span className="w-5 h-5 rounded bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[11px]">2</span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Dispatch & Destination
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Actual Dispatch Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={actualDispatchDate}
                  onChange={(e) => setActualDispatchDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Destination Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={destinationCode}
                  onChange={(e) => setDestinationCode(e.target.value)}
                  placeholder="e.g. CEB-01"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-blue-700 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Consignee <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={consignee}
                  onChange={(e) => setConsignee(e.target.value)}
                  placeholder="Receiving organization or facility"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Quantity & Unit <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    required
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-2/3 px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-1/3 px-2 py-1.5 bg-white border border-slate-300 rounded text-center text-xs"
                    placeholder="Boxes"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Courier / Carrier <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  placeholder="e.g. OFII Inter-Island Fleet / 2GO / PAL Cargo"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: CARGO INFORMATION (CONDITIONAL FIELDS) */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[11px]">3</span>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Cargo Information
                </h3>
              </div>
              <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
                Auto-adapted for <strong>{modeOfShipment}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* Conditional: CBM (Sea Freight & RORO) */}
              {(modeOfShipment === 'Sea Freight' || modeOfShipment === 'RORO') && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    CBM (Cubic Meters) <span className="text-[10px] text-cyan-700 font-normal">Sea / RORO</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={cbm !== undefined ? cbm : ''}
                    onChange={(e) => setCbm(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="e.g. 12.0"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              )}

              {/* Conditional: Volume Weight (Air Freight) */}
              {modeOfShipment === 'Air Freight' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Volume Weight (kg) <span className="text-[10px] text-indigo-700 font-normal">Air Freight</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={volumeWeightKg !== undefined ? volumeWeightKg : ''}
                    onChange={(e) => setVolumeWeightKg(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="e.g. 240.0"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              )}

              {/* Conditional: Actual Weight (Air Freight & Land Freight) */}
              {(modeOfShipment === 'Air Freight' || modeOfShipment === 'Land Freight') && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Actual Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={actualWeightKg !== undefined ? actualWeightKg : ''}
                    onChange={(e) => setActualWeightKg(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="e.g. 185.0"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Fees / Chargeable Weight</label>
                <input
                  type="text"
                  value={chargeableWeightFees}
                  onChange={(e) => setChargeableWeightFees(e.target.value)}
                  placeholder="e.g. PHP 38,500.00"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-semibold focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Declared Value</label>
                <input
                  type="text"
                  value={declaredValue}
                  onChange={(e) => setDeclaredValue(e.target.value)}
                  placeholder="e.g. PHP 1,450,000.00"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-semibold focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: SHIPMENT REFERENCES */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <span className="w-5 h-5 rounded bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[11px]">4</span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Shipment References
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  POD Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={podNumber}
                  onChange={(e) => setPodNumber(e.target.value)}
                  placeholder="e.g. POD-774012"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Air Waybill / Courier Reference Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={awbCourierRefNumber}
                  onChange={(e) => setAwbCourierRefNumber(e.target.value)}
                  placeholder="e.g. AWB-RORO-CEB-8821"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-blue-700 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: DELIVERY INFORMATION */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <span className="w-5 h-5 rounded bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[11px]">5</span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Delivery Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Delivery Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={deliveryStatus}
                  onChange={(e) => setDeliveryStatus(e.target.value as ForwardingDeliveryStatus)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-bold text-slate-900 focus:ring-1 focus:ring-blue-600 focus:outline-none cursor-pointer"
                >
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Pending Delivery">Pending Delivery</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Receiver&apos;s Name</label>
                <input
                  type="text"
                  value={receiversName}
                  onChange={(e) => setReceiversName(e.target.value)}
                  placeholder="Name of receiver at destination"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Actual Delivery Date</label>
                <input
                  type="date"
                  value={actualDeliveryDate}
                  onChange={(e) => setActualDeliveryDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 6: DELIVERY PERFORMANCE (AUTO-CALCULATED) */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[11px]">6</span>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Delivery Performance (Auto-Calculated)
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500">Real-Time SLA:</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                  deliveryPerformance === 'HIT' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                  deliveryPerformance === 'MISSED' ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                  'bg-slate-100 text-slate-700 border border-slate-300'
                }`}>
                  {deliveryPerformance}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Delivery Lead Time (Days)
                </label>
                <input
                  type="number"
                  value={deliveryLeadTimeDays}
                  onChange={(e) => setDeliveryLeadTimeDays(Number(e.target.value))}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
                {isBusinessRuleApplied && (
                  <p className="text-[10px] text-purple-700 font-semibold mt-1">
                    Auto-Set via 13-Day Visayas RORO Rule
                  </p>
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Delivery TAT (Days)
                </label>
                <div className="font-mono font-bold text-base text-blue-800">
                  {actualDeliveryDate ? `${deliveryTatDays} Days` : <span className="text-slate-400 text-xs font-normal">Pending Delivery</span>}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Delivery Date − Dispatch Date
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Delivery Performance Result
                </label>
                <div className="mt-1 font-bold text-sm">
                  {deliveryPerformance === 'HIT' && <span className="text-emerald-700">HIT (Within SLA)</span>}
                  {deliveryPerformance === 'MISSED' && <span className="text-rose-700">MISSED (Exceeded Lead Time)</span>}
                  {deliveryPerformance === 'PENDING' && <span className="text-slate-500">PENDING (In Transit)</span>}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Reason for Delay (Required if Missed or Delayed)
                </label>
                <input
                  type="text"
                  value={reasonForDelay}
                  onChange={(e) => setReasonForDelay(e.target.value)}
                  placeholder="e.g. Typhoon vessel suspension / Port terminal congestion..."
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 7: POD MONITORING (AUTO-CALCULATED) */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[11px]">7</span>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  POD Monitoring (Auto-Calculated)
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500">POD SLA:</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                  podPerformance === 'HIT' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                  podPerformance === 'MISSED' ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                  'bg-slate-100 text-slate-700 border border-slate-300'
                }`}>
                  {podPerformance}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">POD Status</label>
                <select
                  value={podStatus}
                  onChange={(e) => setPodStatus(e.target.value as PODStatus)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-bold text-slate-900 focus:ring-1 focus:ring-blue-600 focus:outline-none cursor-pointer"
                >
                  <option value="Pending Return">Pending Return</option>
                  <option value="Returned">Returned</option>
                  <option value="Transmitted">Transmitted</option>
                  <option value="Under Review">Under Review</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date of POD Return</label>
                <input
                  type="date"
                  value={dateOfPodReturn}
                  onChange={(e) => setDateOfPodReturn(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">POD Lead Time (Days)</label>
                <input
                  type="number"
                  value={podLeadTimeDays}
                  onChange={(e) => setPodLeadTimeDays(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">POD TAT (Days)</label>
                <div className="font-mono font-bold text-blue-800 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                  {dateOfPodReturn && actualDeliveryDate ? `${podTatDays} Days` : <span className="text-slate-400 text-xs font-normal">Pending</span>}
                </div>
              </div>

              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">POD Reason for Delay</label>
                <input
                  type="text"
                  value={podReasonForDelay}
                  onChange={(e) => setPodReasonForDelay(e.target.value)}
                  placeholder="Enter reason if POD document transmission exceeded SLA threshold..."
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleAttemptClose}
              className="px-4 py-2 rounded text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>SAVE FORWARDING RECORD</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    {/* Unsaved Changes Confirmation Modal */}
    <UnsavedChangesModal
      isOpen={showUnsavedPrompt}
      onKeepEditing={() => setShowUnsavedPrompt(false)}
      onConfirmDiscard={() => {
        setShowUnsavedPrompt(false);
        setIsDirty(false);
        onClose();
      }}
      title="Unsaved Changes"
      message="You have unsaved changes. Are you sure you want to leave?"
    />
  </>
);
};
