import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  FileSpreadsheet, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Building2, 
  Ship, 
  Plane, 
  Truck, 
  Anchor, 
  FileText, 
  Download, 
  RotateCcw,
  SlidersHorizontal,
  Layers,
  ArrowUpDown,
  ExternalLink,
  Edit3,
  Trash2
} from 'lucide-react';
import { 
  ForwardingProgressiveRecord, 
  ClientSummary, 
  ForwardingMode, 
  PhilippineArea, 
  ForwardingDeliveryStatus, 
  PODStatus 
} from '../types';

interface ForwardingProgressiveViewProps {
  records: ForwardingProgressiveRecord[];
  clients: ClientSummary[];
  onSelectRecord: (record: ForwardingProgressiveRecord) => void;
  onOpenAddModal: () => void;
  onQuickEditRecord?: (record: ForwardingProgressiveRecord) => void;
  onRequestDeleteRecord?: (record: ForwardingProgressiveRecord) => void;
}

export const ForwardingProgressiveView: React.FC<ForwardingProgressiveViewProps> = ({
  records,
  clients,
  onSelectRecord,
  onOpenAddModal,
  onQuickEditRecord,
  onRequestDeleteRecord,
}) => {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedCoordinator, setSelectedCoordinator] = useState('ALL');
  const [selectedClient, setSelectedClient] = useState('ALL');
  const [selectedMode, setSelectedMode] = useState<string>('ALL');
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [selectedDeliveryStatus, setSelectedDeliveryStatus] = useState<string>('ALL');
  const [selectedPodStatus, setSelectedPodStatus] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected row for quick actions
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Derive unique filter lists from data
  const monthsList = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => r.month && set.add(r.month));
    return Array.from(set);
  }, [records]);

  const coordinatorsList = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => r.coordinator && set.add(r.coordinator));
    return Array.from(set);
  }, [records]);

  const clientsList = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => r.client && set.add(r.client));
    return Array.from(set);
  }, [records]);

  // Filtering Logic
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Exclude deleted records
      if (r.isDeleted) return false;

      // 1. Search Query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matches = 
          r.referenceNumber.toLowerCase().includes(query) ||
          r.client.toLowerCase().includes(query) ||
          r.consignee.toLowerCase().includes(query) ||
          r.destinationCode.toLowerCase().includes(query) ||
          r.podNumber.toLowerCase().includes(query) ||
          r.awbCourierRefNumber.toLowerCase().includes(query) ||
          r.courier.toLowerCase().includes(query) ||
          r.coordinator.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // 2. Month Filter
      if (selectedMonth !== 'ALL' && r.month !== selectedMonth) {
        return false;
      }

      // 3. Coordinator Filter
      if (selectedCoordinator !== 'ALL' && r.coordinator !== selectedCoordinator) {
        return false;
      }

      // 4. Client Filter
      if (selectedClient !== 'ALL' && r.client.toLowerCase() !== selectedClient.toLowerCase()) {
        return false;
      }

      // 5. Mode Filter
      if (selectedMode !== 'ALL' && r.modeOfShipment !== selectedMode) {
        return false;
      }

      // 6. Area Filter
      if (selectedArea !== 'ALL' && r.area !== selectedArea) {
        return false;
      }

      // 7. Delivery Status Filter
      if (selectedDeliveryStatus !== 'ALL' && r.deliveryStatus !== selectedDeliveryStatus) {
        return false;
      }

      // 8. POD Status Filter
      if (selectedPodStatus !== 'ALL' && r.podStatus !== selectedPodStatus) {
        return false;
      }

      // 9. Date Range Filter (based on actual dispatch date or delivery date)
      if (startDate) {
        const dispatchDate = r.actualDispatchDate;
        if (dispatchDate && dispatchDate < startDate) return false;
      }
      if (endDate) {
        const dispatchDate = r.actualDispatchDate;
        if (dispatchDate && dispatchDate > endDate) return false;
      }

      return true;
    });
  }, [
    records,
    searchTerm,
    selectedMonth,
    selectedCoordinator,
    selectedClient,
    selectedMode,
    selectedArea,
    selectedDeliveryStatus,
    selectedPodStatus,
    startDate,
    endDate,
  ]);

  // Operational KPI calculations
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const delivered = filteredRecords.filter((r) => r.deliveryStatus === 'Delivered').length;
    const inTransit = filteredRecords.filter((r) => r.deliveryStatus === 'In Transit').length;
    const delayed = filteredRecords.filter((r) => r.deliveryStatus === 'Delayed' || r.deliveryPerformance === 'MISSED').length;
    const hitRecords = filteredRecords.filter((r) => r.deliveryPerformance === 'HIT').length;
    const completedWithPerf = filteredRecords.filter((r) => r.deliveryPerformance === 'HIT' || r.deliveryPerformance === 'MISSED').length;
    const hitRate = completedWithPerf > 0 ? ((hitRecords / completedWithPerf) * 100).toFixed(1) : '100.0';
    const podReturned = filteredRecords.filter((r) => r.podStatus === 'Returned' || r.podStatus === 'Transmitted').length;

    return { total, delivered, inTransit, delayed, hitRate, podReturned };
  }, [filteredRecords]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedMonth('ALL');
    setSelectedCoordinator('ALL');
    setSelectedClient('ALL');
    setSelectedMode('ALL');
    setSelectedArea('ALL');
    setSelectedDeliveryStatus('ALL');
    setSelectedPodStatus('ALL');
    setStartDate('');
    setEndDate('');
  };

  const getModeIcon = (mode: ForwardingMode) => {
    switch (mode) {
      case 'Sea Freight':
        return <Ship className="w-3.5 h-3.5 text-cyan-700" />;
      case 'Air Freight':
        return <Plane className="w-3.5 h-3.5 text-indigo-700" />;
      case 'RORO':
        return <Anchor className="w-3.5 h-3.5 text-blue-700" />;
      case 'Land Freight':
      default:
        return <Truck className="w-3.5 h-3.5 text-amber-700" />;
    }
  };

  const getDeliveryStatusBadge = (status: ForwardingDeliveryStatus) => {
    switch (status) {
      case 'Delivered':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5"></span>
            Delivered
          </span>
        );
      case 'In Transit':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1.5 animate-pulse"></span>
            In Transit
          </span>
        );
      case 'Delayed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1.5"></span>
            Delayed
          </span>
        );
      case 'Pending Delivery':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1.5"></span>
            Pending
          </span>
        );
    }
  };

  const getPodStatusBadge = (status: PODStatus) => {
    switch (status) {
      case 'Returned':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Returned
          </span>
        );
      case 'Transmitted':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            Transmitted
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            Under Review
          </span>
        );
      case 'Pending Return':
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Forwarding Progressive Report
                </h1>
                <p className="text-xs text-slate-500">
                  Comprehensive inter-island, multimodal, and domestic freight tracking with automated TAT and POD monitoring.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedRowId && (
              <button
                type="button"
                onClick={() => {
                  const rec = records.find((r) => r.id === selectedRowId);
                  if (rec) onSelectRecord(rec);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white shadow-2xs transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>MAKE CHANGES</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ ADD RECORD</span>
            </button>
          </div>
        </div>

        {/* Operational Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200/70">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Tracked</span>
            <span className="text-lg font-bold font-mono text-slate-900 mt-0.5 block">{stats.total} Records</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded border border-slate-200/70">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Delivered</span>
            <span className="text-lg font-bold font-mono text-emerald-700 mt-0.5 block">{stats.delivered} Done</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded border border-slate-200/70">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Transit</span>
            <span className="text-lg font-bold font-mono text-blue-700 mt-0.5 block">{stats.inTransit} On Route</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded border border-slate-200/70">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Delayed / Slipped</span>
            <span className="text-lg font-bold font-mono text-rose-700 mt-0.5 block">{stats.delayed} Attention</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded border border-slate-200/70">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Delivery SLA HIT</span>
            <span className="text-lg font-bold font-mono text-indigo-700 mt-0.5 block">{stats.hitRate}%</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded border border-slate-200/70">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">PODs Returned</span>
            <span className="text-lg font-bold font-mono text-teal-700 mt-0.5 block">{stats.podReturned} Signed</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-700" />
            <span>Search & Multi-Dimensional Filtering</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-slate-100 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* Row 1: Search & Primary Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Text Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Ref, Client, Consignee, POD, AWB..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* Month Filter */}
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white cursor-pointer"
            >
              <option value="ALL">All Months</option>
              {monthsList.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Coordinator Filter */}
          <div>
            <select
              value={selectedCoordinator}
              onChange={(e) => setSelectedCoordinator(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white cursor-pointer"
            >
              <option value="ALL">All Coordinators</option>
              {coordinatorsList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Client Filter (Shared Clients) */}
          <div>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white cursor-pointer"
            >
              <option value="ALL">All Clients ({clients.length})</option>
              {clients.map((c) => (
                <option key={c.id} value={c.name}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Secondary Dropdowns & Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1 border-t border-slate-100">
          {/* Mode of Shipment Filter */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
              Mode of Shipment
            </label>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white cursor-pointer"
            >
              <option value="ALL">All Modes</option>
              <option value="Sea Freight">Sea Freight</option>
              <option value="Air Freight">Air Freight</option>
              <option value="RORO">RORO (Roll-On / Roll-Off)</option>
              <option value="Land Freight">Land Freight</option>
            </select>
          </div>

          {/* Area Filter */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
              Destination Area
            </label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white cursor-pointer"
            >
              <option value="ALL">All Areas</option>
              <option value="Luzon">Luzon</option>
              <option value="Visayas">Visayas</option>
              <option value="Mindanao">Mindanao</option>
              <option value="NCR">NCR / Metro Manila</option>
            </select>
          </div>

          {/* Delivery Status Filter */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
              Delivery Status
            </label>
            <select
              value={selectedDeliveryStatus}
              onChange={(e) => setSelectedDeliveryStatus(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white cursor-pointer"
            >
              <option value="ALL">All Delivery Statuses</option>
              <option value="Delivered">Delivered</option>
              <option value="In Transit">In Transit</option>
              <option value="Pending Delivery">Pending Delivery</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>

          {/* POD Status Filter */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
              POD Status
            </label>
            <select
              value={selectedPodStatus}
              onChange={(e) => setSelectedPodStatus(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white cursor-pointer"
            >
              <option value="ALL">All POD Statuses</option>
              <option value="Returned">Returned</option>
              <option value="Transmitted">Transmitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Pending Return">Pending Return</option>
            </select>
          </div>

          {/* Date Range: Dispatch Date */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
              Dispatch Date Range
            </label>
            <div className="grid grid-cols-2 gap-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="From"
                className="w-full px-1.5 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="To"
                className="w-full px-1.5 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Forwarding Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Progressive Records ({filteredRecords.length})
            </span>
            <span className="text-[11px] text-slate-500">
              Showing summary overview. Select a row to inspect all 29 fields in detail.
            </span>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            {selectedRowId ? (
              <span className="text-blue-700 font-semibold">Row Selected: {selectedRowId}</span>
            ) : (
              <span>Click row to view details or edit</span>
            )}
          </div>
        </div>

        {/* Responsive Table with horizontal scroll */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3 sticky left-0 bg-slate-100 z-10">Month</th>
                <th className="py-2.5 px-3">Coordinator</th>
                <th className="py-2.5 px-3">Client</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3">Area</th>
                <th className="py-2.5 px-3">Dispatch Date</th>
                <th className="py-2.5 px-3">Consignee</th>
                <th className="py-2.5 px-3">Dest Code</th>
                <th className="py-2.5 px-3 text-right">Qty</th>
                <th className="py-2.5 px-3">Reference No.</th>
                <th className="py-2.5 px-3">Courier</th>
                <th className="py-2.5 px-3">POD Number</th>
                <th className="py-2.5 px-3">AWB / Courier Ref</th>
                <th className="py-2.5 px-3">Delivery Status</th>
                <th className="py-2.5 px-3">Delivery Date</th>
                <th className="py-2.5 px-3">POD Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((r) => {
                  const isSelected = selectedRowId === r.id;
                  const isISCI = r.client.toLowerCase().includes('intelligent skin care') || r.client.toLowerCase().includes('isci');

                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedRowId(r.id)}
                      onDoubleClick={() => onSelectRecord(r)}
                      className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50/80 font-medium' : ''
                      }`}
                    >
                      {/* Month */}
                      <td className="py-2.5 px-3 font-semibold text-slate-900 sticky left-0 bg-inherit z-10">
                        {r.month}
                      </td>

                      {/* Coordinator */}
                      <td className="py-2.5 px-3 text-slate-700">
                        {r.coordinator}
                      </td>

                      {/* Client */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 truncate max-w-[160px]">{r.client}</span>
                          {isISCI && (
                            <span className="px-1 py-0.2 rounded text-[9px] bg-purple-50 text-purple-700 border border-purple-200 font-mono font-bold" title="Custom 13-Day SLA Rule">
                              ISCI
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Mode of Shipment */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          {getModeIcon(r.modeOfShipment)}
                          <span className="font-medium text-slate-800">{r.modeOfShipment}</span>
                        </div>
                      </td>

                      {/* Area */}
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          r.area === 'Visayas' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          r.area === 'Mindanao' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                          r.area === 'NCR' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                          'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {r.area}
                        </span>
                      </td>

                      {/* Actual Dispatch Date */}
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {r.actualDispatchDate || '—'}
                      </td>

                      {/* Consignee */}
                      <td className="py-2.5 px-3 text-slate-700 max-w-[200px] truncate" title={r.consignee}>
                        {r.consignee}
                      </td>

                      {/* Destination Code */}
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                        {r.destinationCode}
                      </td>

                      {/* Quantity */}
                      <td className="py-2.5 px-3 font-mono text-right font-bold text-slate-900">
                        {r.quantity.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">{r.unit || 'Boxes'}</span>
                      </td>

                      {/* Reference Number */}
                      <td className="py-2.5 px-3 font-mono text-slate-800 font-semibold">
                        {r.referenceNumber}
                      </td>

                      {/* Courier */}
                      <td className="py-2.5 px-3 text-slate-700 truncate max-w-[140px]" title={r.courier}>
                        {r.courier}
                      </td>

                      {/* POD Number */}
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {r.podNumber}
                      </td>

                      {/* AWB / Courier Reference Number */}
                      <td className="py-2.5 px-3 font-mono text-blue-700 font-medium">
                        {r.awbCourierRefNumber}
                      </td>

                      {/* Delivery Status */}
                      <td className="py-2.5 px-3">
                        {getDeliveryStatusBadge(r.deliveryStatus)}
                      </td>

                      {/* Delivery Date */}
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {r.actualDeliveryDate || <span className="text-slate-400 italic">In Transit</span>}
                      </td>

                      {/* POD Status */}
                      <td className="py-2.5 px-3">
                        {getPodStatusBadge(r.podStatus)}
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-center">
                          {onRequestDeleteRecord && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRequestDeleteRecord(r);
                              }}
                              title="Move record to Recently Deleted"
                              className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded border border-transparent hover:border-amber-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectRecord(r);
                            }}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={17} className="py-10 text-center text-slate-500">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No Forwarding Records Found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search query, or add a new record.</p>
                    <button
                      type="button"
                      onClick={onOpenAddModal}
                      className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ ADD FORWARDING RECORD</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
