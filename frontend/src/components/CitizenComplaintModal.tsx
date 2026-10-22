import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertTriangle, 
  Droplet, 
  MapPin, 
  ShieldAlert, 
  CheckCircle2, 
  FileText, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Send, 
  Info,
  ChevronRight,
  ListFilter,
  Check,
  FileSpreadsheet,
  Download,
  Lock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { AuthUser, WaterIncidentComplaint, IncidentCategory, IncidentSeverity } from '../types/gis';
import { TaumataArowaiLogo } from './TaumataArowaiLogo';
import { AUCKLAND_ZONE_SCHEMES } from '../utils/waterLineageEngine';
import { submitIncidentApi } from '../services/apiClient';
import { isAuthorityUser, exportIncidentData, resolveIncidentInfrastructure } from '../utils/incidentExport';

interface CitizenComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitComplaint: (complaint: WaterIncidentComplaint) => void;
  currentUser: AuthUser | null;
  selectedAddress?: string;
  selectedCoordinates?: [number, number];
  complaintsList: WaterIncidentComplaint[];
  onOpenLoginModal?: (reason?: 'report_incident' | 'general') => void;
  initialTab?: 'submit' | 'registry';
}

export const CitizenComplaintModal: React.FC<CitizenComplaintModalProps> = ({
  isOpen,
  onClose,
  onSubmitComplaint,
  currentUser,
  selectedAddress = '',
  selectedCoordinates,
  complaintsList = [],
  onOpenLoginModal,
  initialTab = 'submit',
}) => {
  const [activeTab, setActiveTab] = useState<'submit' | 'registry'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Export & Authority Access State
  const isAuthority = isAuthorityUser(currentUser);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAuthGateModal, setShowAuthGateModal] = useState(false);

  const handleExportIncidentData = async () => {
    if (!isAuthority) {
      setShowAuthGateModal(true);
      return;
    }

    setIsExporting(true);
    setExportFeedback(null);
    try {
      const res = await exportIncidentData(complaintsList, currentUser);
      if (res.success) {
        setExportFeedback({ type: 'success', text: res.message });
        setTimeout(() => setExportFeedback(null), 6000);
      } else {
        setExportFeedback({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setExportFeedback({ type: 'error', text: err?.message || 'Failed to export incident records.' });
    } finally {
      setIsExporting(false);
    }
  };

  // Form Fields
  const [category, setCategory] = useState<IncidentCategory>('contamination_discoloration');
  const [severity, setSeverity] = useState<IncidentSeverity>('high');
  const [address, setAddress] = useState(selectedAddress || '4015 Great North Road, Kelston, Auckland');
  const [supplyZoneId, setSupplyZoneId] = useState('AKL-SZ-14');
  const [observedAt, setObservedAt] = useState(new Date().toISOString().slice(0, 16));
  const [description, setDescription] = useState('');
  const [waterSupplyType, setWaterSupplyType] = useState('Municipal Watercare Reticulation');
  const [boilWaterAdvised, setBoilWaterAdvised] = useState(true);
  const [reporterName, setReporterName] = useState(currentUser?.name || '');
  const [reporterEmail, setReporterEmail] = useState(currentUser?.email || '');
  const [reporterPhone, setReporterPhone] = useState('021 555 0192');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Submission Status
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories: { id: IncidentCategory; label: string; desc: string; icon: string; defaultSeverity: IncidentSeverity }[] = [
    {
      id: 'contamination_discoloration',
      label: 'Water Discoloration / Turbidity',
      desc: 'Brown, reddish, yellow, or murky tap water with visible sediment particles.',
      icon: '🟤',
      defaultSeverity: 'high',
    },
    {
      id: 'chemical_odor_taste',
      label: 'Chemical Taste or Noxious Odor',
      desc: 'Petroleum, strong chlorine, sulfur, or sewage-like odor/taste from tap.',
      icon: '🧪',
      defaultSeverity: 'high',
    },
    {
      id: 'suspected_illness_pathogen',
      label: 'Suspected Contamination & Illness',
      desc: 'Household illness symptoms (e.g. gastrointestinal) or suspected biological pathogen.',
      icon: '⚠️',
      defaultSeverity: 'critical',
    },
    {
      id: 'pipe_burst_leak',
      label: 'Watermain Rupture or Street Leak',
      desc: 'Major pipe burst, flooding street, bubbling footpath, or leaking Toby meter pit.',
      icon: '💧',
      defaultSeverity: 'high',
    },
    {
      id: 'low_pressure_outage',
      label: 'Complete Supply Outage / Pressure Drop',
      desc: 'No running water or severe pressure drop across multiple premises.',
      icon: '📉',
      defaultSeverity: 'standard',
    },
    {
      id: 'backflow_hazard',
      label: 'Backflow / Cross-Connection Hazard',
      desc: 'Back-siphonage risk from commercial activity or unapproved connection.',
      icon: '🔄',
      defaultSeverity: 'high',
    },
  ];

  const handleCategoryChange = (catId: IncidentCategory) => {
    setCategory(catId);
    const item = categories.find(c => c.id === catId);
    if (item) {
      setSeverity(item.defaultSeverity);
      if (item.id === 'suspected_illness_pathogen') {
        setBoilWaterAdvised(true);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setValidationError('Please specify the location or address where the issue was observed.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setValidationError('Please provide a descriptive explanation of what you observed (at least 10 characters).');
      return;
    }
    if (!isAnonymous && !reporterEmail.trim()) {
      setValidationError('Please provide a contact email address for official compliance follow-up, or choose anonymous submission.');
      return;
    }

    const matchedZone = AUCKLAND_ZONE_SCHEMES.find(z => z.zoneId === supplyZoneId);
    let finalRefCode = `NZ-DW-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newComplaint: WaterIncidentComplaint = {
      id: finalRefCode,
      category,
      categoryLabel: categories.find(c => c.id === category)?.label || 'General Incident',
      severity,
      address: address.trim(),
      coordinates: selectedCoordinates,
      supplyZoneId,
      supplySchemeName: matchedZone?.supplyName || 'Auckland Municipal Water Supply',
      description: description.trim(),
      observedAt,
      waterSupplyType,
      boilWaterAdvised,
      reporterName: isAnonymous ? 'Anonymous Citizen' : (reporterName.trim() || 'Auckland Resident'),
      reporterEmail: isAnonymous ? 'anonymous@taumataarowai.govt.nz' : reporterEmail.trim(),
      reporterPhone: isAnonymous ? undefined : reporterPhone.trim(),
      isAnonymous,
      status: 'Submitted',
      createdAt: new Date().toISOString(),
    };

    // Asynchronously submit to FastAPI backend if available
    submitIncidentApi(newComplaint).then((apiRes) => {
      if (apiRes && apiRes.id) {
        finalRefCode = apiRes.id;
        newComplaint.id = apiRes.id;
        setSubmittedReference(apiRes.id);
      }
    }).catch(() => {
      // Offline fallback already handled
    });

    onSubmitComplaint(newComplaint);
    setSubmittedReference(finalRefCode);
    setValidationError(null);
  };

  const handleResetForm = () => {
    setSubmittedReference(null);
    setDescription('');
    setValidationError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#072e54] text-white flex items-center justify-between border-b border-[#052340] shrink-0">
          <div className="flex items-center gap-3">
            <TaumataArowaiLogo theme="dark" compact={false} className="h-8" />
            <div className="h-6 w-[1px] bg-white/20 hidden sm:block" />
            <div className="hidden sm:block">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Water Contamination & Incident Complaint Intake</span>
              </h2>
              <p className="text-[10px] text-slate-300">
                Official statutory incident registry under the Water Services Act 2021
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close complaint dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 gap-2 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => { setActiveTab('submit'); setSubmittedReference(null); }}
            className={`pb-2 px-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'submit'
                ? 'border-[#072e54] text-[#072e54] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Submit New Complaint</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('registry')}
            className={`pb-2 px-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'registry'
                ? 'border-[#072e54] text-[#072e54] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5 text-sky-700" />
            <span>Active Incident Register ({complaintsList.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-800 space-y-4 custom-scrollbar">

          {/* TAB 1: SUBMIT COMPLAINT FORM */}
          {activeTab === 'submit' && (
            <>
              {submittedReference ? (
                /* SUCCESS CONFIRMATION VIEW */
                <div className="p-5 bg-emerald-50/70 border border-emerald-300 rounded-lg space-y-4 text-xs animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-emerald-950">
                        Incident Report Successfully Registered
                      </h3>
                      <p className="text-[11px] text-emerald-800">
                        Taumata Arowai Drinking Water Compliance Team has been formally notified.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded border border-emerald-200 space-y-2">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Official Reference Number:</span>
                      <span className="font-mono font-bold text-sm text-[#072e54] bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        {submittedReference}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Reported Category:</span>
                      <span className="font-semibold text-slate-800">
                        {categories.find(c => c.id === category)?.label}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Location:</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[280px]">
                        {address}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Status:</span>
                      <span className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        Logged & Awaiting Officer Review
                      </span>
                    </div>
                  </div>

                  {/* Immediate Precautionary Guidance */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-950 space-y-1.5 text-[11px]">
                    <div className="font-bold flex items-center gap-1.5 text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Immediate Safety Precautions:</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      <li><strong>Precautionary Boil Water:</strong> If tap water appears discolored, cloudy, or has an unusual smell, boil water vigorously for at least 1 minute before drinking or brushing teeth.</li>
                      <li><strong>Severe Burst Leak:</strong> If water is rapidly flooding your home or road, phone Watercare 24/7 Operations immediately at <strong>(09) 442 2222</strong>.</li>
                      <li><strong>Health Symptoms:</strong> If you or household members experience illness, consult Healthline at <strong>0800 611 116</strong> or your GP.</li>
                    </ul>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('registry')}
                      className="px-4 py-2 bg-[#072e54] hover:bg-[#052340] text-white font-bold rounded text-xs transition-colors cursor-pointer"
                    >
                      View Incident on Register
                    </button>
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded text-xs transition-colors"
                    >
                      Submit Another Report
                    </button>
                  </div>
                </div>
              ) : (
                /* INTAKE FORM */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {validationError && (
                    <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  {/* STEP 1: CATEGORY SELECTION */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      1. Select Incident Nature / Contamination Type:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {categories.map((cat) => {
                        const isSelected = category === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleCategoryChange(cat.id)}
                            className={`p-2.5 rounded border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                              isSelected
                                ? 'border-[#072e54] bg-sky-50/70 text-[#072e54] ring-1 ring-[#072e54]'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <span className="text-base leading-none mt-0.5">{cat.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-xs text-slate-900 leading-tight">
                                {cat.label}
                              </div>
                              <div className="text-[10px] text-slate-500 leading-snug mt-0.5">
                                {cat.desc}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* STEP 2: LOCATION & SEVERITY */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Affected Street Address / Property Location:
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          required
                          placeholder="e.g. 4015 Great North Road, Kelston"
                          className="w-full pl-8 pr-3 py-2 rounded border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#072e54]"
                        />
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Auckland Water Supply Zone (if known):
                      </label>
                      <select
                        value={supplyZoneId}
                        onChange={(e) => setSupplyZoneId(e.target.value)}
                        className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#072e54]"
                      >
                        {AUCKLAND_ZONE_SCHEMES.map(z => (
                          <option key={z.zoneId} value={z.zoneId}>
                            {z.zoneName} ({z.zoneId})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* STEP 3: OBSERVATION TIME & WATER SUPPLY SOURCE */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        First Observed Date & Time:
                      </label>
                      <div className="relative">
                        <input
                          type="datetime-local"
                          value={observedAt}
                          onChange={(e) => setObservedAt(e.target.value)}
                          className="w-full pl-8 pr-2 py-2 rounded border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#072e54]"
                        />
                        <Clock className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Urgency / Perceived Severity:
                      </label>
                      <select
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                        className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#072e54]"
                      >
                        <option value="standard">Standard Inquiry (Minor Taste/Pressure)</option>
                        <option value="high">High (Severe Discoloration / Odor / Burst)</option>
                        <option value="critical">Critical (Potential Pathogen / Illness)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Water Supply Source:
                      </label>
                      <select
                        value={waterSupplyType}
                        onChange={(e) => setWaterSupplyType(e.target.value)}
                        className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#072e54]"
                      >
                        <option value="Municipal Watercare Reticulation">Municipal Reticulation (Watercare)</option>
                        <option value="Rural Community Water Supply">Rural Community Water Supply</option>
                        <option value="Private Borehole / Groundwater">Private Borehole</option>
                        <option value="Rainwater Tank Collection">Rainwater Tank Collection</option>
                      </select>
                    </div>
                  </div>

                  {/* STEP 4: DESCRIPTION */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Detailed Observation Description:
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      required
                      placeholder="Describe what you observed: color, smell, whether both cold and hot taps are affected, duration of discoloration, or leak severity..."
                      className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#072e54]"
                    />
                  </div>

                  {/* STEP 5: REPORTER CONTACT DETAILS */}
                  <div className="border border-slate-200 rounded p-3 bg-slate-50/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#072e54]" />
                        <span>Reporter Contact Information</span>
                      </div>
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="rounded text-[#072e54]"
                        />
                        <span>Submit Anonymously</span>
                      </label>
                    </div>

                    {!isAnonymous && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        <div>
                          <label className="block text-[10px] text-slate-500">Your Full Name:</label>
                          <input
                            type="text"
                            value={reporterName}
                            onChange={(e) => setReporterName(e.target.value)}
                            placeholder="Full Name"
                            className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs text-slate-900 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">Contact Email:</label>
                          <input
                            type="email"
                            value={reporterEmail}
                            onChange={(e) => setReporterEmail(e.target.value)}
                            placeholder="name@example.co.nz"
                            className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs text-slate-900 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">Phone Number:</label>
                          <input
                            type="tel"
                            value={reporterPhone}
                            onChange={(e) => setReporterPhone(e.target.value)}
                            placeholder="021 XXX XXXX"
                            className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs text-slate-900 bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SUBMIT BUTTON */}
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      Reports are logged directly into Taumata Arowai incident dispatch.
                    </span>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#072e54] font-bold rounded text-xs transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Official Complaint</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* TAB 2: ACTIVE INCIDENT REGISTER */}
          {activeTab === 'registry' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>Registered Incident Reports & Contamination Notifications ({complaintsList.length})</span>
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Statutory Drinking Water Register • Water Services Act 2021
                  </p>
                </div>

                {/* GREEN EXPORT BUTTON */}
                <button
                  type="button"
                  onClick={handleExportIncidentData}
                  disabled={isExporting}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded text-xs transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
                  title={
                    isAuthority
                      ? "Export reported incidents (address, supply zone, treatment plant/dam, details) to CSV/Excel"
                      : "Official login required to export incident records"
                  }
                >
                  {isExporting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : isAuthority ? (
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-emerald-200" />
                  )}
                  <span>Export Incident Data (CSV / Excel)</span>
                  {isAuthority ? (
                    <span className="text-[9px] bg-emerald-800/80 text-emerald-100 px-1.5 py-0.5 rounded font-normal uppercase tracking-wider">
                      Official
                    </span>
                  ) : (
                    <span className="text-[9px] bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      Login Req.
                    </span>
                  )}
                </button>
              </div>

              {/* Export feedback alert banner */}
              {exportFeedback && (
                <div
                  className={`p-2.5 rounded border text-xs flex items-center justify-between gap-2 animate-in fade-in duration-150 ${
                    exportFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {exportFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-medium text-[11px]">{exportFeedback.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExportFeedback(null)}
                    className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                  >
                    &times;
                  </button>
                </div>
              )}

              {complaintsList.length === 0 ? (
                <div className="p-6 text-center text-slate-500 bg-slate-50 rounded border border-slate-200">
                  <Droplet className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                  <p className="font-semibold text-xs text-slate-700">No Active Complaints Recorded</p>
                  <p className="text-[11px] mt-0.5">Use the Submit tab to log a new water quality or contamination report.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {complaintsList.map((item) => (
                    <div key={item.id} className="p-3 bg-white rounded border border-slate-200 hover:border-slate-300 transition-colors space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.severity === 'critical' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                            item.severity === 'high' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            'bg-sky-100 text-sky-800 border border-sky-300'
                          }`}>
                            {item.severity.toUpperCase()}
                          </span>
                          <span className="font-bold text-xs text-slate-900">{item.categoryLabel}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-500 font-semibold">{item.id}</span>
                      </div>

                      <div className="text-[11px] text-slate-700 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold">{item.address}</span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>Reported by: {item.reporterName}</span>
                        <span className="font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[10px] text-slate-500">
            {activeTab === 'registry' ? (
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Statutory export dataset includes citizen address, zone ID, treatment plant/dam & contact details.</span>
              </span>
            ) : (
              'For urgent health emergencies, phone Healthline 0800 611 116 (24/7).'
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'registry' && (
              <button
                type="button"
                onClick={handleExportIncidentData}
                disabled={isExporting}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                title={isAuthority ? "Download official CSV/Excel export" : "Authority login required"}
              >
                {isExporting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Export CSV</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>

      {/* Authority Access Gate Modal */}
      {showAuthGateModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-md p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Official Authority Access Only
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAuthGateModal(false)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Under the <strong>Water Services Act 2021</strong> and <strong>Privacy Act 2020</strong>, downloading complete incident logs is restricted to authorized Drinking Water Officials and GIS Administrators.
                </p>
              </div>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 rounded p-3 text-[11px] text-slate-700 space-y-1.5">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Protected Statutory Export Dataset Includes:</span>
              </div>
              <ul className="list-disc list-inside text-slate-600 space-y-0.5 pl-1">
                <li>Affected citizen residential address & cadastral parcel</li>
                <li>Municipal drinking water supply zone ID & zone name</li>
                <li>Associated upstream treatment plant & source dam lineage</li>
                <li>Problem category, severity level & detailed observations</li>
                <li>Citizen contact details (name, email, phone)</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAuthGateModal(false)}
                className="px-3 py-1.5 rounded text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAuthGateModal(false);
                  if (onOpenLoginModal) {
                    onOpenLoginModal('general');
                  }
                }}
                className="px-4 py-1.5 bg-[#072e54] hover:bg-[#0b3d6f] text-white rounded font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Sign In with Authority Credentials</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
