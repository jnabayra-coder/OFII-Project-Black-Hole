import React, { useState, useEffect } from 'react';
import { 
  X, 
  Truck, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  Phone, 
  Package, 
  Printer, 
  Copy, 
  ArrowRight,
  Pencil,
  Save,
  SlidersHorizontal,
  Check,
  Trash2
} from 'lucide-react';
import { DispatchRecord, DispatchStatus, DeliveryType, ClientSummary } from '../types';
import { formatTo12HourTime } from '../utils/timeUtils';
import { SearchableClientSelect } from './SearchableClientSelect';
import { MilitaryTimeInput } from './MilitaryTimeInput';

interface DispatchDetailModalProps {
  dispatch: DispatchRecord | null;
  onClose: () => void;
  onSelectClient: (clientName: string) => void;
  onSaveDispatch?: (updatedDispatch: DispatchRecord) => void;
  onRequestDelete?: (dispatch: DispatchRecord) => void;
  clients?: ClientSummary[];
}

export const DispatchDetailModal: React.FC<DispatchDetailModalProps> = ({
  dispatch,
  onClose,
  onSelectClient,
  onSaveDispatch,
  onRequestDelete,
  clients = [],
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [draft, setDraft] = useState<DispatchRecord | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Sync draft when dispatch prop changes
  useEffect(() => {
    if (dispatch) {
      setDraft({ ...dispatch });
      setIsEditMode(false);
      setSaveSuccessMessage(false);
    }
  }, [dispatch]);

  if (!dispatch || !draft) return null;

  const current = isEditMode ? draft : dispatch;

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleEnterEditMode = () => {
    setDraft({ ...dispatch });
    setIsEditMode(true);
    setSaveSuccessMessage(false);
  };

  const handleCancelEdit = () => {
    setDraft({ ...dispatch });
    setIsEditMode(false);
  };

  const handleSaveChanges = () => {
    if (!draft) return;
    if (onSaveDispatch) {
      onSaveDispatch(draft);
    }
    setIsEditMode(false);
    setSaveSuccessMessage(true);
    setTimeout(() => setSaveSuccessMessage(false), 4000);
  };

  const updateDraftField = <K extends keyof DispatchRecord>(key: K, value: DispatchRecord[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Delivered</span>;
      case 'In Transit':
        return <span className="px-2.5 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">In Transit</span>;
      case 'Departed':
        return <span className="px-2.5 py-1 rounded text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">Departed</span>;
      case 'In Loading':
        return <span className="px-2.5 py-1 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">In Loading</span>;
      case 'Delayed':
        return <span className="px-2.5 py-1 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Delayed</span>;
      default:
        return <span className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className={`bg-white rounded-lg shadow-2xl border max-w-4xl w-full overflow-hidden my-6 transition-all ${
        isEditMode ? 'border-amber-400 ring-2 ring-amber-200/70' : 'border-slate-200'
      }`}>
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded bg-blue-700 text-white">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Dispatch Detail: {current.podNumber}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-blue-300 font-mono">
                  {current.deliveryType}
                </span>
                {isEditMode && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950"></span>
                    <span>Edit Mode</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Manifest #{current.manifestNumber} • Delivery Date: {current.deliveryDate}
              </p>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center space-x-2">
            {!isEditMode ? (
              <>
                {onSaveDispatch && (
                  <button
                    onClick={handleEnterEditMode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded border border-amber-500/40 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>MAKE CHANGES</span>
                  </button>
                )}
                <button
                  onClick={() => copyToClipboard(`${current.podNumber} | ${current.manifestNumber} | ${current.clientName}`, 'header-copy')}
                  className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Copy Reference Information"
                >
                  {copiedField === 'header-copy' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => window.print()}
                  className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Print Dispatch Record"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 rounded transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors cursor-pointer shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>SAVE CHANGES</span>
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto text-xs text-slate-700 bg-slate-50/50">
          
          {/* Save Success Banner */}
          {saveSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">Changes saved successfully.</span>
                <span className="text-emerald-700">Updated across Daily Dispatching, Client Monitoring, and Forwarding Reports.</span>
              </div>
              <button 
                onClick={() => setSaveSuccessMessage(false)}
                className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Edit Mode Alert Banner */}
          {isEditMode && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <strong>Edit Mode Active:</strong> You can edit operational times, dates, equipment, and status below. Changes automatically synchronize across all related modules upon saving.
                </span>
              </div>
            </div>
          )}

          {/* Top Quick Status Bar with Adjacent Delivery Dates */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Operational Status
              </span>
              {!isEditMode ? (
                <div>{getStatusBadge(current.status)}</div>
              ) : (
                <select
                  value={draft.status}
                  onChange={(e) => updateDraftField('status', e.target.value as DispatchStatus)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-blue-600"
                >
                  <option value="In Loading">In Loading</option>
                  <option value="Departed">Departed</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Delayed">Delayed</option>
                </select>
              )}
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Client Account
              </span>
              {!isEditMode ? (
                <button
                  onClick={() => {
                    onSelectClient(current.clientName);
                    onClose();
                  }}
                  className="font-bold text-xs text-blue-700 hover:underline inline-flex items-center gap-1 mt-0.5"
                >
                  <span className="truncate max-w-[120px]">{current.clientName}</span>
                  <ArrowRight className="w-3 h-3 shrink-0" />
                </button>
              ) : (
                <SearchableClientSelect
                  clients={clients}
                  value={draft.clientName}
                  onChange={(name) => updateDraftField('clientName', name)}
                  placeholder="Select client..."
                />
              )}
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Cargo Volume
              </span>
              {!isEditMode ? (
                <span className="font-mono font-bold text-xs text-slate-900 block mt-0.5">
                  {current.quantityCasesBoxes} {current.unit}
                </span>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={draft.quantityCasesBoxes}
                    onChange={(e) => updateDraftField('quantityCasesBoxes', Number(e.target.value))}
                    className="w-16 bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-slate-900 text-xs"
                  />
                  <select
                    value={draft.unit}
                    onChange={(e) => updateDraftField('unit', e.target.value)}
                    className="bg-white border border-slate-300 rounded px-1.5 py-1 text-xs"
                  >
                    <option value="Boxes">Boxes</option>
                    <option value="Cases">Cases</option>
                    <option value="Cartons">Cartons</option>
                    <option value="Pallets">Pallets</option>
                  </select>
                </div>
              )}
            </div>

            {/* Planned Delivery Date */}
            <div className="p-2 rounded bg-blue-50/60 border border-blue-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block">
                Planned Delivery Date
              </span>
              {!isEditMode ? (
                <span className="font-mono font-bold text-xs text-slate-900 block mt-0.5">
                  {current.plannedDeliveryDate || '—'}
                </span>
              ) : (
                <input
                  type="date"
                  value={draft.plannedDeliveryDate}
                  onChange={(e) => updateDraftField('plannedDeliveryDate', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900 mt-0.5"
                />
              )}
            </div>

            {/* Delivery Date / Actual Delivery Date */}
            <div className="p-2 rounded bg-emerald-50/60 border border-emerald-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block">
                Delivery Date
              </span>
              {!isEditMode ? (
                <span className="font-mono font-bold text-xs text-slate-900 block mt-0.5">
                  {current.deliveryDate || '—'}
                </span>
              ) : (
                <input
                  type="date"
                  value={draft.deliveryDate}
                  onChange={(e) => updateDraftField('deliveryDate', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900 mt-0.5"
                />
              )}
            </div>
          </div>

          {/* Grid of Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Destination & Consignee */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-700" />
                <span>Destination & Routing</span>
              </h4>

              <div className="space-y-2">
                <div>
                  <span className="text-slate-500 block text-[11px]">Consignee / Recipient:</span>
                  {!isEditMode ? (
                    <span className="font-semibold text-slate-900">{current.consignee}</span>
                  ) : (
                    <input
                      type="text"
                      value={draft.consignee}
                      onChange={(e) => updateDraftField('consignee', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-semibold text-slate-900 text-xs"
                    />
                  )}
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Destination Facility:</span>
                  {!isEditMode ? (
                    <span className="text-slate-800">{current.destination}</span>
                  ) : (
                    <input
                      type="text"
                      value={draft.destination}
                      onChange={(e) => updateDraftField('destination', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs"
                    />
                  )}
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Delivery Type Classification:</span>
                  {!isEditMode ? (
                    <span className="font-mono font-bold text-slate-800">{current.deliveryType} Program</span>
                  ) : (
                    <select
                      value={draft.deliveryType}
                      onChange={(e) => updateDraftField('deliveryType', e.target.value as DeliveryType)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-slate-800 text-xs"
                    >
                      <option value="GADC">GADC</option>
                      <option value="ISCI">ISCI</option>
                      <option value="XSEED">XSEED</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Truck, Driver & Provider */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-700" />
                <span>Hauler & Equipment Details</span>
              </h4>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Carrier / Provider:</span>
                    {!isEditMode ? (
                      <span className="font-semibold text-slate-900">{current.truckProvider}</span>
                    ) : (
                      <input
                        type="text"
                        value={draft.truckProvider}
                        onChange={(e) => updateDraftField('truckProvider', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-semibold text-slate-900 text-xs"
                      />
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Plate Number:</span>
                    {!isEditMode ? (
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded inline-block">
                        {current.plateNumber}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={draft.plateNumber}
                        onChange={(e) => updateDraftField('plateNumber', e.target.value.toUpperCase())}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-slate-900 text-xs"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Assigned Driver:</span>
                    {!isEditMode ? (
                      <span className="font-medium text-slate-800">{current.driverName || 'Danilo P. Hernandez'}</span>
                    ) : (
                      <input
                        type="text"
                        value={draft.driverName || ''}
                        onChange={(e) => updateDraftField('driverName', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs"
                      />
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Contact Number:</span>
                    {!isEditMode ? (
                      <span className="font-mono text-slate-700">{current.driverContact || '+63 917 842 1190'}</span>
                    ) : (
                      <input
                        type="text"
                        value={draft.driverContact || ''}
                        onChange={(e) => updateDraftField('driverContact', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono text-slate-700 text-xs"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Dedicated Dispatch Timeline */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4 md:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-700" />
                  <span>Dispatch Timeline</span>
                </h4>
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">
                  Chronological Terminal Sequence (24-Hour Input)
                </span>
              </div>

              {/* Horizontal Visual Step Progress */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 relative">
                {/* Step 1: Truck Arrival */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">1. Arrival</span>
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                      1
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-700 mb-0.5">Truck Arrival</div>
                  {!isEditMode ? (
                    <div className="font-mono font-bold text-sm text-slate-900">
                      {formatTo12HourTime(current.truckArrivalTime)}
                    </div>
                  ) : (
                    <MilitaryTimeInput
                      value={draft.truckArrivalTime}
                      onChange={(val) => updateDraftField('truckArrivalTime', val)}
                      placeholder="e.g. 0530"
                    />
                  )}
                </div>

                {/* Step 2: Loading Started */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">2. Loading</span>
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                      2
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-700 mb-0.5">Loading Started</div>
                  {!isEditMode ? (
                    <div className="font-mono font-bold text-sm text-slate-900">
                      {formatTo12HourTime(current.loadingStartTime)}
                    </div>
                  ) : (
                    <MilitaryTimeInput
                      value={draft.loadingStartTime}
                      onChange={(val) => updateDraftField('loadingStartTime', val)}
                      placeholder="e.g. 0615"
                    />
                  )}
                </div>

                {/* Step 3: Loading Completed */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">3. Staged</span>
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                      3
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-700 mb-0.5">Loading Completed</div>
                  {!isEditMode ? (
                    <div className="font-mono font-bold text-sm text-slate-900">
                      {formatTo12HourTime(current.loadingEndTime)}
                    </div>
                  ) : (
                    <MilitaryTimeInput
                      value={draft.loadingEndTime}
                      onChange={(val) => updateDraftField('loadingEndTime', val)}
                      placeholder="e.g. 0745"
                    />
                  )}
                </div>

                {/* Step 4: Truck Departed */}
                <div className="p-3 rounded-lg bg-blue-50/80 border border-blue-200 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">4. Departed</span>
                    <span className="w-5 h-5 rounded-full bg-blue-700 text-white text-[10px] font-bold flex items-center justify-center">
                      4
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-blue-900 mb-0.5">Truck Departed</div>
                  {!isEditMode ? (
                    <div className="font-mono font-bold text-sm text-blue-950">
                      {formatTo12HourTime(current.departureTime)}
                    </div>
                  ) : (
                    <MilitaryTimeInput
                      value={draft.departureTime}
                      onChange={(val) => updateDraftField('departureTime', val)}
                      placeholder="e.g. 0815"
                    />
                  )}
                </div>
              </div>

              {/* Compact Structured 2-Column Table */}
              <div className="rounded border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 border-r border-slate-200">Event</th>
                      <th className="py-2 px-3">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                        <span>Truck Arrival</span>
                      </td>
                      <td className="py-2 px-3 font-mono font-semibold text-slate-900">
                        {formatTo12HourTime(current.truckArrivalTime)}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span>Loading Started</span>
                      </td>
                      <td className="py-2 px-3 font-mono font-semibold text-slate-900">
                        {formatTo12HourTime(current.loadingStartTime)}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                        <span>Loading Completed</span>
                      </td>
                      <td className="py-2 px-3 font-mono font-semibold text-slate-900">
                        {formatTo12HourTime(current.loadingEndTime)}
                      </td>
                    </tr>
                    <tr className="hover:bg-blue-50/50 bg-blue-50/20">
                      <td className="py-2 px-3 border-r border-slate-200 text-blue-900 font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        <span>Truck Departed</span>
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-blue-950">
                        {formatTo12HourTime(current.departureTime)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Documentation & Remarks */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2 md:col-span-2">
              <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-700" />
                <span>Reference Documents & Dispatch Remarks</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-2">
                  <div>
                    <span className="text-slate-500 text-[11px] block mb-1">POD Number:</span>
                    {!isEditMode ? (
                      <div className="bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200 font-mono font-bold text-blue-700">
                        {current.podNumber}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={draft.podNumber}
                        onChange={(e) => updateDraftField('podNumber', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono font-bold text-blue-700 text-xs"
                      />
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block mb-1">Manifest Number:</span>
                    {!isEditMode ? (
                      <div className="bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200 font-mono font-bold text-slate-800">
                        {current.manifestNumber}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={draft.manifestNumber}
                        onChange={(e) => updateDraftField('manifestNumber', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono font-bold text-slate-800 text-xs"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px] block mb-1">Dispatcher Operational Remarks:</span>
                  {!isEditMode ? (
                    <p className="p-2.5 rounded bg-slate-50 border border-slate-200 text-slate-700 text-xs italic leading-relaxed min-h-[68px]">
                      &ldquo;{current.remarks}&rdquo;
                    </p>
                  ) : (
                    <textarea
                      rows={3}
                      value={draft.remarks}
                      onChange={(e) => updateDraftField('remarks', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 text-xs"
                    />
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500 font-mono">
              System ID: {current.id}
            </span>
            {onRequestDelete && !isEditMode && (
              <button
                type="button"
                onClick={() => {
                  onRequestDelete(dispatch);
                  onClose();
                }}
                className="text-xs text-amber-700 hover:text-amber-900 font-semibold inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 cursor-pointer transition-colors"
                title="Move this dispatch record to Recently Deleted"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Move to Trash</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded cursor-pointer transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>SAVE CHANGES</span>
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded cursor-pointer transition-colors"
              >
                Close Details
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
