import React, { useState } from 'react';
import { Truck, ShieldCheck, ArrowRight, Building2, KeyRound, User, AlertCircle, UserPlus } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
  onCreateAccount: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onCreateAccount }) => {
  const [username, setUsername] = useState('ops.officer@orientfreight.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Subtle corporate background grid pattern */}
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

          <div className="hidden md:flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Internal Network: Active
            </span>
            <span className="text-slate-700">|</span>
            <span>Support: +63 (2) 8851-8888</span>
          </div>
        </div>
      </header>

      {/* Center Login Box */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
          
          {/* Card Header */}
          <div className="bg-slate-900 px-6 py-6 border-b border-slate-800 text-center">
            {/* OFII Logo Placeholder Box */}
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 mb-3 shadow-inner">
              <Truck className="w-7 h-7 text-blue-400" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              OFII Monitoring System
            </h1>
            <p className="text-xs text-blue-200/80 mt-1 font-medium">
              Logistics & Shipment Monitoring Portal
            </p>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8 bg-white">
            <div className="mb-5 p-3 rounded bg-blue-50 border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
              <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Corporate Prototype Mode (v0.1)</p>
                <p className="text-blue-800/80 mt-0.5">Click &ldquo;SIGN IN&rdquo; below to explore the dispatch, client shipment, and reporting modules.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Username
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
                    className="block w-full pl-9 pr-3 py-2 text-sm text-slate-800 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                    placeholder="Username or Corporate Email"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 text-sm text-slate-800 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-700 focus:ring-blue-600 border-slate-300 mr-2"
                  />
                  Remember workstation credentials
                </label>
              </div>

              {/* Action Buttons: SIGN IN & CREATE ACCOUNT */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="submit"
                  className="w-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold uppercase tracking-wider py-2.5 px-4 rounded shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                >
                  <span>SIGN IN</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onCreateAccount}
                  className="w-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold uppercase tracking-wider py-2.5 px-4 rounded border border-slate-300 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-slate-600" />
                  <span>CREATE ACCOUNT</span>
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  OFII Manila Central Hub
                </span>
                <span>Branch #01</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Forgot Password Simple Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 border border-slate-200">
            <div className="flex items-center gap-2.5 text-blue-900 font-semibold mb-2">
              <AlertCircle className="w-5 h-5 text-blue-700" />
              <h4>Password Recovery Protocol</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              For corporate security compliance, internal user password resets must be initiated through your OFII Station Administrator or by contacting the IT Helpdesk at <span className="font-semibold text-slate-800">it.support@orientfreight.com</span>.
            </p>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] text-slate-500 mb-4">
              Tip for Prototype: Any login credentials will successfully open the portal.
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded cursor-pointer"
              >
                Understood & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 px-6 text-center text-xs text-slate-500 border-t border-slate-800/80 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>OFII Monitoring System — Logistics & Shipment Monitoring Portal</span>
          <span>© {new Date().getFullYear()} Orient Freight International, Inc. All rights reserved. Confidential.</span>
        </div>
      </footer>
    </div>
  );
};
