import React, { useState } from 'react';
import { 
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
  KeyRound,
  RotateCcw,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthUser, UserRole } from '../types/gis';

export interface SignInPageProps {
  onLogin?: (user: AuthUser) => void;
  onContinueToMap?: () => void;
  onContinueAsGuest?: () => void;
  currentUser?: AuthUser | null;
}

export type AuthMode = 'login' | 'register';
export type SelectedRole = 'citizen' | 'admin';

export const SignInPage: React.FC<SignInPageProps> = ({
  onLogin = () => {},
  onContinueToMap = () => {},
  onContinueAsGuest = () => {},
  currentUser = null,
}) => {
  // Exactly two account types (Citizen vs Admin) & two authentication options (Login vs Register)
  const [selectedRole, setSelectedRole] = useState<SelectedRole>('citizen');
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Register form state
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
  const [mockNotice, setMockNotice] = useState<{
    title: string;
    description: string;
    details: { label: string; value: string }[];
  } | null>(null);

  // Validation helper
  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  const handleRoleChange = (role: SelectedRole) => {
    setSelectedRole(role);
    setFieldErrors({});
    setMockNotice(null);
  };

  const handleModeChange = (mode: AuthMode) => {
    setAuthMode(mode);
    setFieldErrors({});
    setMockNotice(null);
  };

  // Quick autofill demo credentials helper
  const handleAutofillDemo = () => {
    setFieldErrors({});
    setMockNotice(null);
    if (authMode === 'login') {
      if (selectedRole === 'citizen') {
        setLoginEmail('resident@kelston.nzwater.org.nz');
        setLoginPassword('WaterPass#2026');
      } else {
        setLoginEmail('admin@taumataarowai.govt.nz');
        setLoginPassword('ArowaiAdmin#2026');
      }
    } else {
      if (selectedRole === 'citizen') {
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
      errors.loginEmail = selectedRole === 'admin' ? 'Official email address is required.' : 'Email address is required.';
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

    setTimeout(() => {
      setIsSubmitting(false);
      const userRole: UserRole = selectedRole === 'admin' ? 'admin' : 'citizen';
      const mockUser: AuthUser = {
        id: selectedRole === 'admin' ? 'usr-admin-demo' : 'usr-resident-demo',
        name: selectedRole === 'admin' ? 'Sarah MacLeod' : (loginEmail.split('@')[0] || 'Resident User'),
        email: loginEmail.trim(),
        role: userRole,
        title: selectedRole === 'admin' ? 'Water Infrastructure Administrator' : 'Verified Resident',
        organization: selectedRole === 'admin' ? 'Taumata Arowai National GIS' : 'Auckland Reticulation Network',
        lastLogin: new Date().toISOString(),
      };

      setMockNotice({
        title: selectedRole === 'admin' ? 'Administrator Signed In' : 'Resident Signed In',
        description: selectedRole === 'admin'
          ? `Authenticated as ${loginEmail.trim()} with administrative network privileges.`
          : `Signed in as resident ${loginEmail.trim()}. Accessing verified parcel connectivity.`,
        details: [
          { label: 'Role', value: selectedRole === 'admin' ? 'Administrator' : 'Resident User' },
          { label: 'Account', value: loginEmail.trim() },
          { label: 'Device Session', value: rememberMe ? '30 Days Saved' : 'Single Session' }
        ]
      });

      onLogin(mockUser);
    }, 450);
  };

  // Handle Register submission
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!registerName.trim()) {
      errors.registerName = 'Full name is required.';
    }

    if (!registerEmail.trim()) {
      errors.registerEmail = selectedRole === 'admin' ? 'Official authority email is required.' : 'Email address is required.';
    } else if (!validateEmail(registerEmail)) {
      errors.registerEmail = 'Please enter a valid email address.';
    }

    if (selectedRole === 'citizen' && !houseAddress.trim()) {
      errors.houseAddress = 'Street address is required to locate connected pipeline.';
    }

    if (!registerPassword) {
      errors.registerPassword = 'Password is required.';
    } else if (registerPassword.length < 6) {
      errors.registerPassword = 'Password must be at least 6 characters.';
    }

    if (registerPassword !== registerConfirmPassword) {
      errors.registerConfirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const userRole: UserRole = selectedRole === 'admin' ? 'admin' : 'citizen';
      const mockUser: AuthUser = {
        id: `usr-${Date.now()}`,
        name: registerName.trim(),
        email: registerEmail.trim(),
        role: userRole,
        title: selectedRole === 'admin' ? 'Water Infrastructure Administrator (Pending Authorization)' : 'Registered Citizen',
        organization: selectedRole === 'admin' ? 'Taumata Arowai GIS Network' : 'Municipal Water Services Network',
        lastLogin: new Date().toISOString(),
      };

      setMockNotice({
        title: selectedRole === 'admin' ? 'Administrator Registration Received' : 'Citizen Property Account Created',
        description: selectedRole === 'admin'
          ? `Administrator registration request registered for ${registerEmail}. This is a frontend prototype; official staff privileges will require backend administrative approval.`
          : `Household connectivity profile created for ${registerName} at ${houseAddress}.`,
        details: [
          { label: 'Account Type', value: selectedRole === 'admin' ? 'Admin' : 'Citizen' },
          { label: 'Full Name', value: registerName.trim() },
          { label: 'Email', value: registerEmail.trim() },
          ...(selectedRole === 'citizen' && houseAddress ? [{ label: 'House Address', value: houseAddress }] : []),
          ...(selectedRole === 'citizen' && propertyId ? [{ label: 'Property / Meter ID', value: propertyId }] : [])
        ]
      });

      onLogin(mockUser);
    }, 450);
  };

  return (
    <div className="min-h-screen w-full bg-[#F2F5F9] font-sans antialiased text-[#0B2342] selection:bg-[#009E91] selection:text-white py-6 sm:py-10 px-4 sm:px-6 flex items-center justify-center">
      
      {/* Centred Application Surface with Refined Proportions */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col lg:flex-row min-h-[640px] xl:min-h-[680px]">
        
        {/* ========================================================= */}
        {/* LEFT PANEL: AUTHENTICATION (Approx 48% Desktop Width)     */}
        {/* ========================================================= */}
        <div className="w-full lg:w-[48%] flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14 bg-white relative">
          
          <div className="max-w-[460px] mx-auto w-full">
            {/* Top Brand Header */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-100">
              {/* Compact Navy Brand Lockup */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0B2342] flex items-center justify-center text-[#00D4C7] shadow-xs">
                  <Droplet className="w-5 h-5 fill-[#00D4C7] text-[#00D4C7]" />
                </div>
                <div>
                  <span className="text-sm font-bold tracking-tight text-[#0B2342] block leading-none">
                    AquaConnect GIS
                  </span>
                  <span className="text-xs text-slate-500 font-medium block mt-1">
                    Water Pipeline Connectivity Portal
                  </span>
                </div>
              </div>

              {/* Autofill Demo Credentials Helper */}
              <button
                type="button"
                onClick={handleAutofillDemo}
                className="text-[11px] font-semibold text-[#009E91] hover:text-[#007D73] bg-[#F2F5F9] hover:bg-slate-200/80 px-2.5 py-1 rounded-md border border-slate-200 transition-colors cursor-pointer"
                title="Populate test credentials"
              >
                Autofill {selectedRole === 'admin' ? 'Admin' : 'Citizen'}
              </button>
            </div>

            {/* Contextual Heading & Supporting Description */}
            <div className="mt-7 mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2342] tracking-tight">
                {authMode === 'login'
                  ? selectedRole === 'admin'
                    ? 'Welcome Back, Admin'
                    : 'Welcome Back, Citizen'
                  : selectedRole === 'admin'
                    ? 'Create Admin Account'
                    : 'Create Citizen Account'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                {selectedRole === 'citizen'
                  ? authMode === 'login'
                    ? "Sign in to trace your property's water supply pipeline, pressure zones, and service lineage."
                    : "Register to access your household's water connection information."
                  : authMode === 'login'
                    ? "Sign in with your administrative credentials to manage municipal pipeline assets, compliance records, and zone lineage."
                    : "Register an administrative profile for municipal water network oversight and compliance reporting."}
              </p>
            </div>

            {/* Account Role Selector: Exactly Two Roles (Citizen vs Admin) */}
            <div className="mb-5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Account Role
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#F2F5F9] rounded-xl border border-slate-200/90">
                <button
                  type="button"
                  onClick={() => handleRoleChange('citizen')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedRole === 'citizen'
                      ? 'bg-[#0B2342] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                  aria-pressed={selectedRole === 'citizen'}
                >
                  <Home className={`w-3.5 h-3.5 ${selectedRole === 'citizen' ? 'text-[#00D4C7]' : 'text-slate-500'}`} />
                  <span>Citizen</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('admin')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedRole === 'admin'
                      ? 'bg-[#0B2342] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                  aria-pressed={selectedRole === 'admin'}
                >
                  <Shield className={`w-3.5 h-3.5 ${selectedRole === 'admin' ? 'text-[#00D4C7]' : 'text-slate-500'}`} />
                  <span>Admin</span>
                </button>
              </div>
            </div>

            {/* Authentication Mode Tabs: Exactly Two Tabs (Login vs Register) */}
            <div className="relative flex border-b border-slate-200 mb-6">
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className={`relative flex-1 pb-2.5 text-xs font-bold uppercase tracking-wider text-center transition-colors cursor-pointer ${
                  authMode === 'login'
                    ? 'text-[#009E91]'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Login
                {authMode === 'login' && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#009E91]"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('register')}
                className={`relative flex-1 pb-2.5 text-xs font-bold uppercase tracking-wider text-center transition-colors cursor-pointer ${
                  authMode === 'register'
                    ? 'text-[#009E91]'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Register
                {authMode === 'register' && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#009E91]"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </button>
            </div>

            {/* Simulated Submission Notice */}
            <AnimatePresence>
              {mockNotice && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 mb-6 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs space-y-2 overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-teal-950">
                      <CheckCircle2 className="w-4 h-4 text-[#009E91]" />
                      <span>{mockNotice.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMockNotice(null)}
                      className="text-teal-700 hover:text-teal-900 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-teal-800 leading-relaxed text-[11.5px]">{mockNotice.description}</p>
                  <div className="pt-2 border-t border-teal-200/60 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                    {mockNotice.details.map((detail, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="text-teal-700 font-semibold">{detail.label}:</span>
                        <span className="text-teal-950 font-medium truncate">{detail.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-1.5">
                    <button
                      type="button"
                      onClick={onContinueToMap}
                      className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#009E91] hover:text-[#007D73] hover:underline cursor-pointer"
                    >
                      <span>Continue to Interactive GIS Map</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Forms with Framer Motion Transition */}
            <AnimatePresence mode="wait">
              {authMode === 'login' ? (
                /* ========================================================= */
                /* LOGIN FORM                                                */
                /* ========================================================= */
                <motion.form
                  key="login-form"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.18 }}
                  onSubmit={handleLoginSubmit}
                  className="space-y-4"
                  noValidate
                >
                  {/* Email Input */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0B2342] mb-1.5">
                      {selectedRole === 'admin' ? 'Official Email Address' : 'Email Address'}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => {
                          setLoginEmail(e.target.value);
                          if (fieldErrors.loginEmail) {
                            setFieldErrors(prev => ({ ...prev, loginEmail: '' }));
                          }
                        }}
                        placeholder={selectedRole === 'admin' ? 'admin@taumataarowai.govt.nz' : 'resident@kelston.nzwater.org.nz'}
                        className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-xs text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-[#009E91]/30 ${
                          fieldErrors.loginEmail
                            ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                            : 'border-slate-300 focus:border-[#009E91] bg-white'
                        }`}
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
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
                    <label className="block text-xs font-semibold text-[#0B2342] mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          if (fieldErrors.loginPassword) {
                            setFieldErrors(prev => ({ ...prev, loginPassword: '' }));
                          }
                        }}
                        placeholder="Enter your password"
                        className={`w-full pl-9 pr-10 py-2.5 rounded-lg border text-xs text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-[#009E91]/30 font-mono ${
                          fieldErrors.loginPassword
                            ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                            : 'border-slate-300 focus:border-[#009E91] bg-white'
                        }`}
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-2.5 rounded cursor-pointer"
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

                  {/* Remember Device & Forgot Password */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="rememberDevice"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-[#009E91] focus:ring-[#009E91] h-3.5 w-3.5 cursor-pointer"
                      />
                      <label htmlFor="rememberDevice" className="text-slate-600 cursor-pointer select-none">
                        Remember this device for 30 days
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(!isForgotPasswordOpen)}
                      className="text-[#009E91] hover:text-[#007D73] font-medium hover:underline text-xs cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Forgot Password Feedback */}
                  {isForgotPasswordOpen && (
                    <div className="p-3 rounded-lg bg-[#F2F5F9] border border-slate-300 text-slate-700 text-xs flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-[#009E91] shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-semibold text-[#0B2342] block">Password Reset Notice</span>
                        <span className="text-[11px] text-slate-600 leading-tight block">
                          In production, an automated password reset link will be sent to your registered email address. For testing this frontend interface, use the autofill test credentials button above.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Primary Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#009E91] hover:bg-[#00877C] active:bg-[#007369] text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-1"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>{selectedRole === 'admin' ? 'Sign In as Admin' : 'Sign In as Citizen'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Subtle Divider "OR" */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                      <span className="bg-white px-2.5">OR</span>
                    </div>
                  </div>

                  {/* Continue as Guest Button */}
                  <button
                    type="button"
                    onClick={onContinueAsGuest}
                    className="w-full py-2.5 px-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#0B2342] font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-[#009E91]" />
                    <span>Continue as Guest</span>
                  </button>

                  {/* Switch to Register link */}
                  <div className="text-center pt-2 text-xs text-slate-500">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => handleModeChange('register')}
                      className="font-semibold text-[#009E91] hover:text-[#007D73] hover:underline cursor-pointer"
                    >
                      Register here
                    </button>
                  </div>
                </motion.form>
              ) : (
                /* ========================================================= */
                /* REGISTRATION FORM                                         */
                /* ========================================================= */
                <motion.form
                  key="register-form"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                  onSubmit={handleRegisterSubmit}
                  className="space-y-3"
                  noValidate
                >
                  {/* Admin Prototype Notice */}
                  {selectedRole === 'admin' && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                      <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Admin Prototype Notice:</strong> Admin registration is a frontend prototype. Administrator privileges will require independent verification upon backend integration.
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
                        className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#009E91]/30 ${
                          fieldErrors.registerName
                            ? 'border-rose-400 bg-rose-50/20'
                            : 'border-slate-300 focus:border-[#009E91] bg-white'
                        }`}
                      />
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                    {fieldErrors.registerName && (
                      <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors.registerName}</p>
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
                        className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#009E91]/30 ${
                          fieldErrors.registerEmail
                            ? 'border-rose-400 bg-rose-50/20'
                            : 'border-slate-300 focus:border-[#009E91] bg-white'
                        }`}
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                    {fieldErrors.registerEmail && (
                      <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors.registerEmail}</p>
                    )}
                  </div>

                  {/* Citizen-Specific Fields: House Address & Property ID */}
                  {selectedRole === 'citizen' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                            className={`w-full pl-8 pr-2 py-2 rounded-lg border text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#009E91]/30 ${
                              fieldErrors.houseAddress
                                ? 'border-rose-400 bg-rose-50/20'
                                : 'border-slate-300 focus:border-[#009E91] bg-white'
                            }`}
                          />
                          <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        </div>
                        {fieldErrors.houseAddress && (
                          <p className="text-[10.5px] text-rose-600 mt-0.5">{fieldErrors.houseAddress}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0B2342] mb-1">
                          House / Property ID (Optional)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={propertyId}
                            onChange={(e) => setPropertyId(e.target.value)}
                            placeholder="e.g. Lot 14 DP 48291"
                            className="w-full pl-8 pr-2 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#009E91]/30 focus:border-[#009E91] bg-white"
                          />
                          <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Password & Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          className={`w-full pl-8 pr-8 py-2 rounded-lg border text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#009E91]/30 font-mono ${
                            fieldErrors.registerPassword
                              ? 'border-rose-400 bg-rose-50/20'
                              : 'border-slate-300 focus:border-[#009E91] bg-white'
                          }`}
                        />
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          className="p-1 text-slate-400 hover:text-slate-600 absolute right-1.5 top-2 cursor-pointer"
                        >
                          {showRegisterPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {fieldErrors.registerPassword && (
                        <p className="text-[10.5px] text-rose-600 mt-0.5">{fieldErrors.registerPassword}</p>
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
                          className={`w-full pl-8 pr-8 py-2 rounded-lg border text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#009E91]/30 font-mono ${
                            fieldErrors.registerConfirmPassword
                              ? 'border-rose-400 bg-rose-50/20'
                              : 'border-slate-300 focus:border-[#009E91] bg-white'
                          }`}
                        />
                        <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <button
                          type="button"
                          onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                          className="p-1 text-slate-400 hover:text-slate-600 absolute right-1.5 top-2 cursor-pointer"
                        >
                          {showRegisterConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {fieldErrors.registerConfirmPassword && (
                        <p className="text-[10.5px] text-rose-600 mt-0.5">{fieldErrors.registerConfirmPassword}</p>
                      )}
                    </div>
                  </div>

                  {/* Primary Register Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 mt-2 rounded-lg bg-[#009E91] hover:bg-[#00877C] active:bg-[#007369] text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <>
                        <span>{selectedRole === 'admin' ? 'Create Admin Account' : 'Create Citizen Account'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Subtle Divider "OR" */}
                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                      <span className="bg-white px-2.5">OR</span>
                    </div>
                  </div>

                  {/* Continue as Guest Button (Also accessible from Register view) */}
                  <button
                    type="button"
                    onClick={onContinueAsGuest}
                    className="w-full py-2.5 px-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#0B2342] font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-[#009E91]" />
                    <span>Continue as Guest</span>
                  </button>

                  {/* Switch to Login link */}
                  <div className="text-center pt-1.5 text-xs text-slate-500">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => handleModeChange('login')}
                      className="font-semibold text-[#009E91] hover:text-[#007D73] hover:underline cursor-pointer"
                    >
                      Sign in here
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Restrained Footer */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 max-w-[460px] mx-auto w-full">
            <span>AquaConnect GIS • Municipal Water Services Portal</span>
            <span className="font-mono text-[10px]">Public Reticulation System</span>
          </div>

        </div>

        {/* ========================================================= */}
        {/* RIGHT PANEL: FULL-HEIGHT ABSTRACT ARTWORK (~52% Desktop)  */}
        {/* ========================================================= */}
        <div className="hidden lg:block lg:w-[52%] relative min-h-[640px] xl:min-h-[680px] overflow-hidden bg-[#0e0320]">
          <img
            src="/images/abstract-fluid-artwork.png"
            alt="AquaConnect GIS Abstract Fluid Artwork with icy blue ribbons, deep purple shadows, and coral accents"
            className="w-full h-full object-cover object-center absolute inset-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/abstract-fluid-artwork.svg';
            }}
          />
        </div>

      </div>

    </div>
  );
};

export const SignInPageDemo = SignInPage;
export default SignInPage;
