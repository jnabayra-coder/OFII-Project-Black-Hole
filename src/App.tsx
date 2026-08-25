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
import { CheckCircle2, X, RefreshCw, AlertCircle } from 'lucide-react';
import { useData } from './context/DataContext';

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

export default function App() {
  // 1. Auth State: Login Screen is shown first
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'create-account'>('login');

  // 2. Navigation State
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [selectedHub, setSelectedHub] = useState('OFII Central Hub (Paranaque)');

  // 3. Centralized Database Context (Supabase Cloud + Cross-Tab Sync)
  const {
    clients,
    dispatches,
    shipments,
    forwardingRecords,
    notifications: dispatchNotifications,
    isLoading,
    loadingMessage,
    errorMessage,
    addClient,
    updateClient,
    toggleClientStatus,
    addDispatch,
    updateDispatch,
    addForwardingRecord,
    updateForwardingRecord,
    updateShipment,
    softDeleteRecord,
    restoreRecord,
    permanentDeleteRecord,
    dismissNotification,
    completeNotification,
    showSuccessToast
  } = useData();

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
  // SAFE DELETE & RECOVERY WORKFLOW HANDLERS (Connected to Database)
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
    const clientShipmentHistory = shipments.filter(
      s => s.clientId === client.id || s.client.toLowerCase() === client.name.toLowerCase()
    );
    const clientForwardingHistory = forwardingRecords.filter(
      f => f.clientId === client.id || f.client.toLowerCase() === client.name.toLowerCase()
    );

    const totalHistoricalRecords = clientShipmentHistory.length + clientForwardingHistory.length;

    if (totalHistoricalRecords > 0) {
      setClientDeactivateTarget(client);
    } else {
      setSafeDeleteTarget({
        id: client.id,
        type: 'client',
        identifier: client.code,
        clientName: client.name,
        additionalInfo: `Account Manager: ${client.accountManager} • Contact: ${client.primaryContact}`,
      });
    }
  };

  // 2. Execute Move to Trash (Soft Delete in Database)
  const handleConfirmMoveToTrash = async () => {
    if (!safeDeleteTarget) return;

    const { id, type, identifier, clientName } = safeDeleteTarget;

    try {
      await softDeleteRecord(id, type, 'Moved to Trash via Operations Console');
      if (selectedDispatch?.id === id) setSelectedDispatch(null);
      if (selectedShipment?.id === id) setSelectedShipment(null);
      if (selectedForwardingRecord?.id === id) setSelectedForwardingRecord(null);
      if (selectedClientId === id) setSelectedClientId(null);

      setSafeDeleteTarget(null);

      setConfirmationToast({
        message: 'Record moved to Recently Deleted.',
        subtext: `"${identifier || clientName}" has been removed from active lists and can be restored from the Trash section at any time.`
      });
      setTimeout(() => setConfirmationToast(null), 5000);
    } catch (err: any) {
      alert('Unable to delete record. Please check your connection.');
    }
  };

  // 3. Execute Restore from Trash in Database
  const handleRestoreFromTrash = async (type: OperationalRecordType, id: string) => {
    try {
      await restoreRecord(id, type);
      setConfirmationToast({
        message: 'Record restored to active operational list.',
        subtext: `The ${type.replace('_', ' ')} record has been restored with all relationships intact.`
      });
      setTimeout(() => setConfirmationToast(null), 5000);
    } catch (err: any) {
      alert('Unable to restore record. Please check your connection.');
    }
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

  // 5. Execute Permanent Delete (Purge from Database)
  const handleConfirmPermanentDelete = async () => {
    if (!permanentDeleteTarget) return;

    const { id, type, identifier, clientName } = permanentDeleteTarget;

    try {
      await permanentDeleteRecord(id, type);
      setPermanentDeleteTarget(null);

      setConfirmationToast({
        message: 'Record permanently deleted.',
        subtext: `"${identifier || clientName}" has been permanently purged from the database.`
      });
      setTimeout(() => setConfirmationToast(null), 5000);
    } catch (err: any) {
      alert('Unable to purge record. Please check your connection.');
    }
  };

  // 6. Client Deactivation & Reactivation in Database
  const handleConfirmDeactivateClient = async (clientId: string, reason?: string) => {
    await toggleClientStatus(clientId, reason || 'Deactivated by Operations');
    setClientDeactivateTarget(null);

    const client = clients.find(c => c.id === clientId);
    setConfirmationToast({
      message: 'Client account deactivated.',
      subtext: `Client "${client?.name || clientId}" is now marked as Deactivated. All historical shipment and forwarding records remain preserved in the system.`
    });
    setTimeout(() => setConfirmationToast(null), 5000);
  };

  const handleReactivateClient = async (clientId: string) => {
    await toggleClientStatus(clientId);

    const client = clients.find(c => c.id === clientId);
    setConfirmationToast({
      message: 'Client account reactivated.',
      subtext: `Client "${client?.name || clientId}" is now active and available for new dispatches.`
    });
    setTimeout(() => setConfirmationToast(null), 5000);
  };

  // ---------------------------------------------------------------------------
  // OPERATIONAL CREATION & UPDATE HANDLERS (Connected to Supabase)
  // ---------------------------------------------------------------------------

  // Add Dispatch Record with Automatic Client & Shipment Synchronization
  const handleAddDispatchRecord = async (newDispatch: DispatchRecord, originNotificationId?: string) => {
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

    try {
      // 1. Ensure client is in database
      const existingClient = clients.find(
        c => c.name.toLowerCase() === newDispatch.clientName.toLowerCase()
      );

      let targetClientName = newDispatch.clientName;
      if (!existingClient) {
        const saved = await addClient({
          name: newDispatch.clientName,
          address: `${newDispatch.destination}, NCR`,
          area: 'NCR',
        });
        targetClientName = saved.name;
      }

      // 2. Add Dispatch to database
      await addDispatch({
        ...newDispatch,
        clientName: targetClientName,
      });

      // 3. Complete linked notification if applicable
      if (originNotificationId) {
        await completeNotification(originNotificationId, newDispatch.id);
      }

      setPrefillDispatchData(null);
    } catch (err: any) {
      alert('Unable to save dispatch. Please check your connection.');
    }
  };

  // Add / Edit Shared Client Handler
  const handleAddNewClient = async (newClient: ClientSummary) => {
    try {
      await addClient(newClient);
    } catch (err: any) {
      alert('Unable to add client. Please check your connection.');
    }
  };

  const handleSaveClientFromForm = async (savedClient: ClientSummary) => {
    const isEdit = clients.some(c => c.id === savedClient.id);
    try {
      if (isEdit) {
        await updateClient(savedClient);
        if (selectedManagementClient?.id === savedClient.id) {
          setSelectedManagementClient(savedClient);
        }
      } else {
        await addClient(savedClient);
      }
    } catch (err: any) {
      alert('Unable to save client. Please check your connection.');
    }
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

  const handleConfirmClientStatusToggle = async (clientId: string) => {
    const isDeactivating = clientStatusToggle.mode === 'deactivate';
    await toggleClientStatus(clientId);
    setClientStatusToggle({ isOpen: false, client: null, mode: 'deactivate' });

    const targetClient = clients.find(c => c.id === clientId);
    if (selectedManagementClient?.id === clientId && targetClient) {
      setSelectedManagementClient({ ...targetClient, isDeactivated: isDeactivating });
    }
  };

  // Handle Updates in Daily Dispatch
  const handleUpdateDispatches = (updated: DispatchRecord[]) => {
    // updates already handled via single dispatch edits
  };

  // Handle Save Single Dispatch from Details Modal
  const handleSaveSingleDispatch = async (updatedDispatch: DispatchRecord) => {
    try {
      await updateDispatch(updatedDispatch);
      setSelectedDispatch(updatedDispatch);
    } catch (err: any) {
      alert('Unable to update dispatch. Please check your connection.');
    }
  };

  // Handle Updates in Client Shipment
  const handleUpdateShipment = async (updatedShipment: ShipmentRecord) => {
    try {
      await updateShipment(updatedShipment);
      setSelectedShipment(updatedShipment);
    } catch (err: any) {
      alert('Unable to update shipment. Please check your connection.');
    }
  };

  // Forwarding Progressive Report Handlers with Shared Client Sync
  const handleAddForwardingRecord = async (newRecord: ForwardingProgressiveRecord, clientName: string) => {
    const rawClientName = (clientName || newRecord.client || 'General Client').trim();
    try {
      // Ensure client exists
      const existing = clients.find(c => c.name.toLowerCase() === rawClientName.toLowerCase());
      let targetClientId = existing?.id;
      if (!existing) {
        const saved = await addClient({
          name: rawClientName,
          area: newRecord.area,
        });
        targetClientId = saved.id;
      }

      await addForwardingRecord({
        ...newRecord,
        client: rawClientName,
        clientId: targetClientId,
      });
    } catch (err: any) {
      alert('Unable to add forwarding record. Please check your connection.');
    }
  };

  // Handler: Complete Dispatch from Forwarding Notification
  const handleCompleteDispatchFromNotification = (notification: ForwardingDispatchNotification) => {
    // 1. Set prefilled data for the Add Dispatch modal
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

    // 2. Open the modal
    setIsAddDispatchOpen(true);
  };

  // Handler: Dismiss notification in database
  const handleDismissDispatchNotification = async (notificationId: string) => {
    await dismissNotification(notificationId);
  };

  const handleUpdateForwardingRecord = async (updatedRecord: ForwardingProgressiveRecord) => {
    try {
      await updateForwardingRecord(updatedRecord);
      setSelectedForwardingRecord(updatedRecord);
    } catch (err: any) {
      alert('Unable to update forwarding record. Please check your connection.');
    }
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
                    dispatches={dispatches}
                    shipments={shipments}
                    forwardingRecords={forwardingRecords}
                    onBack={() => setSelectedManagementClient(null)}
                    onEditClient={handleOpenEditClientModal}
                    onDeactivateClient={handleOpenDeactivateClientModal}
                    onReactivateClient={handleOpenReactivateClientModal}
                    onDeleteClient={handleRequestDeleteClient}
                    onSelectDispatch={setSelectedDispatch}
                    onSelectShipment={setSelectedShipment}
                    onSelectForwardingRecord={(rec) => {
                      setSelectedForwardingRecord(rec);
                      setIsForwardingDetailEditMode(false);
                      setCurrentTab('forwarding_report');
                    }}
                  />
                ) : (
                  <ClientManagementView
                    clients={clients}
                    dispatches={dispatches}
                    shipments={shipments}
                    forwardingRecords={forwardingRecords}
                    onSelectClient={setSelectedManagementClient}
                    onOpenAddClientModal={handleOpenAddClientModal}
                    onEditClient={handleOpenEditClientModal}
                    onDeactivateClient={handleOpenDeactivateClientModal}
                    onReactivateClient={handleOpenReactivateClientModal}
                    onDeleteClient={handleRequestDeleteClient}
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
                    onRequestDeleteShipment={handleRequestDeleteShipment}
                  />
                ) : (
                  <ClientShipmentView
                    shipments={shipments}
                    clients={clients}
                    selectedClientId={selectedClientId}
                    onSelectClient={setSelectedClientId}
                    onSelectShipment={setSelectedShipment}
                    onRequestDeleteShipment={handleRequestDeleteShipment}
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
                onRequestDeleteRecord={handleRequestDeleteForwarding}
                onEditRecord={(rec) => {
                  setSelectedForwardingRecord(rec);
                  setIsForwardingDetailEditMode(true);
                }}
              />
            )}

            {/* TAB 5: LOGISTICS & SLA REPORTS */}
            {currentTab === 'reports' && (
              <ReportsView
                dispatches={dispatches}
                shipments={shipments}
                forwardingRecords={forwardingRecords}
                clients={clients}
                onSelectDispatch={setSelectedDispatch}
                onSelectShipment={setSelectedShipment}
              />
            )}

            {/* TAB 6: RECENTLY DELETED / TRASH (RECOVERY VIEW) */}
            {currentTab === 'trash' && (
              <RecentlyDeletedView
                dispatches={dispatches}
                shipments={shipments}
                forwardingRecords={forwardingRecords}
                clients={clients}
                onRestore={handleRestoreFromTrash}
                onPermanentDelete={handleRequestPermanentDelete}
              />
            )}

            {/* TAB 7: SETTINGS VIEW */}
            {currentTab === 'settings' && (
              <SettingsView
                onAddNewClient={handleAddNewClient}
                onSaveClient={handleSaveClientFromForm}
                clients={clients}
              />
            )}

          </div>
        </main>
      </div>

      {/* ---------------- MODALS & OVERLAYS ---------------- */}

      {/* 1. Add Daily Dispatch Modal */}
      {isAddDispatchOpen && (
        <AddDispatchModal
          isOpen={isAddDispatchOpen}
          onClose={() => {
            setIsAddDispatchOpen(false);
            setPrefillDispatchData(null);
          }}
          onAdd={handleAddDispatchRecord}
          prefillData={prefillDispatchData}
          clients={clients}
        />
      )}

      {/* 2. Dispatch Detail / Edit Modal */}
      {selectedDispatch && (
        <DispatchDetailModal
          dispatch={selectedDispatch}
          onClose={() => setSelectedDispatch(null)}
          onSave={handleSaveSingleDispatch}
          onRequestDelete={handleRequestDeleteDispatch}
        />
      )}

      {/* 3. Add Forwarding Record Modal */}
      {isAddForwardingOpen && (
        <AddForwardingRecordModal
          isOpen={isAddForwardingOpen}
          onClose={() => setIsAddForwardingOpen(false)}
          onAdd={handleAddForwardingRecord}
          clients={clients}
        />
      )}

      {/* 4. Forwarding Detail & Edit Modal */}
      {selectedForwardingRecord && (
        <ForwardingDetailModal
          record={selectedForwardingRecord}
          isOpen={!!selectedForwardingRecord}
          initialEditMode={isForwardingDetailEditMode}
          onClose={() => {
            setSelectedForwardingRecord(null);
            setIsForwardingDetailEditMode(false);
          }}
          onSave={handleUpdateForwardingRecord}
          onRequestDelete={handleRequestDeleteForwarding}
        />
      )}

      {/* 5. Safe Delete (Soft Delete to Trash) Modal */}
      {safeDeleteTarget && (
        <SafeDeleteModal
          isOpen={!!safeDeleteTarget}
          recordType={safeDeleteTarget.type}
          identifier={safeDeleteTarget.identifier}
          clientName={safeDeleteTarget.clientName}
          additionalInfo={safeDeleteTarget.additionalInfo}
          onClose={() => setSafeDeleteTarget(null)}
          onConfirm={handleConfirmMoveToTrash}
        />
      )}

      {/* 6. Permanent Delete (Purge) Modal */}
      {permanentDeleteTarget && (
        <PermanentDeleteModal
          isOpen={!!permanentDeleteTarget}
          recordType={permanentDeleteTarget.type}
          identifier={permanentDeleteTarget.identifier}
          clientName={permanentDeleteTarget.clientName}
          onClose={() => setPermanentDeleteTarget(null)}
          onConfirm={handleConfirmPermanentDelete}
        />
      )}

      {/* 7. Client Deactivate instead of Delete Protection Modal */}
      {clientDeactivateTarget && (
        <ClientDeactivateModal
          isOpen={!!clientDeactivateTarget}
          client={clientDeactivateTarget}
          dispatchesCount={dispatches.filter(d => d.clientName.toLowerCase() === clientDeactivateTarget.name.toLowerCase()).length}
          shipmentsCount={shipments.filter(s => s.clientId === clientDeactivateTarget.id || s.client.toLowerCase() === clientDeactivateTarget.name.toLowerCase()).length}
          forwardingCount={forwardingRecords.filter(f => f.clientId === clientDeactivateTarget.id || f.client.toLowerCase() === clientDeactivateTarget.name.toLowerCase()).length}
          onClose={() => setClientDeactivateTarget(null)}
          onConfirmDeactivate={handleConfirmDeactivateClient}
        />
      )}

      {/* 8. Client Management: Create / Edit Client Modal */}
      {clientFormModal.isOpen && (
        <ClientFormModal
          isOpen={clientFormModal.isOpen}
          clientToEdit={clientFormModal.clientToEdit}
          onClose={() => setClientFormModal({ isOpen: false, clientToEdit: null })}
          onSave={handleSaveClientFromForm}
        />
      )}

      {/* 9. Client Management: Deactivate / Reactivate Modal */}
      {clientStatusToggle.isOpen && clientStatusToggle.client && (
        <ClientStatusToggleModal
          isOpen={clientStatusToggle.isOpen}
          client={clientStatusToggle.client}
          mode={clientStatusToggle.mode}
          dispatchesCount={dispatches.filter(d => d.clientName.toLowerCase() === clientStatusToggle.client?.name.toLowerCase()).length}
          shipmentsCount={shipments.filter(s => s.clientId === clientStatusToggle.client?.id || s.client.toLowerCase() === clientStatusToggle.client?.name.toLowerCase()).length}
          forwardingCount={forwardingRecords.filter(f => f.clientId === clientStatusToggle.client?.id || f.client.toLowerCase() === clientStatusToggle.client?.name.toLowerCase()).length}
          onClose={() => setClientStatusToggle({ isOpen: false, client: null, mode: 'deactivate' })}
          onConfirm={handleConfirmClientStatusToggle}
        />
      )}

    </div>
  );
}
