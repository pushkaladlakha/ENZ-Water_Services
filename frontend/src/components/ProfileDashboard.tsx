import React from 'react';
import { X, MapPinned, ShieldCheck, UserRound, Database, BellDot, FileSpreadsheet } from 'lucide-react';
import { AuthUser, WaterIncidentComplaint } from '../types/gis';
import { isAuthorityUser, exportIncidentData } from '../utils/incidentExport';

interface ProfileDashboardProps {
  currentUser: AuthUser | null;
  isOpen: boolean;
  onClose: () => void;
  complaintsList?: WaterIncidentComplaint[];
}

export const ProfileDashboard: React.FC<ProfileDashboardProps> = ({
  currentUser,
  isOpen,
  onClose,
  complaintsList = [],
}) => {
  if (!isOpen) {
    return null;
  }

  const userName = currentUser?.name || 'Guest User';
  const initials = userName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isAuthority = isAuthorityUser(currentUser);
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportNotice, setExportNotice] = React.useState<string | null>(null);

  const handleExportIncidentData = async () => {
    if (!isAuthority) return;
    setIsExporting(true);
    setExportNotice(null);
    try {
      const res = await exportIncidentData(complaintsList || [], currentUser);
      if (res.success) {
        setExportNotice(res.message);
        setTimeout(() => setExportNotice(null), 4000);
      } else {
        setExportNotice(res.message);
      }
    } catch (err: any) {
      setExportNotice(err?.message || 'Failed to export incident records.');
    } finally {
      setIsExporting(false);
    }
  };

  const roleLabel = currentUser?.role === 'admin'
    ? 'GIS Administrator'
    : currentUser?.role === 'official'
      ? 'Authorized Official'
      : 'Public User';

  const statCards = [
    { label: 'Maps', value: '6', icon: MapPinned },
    { label: 'Alerts', value: '2', icon: BellDot },
    { label: 'Access', value: roleLabel, icon: ShieldCheck },
  ];

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-[1px]">
      <div className="absolute right-4 top-20 w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between bg-[#071A35] px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-bold">
              {initials}
            </div>
            <div>
              <div className="text-sm font-semibold">Profile Dashboard</div>
              <div className="text-[10px] text-slate-300">Operational summary</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-200 hover:bg-white/10 hover:text-white"
            aria-label="Close profile dashboard"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 text-lg font-bold text-white">
                {initials}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">{userName}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-600">
                  <UserRound className="h-3.5 w-3.5" />
                  {roleLabel}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {statCards.map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-white p-2.5 text-center">
                  <Icon className="mx-auto h-3.5 w-3.5 text-sky-700" />
                  <div className="mt-1 text-[10px] text-slate-500">{label}</div>
                  <div className="text-xs font-bold text-slate-900">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-700">
                <Database className="h-3.5 w-3.5 text-sky-700" />
                Data access
              </div>
              <div className="mt-2 text-xs text-slate-600">
                {currentUser ? 'Current session has GIS view and role-based asset access enabled.' : 'No active user session. Sign in to unlock full GIS actions.'}
              </div>
            </div>

            {isAuthority && (
              <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-800">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Statutory Incident Register</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold">
                    Official
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-normal">
                  Export incident records including citizen residential addresses, water supply zones, associated treatment plants/dams, and reporter contact details.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleExportIncidentData}
                    disabled={isExporting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded border border-emerald-800 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-white/90" />
                    <span>{isExporting ? 'Exporting...' : 'Export Incident Data (CSV)'}</span>
                  </button>
                </div>
                {exportNotice && (
                  <p className="text-[11px] text-emerald-700 font-medium pt-1">
                    {exportNotice}
                  </p>
                )}
              </div>
            )}

            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-700">Current focus</div>
              <div className="mt-2 text-xs text-slate-600">
                Default basemap is ESRI imagery. No automatic modal prompts are triggered on load.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
