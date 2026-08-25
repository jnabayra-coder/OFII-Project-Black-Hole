import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  Save, 
  RotateCcw, 
  Building2, 
  Calendar, 
  Clock, 
  Truck, 
  Ship, 
  Plane, 
  Anchor, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  FileSpreadsheet, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Info,
  MapPin,
  Box,
  Hash,
  Trash2
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
import { 
  getAutoDeliveryLeadTime, 
  computeDeliveryPerformance, 
  computePodPerformance,
  calculateDaysBetween
} from '../utils/forwardingCalculations';
import { getClientAssignedCoordinator } from '../utils/dataSync';

interface ForwardingDetailModalProps {
  record: ForwardingProgressiveRecord;
  clients: ClientSummary[];
  isOpen: boolean;
  onClose: () => void;
  onSaveRecord: (updated: ForwardingProgressiveRecord) => void;
  onRequestDelete?: (record: ForwardingProgressiveRecord) => void;
  initialEditMode?: boolean;
}

export const ForwardingDetailModal: React.FC<ForwardingDetailModalProps> = ({
  record,
  clients,
  isOpen,
  onClose,
  onSaveRecord,
  onRequestDelete,
  initialEditMode = false,
}) => {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [formData, setFormData] = useState<ForwardingProgressiveRecord>({ ...record });
  const [saveToast, setSaveToast] = useState(false);

  // Sync state when record prop changes
  useEffect(() => {
    setFormData({ ...record });
    setIsEditing(initialEditMode);
  }, [record, initialEditMode, isOpen]);

  if (!isOpen) return null;

  // Real-time calculation helpers for current form data
  const handleInputChange = (field: keyof ForwardingProgressiveRecord, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Apply Smart Business Rules and calculations on the fly
      if (field === 'client' || field === 'modeOfShipment' || field === 'area') {
        const selectedClient = field === 'client' ? value : updated.client;
        const autoLeadTime = getAutoDeliveryLeadTime(
          selectedClient,
          field === 'modeOfShipment' ? value : updated.modeOfShipment,
          field === 'area' ? value : updated.area
        );
        updated.deliveryLeadTimeDays = autoLeadTime;

        if (field === 'client') {
          const matchedClient = clients.find(
            c => c.name.trim().toLowerCase() === String(value).trim().toLowerCase() || c.id === value
          );
          if (matchedClient?.assignedCoordinator || matchedClient?.accountManager) {
            updated.coordinator = matchedClient.assignedCoordinator || matchedClient.accountManager || 'Alodia Manalansan';
          } else {
            updated.coordinator = getClientAssignedCoordinator(clients, String(value));
          }
        }
      }

      // Auto-recalculate Delivery TAT & Performance
      if (field === 'actualDispatchDate' || field === 'actualDeliveryDate' || field === 'deliveryLeadTimeDays') {
        const dispatchDate = field === 'actualDispatchDate' ? value : updated.actualDispatchDate;
        const deliveryDate = field === 'actualDeliveryDate' ? value : updated.actualDeliveryDate;
        const leadTime = field === 'deliveryLeadTimeDays' ? Number(value) : updated.deliveryLeadTimeDays;
        
        const { tatDays, performance } = computeDeliveryPerformance(dispatchDate, deliveryDate, leadTime);
        updated.deliveryTatDays = tatDays;
        updated.deliveryPerformance = performance;
        if (deliveryDate && !updated.deliveryStatus) {
          updated.deliveryStatus = 'Delivered';
        }
      }

      // Auto-recalculate POD TAT & Performance
      if (field === 'actualDeliveryDate' || field === 'dateOfPodReturn' || field === 'podLeadTimeDays') {
        const deliveryDate = field === 'actualDeliveryDate' ? value : updated.actualDeliveryDate;
        const podReturnDate = field === 'dateOfPodReturn' ? value : updated.dateOfPodReturn;
        const podLeadTime = field === 'podLeadTimeDays' ? Number(value) : updated.podLeadTimeDays;

        const { podTatDays, podPerformance } = computePodPerformance(deliveryDate, podReturnDate, podLeadTime);
        updated.podTatDays = podTatDays;
        updated.podPerformance = podPerformance;
      }

      return updated;
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRecord(formData);
    setIsEditing(false);
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
    }, 4000);
  };

  const handleCancelEdit = () => {
    setFormData({ ...record });
    setIsEditing(false);
  };

  const isISCI = 
    (formData.client || '').toLowerCase().includes('intelligent skin care') || 
    (formData.client || '').toLowerCase().includes('isci');
  const isRORO = formData.modeOfShipment === 'RORO';
  const isVisayas = formData.area === 'Visayas';
  const isBusinessRuleApplied = isISCI && isRORO && isVisayas;

  const getPerformanceBadge = (perf: PerformanceResult) => {
    switch (perf) {
      case 'HIT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-700" />
            HIT (Within SLA)
          </span>
        );
      case 'MISSED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-700" />
            MISSED (SLA Breach)
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
            <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
            PENDING
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl border border-slate-300 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded bg-blue-600 flex items-center justify-center text-white font-bold border border-blue-400/40">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Forwarding Record Details
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-700">
                  {formData.referenceNumber || formData.id}
                </span>
                {isEditing ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950">
                    EDIT MODE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                    VIEW MODE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Client: <strong className="text-slate-200">{formData.client}</strong> • Destination: <strong className="text-slate-200">{formData.destinationCode} ({formData.area})</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <>
                {onRequestDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      onRequestDelete(record);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Move record to Recently Deleted"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Move to Trash</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-1.5 rounded text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                  <span>MAKE CHANGES</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3.5 py-1.5 rounded text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>SAVE CHANGES</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Confirmation Toast Banner */}
        {saveToast && (
          <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-semibold flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>Changes saved successfully. All SLA calculations and forwarding indicators have been updated.</span>
            </div>
            <button onClick={() => setSaveToast(false)} className="text-emerald-200 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Business Rule Active Indicator */}
        {isBusinessRuleApplied && (
          <div className="bg-purple-50 border-b border-purple-200 px-6 py-2 flex items-center gap-2 text-xs text-purple-900">
            <Sparkles className="w-4 h-4 text-purple-700 shrink-0" />
            <span>
              <strong>Company Business Rule Active:</strong> Mode of Shipment = <em>RORO</em>, Client = <em>Intelligent Skin Care Inc.</em>, Area = <em>Visayas</em> &rarr; Automatic Delivery Lead Time fixed at <strong>13 Days</strong>.
            </span>
          </div>
        )}

        {/* Scrollable Form / Content Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          
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
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Client Name</label>
                {isEditing ? (
                  <select
                    value={formData.client}
                    onChange={(e) => handleInputChange('client', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-semibold text-slate-900 focus:ring-1 focus:ring-blue-600 focus:outline-none cursor-pointer"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.name}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                ) : (
                  <div className="font-bold text-slate-900 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200 flex items-center justify-between">
                    <span>{formData.client}</span>
                    <Building2 className="w-3.5 h-3.5 text-blue-700" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-600">Coordinator</label>
                  {isEditing && (
                    <span className="text-[10px] text-blue-800 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                      Auto-Assigned
                    </span>
                  )}
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={formData.coordinator}
                    title="Assigned Coordinator is automatically derived from the selected Client."
                    className="w-full px-2.5 py-1.5 bg-slate-100/90 border border-slate-300 rounded font-bold text-slate-900 focus:outline-none cursor-not-allowed select-none"
                    placeholder="Auto-assigned coordinator"
                  />
                ) : (
                  <div className="font-semibold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                    {formData.coordinator || '—'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Month</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.month}
                    onChange={(e) => handleInputChange('month', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    placeholder="e.g. August 2026"
                  />
                ) : (
                  <div className="font-semibold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                    {formData.month || '—'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mode of Shipment</label>
                {isEditing ? (
                  <select
                    value={formData.modeOfShipment}
                    onChange={(e) => handleInputChange('modeOfShipment', e.target.value as ForwardingMode)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-semibold text-slate-900 focus:ring-1 focus:ring-blue-600 focus:outline-none cursor-pointer"
                  >
                    <option value="Sea Freight">Sea Freight</option>
                    <option value="Air Freight">Air Freight</option>
                    <option value="RORO">RORO (Roll-On / Roll-Off)</option>
                    <option value="Land Freight">Land Freight</option>
                  </select>
                ) : (
                  <div className="font-semibold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                    {formData.modeOfShipment}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Destination Area</label>
                {isEditing ? (
                  <select
                    value={formData.area}
                    onChange={(e) => handleInputChange('area', e.target.value as PhilippineArea)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-semibold text-slate-900 focus:ring-1 focus:ring-blue-600 focus:outline-none cursor-pointer"
                  >
                    <option value="Visayas">Visayas</option>
                    <option value="Luzon">Luzon</option>
                    <option value="Mindanao">Mindanao</option>
                    <option value="NCR">NCR / Metro Manila</option>
                  </select>
                ) : (
                  <div className="font-semibold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                    {formData.area}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Reference Number / Project Code</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.referenceNumber}
                    onChange={(e) => handleInputChange('referenceNumber', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-blue-700 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    placeholder="e.g. PRJ-ISCI-049"
                  />
                ) : (
                  <div className="font-mono font-bold text-blue-700 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                    {formData.referenceNumber}
                  </div>
                )}
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
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Actual Dispatch Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.actualDispatchDate}
                    onChange={(e) => handleInputChange('actualDispatchDate', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                ) : (
                  <div className="font-mono text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                    {formData.actualDispatchDate || '—'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Destination Code</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.destinationCode}
                    onChange={(e) => handleInputChange('destinationCode', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-blue-700 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    placeholder="e.g. CEB-01"
                  />
                ) : (
                  <div className="font-mono font-bold text-blue-700 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                    {formData.destinationCode}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Consignee</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.consignee}
                    onChange={(e) => handleInputChange('consignee', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    placeholder="Consignee company or receiver hub"
                  />
                ) : (
                  <div className="font-semibold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200 truncate" title={formData.consignee}>
                    {formData.consignee}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Quantity & Unit</label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', Number(e.target.value))}
                      className="w-2/3 px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={formData.unit || 'Boxes'}
                      onChange={(e) => handleInputChange('unit', e.target.value)}
                      className="w-1/3 px-2 py-1.5 bg-white border border-slate-300 rounded text-center text-xs"
                      placeholder="Boxes"
                    />
                  </div>
                ) : (
                  <div className="font-mono font-bold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                    {formData.quantity.toLocaleString()} {formData.unit || 'Boxes'}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Courier / Carrier</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.courier}
                    onChange={(e) => handleInputChange('courier', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    placeholder="e.g. OFII Inter-Island Fleet / 2GO / LBC"
                  />
                ) : (
                  <div className="font-semibold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                    {formData.courier}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: CARGO INFORMATION (SMART CONDITIONAL FIELDS) */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[11px]">3</span>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Cargo Information
                </h3>
              </div>
              <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
                Showing fields applicable for <strong>{formData.modeOfShipment}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* Conditional: CBM (Sea Freight & RORO) */}
              {(formData.modeOfShipment === 'Sea Freight' || formData.modeOfShipment === 'RORO') && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    CBM (Cubic Meters) <span className="text-[10px] text-cyan-700 font-normal">Sea / RORO</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.1"
                      value={formData.cbm || ''}
                      onChange={(e) => handleInputChange('cbm', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                      placeholder="e.g. 14.5"
                    />
                  ) : (
                    <div className="font-mono text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                      {formData.cbm ? `${formData.cbm} CBM` : '—'}
                    </div>
                  )}
                </div>
              )}

              {/* Conditional: Volume Weight (Air Freight) */}
              {formData.modeOfShipment === 'Air Freight' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Volume Weight (kg) <span className="text-[10px] text-indigo-700 font-normal">Air Freight</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.1"
                      value={formData.volumeWeightKg || ''}
                      onChange={(e) => handleInputChange('volumeWeightKg', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                      placeholder="e.g. 240.0"
                    />
                  ) : (
                    <div className="font-mono text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                      {formData.volumeWeightKg ? `${formData.volumeWeightKg} kg` : '—'}
                    </div>
                  )}
                </div>
              )}

              {/* Conditional: Actual Weight (Air Freight & Land Freight) */}
              {(formData.modeOfShipment === 'Air Freight' || formData.modeOfShipment === 'Land Freight') && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Actual Weight (kg)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.1"
                      value={formData.actualWeightKg || ''}
                      onChange={(e) => handleInputChange('actualWeightKg', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                      placeholder="e.g. 185.0"
                    />
                  ) : (
                    <div className="font-mono text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                      {formData.actualWeightKg ? `${formData.actualWeightKg} kg` : '—'}
                    </div>
                  )}
                </div>
              )}

              {/* Fees / Chargeable Weight */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Fees / Chargeable Weight</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.chargeableWeightFees}
                    onChange={(e) => handleInputChange('chargeableWeightFees', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-semibold focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    placeholder="e.g. PHP 42,500.00"
                  />
                ) : (
                  <div className="font-mono font-semibold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                    {formData.chargeableWeightFees || '—'}
                  </div>
                )}
              </div>

              {/* Declared Value */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Declared Value</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.declaredValue}
                    onChange={(e) => handleInputChange('declaredValue', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-semibold focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    placeholder="e.g. PHP 1,850,000.00"
                  />
                ) : (
                  <div className="font-mono font-semibold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                    {formData.declaredValue || '—'}
                  </div>
                )}
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
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">POD Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.podNumber}
                    onChange={(e) => handleInputChange('podNumber', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    placeholder="e.g. POD-774012"
                  />
                ) : (
                  <div className="font-mono font-bold text-slate-900 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                    {formData.podNumber}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Air Waybill / Courier Reference Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.awbCourierRefNumber}
                    onChange={(e) => handleInputChange('awbCourierRefNumber', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-blue-700 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    placeholder="e.g. AWB-RORO-CEB-8821"
                  />
                ) : (
                  <div className="font-mono font-bold text-blue-700 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                    {formData.awbCourierRefNumber}
                  </div>
                )}
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
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Delivery Status</label>
                {isEditing ? (
                  <select
                    value={formData.deliveryStatus}
                    onChange={(e) => handleInputChange('deliveryStatus', e.target.value as ForwardingDeliveryStatus)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-bold text-slate-900 focus:ring-1 focus:ring-blue-600 focus:outline-none cursor-pointer"
                  >
                    <option value="Delivered">Delivered</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Pending Delivery">Pending Delivery</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                ) : (
                  <div className="font-bold text-slate-900 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                    {formData.deliveryStatus}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Receiver&apos;s Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.receiversName}
                    onChange={(e) => handleInputChange('receiversName', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    placeholder="Authorized signatory / receiver"
                  />
                ) : (
                  <div className="font-semibold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                    {formData.receiversName || 'Pending Receiver'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Actual Delivery Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.actualDeliveryDate}
                    onChange={(e) => handleInputChange('actualDeliveryDate', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                ) : (
                  <div className="font-mono text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                    {formData.actualDeliveryDate || <span className="text-slate-400 italic">Pending Delivery</span>}
                  </div>
                )}
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
                <span className="text-[11px] text-slate-500">Delivery SLA Evaluation:</span>
                {getPerformanceBadge(formData.deliveryPerformance)}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Delivery Lead Time (Days)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.deliveryLeadTimeDays}
                    onChange={(e) => handleInputChange('deliveryLeadTimeDays', Number(e.target.value))}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                ) : (
                  <div className="font-mono font-bold text-base text-slate-900">
                    {formData.deliveryLeadTimeDays} Days
                  </div>
                )}
                {isBusinessRuleApplied && (
                  <p className="text-[10px] text-purple-700 font-semibold mt-1">
                    Auto-Set via 13-Day Visayas RORO Rule
                  </p>
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Delivery TAT (Turnaround Days)
                </label>
                <div className="font-mono font-bold text-base text-blue-800">
                  {formData.actualDeliveryDate && formData.actualDispatchDate ? (
                    `${formData.deliveryTatDays} Days`
                  ) : (
                    <span className="text-slate-400 text-xs font-normal">Calculating when delivered...</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Actual Delivery Date − Actual Dispatch Date
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Delivery SLA Performance
                </label>
                <div className="mt-1">
                  {getPerformanceBadge(formData.deliveryPerformance)}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  TAT ({formData.deliveryTatDays}d) vs Lead Time ({formData.deliveryLeadTimeDays}d)
                </p>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Reason for Delay (if Missed or Delayed)
                </label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={formData.reasonForDelay || ''}
                    onChange={(e) => handleInputChange('reasonForDelay', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    placeholder="Enter root cause / port congestion / weather suspension notes if delayed..."
                  />
                ) : (
                  <div className="font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded border border-slate-200">
                    {formData.reasonForDelay || <span className="text-slate-400 italic">No delay recorded. Shipment operating within SLA.</span>}
                  </div>
                )}
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
                <span className="text-[11px] text-slate-500">POD Performance:</span>
                {getPerformanceBadge(formData.podPerformance)}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">POD Status</label>
                {isEditing ? (
                  <select
                    value={formData.podStatus}
                    onChange={(e) => handleInputChange('podStatus', e.target.value as PODStatus)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-bold text-slate-900 focus:ring-1 focus:ring-blue-600 focus:outline-none cursor-pointer"
                  >
                    <option value="Returned">Returned</option>
                    <option value="Transmitted">Transmitted</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Pending Return">Pending Return</option>
                  </select>
                ) : (
                  <div className="font-bold text-slate-900 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                    {formData.podStatus}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date of POD Return</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.dateOfPodReturn}
                    onChange={(e) => handleInputChange('dateOfPodReturn', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                ) : (
                  <div className="font-mono text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                    {formData.dateOfPodReturn || <span className="text-slate-400 italic">Pending POD Return</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">POD Lead Time (Days)</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.podLeadTimeDays}
                    onChange={(e) => handleInputChange('podLeadTimeDays', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                ) : (
                  <div className="font-mono font-bold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                    {formData.podLeadTimeDays} Days
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">POD TAT (Days)</label>
                <div className="font-mono font-bold text-blue-800 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                  {formData.dateOfPodReturn && formData.actualDeliveryDate ? (
                    `${formData.podTatDays} Days`
                  ) : (
                    <span className="text-slate-400 text-xs font-normal">Pending</span>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">POD Reason for Delay</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.podReasonForDelay || ''}
                    onChange={(e) => handleInputChange('podReasonForDelay', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    placeholder="Enter reason if POD document return exceeded SLA threshold..."
                  />
                ) : (
                  <div className="font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded border border-slate-200">
                    {formData.podReasonForDelay || <span className="text-slate-400 italic">No POD delay. Document transmitted in order.</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons in Edit Mode */}
          {isEditing && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 rounded text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>SAVE CHANGES</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
