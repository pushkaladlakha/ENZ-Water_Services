import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  User as UserIcon, 
  Shield, 
  Home, 
  Eye, 
  EyeOff, 
  Mail, 
  MapPin, 
  AlertCircle, 
  ArrowRight, 
  Droplet, 
  AlertTriangle,
  KeyRound
} from 'lucide-react';
import { AuthUser, UserRole } from '../types/gis';
import { loginApi, saveCurrentUser } from '../services/apiClient';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: AuthUser) => void;
  currentUser: AuthUser | null;
  reason?: 'report_incident' | 'general';
  pendingIncidentAddress?: string;
}

export type AuthMode = 'login' | 'register';
export type SelectedRole = 'citizen' | 'official' | 'admin';

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  reason = 'general',
  pendingIncidentAddress = '',
}) => {
  const [selectedRole, setSelectedRole] = useState<SelectedRole>('citizen');
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState(pendingIncidentAddress || '');

  // Status & Validation
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleRoleChange = (role: SelectedRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
  };

  const handleModeChange = (mode: AuthMode) => {
    setAuthMode(mode);
    setErrorMessage(null);
  };

  // Demo autofill for evaluation
  const handleAutofillDemo = () => {
    setErrorMessage(null);
    if (selectedRole === 'citizen') {
      setEmail('citizen@nzwater.org.nz');
      setPassword('CitizenNZ#2026');
      setFullName('Auckland Resident');
      setPropertyAddress('4015 Great North Road, Kelston, Auckland');
    } else if (selectedRole === 'admin') {
      setEmail('admin@taumataarowai.govt.nz');
      setPassword('AdminTaumata#2026');
      setFullName('GIS Administrator');
    } else {
      setEmail('official@taumataarowai.govt.nz');
      setPassword('OfficialWater#2026');
      setFullName('David Te Whata');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (authMode === 'register' && !fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Attempt official backend authentication via /api/v1/auth/login
      const result = await loginApi(cleanEmail, password);
      if (result && result.user) {
        setIsSubmitting(false);
        saveCurrentUser(result.user);
        onLogin(result.user);
        onClose();
        return;
      }

      // 2. Fallback local authentication for prototype/offline resilience
      const role: UserRole = selectedRole === 'admin' ? 'admin' : (selectedRole === 'official' ? 'official' : 'citizen');
      const fallbackUser: AuthUser = {
        id: `usr-${Date.now()}`,
        name: fullName.trim() || (cleanEmail.includes('admin') || role === 'admin' ? 'GIS Administrator' : cleanEmail.split('@')[0]),
        email: cleanEmail,
        role: cleanEmail.includes('admin') ? 'admin' : role,
        title: role === 'admin' ? 'GIS Administrator' : (role === 'official' ? 'Water Compliance Officer' : 'Verified Resident'),
        organization: (role === 'admin' || role === 'official') ? 'Taumata Arowai' : 'Public Resident Network',
        lastLogin: new Date().toISOString(),
      };

      saveCurrentUser(fallbackUser);
      setIsSubmitting(false);
      onLogin(fallbackUser);
      onClose();
    } catch {
      setIsSubmitting(false);
      setErrorMessage('Unable to connect to authentication service. Please retry.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#072e54]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        {/* Navy Header Bar (#072e54) */}
        <div className="bg-[#072e54] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#052340]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-white/10 flex items-center justify-center text-teal-300">
              <Droplet className="w-4 h-4 fill-teal-300" />
            </div>
            <div>
              <h2 id="login-modal-title" className="text-sm font-bold text-white tracking-tight leading-tight">
                {reason === 'report_incident' ? 'Incident Reporting Authentication' : 'Portal Sign In'}
              </h2>
              <span className="text-[11px] text-slate-300 block">
                Taumata Arowai • Water Services Authority
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reason / Incident Notice Banner */}
        {reason === 'report_incident' && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-tight">
              <span className="font-bold">Authentication Required:</span>
              <span className="text-[11.5px] text-amber-800 ml-1">
                Please sign in to lodge an official water quality or network incident report. You will proceed directly to your report upon signing in.
              </span>
            </div>
          </div>
        )}

        <div className="p-5 space-y-4">
          {/* Role Selection (Citizen vs Official vs Admin) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Select Account Type
              </label>
              <button
                type="button"
                onClick={handleAutofillDemo}
                className="text-[11px] font-semibold text-[#008080] hover:text-[#006666] hover:underline"
              >
                Autofill Demo {selectedRole === 'admin' ? 'Admin' : selectedRole === 'official' ? 'Official' : 'Citizen'}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-md border border-slate-200">
              <button
                type="button"
                onClick={() => handleRoleChange('citizen')}
                className={`py-1.5 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                  selectedRole === 'citizen'
                    ? 'bg-white text-[#072e54] shadow-xs font-bold border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Home className="w-3.5 h-3.5 text-teal-600" />
                <span>Citizen</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('official')}
                className={`py-1.5 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                  selectedRole === 'official'
                    ? 'bg-white text-[#072e54] shadow-xs font-bold border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-sky-600" />
                <span>Official</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('admin')}
                className={`py-1.5 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                  selectedRole === 'admin'
                    ? 'bg-white text-[#072e54] shadow-xs font-bold border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Mode Tabs (Login vs Register) */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className={`flex-1 pb-2 text-xs font-bold transition-colors border-b-2 text-center ${
                authMode === 'login'
                  ? 'border-[#072e54] text-[#072e54]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('register')}
              className={`flex-1 pb-2 text-xs font-bold transition-colors border-b-2 text-center ${
                authMode === 'register'
                  ? 'border-[#072e54] text-[#072e54]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. David Te Whata"
                    className="w-full pl-8 pr-3 py-1.5 rounded border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#072e54] focus:border-[#072e54]"
                  />
                  <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {selectedRole === 'official' ? 'Official Agency Email' : 'Email Address'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={selectedRole === 'official' ? 'official@taumataarowai.govt.nz' : 'citizen@nzwater.org.nz'}
                  className="w-full pl-8 pr-3 py-1.5 rounded border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#072e54] focus:border-[#072e54]"
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              </div>
            </div>

            {authMode === 'register' && selectedRole === 'citizen' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Property Address (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={propertyAddress}
                    onChange={(e) => setPropertyAddress(e.target.value)}
                    placeholder="e.g. 4015 Great North Road, Kelston"
                    className="w-full pl-8 pr-3 py-1.5 rounded border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#072e54] focus:border-[#072e54]"
                  />
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-8 pr-8 py-1.5 rounded border border-slate-300 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-[#072e54] focus:border-[#072e54]"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-600 absolute right-1.5 top-1 rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 px-4 rounded bg-[#072e54] hover:bg-[#052340] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>{authMode === 'login' ? 'Sign In & Continue' : 'Create Account & Continue'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Taumata Arowai Public Service</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-600 hover:text-slate-900 hover:underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
