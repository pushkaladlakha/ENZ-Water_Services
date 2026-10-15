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
  Hash, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Droplet, 
  HelpCircle,
  KeyRound
} from 'lucide-react';
import { AuthUser, UserRole } from '../types/gis';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: AuthUser) => void;
  currentUser: AuthUser | null;
}

export type AuthMode = 'login' | 'register';
export type SelectedRole = 'user' | 'admin';

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  currentUser,
}) => {
  // Exactly two account types & two authentication options
  const [selectedRole, setSelectedRole] = useState<SelectedRole>('user');
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Register form state (User)
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [houseAddress, setHouseAddress] = useState('');
  const [propertyId, setPropertyId] = useState('');

  // UI state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [mockSuccessMessage, setMockSuccessMessage] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<AuthUser | null>(null);

  if (!isOpen) return null;

  // Validation helper
  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  const handleRoleChange = (role: SelectedRole) => {
    setSelectedRole(role);
    setFieldErrors({});
    setMockSuccessMessage(null);
    setCreatedUser(null);
  };

  const handleModeChange = (mode: AuthMode) => {
    setAuthMode(mode);
    setFieldErrors({});
    setMockSuccessMessage(null);
    setCreatedUser(null);
  };

  // Quick autofill demo credentials
  const handleAutofillDemo = () => {
    setFieldErrors({});
    if (authMode === 'login') {
      if (selectedRole === 'user') {
        setLoginEmail('resident@kelston.nzwater.org.nz');
        setLoginPassword('WaterPass#2026');
      } else {
        setLoginEmail('admin@taumataarowai.govt.nz');
        setLoginPassword('ArowaiAdmin#2026');
      }
    } else {
      if (selectedRole === 'user') {
        setRegisterName('Auckland Homeowner');
        setRegisterEmail('resident@kelston.nzwater.org.nz');
        setRegisterPassword('WaterPass#2026');
        setRegisterConfirmPassword('WaterPass#2026');
        setHouseAddress('4015 Great North Road, Kelston, Auckland');
        setPropertyId('LOT 14 DP 48291');
      } else {
        setRegisterName('Sarah MacLeod');
        setRegisterEmail('admin@taumataarowai.govt.nz');
        setRegisterPassword('ArowaiAdmin#2026');
        setRegisterConfirmPassword('ArowaiAdmin#2026');
      }
    }
  };

  // Handle Login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!loginEmail.trim()) {
      errors.loginEmail = 'Email address is required.';
    } else if (!validateEmail(loginEmail)) {
      errors.loginEmail = 'Please enter a valid email address.';
    }

    if (!loginPassword) {
      errors.loginPassword = 'Password is required.';
    } else if (loginPassword.length < 6) {
      errors.loginPassword = 'Password must be at least 6 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    // Mock frontend authentication delay
    setTimeout(() => {
      setIsSubmitting(false);
      const userRole: UserRole = selectedRole === 'admin' ? 'admin' : 'user';
      const mockUser: AuthUser = {
        id: selectedRole === 'admin' ? 'usr-admin-demo' : 'usr-resident-demo',
        name: selectedRole === 'admin' ? 'Sarah MacLeod' : loginEmail.split('@')[0],
        email: loginEmail.trim(),
        role: userRole,
        title: selectedRole === 'admin' ? 'Water Infrastructure Administrator' : 'Verified Resident',
        organization: selectedRole === 'admin' ? 'Taumata Arowai GIS Operations' : 'Watercare Household Network',
        lastLogin: new Date().toISOString(),
      };

      setCreatedUser(mockUser);
      setMockSuccessMessage(
        selectedRole === 'admin'
          ? `Welcome back, Administrator. Mock authentication successful for ${loginEmail}.`
          : `Welcome back! Connected resident account verified for ${loginEmail}.`
      );
    }, 500);
  };

  // Handle Register submission
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!registerName.trim()) {
      errors.registerName = 'Full name is required.';
    }

    if (!registerEmail.trim()) {
      errors.registerEmail = selectedRole === 'admin' ? 'Official email address is required.' : 'Email address is required.';
    } else if (!validateEmail(registerEmail)) {
      errors.registerEmail = 'Please enter a valid email address.';
    }

    if (!registerPassword) {
      errors.registerPassword = 'Password is required.';
    } else if (registerPassword.length < 6) {
      errors.registerPassword = 'Password must be at least 6 characters.';
    }

    if (!registerConfirmPassword) {
      errors.registerConfirmPassword = 'Confirming your password is required.';
    } else if (registerPassword !== registerConfirmPassword) {
      errors.registerConfirmPassword = 'Passwords do not match.';
    }

    if (selectedRole === 'user') {
      if (!houseAddress.trim()) {
        errors.houseAddress = 'House address is required to identify connected supply lines.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    // Mock frontend registration delay
    setTimeout(() => {
      setIsSubmitting(false);
      const userRole: UserRole = selectedRole === 'admin' ? 'admin' : 'user';
      const mockUser: AuthUser = {
        id: `usr-${Date.now()}`,
        name: registerName.trim(),
        email: registerEmail.trim(),
        role: userRole,
        title: selectedRole === 'admin' ? 'Water Infrastructure Administrator (Pending Server Review)' : 'Registered Resident',
        organization: selectedRole === 'admin' ? 'Taumata Arowai' : 'Municipal Resident Network',
        lastLogin: new Date().toISOString(),
      };

      setCreatedUser(mockUser);
      setMockSuccessMessage(
        selectedRole === 'admin'
          ? `Administrator registration request registered for ${registerEmail}. Once the backend is integrated, official staff privileges will be verified.`
          : `Household connectivity profile created for ${registerName} at ${houseAddress}.`
      );
    }, 600);
  };

  const handleFinishAndEnterApp = () => {
    if (createdUser) {
      onLogin(createdUser);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B2342]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      
      {/* Modal Container: Split Screen on desktop (40% Left Navy / 60% Right White) */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl overflow-hidden flex flex-col lg:flex-row my-auto max-h-[95vh]">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-30 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors shadow-xs"
          aria-label="Close portal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ========================================================= */}
        {/* LEFT PANEL: Water-Network Identity & Pipeline Schematic   */}
        {/* ========================================================= */}
        <div className="lg:w-[40%] bg-gradient-to-b from-[#0B2342] via-[#091D37] to-[#07172D] text-white p-6 sm:p-7 flex flex-col justify-between relative overflow-y-auto border-r border-[#091D37]">
          
          {/* Top Brand Identity */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md border border-[#009E91]/50 bg-[#07172D] text-[#00D4C7] shadow-inner flex items-center justify-center">
                <Droplet className="w-4 h-4 fill-[#00D4C7] text-[#00D4C7]" />
              </div>
              <div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-white block leading-none">
                  AQUACONNECT GIS
                </span>
                <span className="text-[10px] text-slate-300 font-medium block mt-0.5">
                  Water Pipeline Connectivity Portal
                </span>
              </div>
            </div>

            {/* Small outlined teal label */}
            <div className="pt-1">
              <span className="inline-block border border-[#009E91] text-[#00D4C7] text-[9.5px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded">
                WATER PIPELINE CONNECTIVITY PORTAL
              </span>
            </div>

            {/* Main Headline */}
            <div className="pt-0.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
                Know Your Water Connection.
              </h1>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Identify the municipal pipeline, supply zone, and treatment plant connected to your house.
              </p>
            </div>
          </div>

          {/* Abstract Fluid Artwork Card */}
          <div className="my-4 rounded-xl overflow-hidden border border-slate-700/60 shadow-inner relative h-48 bg-[#0e0320]">
            <img 
              src="/images/abstract-fluid-artwork.png" 
              alt="AquaConnect GIS Abstract Fluid Artwork"
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/abstract-fluid-artwork.svg';
              }}
            />
          </div>

          {/* Bottom Trust Indicators */}
          <div className="space-y-2 pt-3 border-t border-slate-700/60 text-[11px]">
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#009E91] shrink-0" />
              <span>Direct parcel-to-pipe GIS reticulation mapping</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#009E91] shrink-0" />
              <span>Real-time water pressure and supply zone grading</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT PANEL: Clean Authentication Interface (White/Navy)  */}
        {/* ========================================================= */}
        <div className="lg:w-[60%] p-6 sm:p-8 flex flex-col justify-between bg-white text-[#0B2342] overflow-y-auto">
          <div>
            
            {/* Top Bar with Logo & Autofill Demo Action */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#0B2342] flex items-center justify-center text-[#00D4C7] shadow-xs">
                  <Droplet className="w-3.5 h-3.5 fill-[#00D4C7] text-[#00D4C7]" />
                </div>
                <span className="font-bold text-xs sm:text-sm text-[#0B2342]">
                  AquaConnect Authentication
                </span>
              </div>

              {/* Development Autofill control */}
              <button
                type="button"
                onClick={handleAutofillDemo}
                className="text-[10.5px] font-semibold text-[#009E91] hover:text-[#007D73] bg-[#F0F4F8] hover:bg-slate-200/80 px-2.5 py-1 rounded border border-slate-200 transition-colors"
                title="Populate test credentials for demo purposes"
              >
                Autofill Test {selectedRole === 'admin' ? 'Admin' : 'User'}
              </button>
            </div>

            {/* Contextual Heading */}
            <div className="mt-4 mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0B2342] tracking-tight">
                {authMode === 'login' ? 'Welcome Back' : 'Create Your Account'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {selectedRole === 'user'
                  ? authMode === 'login'
                    ? "Sign in to trace your property's water supply pipeline, pressure zones, and service lineage."
                    : "Register your property to locate connected watermains, Toby meters, and supply zones."
                  : authMode === 'login'
                    ? "Sign in to access water-network records and manage pipeline information."
                    : "Register an administrator account to oversee water networks and household connections."}
              </p>
            </div>

            {/* Account-Role Selector (Strictly: User vs Admin) */}
            <div className="mb-4">
              <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                SELECT ACCOUNT ROLE
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#F0F4F8] rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleRoleChange('user')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    selectedRole === 'user'
                      ? 'bg-[#0B2342] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                  aria-pressed={selectedRole === 'user'}
                >
                  <Home className={`w-3.5 h-3.5 ${selectedRole === 'user' ? 'text-[#00D4C7]' : 'text-slate-400'}`} />
                  <span>User (Resident)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('admin')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    selectedRole === 'admin'
                      ? 'bg-[#0B2342] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                  aria-pressed={selectedRole === 'admin'}
                >
                  <Shield className={`w-3.5 h-3.5 ${selectedRole === 'admin' ? 'text-[#00D4C7]' : 'text-slate-400'}`} />
                  <span>Admin</span>
                </button>
              </div>
            </div>

            {/* Login and Register Tabs */}
            <div className="flex border-b border-slate-200 mb-4">
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className={`flex-1 py-2 text-center text-xs font-bold border-b-2 transition-colors ${
                  authMode === 'login'
                    ? 'border-[#009E91] text-[#009E91]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('register')}
                className={`flex-1 py-2 text-center text-xs font-bold border-b-2 transition-colors ${
                  authMode === 'register'
                    ? 'border-[#009E91] text-[#009E91]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Register
              </button>
            </div>

            {/* Mock Success View State */}
            {mockSuccessMessage && createdUser ? (
              <div className="py-3 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 space-y-2">
                  <div className="flex items-center gap-2 text-[#009E91] font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[#009E91] shrink-0" />
                    <span>Mock Authentication Successful</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {mockSuccessMessage}
                  </p>
                  <div className="p-2.5 rounded-lg bg-white border border-teal-200/60 text-[11px] text-slate-700 space-y-1">
                    <div><span className="font-semibold">Role:</span> {createdUser.role === 'admin' ? 'Admin' : 'Resident User'}</div>
                    <div><span className="font-semibold">Account:</span> {createdUser.name} ({createdUser.email})</div>
                    {houseAddress && selectedRole === 'user' && (
                      <div><span className="font-semibold">Household Address:</span> {houseAddress}</div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    Note: Frontend demonstration mode. No credentials have been stored in external databases.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleFinishAndEnterApp}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#009E91] hover:bg-[#00877C] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <span>Proceed to Pipeline GIS Map</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMockSuccessMessage(null);
                      setCreatedUser(null);
                    }}
                    className="py-2.5 px-4 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* ========================================================= */}
                {/* LOGIN FORM                                                */}
                {/* ========================================================= */}
                {authMode === 'login' && (
                  <form onSubmit={handleLoginSubmit} className="space-y-3.5" noValidate>
                    {/* Email Input */}
                    <div>
                      <label className="block text-xs font-semibold text-[#0B2342] mb-1">
                        {selectedRole === 'admin' ? 'Official Email Address' : 'Email Address'}
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder={selectedRole === 'admin' ? 'admin@taumataarowai.govt.nz' : 'resident@auckland.nz'}
                          className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-[#009E91]/30 ${
                            fieldErrors.loginEmail
                              ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                              : 'border-slate-300 focus:border-[#009E91] bg-white'
                          }`}
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                      {fieldErrors.loginEmail && (
                        <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.loginEmail}</span>
                        </p>
                      )}
                    </div>

                    {/* Password Input */}
                    <div>
                      <label className="block text-xs font-semibold text-[#0B2342] mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Enter your password"
                          className={`w-full pl-9 pr-9 py-2 rounded-lg border text-xs text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-[#009E91]/30 font-mono ${
                            fieldErrors.loginPassword
                              ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                              : 'border-slate-300 focus:border-[#009E91] bg-white'
                          }`}
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="p-1 text-slate-400 hover:text-slate-600 absolute right-2 top-2 rounded"
                          aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {fieldErrors.loginPassword && (
                        <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.loginPassword}</span>
                        </p>
                      )}
                    </div>

                    {/* Remember Me & Forgot Password Row */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="rememberMe"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-slate-300 text-[#009E91] focus:ring-[#009E91] h-3.5 w-3.5"
                        />
                        <label htmlFor="rememberMe" className="text-slate-600 cursor-pointer select-none">
                          Remember this device for 30 days
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsForgotPasswordOpen(!isForgotPasswordOpen)}
                        className="text-[#009E91] hover:text-[#007D73] font-medium hover:underline text-[11px]"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* Forgot Password Informational Box */}
                    {isForgotPasswordOpen && (
                      <div className="p-3 rounded-lg bg-[#F0F4F8] border border-slate-300 text-slate-700 text-xs flex items-start gap-2 animate-in fade-in duration-150">
                        <HelpCircle className="w-4 h-4 text-[#009E91] shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <span className="font-semibold text-[#0B2342] block">Password Reset Notice</span>
                          <span className="text-[11px] text-slate-600 leading-tight block">
                            In production, an automated password reset link will be sent to your verified email address. For this prototype, use the autofill test credentials.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Primary Login Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 rounded-lg bg-[#009E91] hover:bg-[#00877C] active:bg-[#007369] text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <span>{selectedRole === 'admin' ? 'Sign In as Admin' : 'Sign In as Resident'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Centered Switch to Register prompt */}
                    <div className="text-center pt-2 text-xs text-slate-500">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => handleModeChange('register')}
                        className="font-semibold text-[#009E91] hover:text-[#007D73] hover:underline"
                      >
                        Register here
                      </button>
                    </div>
                  </form>
                )}

                {/* ========================================================= */}
                {/* REGISTER FORM                                             */}
                {/* ========================================================= */}
                {authMode === 'register' && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-2.5" noValidate>
                    {/* Admin Prototype Notice */}
                    {selectedRole === 'admin' && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                        <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>Admin Prototype:</strong> Admin registration is a frontend prototype. Administrator privileges will require independent verification upon backend integration.
                        </span>
                      </div>
                    )}

                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-[#0B2342] mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={registerName}
                          onChange={(e) => setRegisterName(e.target.value)}
                          placeholder="e.g. Sarah MacLeod"
                          className={`w-full pl-9 pr-3 py-1.5 rounded-lg border text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#009E91]/30 ${
                            fieldErrors.registerName
                              ? 'border-rose-400 bg-rose-50/20'
                              : 'border-slate-300 focus:border-[#009E91] bg-white'
                          }`}
                        />
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
                      </div>
                      {fieldErrors.registerName && (
                        <p className="text-[10.5px] text-rose-600 mt-0.5">{fieldErrors.registerName}</p>
                      )}
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="block text-xs font-semibold text-[#0B2342] mb-1">
                        {selectedRole === 'admin' ? 'Official Email Address' : 'Email Address'}
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          placeholder={selectedRole === 'admin' ? 'name@taumataarowai.govt.nz' : 'name@nzwater.org.nz'}
                          className={`w-full pl-9 pr-3 py-1.5 rounded-lg border text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#009E91]/30 ${
                            fieldErrors.registerEmail
                              ? 'border-rose-400 bg-rose-50/20'
                              : 'border-slate-300 focus:border-[#009E91] bg-white'
                          }`}
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
                      </div>
                      {fieldErrors.registerEmail && (
                        <p className="text-[10.5px] text-rose-600 mt-0.5">{fieldErrors.registerEmail}</p>
                      )}
                    </div>

                    {/* Role Specific Fields for User: House Address & Property ID */}
                    {selectedRole === 'user' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-[#0B2342] mb-1">
                            House Address
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={houseAddress}
                              onChange={(e) => setHouseAddress(e.target.value)}
                              placeholder="e.g. 4015 Great North Rd"
                              className={`w-full pl-8 pr-2 py-1.5 rounded-lg border text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#009E91]/30 ${
                                fieldErrors.houseAddress
                                  ? 'border-rose-400 bg-rose-50/20'
                                  : 'border-slate-300 focus:border-[#009E91] bg-white'
                              }`}
                            />
                            <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                          </div>
                          {fieldErrors.houseAddress && (
                            <p className="text-[10px] text-rose-600 mt-0.5">{fieldErrors.houseAddress}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#0B2342] mb-1">
                            House Number or Consumer/Property ID (Optional)
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={propertyId}
                              onChange={(e) => setPropertyId(e.target.value)}
                              placeholder="e.g. Lot 14 DP 48291"
                              className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#009E91]/30 focus:border-[#009E91] bg-white"
                            />
                            <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Password & Confirm Password */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-[#0B2342] mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showRegisterPassword ? 'text' : 'password'}
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            className={`w-full pl-8 pr-8 py-1.5 rounded-lg border text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#009E91]/30 font-mono ${
                              fieldErrors.registerPassword
                                ? 'border-rose-400 bg-rose-50/20'
                                : 'border-slate-300 focus:border-[#009E91] bg-white'
                            }`}
                          />
                          <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                          <button
                            type="button"
                            onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                            className="p-1 text-slate-400 hover:text-slate-600 absolute right-1.5 top-1.5"
                          >
                            {showRegisterPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {fieldErrors.registerPassword && (
                          <p className="text-[10px] text-rose-600 mt-0.5">{fieldErrors.registerPassword}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0B2342] mb-1">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            type={showRegisterConfirmPassword ? 'text' : 'password'}
                            value={registerConfirmPassword}
                            onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                            className={`w-full pl-8 pr-8 py-1.5 rounded-lg border text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#009E91]/30 font-mono ${
                              fieldErrors.registerConfirmPassword
                                ? 'border-rose-400 bg-rose-50/20'
                                : 'border-slate-300 focus:border-[#009E91] bg-white'
                            }`}
                          />
                          <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                          <button
                            type="button"
                            onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                            className="p-1 text-slate-400 hover:text-slate-600 absolute right-1.5 top-1.5"
                          >
                            {showRegisterConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {fieldErrors.registerConfirmPassword && (
                          <p className="text-[10px] text-rose-600 mt-0.5">{fieldErrors.registerConfirmPassword}</p>
                        )}
                      </div>
                    </div>

                    {/* Primary Register Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 mt-1.5 rounded-lg bg-[#009E91] hover:bg-[#00877C] active:bg-[#007369] text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <span>{selectedRole === 'admin' ? 'Create Admin Account' : 'Create User Account'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Centered Switch to Login prompt */}
                    <div className="text-center pt-1.5 text-xs text-slate-500">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => handleModeChange('login')}
                        className="font-semibold text-[#009E91] hover:text-[#007D73] hover:underline"
                      >
                        Sign in here
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>

          {/* Footer note */}
          <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-400">
            <span>AquaConnect GIS • Public Water Infrastructure</span>
            <span className="font-mono text-[9.5px]">v1.0.0 Frontend Interface</span>
          </div>

        </div>

      </div>
    </div>
  );
};
