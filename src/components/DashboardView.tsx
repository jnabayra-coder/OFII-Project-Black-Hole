import React, { useMemo } from 'react';
import { 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Package, 
  ChevronRight, 
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  FileCheck,
  BellRing,
  AlertCircle,
  Eye,
  Calendar,
  Building2,
  BarChart3,
  CheckCircle,
  XCircle,
  Timer
} from 'lucide-react';
import { 
  DispatchRecord, 
  ShipmentRecord, 
  ForwardingProgressiveRecord, 
  ClientSummary, 
  ForwardingDispatchNotification,
  NavigationTab 
} from '../types';
import { currentUser } from '../data/mockData';
import { formatDualTimeDisplay } from '../utils/timeUtils';
import { calculateDaysBetween } from '../utils/forwardingCalculations';

interface DashboardViewProps {
  dispatches: DispatchRecord[];
  shipments: ShipmentRecord[];
  forwardingRecords: ForwardingProgressiveRecord[];
  clients: ClientSummary[];
  dispatchNotifications?: ForwardingDispatchNotification[];
  onSelectDispatch: (dispatch: DispatchRecord) => void;
  onSelectShipment: (shipment: ShipmentRecord) => void;
  onSelectForwardingRecord?: (record: ForwardingProgressiveRecord) => void;
  onNavigate: (tab: NavigationTab) => void;
  onSelectClientFromDashboard: (clientName: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  dispatches,
  shipments,
  forwardingRecords,
  clients,
  dispatchNotifications = [],
  onSelectDispatch,
  onSelectShipment,
  onSelectForwardingRecord,
  onNavigate,
  onSelectClientFromDashboard,
}) => {
  // ---------------------------------------------------------------------------
  // 1. ACTIVE DATA SETS (Excluding deleted records)
  // ---------------------------------------------------------------------------
  const activeDispatches = useMemo(() => dispatches.filter(d => !d.isDeleted), [dispatches]);
  const activeShipments = useMemo(() => shipments.filter(s => !s.isDeleted), [shipments]);
  const activeForwarding = useMemo(() => forwardingRecords.filter(f => !f.isDeleted), [forwardingRecords]);
  const activeClients = useMemo(() => clients.filter(c => !c.isDeleted), [clients]);
  const activeNotifications = useMemo(() => dispatchNotifications.filter(n => !n.isDismissed && n.status !== 'COMPLETED'), [dispatchNotifications]);

  // ---------------------------------------------------------------------------
  // 2. DYNAMICALLY CALCULATED DELIVERY OVERVIEW & SUMMARY METRICS
  // Derived 100% dynamically from shared dataset using company HIT/MISSED rules
  // ---------------------------------------------------------------------------
  const deliveryOverviewData = useMemo(() => {
    // Total Deliveries / Shipments in shared dataset
    const totalDeliveries = activeForwarding.length > 0 ? activeForwarding.length : activeShipments.length;

    // Delivery Status counts from active records
    let delivered = 0;
    let pending = 0;
    let inTransit = 0;
    let delayed = 0;

    // Delivery Performance HIT vs MISSED counts
    let hitCount = 0;
    let missedCount = 0;
    let pendingPerfCount = 0;

    if (activeForwarding.length > 0) {
      activeForwarding.forEach(record => {
        // Status mapping
        if (record.deliveryStatus === 'Delivered') {
          delivered++;
        } else if (record.deliveryStatus === 'In Transit') {
          inTransit++;
        } else if (record.deliveryStatus === 'Delayed') {
          delayed++;
        } else {
          // 'Pending Delivery' or unfulfilled
          pending++;
        }

        // Performance evaluation based on company HIT/MISSED rules:
        // If delivery dates are present, TAT is evaluated against deliveryLeadTimeDays
        let performance = record.deliveryPerformance;
        if (record.actualDispatchDate && record.actualDeliveryDate) {
          const tat = calculateDaysBetween(record.actualDispatchDate, record.actualDeliveryDate);
          performance = tat <= record.deliveryLeadTimeDays ? 'HIT' : 'MISSED';
        }

        if (performance === 'HIT') {
          hitCount++;
        } else if (performance === 'MISSED') {
          missedCount++;
        } else {
          pendingPerfCount++;
        }
      });
    } else {
      activeShipments.forEach(shipment => {
        if (shipment.status === 'Delivered') {
          delivered++;
        } else if (shipment.status === 'In Transit' || shipment.status === 'Out for Delivery') {
          inTransit++;
        } else if (shipment.status === 'Delayed') {
          delayed++;
        } else {
          pending++;
        }

        if (shipment.deliveryPerformance === 'On-Time' || shipment.deliveryPerformance === 'Early') {
          hitCount++;
        } else if (shipment.deliveryPerformance === 'Delayed') {
          missedCount++;
        } else {
          pendingPerfCount++;
        }
      });
    }

    const totalEvaluated = hitCount + missedCount;
    const deliveryPerformancePercentage = totalEvaluated > 0 
      ? ((hitCount / totalEvaluated) * 100).toFixed(1)
      : null;

    return {
      totalDeliveries,
      delivered,
      pending,
      inTransit,
      delayed,
      hitCount,
      missedCount,
      pendingPerfCount,
      totalEvaluated,
      deliveryPerformancePercentage,
    };
  }, [activeForwarding, activeShipments]);

  // ---------------------------------------------------------------------------
  // 3. SUMMARY CARDS VALUES
  // ---------------------------------------------------------------------------
  const totalShipmentsCount = deliveryOverviewData.totalDeliveries;
  const totalDispatchesCount = activeDispatches.length;
  const deliveredCount = deliveryOverviewData.delivered;
  const pendingCount = deliveryOverviewData.pending;
  const inTransitCount = deliveryOverviewData.inTransit;
  const delayedCount = deliveryOverviewData.delayed;

  // POD Pending Count
  const podPendingCount = useMemo(() => {
    if (activeForwarding.length > 0) {
      return activeForwarding.filter(f => f.podStatus !== 'Returned').length;
    }
    return activeShipments.filter(s => !s.datePodReceived || s.datePodReceived.trim() === '').length;
  }, [activeForwarding, activeShipments]);

  // ---------------------------------------------------------------------------
  // 4. DYNAMIC POD MONITORING METRICS & POD PERFORMANCE %
  // ---------------------------------------------------------------------------
  const podMetrics = useMemo(() => {
    let returned = 0;
    let pending = 0;
    let delayed = 0;
    let podHitCount = 0;
    let podMissedCount = 0;
    let podPendingPerfCount = 0;

    activeForwarding.forEach(record => {
      if (record.podStatus === 'Returned') {
        returned++;
      } else if (record.podPerformance === 'MISSED' || (record.podLeadTimeDays && record.podLeadTimeDays > 5)) {
        delayed++;
      } else {
        pending++;
      }

      // POD HIT/MISSED calculation based on company rule:
      let podPerf = record.podPerformance;
      if (record.actualDeliveryDate && record.dateOfPodReturn) {
        const podTat = calculateDaysBetween(record.actualDeliveryDate, record.dateOfPodReturn);
        podPerf = podTat <= (record.podLeadTimeDays || 3) ? 'HIT' : 'MISSED';
      }

      if (podPerf === 'HIT') {
        podHitCount++;
      } else if (podPerf === 'MISSED') {
        podMissedCount++;
      } else {
        podPendingPerfCount++;
      }
    });

    const totalPodEvaluated = podHitCount + podMissedCount;
    const podPerformancePercentage = totalPodEvaluated > 0
      ? ((podHitCount / totalPodEvaluated) * 100).toFixed(1)
      : null;

    const total = activeForwarding.length || 1;

    return {
      returned,
      pending,
      delayed,
      podHitCount,
      podMissedCount,
      podPendingPerfCount,
      totalPodEvaluated,
      podPerformancePercentage,
      returnedPct: Math.round((returned / total) * 100),
      pendingPct: Math.round((pending / total) * 100),
      delayedPct: Math.round((delayed / total) * 100),
    };
  }, [activeForwarding]);

  // ---------------------------------------------------------------------------
  // 5. TODAY'S DISPATCHES
  // ---------------------------------------------------------------------------
  const todaysDispatches = useMemo(() => {
    const todayStr = '2026-08-24';
    const forToday = activeDispatches.filter(d => d.deliveryDate === todayStr || d.plannedDeliveryDate === todayStr);
    if (forToday.length > 0) return forToday;
    return activeDispatches.slice(0, 5);
  }, [activeDispatches]);

  // ---------------------------------------------------------------------------
  // 6. RECENT SHIPMENTS
  // ---------------------------------------------------------------------------
  const recentShipmentsList = useMemo(() => {
    return [...activeShipments].slice(0, 5);
  }, [activeShipments]);

  // ---------------------------------------------------------------------------
  // 7. CLIENT SLA BREAKDOWN (Calculated dynamically per client from actual records)
  // ---------------------------------------------------------------------------
  const clientPerformanceList = useMemo(() => {
    return activeClients.slice(0, 4).map(client => {
      const clientRecords = activeForwarding.filter(f => 
        f.client.toLowerCase() === client.name.toLowerCase() || f.clientId === client.id
      );

      let hits = 0;
      let missed = 0;

      clientRecords.forEach(r => {
        let perf = r.deliveryPerformance;
        if (r.actualDispatchDate && r.actualDeliveryDate) {
          const tat = calculateDaysBetween(r.actualDispatchDate, r.actualDeliveryDate);
          perf = tat <= r.deliveryLeadTimeDays ? 'HIT' : 'MISSED';
        }
        if (perf === 'HIT') hits++;
        else if (perf === 'MISSED') missed++;
      });

      const totalEval = hits + missed;
      const rateStr = totalEval > 0 
        ? `${((hits / totalEval) * 100).toFixed(1)}%` 
        : (client.onTimeRate ? `${client.onTimeRate.toFixed(1)}%` : '—');

      const rateNum = totalEval > 0 ? (hits / totalEval) * 100 : (client.onTimeRate || 100);

      return {
        ...client,
        computedOnTimeRateStr: rateStr,
        computedOnTimeRateNum: rateNum,
        activeCount: clientRecords.length || client.activeShipments || 0
      };
    });
  }, [activeClients, activeForwarding]);

  // ---------------------------------------------------------------------------
  // 8. ACTION REQUIRED (Automated identification from shared data)
  // ---------------------------------------------------------------------------
  const actionRequiredItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      category: 'Incomplete Dispatch' | 'Delivery Delayed' | 'POD Pending' | 'POD Delayed';
      severity: 'high' | 'medium' | 'low';
      badgeText: string;
      actionLabel: string;
      onAction: () => void;
    }> = [];

    // Check 1: Incomplete Dispatch Notifications (Forwarding -> Dispatch)
    activeNotifications.forEach(notif => {
      items.push({
        id: `act-notif-${notif.id}`,
        title: `Dispatch Information Incomplete: ${notif.client}`,
        subtitle: `POD ${notif.podNumber} • ${notif.consignee} (${notif.destinationCode || notif.destination || 'NCR'}) requires truck, driver & departure info`,
        category: 'Incomplete Dispatch',
        severity: 'high',
        badgeText: 'DISPATCH REQUIRED',
        actionLabel: 'VIEW',
        onAction: () => onNavigate('dispatch')
      });
    });

    // Check 2: Delivery Delayed
    const delayedShipments = activeForwarding.filter(f => f.deliveryStatus === 'Delayed' || f.deliveryPerformance === 'MISSED');
    delayedShipments.forEach(ds => {
      items.push({
        id: `act-delayed-${ds.id}`,
        title: `Delivery Delayed: ${ds.client}`,
        subtitle: `Ref ${ds.referenceNumber} • POD ${ds.podNumber} • ${ds.consignee} (${ds.reasonForDelay || 'Transit / weather delay'})`,
        category: 'Delivery Delayed',
        severity: 'high',
        badgeText: 'DELAYED',
        actionLabel: 'VIEW',
        onAction: () => {
          if (onSelectForwardingRecord) {
            onSelectForwardingRecord(ds);
          } else {
            onNavigate('forwarding_report');
          }
        }
      });
    });

    // Check 3: POD Return Pending / Delayed
    const podPendingShipments = activeForwarding.filter(f => f.deliveryStatus === 'Delivered' && f.podStatus !== 'Returned');
    podPendingShipments.slice(0, 2).forEach(ps => {
      items.push({
        id: `act-pod-${ps.id}`,
        title: `POD Return Pending: ${ps.client}`,
        subtitle: `POD ${ps.podNumber} delivered on ${ps.actualDeliveryDate || 'recent date'}. Physical receipt pending courier return.`,
        category: 'POD Pending',
        severity: 'medium',
        badgeText: 'POD PENDING',
        actionLabel: 'VIEW',
        onAction: () => {
          if (onSelectForwardingRecord) {
            onSelectForwardingRecord(ps);
          } else {
            onNavigate('forwarding_report');
          }
        }
      });
    });

    return items;
  }, [activeNotifications, activeForwarding, onNavigate, onSelectForwardingRecord]);

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Delivered</span>;
      case 'In Transit':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">In Transit</span>;
      case 'Departed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">Departed</span>;
      case 'In Loading':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">In Loading</span>;
      case 'Booked':
      case 'Pending Pickup':
      case 'Pending Delivery':
      case 'Pending':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">Pending</span>;
      case 'Delayed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Delayed</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Greeting & Quick Navigation */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Good morning, {currentUser.name}!</span>
              <span role="img" aria-label="wave">👋</span>
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
              Live Central Summary
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time synchronization across Daily Dispatching, Client Shipment Monitoring, and Forwarding Progressive Reports.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => onNavigate('dispatch')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded shadow-xs transition-colors cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Open Daily Dispatching</span>
          </button>

          <button
            onClick={() => onNavigate('clients')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Client Shipment Monitoring</span>
          </button>

          <button
            onClick={() => onNavigate('forwarding_report')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Forwarding Report</span>
          </button>
        </div>
      </div>

      {/* 2. Connected Dashboard Summary Cards (All 7 Live Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5">
        {/* Card 1: TOTAL SHIPMENTS */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Shipments
            </span>
            <div className="p-1.5 rounded bg-slate-100 text-slate-700">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {totalShipmentsCount}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium truncate">
            Shared dataset
          </div>
        </div>

        {/* Card 2: TOTAL DISPATCHES */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Dispatches
            </span>
            <div className="p-1.5 rounded bg-blue-50 text-blue-700">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-blue-700 font-mono">
              {totalDispatchesCount}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-blue-600 font-medium truncate">
            Daily Monitoring
          </div>
        </div>

        {/* Card 3: DELIVERED */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Delivered
            </span>
            <div className="p-1.5 rounded bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-emerald-700 font-mono">
              {deliveredCount}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 font-medium truncate">
            {totalShipmentsCount > 0 ? `${Math.round((deliveredCount / totalShipmentsCount) * 100)}% completed` : '—'}
          </div>
        </div>

        {/* Card 4: PENDING */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pending
            </span>
            <div className="p-1.5 rounded bg-amber-50 text-amber-700">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-amber-700 font-mono">
              {pendingCount}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-amber-700 font-medium truncate">
            Awaiting pickup/prep
          </div>
        </div>

        {/* Card 5: IN TRANSIT */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              In Transit
            </span>
            <div className="p-1.5 rounded bg-cyan-50 text-cyan-700">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-cyan-700 font-mono">
              {inTransitCount}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-cyan-700 font-medium truncate">
            On the road / RORO
          </div>
        </div>

        {/* Card 6: DELAYED */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Delayed
            </span>
            <div className="p-1.5 rounded bg-rose-50 text-rose-700">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-rose-700 font-mono">
              {delayedCount}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-rose-700 font-medium truncate">
            {delayedCount > 0 ? 'Action required' : 'Zero delays'}
          </div>
        </div>

        {/* Card 7: POD PENDING */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              POD Pending
            </span>
            <div className="p-1.5 rounded bg-purple-50 text-purple-700">
              <FileCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-purple-700 font-mono">
              {podPendingCount}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-purple-700 font-medium truncate">
            Awaiting physical POD
          </div>
        </div>
      </div>

      {/* 3. DEDICATED DELIVERY OVERVIEW (Fully connected, dynamic 8-metric section) */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-blue-50 text-blue-700">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Delivery Overview</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Dynamic Calculation
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Aggregated delivery status, turnaround adherence, and company HIT/MISSED SLA metrics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500">Evaluated Records:</span>
              <span className="font-mono font-bold text-slate-800">{deliveryOverviewData.totalEvaluated}</span>
            </div>
            <button 
              onClick={() => onNavigate('forwarding_report')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View Source Records</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 8 Connected Overview Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-4">
          {/* 1. Total Deliveries */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Deliveries</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-slate-900">{deliveryOverviewData.totalDeliveries}</span>
              <Package className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <span className="text-[10px] text-slate-400 mt-1">All active shipments</span>
          </div>

          {/* 2. Delivered */}
          <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Delivered</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-emerald-700">{deliveryOverviewData.delivered}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <span className="text-[10px] text-emerald-600 mt-1">Fulfilled consignments</span>
          </div>

          {/* 3. Pending */}
          <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Pending</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-amber-700">{deliveryOverviewData.pending}</span>
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <span className="text-[10px] text-amber-600 mt-1">In prep / booking</span>
          </div>

          {/* 4. In Transit */}
          <div className="p-3 rounded-lg bg-cyan-50/50 border border-cyan-100 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-cyan-800 uppercase tracking-wider">In Transit</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-cyan-700">{deliveryOverviewData.inTransit}</span>
              <Activity className="w-3.5 h-3.5 text-cyan-500" />
            </div>
            <span className="text-[10px] text-cyan-600 mt-1">Dispatched en route</span>
          </div>

          {/* 5. Delayed */}
          <div className="p-3 rounded-lg bg-rose-50/50 border border-rose-100 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">Delayed</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-rose-700">{deliveryOverviewData.delayed}</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <span className="text-[10px] text-rose-600 mt-1">Pending resolution</span>
          </div>

          {/* 6. HIT / On-Time */}
          <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-emerald-900 uppercase tracking-wider">HIT / On-Time</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-emerald-800">{deliveryOverviewData.hitCount}</span>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-[10px] text-emerald-700 mt-1">TAT ≤ Lead Time</span>
          </div>

          {/* 7. MISSED */}
          <div className="p-3 rounded-lg bg-rose-50/80 border border-rose-200 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-rose-900 uppercase tracking-wider">MISSED</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-rose-800">{deliveryOverviewData.missedCount}</span>
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <span className="text-[10px] text-rose-700 mt-1">TAT &gt; Lead Time</span>
          </div>

          {/* 8. Delivery Performance % */}
          <div className="p-3 rounded-lg bg-blue-50/80 border border-blue-200 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-blue-900 uppercase tracking-wider">Performance %</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-blue-800">
                {deliveryOverviewData.deliveryPerformancePercentage !== null 
                  ? `${deliveryOverviewData.deliveryPerformancePercentage}%` 
                  : 'N/A'}
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-[10px] text-blue-700 mt-1">HIT / Evaluated %</span>
          </div>
        </div>

        {/* Visual Performance Ratio Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
          <div className="flex justify-between items-center text-xs text-slate-600">
            <span className="font-medium">Company SLA Compliance (Delivery Performance)</span>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>HIT: {deliveryOverviewData.hitCount}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>MISSED: {deliveryOverviewData.missedCount}</span>
              </span>
              {deliveryOverviewData.pendingPerfCount > 0 && (
                <span className="inline-flex items-center gap-1 text-slate-500 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  <span>Pending: {deliveryOverviewData.pendingPerfCount}</span>
                </span>
              )}
              <span className="font-bold font-mono text-slate-900">
                {deliveryOverviewData.deliveryPerformancePercentage !== null 
                  ? `${deliveryOverviewData.deliveryPerformancePercentage}%` 
                  : 'N/A'}
              </span>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
            {deliveryOverviewData.totalEvaluated > 0 ? (
              <>
                <div 
                  style={{ width: `${Number(deliveryOverviewData.deliveryPerformancePercentage)}%` }} 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  title={`HIT Rate: ${deliveryOverviewData.deliveryPerformancePercentage}%`} 
                />
                <div 
                  style={{ width: `${100 - Number(deliveryOverviewData.deliveryPerformancePercentage)}%` }} 
                  className="bg-rose-400 h-full transition-all duration-500" 
                  title={`MISSED Rate: ${(100 - Number(deliveryOverviewData.deliveryPerformancePercentage)).toFixed(1)}%`} 
                />
              </>
            ) : (
              <div className="bg-slate-200 w-full h-full" title="No evaluated records" />
            )}
          </div>
        </div>
      </div>

      {/* 4. Operational Analysis: Delivery Performance by Client, POD Monitoring, & Action Required */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Section: DELIVERY PERFORMANCE BY ACCOUNT */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Account SLA Compliance</h2>
                <p className="text-xs text-slate-500">Delivery Performance by key client account</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-mono">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>
                  {deliveryOverviewData.deliveryPerformancePercentage !== null 
                    ? `${deliveryOverviewData.deliveryPerformancePercentage}% HIT` 
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* Performance KPI Split */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded bg-emerald-50/70 border border-emerald-100">
                <div className="font-bold text-emerald-800 font-mono text-base">{deliveryOverviewData.hitCount}</div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">On-Time / HIT</div>
              </div>
              <div className="p-2.5 rounded bg-rose-50/70 border border-rose-100">
                <div className="font-bold text-rose-800 font-mono text-base">{deliveryOverviewData.missedCount}</div>
                <div className="text-[11px] text-rose-700 font-semibold mt-0.5">Delayed / MISSED</div>
              </div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-800 font-mono text-base">{deliveryOverviewData.pendingPerfCount}</div>
                <div className="text-[11px] text-slate-600 font-semibold mt-0.5">Pending / In Transit</div>
              </div>
            </div>

            {/* Client SLA Breakdown */}
            <div className="mt-4 space-y-2.5 pt-3 border-t border-slate-100">
              <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                Key Account SLA Compliance
              </div>
              {clientPerformanceList.map((client) => (
                <div key={client.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700 truncate max-w-[170px]">{client.name}</span>
                    <span className="font-mono font-bold text-slate-900">{client.computedOnTimeRateStr}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, client.computedOnTimeRateNum)}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Evaluated Records: <strong>{deliveryOverviewData.totalEvaluated}</strong></span>
            <button 
              onClick={() => onNavigate('forwarding_report')}
              className="text-blue-700 hover:text-blue-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View Report</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Section: POD MONITORING */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">POD Monitoring</h2>
                <p className="text-xs text-slate-500">Proof of Delivery tracking & turnaround adherence</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-mono">
                <FileCheck className="w-3.5 h-3.5" />
                <span>
                  {podMetrics.podPerformancePercentage !== null 
                    ? `${podMetrics.podPerformancePercentage}% HIT` 
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* POD Metric Breakdown */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded bg-emerald-50/70 border border-emerald-100">
                <div className="font-bold text-emerald-800 font-mono text-base">{podMetrics.returned}</div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">POD Returned</div>
              </div>
              <div className="p-2.5 rounded bg-purple-50/70 border border-purple-100">
                <div className="font-bold text-purple-800 font-mono text-base">{podMetrics.pending}</div>
                <div className="text-[11px] text-purple-700 font-semibold mt-0.5">POD Pending</div>
              </div>
              <div className="p-2.5 rounded bg-amber-50/70 border border-amber-100">
                <div className="font-bold text-amber-800 font-mono text-base">{podMetrics.delayed}</div>
                <div className="text-[11px] text-amber-700 font-semibold mt-0.5">POD Delayed</div>
              </div>
            </div>

            {/* Visual POD Distribution Bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600">
                <span className="font-medium">POD Return Fulfillment</span>
                <span className="font-bold font-mono text-slate-900">{podMetrics.returnedPct}% Returned</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div 
                  style={{ width: `${podMetrics.returnedPct}%` }} 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  title={`Returned: ${podMetrics.returnedPct}%`} 
                />
                <div 
                  style={{ width: `${podMetrics.pendingPct}%` }} 
                  className="bg-purple-400 h-full transition-all duration-500" 
                  title={`Pending: ${podMetrics.pendingPct}%`} 
                />
                <div 
                  style={{ width: `${podMetrics.delayedPct}%` }} 
                  className="bg-amber-400 h-full transition-all duration-500" 
                  title={`Delayed: ${podMetrics.delayedPct}%`} 
                />
              </div>
            </div>

            {/* POD Performance & Operational Details */}
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">POD Performance % (HIT vs MISSED):</span>
                <span className="font-bold text-purple-800 font-mono">
                  {podMetrics.podPerformancePercentage !== null 
                    ? `${podMetrics.podPerformancePercentage}%` 
                    : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Evaluated POD Turnarounds:</span>
                <span className="font-bold text-slate-800 font-mono">{podMetrics.totalPodEvaluated} records</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Physical Hardcopies Verified:</span>
                <span className="font-bold text-emerald-700 font-mono">{podMetrics.returned} receipts</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Target Turnaround: <strong>3-5 Days</strong></span>
            <button 
              onClick={() => onNavigate('forwarding_report')}
              className="text-blue-700 hover:text-blue-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Manage PODs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Section: ACTION REQUIRED */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">Action Required</h2>
                {actionRequiredItems.length > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                    {actionRequiredItems.length} Urgent
                  </span>
                )}
              </div>
              <BellRing className="w-4 h-4 text-slate-400" />
            </div>

            {/* Action Items List */}
            <div className="mt-3 space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
              {actionRequiredItems.length > 0 ? (
                actionRequiredItems.map((item) => (
                  <div 
                    key={item.id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.category === 'Incomplete Dispatch' 
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : item.category === 'Delivery Delayed'
                            ? 'bg-rose-100 text-rose-900 border border-rose-200'
                            : 'bg-purple-100 text-purple-900 border border-purple-200'
                        }`}>
                          {item.badgeText}
                        </span>
                        <h3 className="text-xs font-bold text-slate-900 truncate">
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {item.subtitle}
                      </p>
                    </div>

                    <button
                      onClick={item.onAction}
                      className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-300 rounded shrink-0 shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>{item.actionLabel}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 rounded-lg border border-dashed border-slate-200 bg-slate-50">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">All Operations Clear</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">No overdue dispatches, delays, or pending SLA interventions.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Automated operational monitoring</span>
            <button 
              onClick={() => onNavigate('dispatch')}
              className="text-blue-700 hover:text-blue-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View Dispatches</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 5. Section: TODAY'S DISPATCHES */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Today&apos;s Dispatches</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {todaysDispatches.length} Active Run
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live fleet departures, loading bay activities, and consignee delivery dispatches for today
            </p>
          </div>
          <button
            onClick={() => onNavigate('dispatch')}
            className="text-xs text-blue-700 hover:text-blue-900 font-bold inline-flex items-center gap-1 cursor-pointer px-3 py-1.5 bg-blue-50/80 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
          >
            <span>VIEW ALL DISPATCHES ({activeDispatches.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/80 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Client</th>
                <th className="py-2.5 px-4">Consignee</th>
                <th className="py-2.5 px-4">Destination</th>
                <th className="py-2.5 px-4">POD Number</th>
                <th className="py-2.5 px-4">Dispatch Time</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {todaysDispatches.map((dispatch) => (
                <tr 
                  key={dispatch.id} 
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => onSelectDispatch(dispatch)}
                >
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectClientFromDashboard(dispatch.clientName);
                      }}
                      className="hover:underline text-left text-slate-900 hover:text-blue-700 font-semibold"
                    >
                      {dispatch.clientName}
                    </button>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800 max-w-[180px] truncate" title={dispatch.consignee}>
                    {dispatch.consignee}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate" title={dispatch.destination}>
                    {dispatch.destination}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">
                    {dispatch.podNumber}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {dispatch.departureTime ? formatDualTimeDisplay(dispatch.departureTime) : (dispatch.loadingStartTime ? `Load ${formatDualTimeDisplay(dispatch.loadingStartTime)}` : '08:00 AM')}
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(dispatch.status)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDispatch(dispatch);
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded border border-slate-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Section: RECENT SHIPMENTS */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Recent Shipments</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Shared Master List
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest client consignments and freight forward movements across the nationwide distribution network
            </p>
          </div>
          <button
            onClick={() => onNavigate('clients')}
            className="text-xs text-blue-700 hover:text-blue-900 font-bold inline-flex items-center gap-1 cursor-pointer px-3 py-1.5 bg-blue-50/80 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
          >
            <span>VIEW ALL SHIPMENTS ({activeShipments.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/80 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Client</th>
                <th className="py-2.5 px-4">Consignee</th>
                <th className="py-2.5 px-4">Destination</th>
                <th className="py-2.5 px-4">POD Number</th>
                <th className="py-2.5 px-4">Dispatch Date</th>
                <th className="py-2.5 px-4">Delivery Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentShipmentsList.map((shipment) => (
                <tr 
                  key={shipment.id} 
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => onSelectShipment(shipment)}
                >
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectClientFromDashboard(shipment.client);
                      }}
                      className="hover:underline text-left text-slate-900 hover:text-blue-700 font-semibold"
                    >
                      {shipment.client}
                    </button>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800 max-w-[180px] truncate" title={shipment.consignee}>
                    {shipment.consignee}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate" title={shipment.destination}>
                    {shipment.destination}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">
                    {shipment.podNumber}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {shipment.actualDeparture || shipment.bookedDate || '2026-08-24'}
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(shipment.status)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectShipment(shipment);
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded border border-slate-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
