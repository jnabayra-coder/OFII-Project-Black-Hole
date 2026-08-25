/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { CreateAccountScreen } from './components/CreateAccountScreen';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { DailyDispatchView } from './components/DailyDispatchView';
import { DispatchDetailModal } from './components/DispatchDetailModal';
import { ClientShipmentView } from './components/ClientShipmentView';
import { ClientShipmentDetailView } from './components/ClientShipmentDetailView';
import { ForwardingProgressiveView } from './components/ForwardingProgressiveView';
import { ForwardingDetailModal } from './components/ForwardingDetailModal';
import { AddForwardingRecordModal } from './components/AddForwardingRecordModal';
import { RecentlyDeletedView } from './components/RecentlyDeletedView';
import { SafeDeleteModal } from './components/SafeDeleteModal';
import { PermanentDeleteModal } from './components/PermanentDeleteModal';
import { ClientDeactivateModal } from './components/ClientDeactivateModal';
import { ClientManagementView } from './components/ClientManagementView';
import { ClientDetailView } from './components/ClientDetailView';
import { ClientFormModal } from './components/ClientFormModal';
import { ClientStatusToggleModal } from './components/ClientStatusToggleModal';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { AddDispatchModal, DispatchPrefillData } from './components/AddDispatchModal';
import { CheckCircle2, X } from 'lucide-react';

import { 
  NavigationTab, 
  DispatchRecord, 
  ShipmentRecord, 
  ClientSummary, 
  DispatchStatus, 
  ShipmentStatus, 
  PhilippineArea, 
  ForwardingProgressiveRecord,
  OperationalRecordType,
  ForwardingDispatchNotification
} from './types';
import { 
  dashboardSummaryData, 
  initialDispatches, 
  initialClients, 
  initialShipments, 
  initialForwardingRecords,
  initialDispatchNotifications
} from './data/mockData';

export default function App() {
  // 1. Auth State: Login Screen is shown first
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'create-account'>('login');

  // 2. Navigation State
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [selectedHub, setSelectedHub] = useState('OFII Central Hub (Paranaque)');

  // 3. Shared Data State across the system
  const [dispatches, setDispatches] = useState<DispatchRecord[]>(initialDispatches);
  const [clients, setClients] = useState<ClientSummary[]>(initialClients);
  const [shipments, setShipments] = useState<ShipmentRecord[]>(initialShipments);
  const [forwardingRecords, setForwardingRecords] = useState<ForwardingProgressiveRecord[]>(initialForwardingRecords);
  const [dispatchNotifications, setDispatchNotifications] = useState<ForwardingDispatchNotification[]>(initialDispatchNotifications);

  // 4. Confirmation Toast / Alert
  const [confirmationToast, setConfirmationToast] = useState<{ 
    message: string; 
    subtext?: string;
  } | null>(null);

  // 5. Detailed View / Modal State
  const [selectedDispatch, setSelectedDispatch] = useState<DispatchRecord | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRecord | null>(null);
  const [isAddDispatchOpen, setIsAddDispatchOpen] = useState(false);
  const [prefillDispatchData, setPrefillDispatchData] = useState<DispatchPrefillData | null>(null);

  // 6. Forwarding Module Modal & Record Selection State
  const [selectedForwardingRecord, setSelectedForwardingRecord] = useState<ForwardingProgressiveRecord | null>(null);
  const [isAddForwardingOpen, setIsAddForwardingOpen] = useState(false);
  const [isForwardingDetailEditMode, setIsForwardingDetailEditMode] = useState(false);

  // 7. Safe Delete & Recovery Modal States
  const [safeDeleteTarget, setSafeDeleteTarget] = useState<{
    id: string;
    type: OperationalRecordType;
    identifier?: string;
    clientName?: string;
    additionalInfo?: string;
  } | null>(null);

  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<{
    id: string;
    type: OperationalRecordType;
    identifier?: string;
    clientName?: string;
  } | null>(null);

  const [clientDeactivateTarget, setClientDeactivateTarget] = useState<ClientSummary | null>(null);

  // 8. Client Management Specific State
  const [selectedManagementClient, setSelectedManagementClient] = useState<ClientSummary | null>(null);
  const [clientFormModal, setClientFormModal] = useState<{
    isOpen: boolean;
    clientToEdit: ClientSummary | null;
  }>({ isOpen: false, clientToEdit: null });
  const [clientStatusToggle, setClientStatusToggle] = useState<{
    isOpen: boolean;
    client: ClientSummary | null;
    mode: 'deactivate' | 'reactivate';
  }>({ isOpen: false, client: null, mode: 'deactivate' });

  // Calculate live count of deleted records across all categories
  const deletedCount = useMemo(() => {
    const deletedDispatches = dispatches.filter(d => d.isDeleted).length;
    const deletedShipments = shipments.filter(s => s.isDeleted).length;
    const deletedForwarding = forwardingRecords.filter(f => f.isDeleted).length;
    const deletedClients = clients.filter(c => c.isDeleted).length;
    return deletedDispatches + deletedShipments + deletedForwarding + deletedClients;
  }, [dispatches, shipments, forwardingRecords, clients]);

  // Calculate live count of pending forwarding->dispatch notifications
  const pendingNotificationsCount = useMemo(() => {
    return dispatchNotifications.filter(n => !n.isDismissed && (n.status === 'NEW' || n.status === 'IN PROGRESS')).length;
  }, [dispatchNotifications]);

  // Handlers
  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthView('login');
    setSelectedDispatch(null);
    setSelectedClientId(null);
    setSelectedShipment(null);
    setSelectedManagementClient(null);
  };

  const handleNavigate = (tab: NavigationTab) => {
    setCurrentTab(tab);
    // If switching main tabs, clear granular views
    if (tab !== 'clients') {
      setSelectedShipment(null);
    }
    if (tab !== 'client_management') {
      setSelectedManagementClient(null);
    }
  };

  const handleSelectClientFromDashboard = (clientName: string) => {
    const client = clients.find(c => c.name.toLowerCase().includes(clientName.toLowerCase()));
    if (client) {
      setSelectedClientId(client.id);
    } else {
      setSelectedClientId(null);
    }
    setSelectedShipment(null);
    setCurrentTab('clients');
  };

  // Maps a dispatch status to standard shipment monitoring status
  const mapDispatchStatusToShipmentStatus = (s: DispatchStatus): ShipmentStatus => {
    switch (s) {
      case 'Delivered': return 'Delivered';
      case 'In Transit': return 'In Transit';
      case 'Departed': return 'In Transit';
      case 'Arrived at Hub': return 'In Transit';
      case 'Delayed': return 'Delayed';
      case 'In Loading': return 'Booked';
      case 'Pending Pickup': return 'Booked';
      default: return 'In Transit';
    }
  };

  // ---------------------------------------------------------------------------
  // SAFE DELETE & RECOVERY WORKFLOW HANDLERS
  // ---------------------------------------------------------------------------

  // 1. Request Move to Trash (Safe Delete Modal triggers)
  const handleRequestDeleteDispatch = (dispatch: DispatchRecord) => {
    setSafeDeleteTarget({
      id: dispatch.id,
      type: 'dispatch',
      identifier: dispatch.podNumber || dispatch.manifestNumber || dispatch.id,
      clientName: dispatch.clientName,
      additionalInfo: `Destination: ${dispatch.destination} • Truck: ${dispatch.plateNumber} • Driver: ${dispatch.driverName || 'OFII Fleet Driver'}`,
    });
  };

  const handleRequestDeleteShipment = (shipment: ShipmentRecord) => {
    setSafeDeleteTarget({
      id: shipment.id,
      type: 'shipment',
      identifier: shipment.podNumber || shipment.awbNumber || shipment.id,
      clientName: shipment.client,
      additionalInfo: `${shipment.itemDescription} • Mode: ${shipment.modeOfShipment} • Status: ${shipment.status}`,
    });
  };

  const handleRequestDeleteForwarding = (record: ForwardingProgressiveRecord) => {
    setSafeDeleteTarget({
      id: record.id,
      type: 'forwarding_report',
      identifier: record.referenceNumber,
      clientName: record.client,
      additionalInfo: `Consignee: ${record.consignee} (${record.destinationCode}) • ${record.quantity} ${record.unit || 'Units'}`,
    });
  };

  const handleRequestDeleteClient = (client: ClientSummary) => {
    // Check if client has historical shipments or forwarding records
    const clientShipmentHistory = shipments.filter(
      s => s.clientId === client.id || s.client.toLowerCase() === client.name.toLowerCase()
    );
    const clientForwardingHistory = forwardingRecords.filter(
      f => f.clientId === client.id || f.client.toLowerCase() === client.name.toLowerCase()
    );

    const totalHistoricalRecords = clientShipmentHistory.length + clientForwardingHistory.length;

    if (totalHistoricalRecords > 0) {
      // RULE: Client with historical records must be DEACTIVATED, not permanently deleted!
      setClientDeactivateTarget(client);
    } else {
      // Fresh client with no records can be moved to trash
      setSafeDeleteTarget({
        id: client.id,
        type: 'client',
        identifier: client.code,
        clientName: client.name,
        additionalInfo: `Account Manager: ${client.accountManager} • Contact: ${client.primaryContact}`,
      });
    }
  };

  // 2. Execute Move to Trash (Soft Delete)
  const handleConfirmMoveToTrash = () => {
    if (!safeDeleteTarget) return;

    const { id, type, identifier, clientName } = safeDeleteTarget;
    const nowIso = new Date().toISOString();
    const currentUser = 'Operations Officer (OFII Control)';

    if (type === 'dispatch') {
      setDispatches(prev => prev.map(d => d.id === id ? {
        ...d,
        isDeleted: true,
        deletedAt: nowIso,
        deletedBy: currentUser
      } : d));
      if (selectedDispatch?.id === id) {
        setSelectedDispatch(null);
      }
    } else if (type === 'shipment') {
      setShipments(prev => prev.map(s => s.id === id ? {
        ...s,
        isDeleted: true,
        deletedAt: nowIso,
        deletedBy: currentUser
      } : s));
      if (selectedShipment?.id === id) {
        setSelectedShipment(null);
      }
    } else if (type === 'forwarding_report') {
      setForwardingRecords(prev => prev.map(f => f.id === id ? {
        ...f,
        isDeleted: true,
        deletedAt: nowIso,
        deletedBy: currentUser
      } : f));
      if (selectedForwardingRecord?.id === id) {
        setSelectedForwardingRecord(null);
      }
    } else if (type === 'client') {
      setClients(prev => prev.map(c => c.id === id ? {
        ...c,
        isDeleted: true,
        deletedAt: nowIso,
        deletedBy: currentUser
      } : c));
      if (selectedClientId === id) {
        setSelectedClientId(null);
      }
    }

    setSafeDeleteTarget(null);

    setConfirmationToast({
      message: 'Record moved to Recently Deleted.',
      subtext: `"${identifier || clientName}" has been removed from active lists and can be restored from the Trash section at any time.`
    });
    setTimeout(() => {
      setConfirmationToast(null);
    }, 5000);
  };

  // 3. Execute Restore from Trash
  const handleRestoreFromTrash = (type: OperationalRecordType, id: string) => {
    if (type === 'dispatch') {
      setDispatches(prev => prev.map(d => d.id === id ? {
        ...d,
        isDeleted: false,
        deletedAt: undefined,
        deletedBy: undefined
      } : d));
    } else if (type === 'shipment') {
      setShipments(prev => prev.map(s => s.id === id ? {
        ...s,
        isDeleted: false,
        deletedAt: undefined,
        deletedBy: undefined
      } : s));
    } else if (type === 'forwarding_report') {
      setForwardingRecords(prev => prev.map(f => f.id === id ? {
        ...f,
        isDeleted: false,
        deletedAt: undefined,
        deletedBy: undefined
      } : f));
    } else if (type === 'client') {
      setClients(prev => prev.map(c => c.id === id ? {
        ...c,
        isDeleted: false,
        deletedAt: undefined,
        deletedBy: undefined
      } : c));
    }

    setConfirmationToast({
      message: 'Record restored to active operational list.',
      subtext: `The ${type.replace('_', ' ')} record has been restored with all relationships intact.`
    });
    setTimeout(() => {
      setConfirmationToast(null);
    }, 5000);
  };

  // 4. Request Permanent Delete (Modal opener)
  const handleRequestPermanentDelete = (
    type: OperationalRecordType, 
    id: string, 
    identifier: string, 
    clientName: string
  ) => {
    setPermanentDeleteTarget({ id, type, identifier, clientName });
  };

  // 5. Execute Permanent Delete (Irreversible Purge)
  const handleConfirmPermanentDelete = () => {
    if (!permanentDeleteTarget) return;

    const { id, type, identifier, clientName } = permanentDeleteTarget;

    if (type === 'dispatch') {
      setDispatches(prev => prev.filter(d => d.id !== id));
    } else if (type === 'shipment') {
      setShipments(prev => prev.filter(s => s.id !== id));
    } else if (type === 'forwarding_report') {
      setForwardingRecords(prev => prev.filter(f => f.id !== id));
    } else if (type === 'client') {
      setClients(prev => prev.filter(c => c.id !== id));
    }

    setPermanentDeleteTarget(null);

    setConfirmationToast({
      message: 'Record permanently deleted.',
      subtext: `"${identifier || clientName}" has been permanently purged from the system.`
    });
    setTimeout(() => {
      setConfirmationToast(null);
    }, 5000);
  };

  // 6. Client Deactivation & Reactivation (Rule: Preserve history)
  const handleConfirmDeactivateClient = (clientId: string, reason?: string) => {
    setClients(prev => prev.map(c => c.id === clientId ? {
      ...c,
      isDeactivated: true
    } : c));
    setClientDeactivateTarget(null);

    const client = clients.find(c => c.id === clientId);
    setConfirmationToast({
      message: 'Client account deactivated.',
      subtext: `Client "${client?.name || clientId}" is now marked as Deactivated. All historical shipment and forwarding records remain preserved in the system.`
    });
    setTimeout(() => {
      setConfirmationToast(null);
    }, 5000);
  };

  const handleReactivateClient = (clientId: string) => {
    setClients(prev => prev.map(c => c.id === clientId ? {
      ...c,
      isDeactivated: false
    } : c));

    const client = clients.find(c => c.id === clientId);
    setConfirmationToast({
      message: 'Client account reactivated.',
      subtext: `Client "${client?.name || clientId}" is now active and available for new dispatches.`
    });
    setTimeout(() => {
      setConfirmationToast(null);
    }, 5000);
  };

  // ---------------------------------------------------------------------------
  // OPERATIONAL CREATION & UPDATE HANDLERS
  // ---------------------------------------------------------------------------

  // Add Dispatch Record with Automatic Client & Shipment Synchronization
  const handleAddDispatchRecord = (newDispatch: DispatchRecord, originNotificationId?: string) => {
    // 0. Duplicate Protection Guard
    const existingDuplicate = dispatches.find(
      d => !d.isDeleted && d.podNumber.trim().toLowerCase() === newDispatch.podNumber.trim().toLowerCase()
    );
    if (existingDuplicate) {
      setConfirmationToast({
        message: 'Duplicate Dispatch Prevented.',
        subtext: `A dispatch record with POD ${newDispatch.podNumber} already exists in the system.`
      });
      setTimeout(() => setConfirmationToast(null), 5000);
      return;
    }

    // 1. Check if client exists in Shared Client Master List
    const existingClientIndex = clients.findIndex(
      c => c.name.toLowerCase() === newDispatch.clientName.toLowerCase()
    );

    let targetClient: ClientSummary;

    if (existingClientIndex >= 0) {
      const existing = clients[existingClientIndex];
      targetClient = {
        ...existing,
        activeShipments: newDispatch.status === 'Delivered' 
          ? (existing.activeShipments || 0) 
          : (existing.activeShipments || 0) + 1,
        deliveredThisMonth: newDispatch.status === 'Delivered'
          ? (existing.deliveredThisMonth || 0) + 1
          : (existing.deliveredThisMonth || 0),
      };
      setClients(prev => prev.map((c, i) => i === existingClientIndex ? targetClient : c));
    } else {
      const words = newDispatch.clientName.split(/\s+/);
      const acronym = words.length === 1 ? words[0].slice(0, 3).toUpperCase() : words.map(w => w[0]).join('').slice(0, 4).toUpperCase();
      const clientCode = `${acronym}-${Math.floor(100 + Math.random() * 900)}`;
      const newClientId = `client-${newDispatch.clientName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

      targetClient = {
        id: newClientId,
        name: newDispatch.clientName,
        code: clientCode,
        accountManager: 'Maria Santos (OFII Key Accounts)',
        industry: 'General Logistics & FMCG',
        activeShipments: newDispatch.status === 'Delivered' ? 0 : 1,
        deliveredThisMonth: newDispatch.status === 'Delivered' ? 1 : 0,
        onTimeRate: 98.0,
        primaryContact: 'Operations Manager',
        email: `dispatch@${newDispatch.clientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}.com.ph`,
        phone: '+63 (2) 8876-0000',
        address: `${newDispatch.destination}, NCR`,
        area: 'NCR',
      };

      setClients(prev => [targetClient, ...prev]);
    }

    // 2. Add to Daily Dispatches
    const normalizedDispatch: DispatchRecord = {
      ...newDispatch,
      clientName: targetClient.name,
    };
    setDispatches(prev => [normalizedDispatch, ...prev]);

    // 3. Mark Notification as Completed (if linked)
    if (originNotificationId) {
      setDispatchNotifications(prev => prev.map(notif => 
        notif.id === originNotificationId 
          ? { 
              ...notif, 
              status: 'COMPLETED', 
              completedAt: new Date().toISOString(), 
              completedDispatchId: normalizedDispatch.id 
            } 
          : notif
      ));
    } else {
      // Also match by POD number if any existing pending notification exists
      setDispatchNotifications(prev => prev.map(notif => 
        notif.podNumber.trim().toLowerCase() === newDispatch.podNumber.trim().toLowerCase() && notif.status !== 'COMPLETED'
          ? { 
              ...notif, 
              status: 'COMPLETED', 
              completedAt: new Date().toISOString(), 
              completedDispatchId: normalizedDispatch.id 
            } 
          : notif
      ));
    }

    // Reset prefill state
    setPrefillDispatchData(null);

    // 4. Automatically Create Corresponding Shipment Monitoring Record
    const autoShipment: ShipmentRecord = {
      id: `SHP-${newDispatch.podNumber || newDispatch.manifestNumber || newDispatch.id}`,
      client: targetClient.name,
      clientId: targetClient.id,
      monthStarted: new Date().toLocaleString('default', { month: 'long' }),
      bookedDate: newDispatch.deliveryDate,
      pickupDate: newDispatch.deliveryDate,
      consignee: newDispatch.consignee || newDispatch.destination,
      contactNumber: '+63 917 555 0199',
      modeOfShipment: newDispatch.deliveryType === 'Air Freight' ? 'Air Freight' : 'Land Freight',
      originPickupPoint: 'OFII Paranaque Central Terminal',
      destination: newDispatch.destination,
      area: 'NCR',
      requestedDeliveryDate: newDispatch.plannedDeliveryDate || newDispatch.deliveryDate,
      itemDescription: `${newDispatch.quantityCasesBoxes || 100} ${newDispatch.unit || 'Cases'} Commercial Cargo`,
      quantityBoxes: newDispatch.quantityCasesBoxes || 100,
      amount: 'PHP 1,250,000.00',
      actualCbm: 12.5,
      volumeWeight: 180.0,
      actualWeightKg: newDispatch.totalWeightKg || 250,
      chargePerWeight: 'PHP 25.00 / kg',
      vanNumber: 'VAN-PAR-01',
      truckPlate: newDispatch.plateNumber,
      estimatedDeparture: `${newDispatch.deliveryDate} ${newDispatch.departureTime || '08:00 AM'}`,
      actualDeparture: `${newDispatch.deliveryDate} ${newDispatch.departureTime || '08:30 AM'}`,
      estimatedArrival: `${newDispatch.plannedDeliveryDate || newDispatch.deliveryDate} 06:00 PM`,
      actualArrival: newDispatch.status === 'Delivered' ? newDispatch.plannedDeliveryDate : 'In Transit',
      podNumber: newDispatch.podNumber,
      awbNumber: `AWB-${newDispatch.podNumber}`,
      drNumber: `DR-${newDispatch.manifestNumber || newDispatch.podNumber}`,
      sealNumber: 'SEAL-OFII-8891',
      billOfLandingNumber: 'BL-OFII-9042',
      manifestNumber: newDispatch.manifestNumber,
      plannedDeliveryDate: newDispatch.plannedDeliveryDate || newDispatch.deliveryDate,
      actualDeliveryDate: newDispatch.status === 'Delivered' ? newDispatch.plannedDeliveryDate : '',
      deliveryDate: newDispatch.status === 'Delivered' ? newDispatch.plannedDeliveryDate : 'In Transit',
      receiversName: 'Authorized Consignee Representative',
      datePodReceived: newDispatch.status === 'Delivered' ? 'POD In-Hand' : 'Pending',
      dateTransmitted: newDispatch.deliveryDate,
      deliveryRemarks: newDispatch.remarks || 'Standard OFII Consolidated Freight Run',
      status: mapDispatchStatusToShipmentStatus(newDispatch.status),
      leadTime: '2 Days',
      tatNumber: `TAT-NCR-${Math.floor(100 + Math.random() * 900)}`,
      deliveryPerformance: 'On-Time',
      numberOfDays: 2,
    };

    setShipments(prev => [autoShipment, ...prev]);

    // 5. Show success toast notification
    setConfirmationToast({
      message: 'Dispatch successfully encoded.',
      subtext: `Synced with Client Shipment Monitoring (POD: ${newDispatch.podNumber}) • Client: ${targetClient.name}`
    });
    setTimeout(() => {
      setConfirmationToast(null);
    }, 5000);
  };

  // Add / Edit Shared Client Handler
  const handleAddNewClient = (newClient: ClientSummary) => {
    setClients(prev => {
      const exists = prev.some(c => c.name.toLowerCase() === newClient.name.toLowerCase());
      if (exists) return prev;
      return [newClient, ...prev];
    });

    setConfirmationToast({
      message: 'Client added successfully.',
      subtext: `Client "${newClient.name}" (${newClient.code}) is now active across all monitoring modules.`
    });
    setTimeout(() => {
      setConfirmationToast(null);
    }, 5000);
  };

  const handleSaveClientFromForm = (savedClient: ClientSummary) => {
    const isEdit = clients.some(c => c.id === savedClient.id);

    if (isEdit) {
      setClients(prev => prev.map(c => c.id === savedClient.id ? savedClient : c));
      if (selectedManagementClient?.id === savedClient.id) {
        setSelectedManagementClient(savedClient);
      }
      setConfirmationToast({
        message: 'Client information updated successfully.',
        subtext: `Master record for "${savedClient.name}" has been updated.`
      });
    } else {
      setClients(prev => [savedClient, ...prev]);
      setConfirmationToast({
        message: 'Client added successfully.',
        subtext: `Client "${savedClient.name}" (${savedClient.code}) has been created and is available across the system.`
      });
    }

    setTimeout(() => {
      setConfirmationToast(null);
    }, 5000);
  };

  const handleOpenAddClientModal = () => {
    setClientFormModal({ isOpen: true, clientToEdit: null });
  };

  const handleOpenEditClientModal = (client: ClientSummary) => {
    setClientFormModal({ isOpen: true, clientToEdit: client });
  };

  const handleOpenDeactivateClientModal = (client: ClientSummary) => {
    setClientStatusToggle({ isOpen: true, client, mode: 'deactivate' });
  };

  const handleOpenReactivateClientModal = (client: ClientSummary) => {
    setClientStatusToggle({ isOpen: true, client, mode: 'reactivate' });
  };

  const handleConfirmClientStatusToggle = (clientId: string) => {
    const isDeactivating = clientStatusToggle.mode === 'deactivate';
    
    setClients(prev => prev.map(c => c.id === clientId ? {
      ...c,
      isDeactivated: isDeactivating
    } : c));

    const targetClient = clients.find(c => c.id === clientId);
    const updatedClient = targetClient ? { ...targetClient, isDeactivated: isDeactivating } : null;
    
    if (selectedManagementClient?.id === clientId && updatedClient) {
      setSelectedManagementClient(updatedClient);
    }

    setConfirmationToast({
      message: isDeactivating ? 'Client account deactivated.' : 'Client account reactivated.',
      subtext: isDeactivating 
        ? `Client "${targetClient?.name || clientId}" is now inactive. Historical shipments remain preserved.`
        : `Client "${targetClient?.name || clientId}" is now active and available for new dispatches.`
    });

    setTimeout(() => {
      setConfirmationToast(null);
    }, 5000);
  };

  // Handle Updates in Daily Dispatch
  const handleUpdateDispatches = (updated: DispatchRecord[]) => {
    setDispatches(updated);
  };

  // Handle Save Single Dispatch from Details Modal
  const handleSaveSingleDispatch = (updatedDispatch: DispatchRecord) => {
    setDispatches(prev => prev.map(d => d.id === updatedDispatch.id ? updatedDispatch : d));
    setSelectedDispatch(updatedDispatch);

    // Synchronize with Client Shipment Monitoring
    setShipments(prev => prev.map(s => {
      if (s.podNumber === updatedDispatch.podNumber || s.manifestNumber === updatedDispatch.manifestNumber) {
        return {
          ...s,
          truckPlate: updatedDispatch.plateNumber,
          destination: updatedDispatch.destination,
          consignee: updatedDispatch.consignee,
          quantityBoxes: updatedDispatch.quantityCasesBoxes,
          status: mapDispatchStatusToShipmentStatus(updatedDispatch.status),
          plannedDeliveryDate: updatedDispatch.plannedDeliveryDate,
          actualDeliveryDate: updatedDispatch.status === 'Delivered' ? updatedDispatch.plannedDeliveryDate : s.actualDeliveryDate,
          deliveryDate: updatedDispatch.status === 'Delivered' ? updatedDispatch.plannedDeliveryDate : s.deliveryDate,
          actualDeparture: `${updatedDispatch.deliveryDate} ${updatedDispatch.departureTime || ''}`.trim(),
        };
      }
      return s;
    }));

    setConfirmationToast({
      message: 'Dispatch record updated.',
      subtext: `Changes saved for POD ${updatedDispatch.podNumber} and synchronized across monitoring modules.`
    });
    setTimeout(() => setConfirmationToast(null), 4000);
  };

  // Handle Updates in Client Shipment
  const handleUpdateShipment = (updatedShipment: ShipmentRecord) => {
    setShipments(prev => prev.map(s => s.id === updatedShipment.id ? updatedShipment : s));
    setSelectedShipment(updatedShipment);
  };

  // Forwarding Progressive Report Handlers with Shared Client Sync
  const handleAddForwardingRecord = (newRecord: ForwardingProgressiveRecord, clientName: string) => {
    const rawClientName = (clientName || newRecord.client || 'General Client').trim();

    // 1. Sync Shared Client List
    const existingIndex = clients.findIndex(
      c => c.name.trim().toLowerCase() === rawClientName.toLowerCase()
    );

    let targetClient: ClientSummary;

    if (existingIndex >= 0) {
      const existing = clients[existingIndex];
      targetClient = {
        ...existing,
        activeShipments: newRecord.deliveryStatus === 'Delivered' 
          ? (existing.activeShipments || 0) 
          : (existing.activeShipments || 0) + 1,
        deliveredThisMonth: newRecord.deliveryStatus === 'Delivered'
          ? (existing.deliveredThisMonth || 0) + 1
          : (existing.deliveredThisMonth || 0),
      };
      setClients(prev => prev.map((c, i) => i === existingIndex ? targetClient : c));
    } else {
      const words = rawClientName.split(/\s+/);
      const acronym = words.length === 1 ? words[0].slice(0, 3).toUpperCase() : words.map(w => w[0]).join('').slice(0, 4).toUpperCase();
      const clientCode = `${acronym}-${Math.floor(100 + Math.random() * 900)}`;
      const newClientId = `client-${rawClientName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

      targetClient = {
        id: newClientId,
        name: rawClientName,
        code: clientCode,
        accountManager: 'Maria Santos (OFII Key Accounts)',
        industry: 'Forwarding & Freight Consignment',
        activeShipments: newRecord.deliveryStatus === 'Delivered' ? 0 : 1,
        deliveredThisMonth: newRecord.deliveryStatus === 'Delivered' ? 1 : 0,
        onTimeRate: 98.5,
        primaryContact: newRecord.consignee || 'Logistics In-Charge',
        email: `contact@${rawClientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}.com.ph`,
        phone: '+63 (2) 8892-0000',
        address: `${newRecord.destinationCode} Regional Terminal, ${newRecord.area}`,
        area: newRecord.area,
      };

      setClients(prev => [targetClient, ...prev]);
    }

    // 2. Add to Forwarding Records
    const normalizedForwardingRecord: ForwardingProgressiveRecord = {
      ...newRecord,
      client: targetClient.name,
      clientId: targetClient.id,
    };
    setForwardingRecords(prev => [normalizedForwardingRecord, ...prev]);

    // 3. Keep Client Shipment Monitoring synchronized
    const correspondingShipment: ShipmentRecord = {
      id: `SHP-FPR-${newRecord.id.replace('FPR-2026-', '')}`,
      client: targetClient.name,
      clientId: targetClient.id,
      monthStarted: newRecord.month,
      bookedDate: newRecord.actualDispatchDate,
      pickupDate: newRecord.actualDispatchDate,
      consignee: newRecord.consignee,
      contactNumber: '+63 917 555 0192',
      modeOfShipment: newRecord.modeOfShipment,
      originPickupPoint: 'OFII Paranaque Central Cargo Terminal',
      destination: `${newRecord.destinationCode} - ${newRecord.consignee}`,
      area: newRecord.area,
      requestedDeliveryDate: newRecord.actualDeliveryDate || newRecord.actualDispatchDate,
      itemDescription: `${newRecord.quantity} ${newRecord.unit} Commercial Cargo Consignment`,
      quantityBoxes: newRecord.quantity,
      amount: newRecord.declaredValue || 'PHP 1,500,000.00',
      actualCbm: newRecord.cbm || 10.0,
      volumeWeight: newRecord.volumeWeightKg || 150.0,
      actualWeightKg: newRecord.actualWeightKg || 200,
      chargePerWeight: 'PHP 25.00 / kg',
      vanNumber: `VAN-${newRecord.destinationCode}-01`,
      truckPlate: 'OFII-FLEET',
      estimatedDeparture: `${newRecord.actualDispatchDate} 08:00 AM`,
      actualDeparture: `${newRecord.actualDispatchDate} 08:30 AM`,
      estimatedArrival: `${newRecord.actualDeliveryDate || newRecord.actualDispatchDate} 05:00 PM`,
      actualArrival: newRecord.deliveryStatus === 'Delivered' ? newRecord.actualDeliveryDate : 'In Transit',
      podNumber: newRecord.podNumber,
      awbNumber: newRecord.awbCourierRefNumber,
      drNumber: `DR-${newRecord.referenceNumber.replace('PRJ-', '')}`,
      sealNumber: `SEAL-OFII-${Math.floor(10000 + Math.random() * 90000)}`,
      billOfLandingNumber: `BL-OFII-${Math.floor(10000 + Math.random() * 90000)}`,
      manifestNumber: `MNF-${newRecord.destinationCode}-2026`,
      plannedDeliveryDate: newRecord.actualDeliveryDate || newRecord.actualDispatchDate,
      actualDeliveryDate: newRecord.actualDeliveryDate || '',
      deliveryDate: newRecord.actualDeliveryDate || 'In Transit',
      receiversName: newRecord.receiversName || 'Authorized Consignee Signatory',
      datePodReceived: newRecord.dateOfPodReturn || 'Pending',
      dateTransmitted: newRecord.actualDispatchDate,
      deliveryRemarks: newRecord.reasonForDelay || 'Standard Forwarding Freight Dispatch',
      status: newRecord.deliveryStatus === 'Delivered' ? 'Delivered' : (newRecord.deliveryStatus === 'Delayed' ? 'Delayed' : 'In Transit'),
      leadTime: `${newRecord.deliveryLeadTimeDays} Days`,
      tatNumber: `TAT-${newRecord.destinationCode}-${Math.floor(100 + Math.random() * 900)}`,
      deliveryPerformance: newRecord.deliveryPerformance === 'HIT' ? 'On-Time' : (newRecord.deliveryPerformance === 'MISSED' ? 'Delayed' : 'Within SLA'),
      numberOfDays: newRecord.deliveryTatDays,
    };
    setShipments(prev => [correspondingShipment, ...prev]);

    // 4. Generate Forwarding -> Dispatch Notification (Do NOT automatically create full dispatch record)
    const newDispatchNotification: ForwardingDispatchNotification = {
      id: `FDN-${Date.now()}`,
      forwardingRecordId: normalizedForwardingRecord.id,
      client: targetClient.name,
      clientId: targetClient.id,
      consignee: normalizedForwardingRecord.consignee,
      podNumber: normalizedForwardingRecord.podNumber,
      referenceNumber: normalizedForwardingRecord.referenceNumber,
      deliveryDate: normalizedForwardingRecord.actualDispatchDate || normalizedForwardingRecord.actualDeliveryDate || '2026-08-24',
      modeOfShipment: normalizedForwardingRecord.modeOfShipment,
      area: normalizedForwardingRecord.area,
      quantity: normalizedForwardingRecord.quantity,
      unit: normalizedForwardingRecord.unit,
      destination: normalizedForwardingRecord.destinationCode 
        ? `${normalizedForwardingRecord.destinationCode} - ${normalizedForwardingRecord.consignee}` 
        : normalizedForwardingRecord.consignee,
      destinationCode: normalizedForwardingRecord.destinationCode,
      source: 'Forwarding Progressive Report',
      message: 'A new shipment has been added to the Forwarding Progressive Report. Complete the required dispatch information.',
      status: 'NEW',
      createdAt: new Date().toISOString(),
    };
    setDispatchNotifications(prev => [newDispatchNotification, ...prev]);

    // 5. Trigger Confirmation Toast
    setConfirmationToast({
      message: 'Forwarding record created successfully.',
      subtext: `Ref: ${newRecord.referenceNumber} • Forwarding → Dispatch notification sent to Daily Dispatching Monitoring.`
    });
    setTimeout(() => {
      setConfirmationToast(null);
    }, 5000);
  };

  // Handler: Complete Dispatch from Forwarding Notification
  const handleCompleteDispatchFromNotification = (notification: ForwardingDispatchNotification) => {
    // 1. Mark notification as In Progress
    setDispatchNotifications(prev => prev.map(n => 
      n.id === notification.id ? { ...n, status: 'IN PROGRESS' } : n
    ));

    // 2. Set prefilled data for the Add Dispatch modal
    setPrefillDispatchData({
      clientName: notification.client,
      consignee: notification.consignee,
      podNumber: notification.podNumber,
      referenceNumber: notification.referenceNumber,
      deliveryDate: notification.deliveryDate,
      destination: notification.destination,
      quantity: notification.quantity,
      unit: notification.unit,
      modeOfShipment: notification.modeOfShipment,
      area: notification.area,
      notificationId: notification.id,
    });

    // 3. Open the modal
    setIsAddDispatchOpen(true);
  };

  // Handler: Dismiss notification
  const handleDismissDispatchNotification = (notificationId: string) => {
    setDispatchNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, isDismissed: true } : n
    ));
  };

  const handleUpdateForwardingRecord = (updatedRecord: ForwardingProgressiveRecord) => {
    setForwardingRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    setSelectedForwardingRecord(updatedRecord);

    setConfirmationToast({
      message: 'Changes saved successfully.',
      subtext: `Ref: ${updatedRecord.referenceNumber} updated. Delivery Performance: ${updatedRecord.deliveryPerformance} • POD Status: ${updatedRecord.podStatus}`
    });
    setTimeout(() => {
      setConfirmationToast(null);
    }, 5000);
  };

  // 1. If not logged in, render corporate Login Screen or Create Account Screen
  if (!isLoggedIn) {
    if (authView === 'create-account') {
      return <CreateAccountScreen onBackToLogin={() => setAuthView('login')} />;
    }
    return (
      <LoginScreen 
        onLogin={handleLogin} 
        onCreateAccount={() => setAuthView('create-account')} 
      />
    );
  }

  // Selected client name for header breadcrumb
  const currentClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-row antialiased font-sans text-slate-800 relative">
      
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        unreadDispatchesCount={dispatches.filter(d => !d.isDeleted).length}
        deletedCount={deletedCount}
        pendingNotificationsCount={pendingNotificationsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Sticky Top Header */}
        <Header
          currentTab={currentTab}
          clientSelectedName={currentClient?.name}
          selectedHub={selectedHub}
          onSelectHub={setSelectedHub}
        />

        {/* Global Toast Confirmation Notification */}
        {confirmationToast && (
          <div className="fixed top-16 right-6 z-50 max-w-md bg-slate-900 text-white p-4 rounded-lg shadow-2xl border border-slate-700 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white tracking-wide uppercase">
                {confirmationToast.message}
              </p>
              {confirmationToast.subtext && (
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  {confirmationToast.subtext}
                </p>
              )}
            </div>
            <button
              onClick={() => setConfirmationToast(null)}
              className="text-slate-400 hover:text-white p-0.5 cursor-pointer rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable Main View Container */}
        <main className="flex-1 overflow-y-auto px-6 py-6 bg-slate-100/90">
          <div className="max-w-7xl mx-auto">
            
            {/* TAB 1: DASHBOARD */}
            {currentTab === 'dashboard' && (
              <DashboardView
                dispatches={dispatches}
                shipments={shipments}
                forwardingRecords={forwardingRecords}
                clients={clients}
                dispatchNotifications={dispatchNotifications}
                onSelectDispatch={setSelectedDispatch}
                onSelectShipment={(shipment) => {
                  setSelectedShipment(shipment);
                  setSelectedClientId(shipment.clientId || null);
                  setCurrentTab('clients');
                }}
                onSelectForwardingRecord={(rec) => {
                  setSelectedForwardingRecord(rec);
                  setIsForwardingDetailEditMode(false);
                  setCurrentTab('forwarding_report');
                }}
                onNavigate={handleNavigate}
                onSelectClientFromDashboard={handleSelectClientFromDashboard}
              />
            )}

            {/* TAB 2: DAILY DISPATCHING MONITORING */}
            {currentTab === 'dispatch' && (
              <DailyDispatchView
                dispatches={dispatches}
                onSelectDispatch={setSelectedDispatch}
                onOpenAddModal={() => {
                  setPrefillDispatchData(null);
                  setIsAddDispatchOpen(true);
                }}
                onUpdateDispatches={handleUpdateDispatches}
                onRequestDeleteDispatch={handleRequestDeleteDispatch}
                dispatchNotifications={dispatchNotifications}
                onCompleteDispatchNotification={handleCompleteDispatchFromNotification}
                onDismissDispatchNotification={handleDismissDispatchNotification}
                clients={clients}
              />
            )}

            {/* TAB: CLIENT MANAGEMENT */}
            {currentTab === 'client_management' && (
              <>
                {selectedManagementClient ? (
                  <ClientDetailView
                    client={selectedManagementClient}
                    shipments={shipments}
                    dispatches={dispatches}
                    forwardingRecords={forwardingRecords}
                    onBack={() => setSelectedManagementClient(null)}
                    onEditClient={handleOpenEditClientModal}
                    onDeactivateClient={handleOpenDeactivateClientModal}
                    onReactivateClient={handleOpenReactivateClientModal}
                    onSelectShipment={(shipment) => {
                      setSelectedShipment(shipment);
                      setSelectedClientId(shipment.clientId || selectedManagementClient.id);
                      setCurrentTab('clients');
                    }}
                  />
                ) : (
                  <ClientManagementView
                    clients={clients}
                    shipments={shipments}
                    dispatches={dispatches}
                    forwardingRecords={forwardingRecords}
                    onOpenAddClient={handleOpenAddClientModal}
                    onViewClient={(client) => setSelectedManagementClient(client)}
                    onEditClient={handleOpenEditClientModal}
                    onDeactivateClient={handleOpenDeactivateClientModal}
                    onReactivateClient={handleOpenReactivateClientModal}
                  />
                )}
              </>
            )}

            {/* TAB 3: CLIENT SHIPMENT MONITORING */}
            {currentTab === 'clients' && (
              <>
                {selectedShipment ? (
                  <ClientShipmentDetailView
                    shipment={selectedShipment}
                    onBack={() => setSelectedShipment(null)}
                    onUpdateShipment={handleUpdateShipment}
                    onRequestDelete={handleRequestDeleteShipment}
                  />
                ) : (
                  <ClientShipmentView
                    clients={clients}
                    shipments={shipments}
                    selectedClientId={selectedClientId}
                    onSelectClient={setSelectedClientId}
                    onSelectShipment={setSelectedShipment}
                    onAddNewClient={handleAddNewClient}
                    onRequestDeleteShipment={handleRequestDeleteShipment}
                    onRequestDeactivateClient={handleRequestDeleteClient}
                    onRequestReactivateClient={handleReactivateClient}
                  />
                )}
              </>
            )}

            {/* TAB 4: FORWARDING PROGRESSIVE REPORT */}
            {currentTab === 'forwarding_report' && (
              <ForwardingProgressiveView
                records={forwardingRecords}
                clients={clients}
                onSelectRecord={(rec) => {
                  setSelectedForwardingRecord(rec);
                  setIsForwardingDetailEditMode(false);
                }}
                onOpenAddModal={() => setIsAddForwardingOpen(true)}
                onQuickEditRecord={(rec) => {
                  setSelectedForwardingRecord(rec);
                  setIsForwardingDetailEditMode(true);
                }}
                onRequestDeleteRecord={handleRequestDeleteForwarding}
              />
            )}

            {/* TAB 5: RECENTLY DELETED / TRASH */}
            {currentTab === 'trash' && (
              <RecentlyDeletedView
                dispatches={dispatches}
                shipments={shipments}
                forwardingRecords={forwardingRecords}
                clients={clients}
                onRestoreRecord={handleRestoreFromTrash}
                onPermanentDeleteRecord={(type, id) => {
                  const record = type === 'dispatch' ? dispatches.find(d => d.id === id) :
                    type === 'shipment' ? shipments.find(s => s.id === id) :
                    type === 'forwarding_report' ? forwardingRecords.find(f => f.id === id) :
                    clients.find(c => c.id === id);
                  const identifier = (record as any)?.podNumber || (record as any)?.referenceNumber || (record as any)?.code || id;
                  const clientName = (record as any)?.clientName || (record as any)?.client || (record as any)?.name || 'Client';
                  handleRequestPermanentDelete(type, id, identifier, clientName);
                }}
                onRequestPermanentDelete={handleRequestPermanentDelete}
              />
            )}

            {/* TAB 6: REPORTS */}
            {currentTab === 'reports' && (
              <ReportsView />
            )}

            {/* TAB 7: SETTINGS */}
            {currentTab === 'settings' && (
              <SettingsView />
            )}

          </div>
        </main>
      </div>

      {/* Slide-over / Modal: Dispatch Detail */}
      {selectedDispatch && (
        <DispatchDetailModal
          dispatch={selectedDispatch}
          onClose={() => setSelectedDispatch(null)}
          onSelectClient={handleSelectClientFromDashboard}
          onSaveDispatch={handleSaveSingleDispatch}
          onRequestDelete={handleRequestDeleteDispatch}
          clients={clients}
        />
      )}

      {/* Modal: Add New Dispatch */}
      <AddDispatchModal
        isOpen={isAddDispatchOpen}
        onClose={() => {
          setIsAddDispatchOpen(false);
          setPrefillDispatchData(null);
        }}
        onAddDispatch={handleAddDispatchRecord}
        clients={clients}
        onAddNewClient={handleAddNewClient}
        initialPrefillData={prefillDispatchData}
        existingDispatches={dispatches}
        onViewExistingDispatch={(dispatch) => {
          setSelectedDispatch(dispatch);
          setIsAddDispatchOpen(false);
          setPrefillDispatchData(null);
        }}
      />

      {/* Modal: Forwarding Progressive Record Details (View & Edit) */}
      {selectedForwardingRecord && (
        <ForwardingDetailModal
          record={selectedForwardingRecord}
          clients={clients}
          isOpen={true}
          onClose={() => {
            setSelectedForwardingRecord(null);
            setIsForwardingDetailEditMode(false);
          }}
          onSaveRecord={handleUpdateForwardingRecord}
          onRequestDelete={handleRequestDeleteForwarding}
          initialEditMode={isForwardingDetailEditMode}
        />
      )}

      {/* Modal: Add Forwarding Progressive Record */}
      <AddForwardingRecordModal
        isOpen={isAddForwardingOpen}
        onClose={() => setIsAddForwardingOpen(false)}
        clients={clients}
        onAddRecord={handleAddForwardingRecord}
        onOpenAddClientModal={(initialName) => {
          if (initialName) {
            handleAddNewClient({
              id: `client-${Date.now()}`,
              name: initialName,
              code: `${initialName.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
              accountManager: 'Maria Santos (OFII Key Accounts)',
              industry: 'General Forwarding Consignment',
              activeShipments: 1,
              deliveredThisMonth: 0,
              onTimeRate: 98.0,
              primaryContact: 'Logistics Supervisor',
              email: `contact@${initialName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}.com.ph`,
              phone: '+63 (2) 8876-0000',
              address: 'Metro Manila Distribution Center',
              area: 'NCR',
            });
          }
        }}
      />

      {/* 1. Confirmation Modal: Safe Delete (Move to Trash) */}
      <SafeDeleteModal
        isOpen={!!safeDeleteTarget}
        onClose={() => setSafeDeleteTarget(null)}
        onConfirm={handleConfirmMoveToTrash}
        recordType={safeDeleteTarget?.type || 'dispatch'}
        recordIdentifier={safeDeleteTarget?.identifier}
        clientName={safeDeleteTarget?.clientName}
        additionalInfo={safeDeleteTarget?.additionalInfo}
      />

      {/* 2. Confirmation Modal: Permanent Delete (Irreversible from Trash) */}
      <PermanentDeleteModal
        isOpen={!!permanentDeleteTarget}
        onClose={() => setPermanentDeleteTarget(null)}
        onConfirm={handleConfirmPermanentDelete}
        recordType={permanentDeleteTarget?.type || 'dispatch'}
        recordIdentifier={permanentDeleteTarget?.identifier}
        clientName={permanentDeleteTarget?.clientName}
      />

      {/* 3. Confirmation Modal: Client Deactivation Rule (History Preservation) */}
      <ClientDeactivateModal
        client={clientDeactivateTarget}
        isOpen={!!clientDeactivateTarget}
        onClose={() => setClientDeactivateTarget(null)}
        hasHistoricalRecords={true}
        historicalRecordsCount={
          clientDeactivateTarget 
            ? (shipments.filter(s => s.clientId === clientDeactivateTarget.id || s.client.toLowerCase() === clientDeactivateTarget.name.toLowerCase()).length +
               forwardingRecords.filter(f => f.clientId === clientDeactivateTarget.id || f.client.toLowerCase() === clientDeactivateTarget.name.toLowerCase()).length)
            : 0
        }
        onConfirmDeactivate={handleConfirmDeactivateClient}
        onConfirmReactivate={handleReactivateClient}
      />

      {/* 4. Client Management Modal: Add / Edit Client */}
      <ClientFormModal
        isOpen={clientFormModal.isOpen}
        onClose={() => setClientFormModal({ isOpen: false, clientToEdit: null })}
        onSaveClient={handleSaveClientFromForm}
        clientToEdit={clientFormModal.clientToEdit}
      />

      {/* 5. Client Management Modal: Status Toggle (Deactivate / Reactivate) */}
      <ClientStatusToggleModal
        isOpen={clientStatusToggle.isOpen}
        onClose={() => setClientStatusToggle({ isOpen: false, client: null, mode: 'deactivate' })}
        client={clientStatusToggle.client}
        mode={clientStatusToggle.mode}
        onConfirm={handleConfirmClientStatusToggle}
      />
    </div>
  );
}
