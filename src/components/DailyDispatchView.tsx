import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  Truck, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Clock, 
  FileText,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Pencil,
  X,
  Save,
  Check,
  Trash2,
  Bell
} from 'lucide-react';
import { DispatchRecord, DeliveryType, DispatchStatus, ForwardingDispatchNotification, ClientSummary } from '../types';
import { MilitaryTimeInput } from './MilitaryTimeInput';
import { formatTo12HourTime, formatTo24HourTime, formatDualTimeDisplay, parseAndConvertMilitaryTime } from '../utils/timeUtils';
import { ForwardingDispatchNotificationPanel } from './ForwardingDispatchNotificationPanel';

interface DailyDispatchViewProps {
  dispatches: DispatchRecord[];
  onSelectDispatch: (dispatch: DispatchRecord) => void;
  onOpenAddModal: () => void;
  onUpdateDispatches: (updatedDispatches: DispatchRecord[]) => void;
  onRequestDeleteDispatch?: (dispatch: DispatchRecord) => void;
  dispatchNotifications?: ForwardingDispatchNotification[];
  onCompleteDispatchNotification?: (notification: ForwardingDispatchNotification) => void;
  onDismissDispatchNotification?: (notificationId: string) => void;
  clients?: ClientSummary[];
}

export const DailyDispatchView: React.FC<DailyDispatchViewProps> = ({
  dispatches,
  onSelectDispatch,
  onOpenAddModal,
  onUpdateDispatches,
  onRequestDeleteDispatch,
  dispatchNotifications = [],
  onCompleteDispatchNotification,
  onDismissDispatchNotification,
  clients = [],
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editDraft, setEditDraft] = useState<Record<string, DispatchRecord>>({});
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);

  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedDate, setSelectedDate] = useState('2026-08-23');
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Start Edit Mode
  const handleEnterEditMode = () => {
    const draft: Record<string, DispatchRecord> = {};
    dispatches.forEach((d) => {
      draft[d.id] = { ...d };
    });
    setEditDraft(draft);
    setIsEditMode(true);
    setSaveSuccessMessage(false);
  };

  // Cancel Edit Mode
  const handleCancelEdit = () => {
    setEditDraft({});
    setIsEditMode(false);
  };

  // Save Changes
  const handleSaveChanges = () => {
    const updatedList = dispatches.map((d) => {
      return editDraft[d.id] ? editDraft[d.id] : d;
    });
    onUpdateDispatches(updatedList);
    setIsEditMode(false);
    setSaveSuccessMessage(true);
    setTimeout(() => {
      setSaveSuccessMessage(false);
    }, 4000);
  };

  // Update specific field in edit draft
  const handleFieldChange = (id: string, field: keyof DispatchRecord, value: any) => {
    setEditDraft((prev) => {
      const current = prev[id] || dispatches.find((d) => d.id === id);
      if (!current) return prev;
      return {
        ...prev,
        [id]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  // Filtered dispatches (using draft values when in edit mode)
  const filteredDispatches = useMemo(() => {
    return dispatches.filter((originalItem) => {
      // Exclude deleted records
      if (originalItem.isDeleted) return false;

      const item = isEditMode && editDraft[originalItem.id] ? editDraft[originalItem.id] : originalItem;
      
      // Year check
      if (selectedYear && !item.deliveryDate.startsWith(selectedYear)) {
        return false;
      }
      // Delivery Type filter
      if (selectedDeliveryType !== 'ALL' && item.deliveryType !== selectedDeliveryType) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
        return false;
      }
      // Search query (POD, Manifest, Consignee, Destination, Plate, Provider, Client)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matches = 
          item.podNumber.toLowerCase().includes(q) ||
          item.manifestNumber.toLowerCase().includes(q) ||
          item.consignee.toLowerCase().includes(q) ||
          item.destination.toLowerCase().includes(q) ||
          item.plateNumber.toLowerCase().includes(q) ||
          item.truckProvider.toLowerCase().includes(q) ||
          item.clientName.toLowerCase().includes(q) ||
          item.remarks.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [dispatches, editDraft, isEditMode, selectedYear, selectedDeliveryType, selectedStatus, searchQuery]);

  const getStatusBadge = (status: DispatchStatus) => {
    switch (status) {
      case 'Delivered':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Delivered</span>;
      case 'In Transit':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">In Transit</span>;
      case 'Departed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">Departed</span>;
      case 'In Loading':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">In Loading</span>;
      case 'Delayed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Delayed</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  const getDeliveryTypeBadge = (type: DeliveryType) => {
    switch (type) {
      case 'GADC':
        return <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-indigo-50 text-indigo-700 border border-indigo-200">GADC</span>;
      case 'ISCI':
        return <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-purple-50 text-purple-700 border border-purple-200">ISCI</span>;
      case 'XSEED':
        return <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-50 text-amber-700 border border-amber-200">XSEED</span>;
      default:
        return <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">{type}</span>;
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header & Action Controls */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-700" />
              <span>Daily Dispatching Monitoring</span>
            </h1>

            {isEditMode ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 animate-pulse shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Edit Mode Active</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <Eye className="w-3 h-3 text-slate-500" />
                <span>View Mode</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time control log of terminal truck arrivals, bay loading cycles, and departing linehauls.
          </p>
        </div>

        {/* Action Controls: View Mode vs Edit Mode */}
        <div className="flex items-center gap-2.5">
          {!isEditMode ? (
            <>
              <button
                id="btn-dispatch-make-changes"
                onClick={handleEnterEditMode}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 rounded shadow-xs border border-amber-500/30 transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>MAKE CHANGES</span>
              </button>

              <button
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 rounded shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Dispatch</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="btn-dispatch-cancel-changes"
                onClick={handleCancelEdit}
                className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-300 rounded transition-colors cursor-pointer shadow-2xs"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
                <span>CANCEL</span>
              </button>

              <button
                id="btn-dispatch-save-changes"
                onClick={handleSaveChanges}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>SAVE CHANGES</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Save Confirmation Banner */}
      {saveSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">Changes saved successfully.</span>
            <span className="text-emerald-700">Dispatch log records updated in monitoring system.</span>
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
              <strong>Edit Mode active:</strong> You can edit any cell directly in the table below. When finished, click <strong>SAVE CHANGES</strong> above to commit your edits or <strong>CANCEL</strong> to discard.
            </span>
          </div>
          <span className="text-[11px] font-mono text-amber-800 font-semibold uppercase">
            Interactive Form Table
          </span>
        </div>
      )}

      {/* Forwarding -> Dispatch Notification Workflow Panel */}
      {dispatchNotifications.length > 0 && onCompleteDispatchNotification && onDismissDispatchNotification && (
        <ForwardingDispatchNotificationPanel
          notifications={dispatchNotifications}
          dispatches={dispatches}
          onCompleteDispatch={onCompleteDispatchNotification}
          onDismissNotification={onDismissDispatchNotification}
          onViewExistingDispatch={onSelectDispatch}
        />
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          
          {/* Year Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="2026">2026 (Current Operational Year)</option>
              <option value="2025">2025 (Archive)</option>
            </select>
          </div>

          {/* Date Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Dispatch Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Delivery Type Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Delivery Type
            </label>
            <select
              value={selectedDeliveryType}
              onChange={(e) => setSelectedDeliveryType(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">All Delivery Types (GADC / ISCI / XSEED)</option>
              <option value="GADC">GADC</option>
              <option value="ISCI">ISCI</option>
              <option value="XSEED">XSEED</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Dispatch Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="In Loading">In Loading</option>
              <option value="Departed">Departed</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>

          {/* Search Field */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Search Field
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="POD, Plate, Manifest, Consignee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Filter Summary Tags & Results Count */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Showing <strong>{filteredDispatches.length}</strong> of {dispatches.length} dispatch logs</span>
            {(selectedDeliveryType !== 'ALL' || selectedStatus !== 'ALL' || searchQuery !== '') && (
              <button
                onClick={() => {
                  setSelectedDeliveryType('ALL');
                  setSelectedStatus('ALL');
                  setSearchQuery('');
                }}
                className="text-blue-700 hover:underline text-[11px] font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-400">
            {isEditMode 
              ? 'Edit Mode Active: Modify fields below and click SAVE CHANGES.' 
              : 'Tip: Click any dispatch row to view full timing breakdown & manifest details.'}
          </div>
        </div>
      </div>

      {/* Clean, Streamlined Operational Table */}
      <div className={`bg-white rounded-lg border shadow-xs overflow-hidden transition-all ${
        isEditMode ? 'border-amber-400 ring-2 ring-amber-200/60' : 'border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/90 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10 whitespace-nowrap">
              <tr>
                <th className="py-2.5 px-3 border-r border-slate-200 bg-blue-50/80 text-blue-900 font-bold">
                  Planned Delivery Date
                </th>
                <th className="py-2.5 px-3 border-r border-slate-200 bg-blue-50/80 text-blue-900 font-bold">
                  Delivery Date
                </th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center">Status</th>
                <th className="py-2.5 px-3 border-r border-slate-200">POD Number</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-right">Quantity</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center">Delivery Type</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Destination</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Consignee</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Truck / Plate Number</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Manifest / Remarks</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredDispatches.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-slate-500 bg-slate-50">
                    No dispatch records matching your current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDispatches.map((record) => {
                  const currentRecord = isEditMode && editDraft[record.id] ? editDraft[record.id] : record;

                  if (isEditMode) {
                    // EDIT MODE ROW RENDERING (Interactive inputs)
                    return (
                      <tr
                        key={currentRecord.id}
                        className="bg-amber-50/20 hover:bg-amber-50/40 transition-colors whitespace-nowrap"
                      >
                        {/* 1. Planned Delivery Date */}
                        <td className="py-2 px-2.5 border-r border-slate-200 bg-blue-50/30">
                          <input
                            type="date"
                            value={currentRecord.plannedDeliveryDate}
                            onChange={(e) => handleFieldChange(currentRecord.id, 'plannedDeliveryDate', e.target.value)}
                            className="bg-white border border-amber-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2 py-1 font-mono font-semibold text-xs text-blue-950 w-32 shadow-2xs"
                          />
                        </td>

                        {/* 2. Delivery Date */}
                        <td className="py-2 px-2.5 border-r border-slate-200 bg-blue-50/30">
                          <input
                            type="date"
                            value={currentRecord.deliveryDate}
                            onChange={(e) => handleFieldChange(currentRecord.id, 'deliveryDate', e.target.value)}
                            className="bg-white border border-amber-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2 py-1 font-mono font-semibold text-xs text-slate-900 w-32 shadow-2xs"
                          />
                        </td>

                        {/* 3. Status */}
                        <td className="py-2 px-2.5 border-r border-slate-200 text-center">
                          <select
                            value={currentRecord.status}
                            onChange={(e) => handleFieldChange(currentRecord.id, 'status', e.target.value as DispatchStatus)}
                            className="bg-white border border-amber-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2 py-1 font-semibold text-xs text-slate-800 shadow-2xs"
                          >
                            <option value="Planned">Planned</option>
                            <option value="In Loading">In Loading</option>
                            <option value="Departed">Departed</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Delayed">Delayed</option>
                          </select>
                        </td>

                        {/* 4. POD Number */}
                        <td className="py-2 px-2.5 border-r border-slate-200">
                          <input
                            type="text"
                            value={currentRecord.podNumber}
                            onChange={(e) => handleFieldChange(currentRecord.id, 'podNumber', e.target.value)}
                            className="bg-white border border-amber-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2 py-1 font-mono font-bold text-blue-700 text-xs w-32 shadow-2xs"
                          />
                        </td>

                        {/* 5. Quantity / Cases / Boxes */}
                        <td className="py-2 px-2.5 border-r border-slate-200">
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              min="0"
                              value={currentRecord.quantityCasesBoxes}
                              onChange={(e) => handleFieldChange(currentRecord.id, 'quantityCasesBoxes', parseInt(e.target.value, 10) || 0)}
                              className="bg-white border border-amber-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2 py-1 font-mono font-semibold text-xs text-slate-900 w-20 text-right shadow-2xs"
                            />
                            <span className="text-[11px] text-slate-500 font-medium">{currentRecord.unit}</span>
                          </div>
                        </td>

                        {/* 6. Delivery Type */}
                        <td className="py-2 px-2.5 border-r border-slate-200 text-center">
                          <select
                            value={currentRecord.deliveryType}
                            onChange={(e) => handleFieldChange(currentRecord.id, 'deliveryType', e.target.value as DeliveryType)}
                            className="bg-white border border-amber-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2 py-1 font-mono font-bold text-xs text-slate-800 shadow-2xs"
                          >
                            <option value="GADC">GADC</option>
                            <option value="ISCI">ISCI</option>
                            <option value="XSEED">XSEED</option>
                          </select>
                        </td>

                        {/* 7. Destination */}
                        <td className="py-2 px-2.5 border-r border-slate-200">
                          <input
                            type="text"
                            value={currentRecord.destination}
                            onChange={(e) => handleFieldChange(currentRecord.id, 'destination', e.target.value)}
                            className="bg-white border border-amber-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2 py-1 text-xs text-slate-800 min-w-[180px] shadow-2xs"
                          />
                        </td>

                        {/* 8. Consignee */}
                        <td className="py-2 px-2.5 border-r border-slate-200">
                          <input
                            type="text"
                            value={currentRecord.consignee}
                            onChange={(e) => handleFieldChange(currentRecord.id, 'consignee', e.target.value)}
                            className="bg-white border border-amber-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2 py-1 text-xs font-medium text-slate-900 min-w-[160px] shadow-2xs"
                          />
                        </td>

                        {/* 9. Truck / Plate Number */}
                        <td className="py-2 px-2.5 border-r border-slate-200">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={currentRecord.truckProvider}
                              onChange={(e) => handleFieldChange(currentRecord.id, 'truckProvider', e.target.value)}
                              placeholder="Provider"
                              className="bg-white border border-amber-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2 py-1 text-xs text-slate-700 w-28 shadow-2xs"
                            />
                            <input
                              type="text"
                              value={currentRecord.plateNumber}
                              onChange={(e) => handleFieldChange(currentRecord.id, 'plateNumber', e.target.value)}
                              placeholder="Plate #"
                              className="bg-white border border-amber-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2 py-1 font-mono font-bold text-xs text-slate-800 w-24 shadow-2xs"
                            />
                          </div>
                        </td>

                        {/* 10. Manifest / Remarks */}
                        <td className="py-2 px-2.5 border-r border-slate-200">
                          <input
                            type="text"
                            value={currentRecord.manifestNumber}
                            onChange={(e) => handleFieldChange(currentRecord.id, 'manifestNumber', e.target.value)}
                            placeholder="Manifest #"
                            className="bg-white border border-amber-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2 py-1 font-mono text-xs text-slate-800 w-28 shadow-2xs"
                          />
                        </td>

                        {/* 11. Action / View Details */}
                        <td className="py-2 px-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => onSelectDispatch(currentRecord)}
                              className="text-xs text-blue-700 hover:text-blue-900 font-semibold inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 cursor-pointer"
                              title="View Timeline Breakdown"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Timeline</span>
                            </button>
                            {onRequestDeleteDispatch && (
                              <button
                                type="button"
                                onClick={() => onRequestDeleteDispatch(currentRecord)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Move to Trash"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // VIEW MODE ROW RENDERING (Read-only, high scannability)
                  return (
                    <tr
                      key={record.id}
                      onClick={() => onSelectDispatch(record)}
                      className="hover:bg-blue-50/60 transition-colors cursor-pointer group whitespace-nowrap"
                    >
                      {/* 1. Planned Delivery Date */}
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-900 border-r border-slate-200 bg-blue-50/30">
                        {record.plannedDeliveryDate}
                      </td>

                      {/* 2. Delivery Date / Actual Delivery Date */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 border-r border-slate-200 bg-blue-50/30">
                        {record.deliveryDate}
                      </td>

                      {/* 3. Status */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                        {getStatusBadge(record.status)}
                      </td>

                      {/* 4. POD Number */}
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700 group-hover:underline border-r border-slate-200">
                        {record.podNumber}
                      </td>

                      {/* 5. Quantity / Cases / Boxes */}
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 border-r border-slate-200 text-right">
                        {record.quantityCasesBoxes.toLocaleString()} {record.unit}
                      </td>

                      {/* 6. Delivery Type */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                        {getDeliveryTypeBadge(record.deliveryType)}
                      </td>

                      {/* 7. Destination */}
                      <td className="py-2.5 px-3 max-w-[200px] truncate border-r border-slate-200" title={record.destination}>
                        {record.destination}
                      </td>

                      {/* 8. Consignee */}
                      <td className="py-2.5 px-3 font-medium text-slate-800 max-w-[180px] truncate border-r border-slate-200" title={record.consignee}>
                        {record.consignee}
                      </td>

                      {/* 9. Truck / Plate Number */}
                      <td className="py-2.5 px-3 border-r border-slate-200">
                        <div className="font-semibold text-slate-900">{record.truckProvider}</div>
                        <div className="font-mono text-[11px] text-slate-500">{record.plateNumber}</div>
                      </td>

                      {/* 10. Manifest / Remarks */}
                      <td className="py-2.5 px-3 max-w-[160px] truncate border-r border-slate-200 text-slate-600" title={record.remarks ? `${record.manifestNumber} • ${record.remarks}` : record.manifestNumber}>
                        <div className="font-mono font-medium text-slate-800">{record.manifestNumber}</div>
                        {record.remarks && (
                          <div className="text-[10px] text-slate-400 truncate">{record.remarks}</div>
                        )}
                      </td>

                      {/* 11. Action */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 group-hover:text-blue-900 bg-blue-50/80 group-hover:bg-blue-100 px-2 py-1 rounded transition-colors">
                            <Eye className="w-3 h-3" />
                            <span>Details</span>
                          </span>
                          {onRequestDeleteDispatch && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRequestDeleteDispatch(record);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Move to Trash"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Summary */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Total Active Dispatches Shown: <strong className="text-slate-800 font-mono">{filteredDispatches.length} Records</strong>
          </span>
          <span className="text-[11px] text-slate-400">
            OFII Fleet Terminal Control • Paranaque Hub Station #01
          </span>
        </div>
      </div>
    </div>
  );
};

