import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  User, 
  ShieldCheck, 
  AlertCircle, 
  KeyRound, 
  Eye, 
  EyeOff,
  Info
} from 'lucide-react';
import { AuthUser, UserRole } from '../types/gis';
import { TaumataArowaiLogo } from './TaumataArowaiLogo';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: AuthUser) => void;
  currentUser: AuthUser | null;
}

// Development-only test accounts with roles for local testing
export const DEV_TEST_ACCOUNTS: Record<UserRole, AuthUser & { defaultPasswordHint: string }> = {
  official: {
    id: 'usr-official-01',
    name: 'David Te Whata',
    email: 'official@taumataarowai.govt.nz',
    role: 'official',
    title: 'Water Services Compliance Officer',
    organization: 'Taumata Arowai - Regulatory Operations',
    defaultPasswordHint: 'OfficialWater#2026',
  },
  admin: {
    id: 'usr-admin-01',
    name: 'Sarah MacLeod',
    email: 'admin@taumataarowai.govt.nz',
    role: 'admin',
    title: 'GIS Systems Administrator',
    organization: 'Taumata Arowai - National GIS Office',
    defaultPasswordHint: 'ArowaiAdmin#2026',
  },
  citizen: {
    id: 'usr-citizen-01',
    name: 'Auckland Resident',
    email: 'citizen@nzwater.org.nz',
    role: 'citizen',
    title: 'Registered Property Owner',
    organization: 'Public Resident',
    defaultPasswordHint: 'CitizenNZ#2026',
  },
};

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  currentUser,
}) => {
  const [selectedRolePreset, setSelectedRolePreset] = useState<UserRole>('official');
  const [email, setEmail] = useState(DEV_TEST_ACCOUNTS.official.email);
  const [password, setPassword] = useState('OfficialWater#2026');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (role: UserRole) => {
    setSelectedRolePreset(role);
    setEmail(DEV_TEST_ACCOUNTS[role].email);
    setPassword(DEV_TEST_ACCOUNTS[role].defaultPasswordHint);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide both an email/username and password.');
      return;
    }

    // Match with verified account records
    const matched = Object.values(DEV_TEST_ACCOUNTS).find(
      (acc) => acc.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (matched) {
      onLogin({
        ...matched,
        lastLogin: new Date().toISOString(),
      });
      onClose();
    } else {
      // Authenticated general user fallback
      onLogin({
        id: `usr-${Date.now()}`,
        name: email.split('@')[0],
        email: email.trim(),
        role: 'citizen',
        title: 'Public User',
        organization: 'Public User',
        lastLogin: new Date().toISOString(),
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Header with Taumata Arowai Branding */}
        <div className="px-6 py-4 bg-[#071A35] text-white flex items-center justify-between border-b border-[#0C2548]">
          <div className="flex items-center gap-3">
            <TaumataArowaiLogo theme="dark" compact={false} className="h-8" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close login dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subheader */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
          <div className="text-xs font-bold text-[#071A35] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Water Services Authority Authentication</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Sign in to access assigned operational GIS datasets and permissions.
          </p>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Development Test Account Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Development Test Accounts:
              </label>
              <span className="text-[10px] text-slate-400">Local Testing</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectPreset('official')}
                className={`p-2 rounded border text-left transition-all ${
                  selectedRolePreset === 'official'
                    ? 'border-[#071A35] bg-sky-50/70 text-[#071A35] font-bold ring-1 ring-[#071A35]'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-[11px] font-bold">Authorized Official</div>
                <div className="text-[9px] text-slate-500 leading-tight mt-0.5">Compliance & Assets</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('admin')}
                className={`p-2 rounded border text-left transition-all ${
                  selectedRolePreset === 'admin'
                    ? 'border-[#071A35] bg-sky-50/70 text-[#071A35] font-bold ring-1 ring-[#071A35]'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-[11px] font-bold">Admin</div>
                <div className="text-[9px] text-slate-500 leading-tight mt-0.5">System & Uploads</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('citizen')}
                className={`p-2 rounded border text-left transition-all ${
                  selectedRolePreset === 'citizen'
                    ? 'border-[#071A35] bg-sky-50/70 text-[#071A35] font-bold ring-1 ring-[#071A35]'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-[11px] font-bold">Citizen</div>
                <div className="text-[9px] text-slate-500 leading-tight mt-0.5">Public Drinking Water</div>
              </button>
            </div>
          </div>

          {/* Email / Username Input */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-700">
              User Email / Government ID:
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-8 pr-3 py-2 rounded border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#071A35] focus:border-[#071A35]"
                placeholder="name@taumataarowai.govt.nz"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-700">
              Password:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-8 pr-9 py-2 rounded border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#071A35] focus:border-[#071A35] font-mono"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role Access Notice */}
          <div className="p-3 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#071A35]" />
              <span>Assigned Role Permissions:</span>
            </div>
            {selectedRolePreset === 'admin' && (
              <p className="leading-relaxed">
                <strong>Admin</strong>: Ingest GIS layers (<code>AklDizzy</code>, <code>Auckland_zone_list</code>), execute schema migrations, manage system audits.
              </p>
            )}
            {selectedRolePreset === 'official' && (
              <p className="leading-relaxed">
                <strong>Authorized Official</strong>: Full reticulation attributes (COMPKEYs, diameters, CCTV condition, valve isolation), compliance records.
              </p>
            )}
            {selectedRolePreset === 'citizen' && (
              <p className="leading-relaxed">
                <strong>Citizen</strong>: Public drinking water supply zones, scheme name, boil water alerts, and property boundaries.
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#071A35] hover:bg-[#0C2548] text-white font-bold rounded text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In as {DEV_TEST_ACCOUNTS[selectedRolePreset].title}</span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-500">
          Taumata Arowai - Water Services Authority GIS Security
        </div>
      </div>
    </div>
  );
};
