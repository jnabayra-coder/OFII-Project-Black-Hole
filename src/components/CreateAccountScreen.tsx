import React, { useState } from 'react';
import { 
  Building2, 
  UserCheck, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldAlert, 
  BadgeCheck, 
  Send, 
  Lock, 
  Mail, 
  User, 
  IdCard, 
  Briefcase, 
  Layers
} from 'lucide-react';

interface CreateAccountScreenProps {
  onBackToLogin: () => void;
}

export const CreateAccountScreen: React.FC<CreateAccountScreenProps> = ({ onBackToLogin }) => {
  // Form Fields
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('Domestic Operations & Dispatch');
  const [position, setPosition] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI States
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedData, setSubmittedData] = useState<{
    fullName: string;
    employeeId: string;
    department: string;
    emailAddress: string;
    requestRef: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    // Generate prototype request reference number
    const refCode = `REQ-OFII-${Math.floor(100000 + Math.random() * 900000)}`;

    setSubmittedData({
      fullName,
      employeeId,
      department,
      emailAddress,
      requestRef: refCode
    });

    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Top Bar / Corporate Header */}
      <header className="relative z-10 w-full border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* OFII Logo Placeholder Badge */}
            <div className="w-10 h-10 rounded bg-blue-700 flex items-center justify-center text-white font-bold text-lg tracking-wider border border-blue-500/40 shadow-sm">
              OFII
            </div>
            <div>
              <div className="text-white text-sm font-semibold tracking-wide flex items-center gap-2">
                ORIENT FREIGHT INTERNATIONAL, INC.
                <span className="hidden sm:inline-block text-[10px] uppercase px-1.5 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded">
                  EST. 1974
                </span>
              </div>
              <p className="text-xs text-slate-400">Total Logistics Services Provider • Philippines</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToLogin}
            className="flex items-center gap-1.5 text-xs text-blue-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded border border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </button>
        </div>
      </header>

      {/* Center Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden">
          
          {/* Card Header */}
          <div className="bg-slate-900 px-6 py-5 border-b border-slate-800 text-center relative">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 mb-2 shadow-inner">
              <UserCheck className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Create Account
            </h1>
            <p className="text-xs text-blue-200/80 mt-1 font-medium">
              Employee Portal Access Registration & Verification
            </p>
          </div>

          {/* Body Content */}
          {!isSubmitted ? (
            <div className="p-6 sm:p-8 bg-white">
              
              {/* Internal Employee Notice */}
              <div className="mb-6 p-3.5 rounded-lg bg-amber-50/80 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950">Internal Employee Access Registration</p>
                  <p className="text-amber-800/90 mt-0.5 leading-relaxed">
                    This registration is strictly for authorized employees of <strong>Orient Freight International, Inc.</strong> New account requests will be routed to your Department Supervisor and the IT Systems Administrator for credential provisioning.
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-5 p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  {errorMessage}
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-700">
                
                {/* Row 1: Full Name & Employee ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 tracking-wider mb-1.5">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative rounded-md shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Maria Corazon Santos"
                        className="block w-full pl-9 pr-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 tracking-wider mb-1.5">
                      Employee ID <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative rounded-md shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <IdCard className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        placeholder="e.g. OFII-2024-8841"
                        className="block w-full pl-9 pr-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded font-mono font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Department & Position */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 tracking-wider mb-1.5">
                      Department <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative rounded-md shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Layers className="h-4 w-4" />
                      </div>
                      <select
                        required
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="block w-full pl-9 pr-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                      >
                        <option value="Domestic Operations & Dispatch">Domestic Operations & Dispatch</option>
                        <option value="International Freight Forwarding">International Freight Forwarding</option>
                        <option value="Warehousing & Logistics (GADC / ISCI)">Warehousing & Logistics (GADC / ISCI)</option>
                        <option value="Fleet Management & Trucking">Fleet Management & Trucking</option>
                        <option value="Client Services & Accounts">Client Services & Accounts</option>
                        <option value="Billing & Financial Operations">Billing & Financial Operations</option>
                        <option value="IT & Systems Administration">IT & Systems Administration</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 tracking-wider mb-1.5">
                      Position / Title <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative rounded-md shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="e.g. Dispatch Officer / Logistics Lead"
                        className="block w-full pl-9 pr-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Email Address & Username */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 tracking-wider mb-1.5">
                      Corporate Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative rounded-md shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        placeholder="m.santos@orientfreight.com"
                        className="block w-full pl-9 pr-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 tracking-wider mb-1.5">
                      Username <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative rounded-md shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. maria.santos"
                        className="block w-full pl-9 pr-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 4: Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 tracking-wider mb-1.5">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative rounded-md shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="block w-full pl-9 pr-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 tracking-wider mb-1.5">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative rounded-md shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="block w-full pl-9 pr-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={onBackToLogin}
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold uppercase tracking-wider text-xs rounded transition-colors text-center cursor-pointer"
                  >
                    CANCEL / BACK TO LOGIN
                  </button>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold uppercase tracking-wider text-xs rounded shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>CREATE ACCOUNT</span>
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  OFII Manila Central Hub
                </span>
                <span>Security Level: Corporate Internal</span>
              </div>
            </div>
          ) : (
            /* Confirmation State Screen */
            <div className="p-8 sm:p-10 bg-white text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h2 className="text-lg font-bold text-slate-900">
                Account request submitted successfully.
              </h2>
              
              <p className="text-xs text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
                Your employee registration request has been logged in the system. An authorization notification has been dispatched to your department head and the OFII IT helpdesk.
              </p>

              {/* Request Summary Box */}
              {submittedData && (
                <div className="mt-6 max-w-md mx-auto p-4 rounded-lg bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-semibold uppercase text-[10px]">Reference Number</span>
                    <span className="font-mono font-bold text-blue-700">{submittedData.requestRef}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Applicant:</span>
                    <span className="font-semibold text-slate-900">{submittedData.fullName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Employee ID:</span>
                    <span className="font-mono text-slate-800">{submittedData.employeeId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Department:</span>
                    <span className="text-slate-800 truncate max-w-[200px]">{submittedData.department}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Notification Email:</span>
                    <span className="font-mono text-slate-800">{submittedData.emailAddress}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-emerald-800 font-semibold">
                    <span className="flex items-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Status:
                    </span>
                    <span>Pending Verification</span>
                  </div>
                </div>
              )}

              <div className="mt-8">
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold uppercase tracking-wider text-xs rounded shadow-sm hover:shadow transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>RETURN TO LOGIN SCREEN</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 px-6 text-center text-xs text-slate-500 border-t border-slate-800/80 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>OFII Monitoring System — Employee Registration Portal</span>
          <span>© {new Date().getFullYear()} Orient Freight International, Inc. All rights reserved. Confidential.</span>
        </div>
      </footer>
    </div>
  );
};
