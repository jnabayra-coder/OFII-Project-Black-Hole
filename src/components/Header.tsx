import React from 'react';
import { 
  Building2, 
  Clock, 
  Search, 
  Bell, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet
} from 'lucide-react';
import { NavigationTab } from '../types';

interface HeaderProps {
  currentTab: NavigationTab;
  clientSelectedName?: string;
  onSearchClick?: () => void;
  selectedHub: string;
  onSelectHub: (hub: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  clientSelectedName,
  selectedHub,
  onSelectHub,
}) => {
  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Operations Dashboard';
      case 'dispatch':
        return 'Daily Dispatching Monitoring';
      case 'client_management':
        return 'Client Management';
      case 'clients':
        return clientSelectedName ? `Client Monitoring: ${clientSelectedName}` : 'Client Shipment Monitoring';
      case 'forwarding_report':
        return 'Forwarding Progressive Report';
      case 'reports':
        return 'Logistics & SLA Reports';
      case 'trash':
        return 'Recently Deleted & Operational Trash';
      case 'settings':
        return 'System Settings & Profile';
      default:
        return 'OFII Monitoring System';
    }
  };

  const getBreadcrumb = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Home / Overview';
      case 'dispatch':
        return 'Operations / Daily Dispatching';
      case 'client_management':
        return 'Operations / Client Management';
      case 'clients':
        return clientSelectedName ? `Operations / Clients / ${clientSelectedName}` : 'Operations / Client Shipments';
      case 'forwarding_report':
        return 'Operations / Progressive Forwarding Monitoring';
      case 'reports':
        return 'Analytics / Reports & Performance';
      case 'trash':
        return 'System / Operational Recovery & Trash';
      case 'settings':
        return 'System / Configuration';
      default:
        return 'Portal';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 shrink-0 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-4">
        <div>
          <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
            <span>{getBreadcrumb()}</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {getPageTitle()}
          </h2>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Hub Selector */}
        <div className="hidden lg:flex items-center bg-slate-100 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-blue-700 mr-1.5 shrink-0" />
          <span className="text-slate-500 mr-1">Station:</span>
          <select
            value={selectedHub}
            onChange={(e) => onSelectHub(e.target.value)}
            className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer pr-1"
          >
            <option value="OFII Central Hub (Paranaque)">OFII Central Hub (Paranaque, NCR)</option>
            <option value="OFII North Harbor Pier 4 Terminal">OFII North Harbor Pier 4 Terminal</option>
            <option value="OFII Cebu Hub (Mandaue)">OFII Cebu Hub (Mandaue, Visayas)</option>
            <option value="OFII Davao Terminal (Sasa Wharf)">OFII Davao Terminal (Sasa Wharf, Mindanao)</option>
          </select>
        </div>

        {/* Live System Time / Date Badge */}
        <div className="hidden sm:flex items-center text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded">
          <Clock className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
          <span>Today: <strong className="text-slate-800">Aug 23, 2026</strong></span>
        </div>

        {/* Prototype Label */}
        <div className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 hidden md:inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
          <span>OFII Internal TMS</span>
        </div>
      </div>
    </header>
  );
};
