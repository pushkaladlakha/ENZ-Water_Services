import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Database,
  Navigation, 
  LogOut, 
  LogIn, 
  ShieldCheck,
  Building2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { AuthUser, ParcelFeature } from '../types/gis';
import { VERIFIED_PARCELS } from '../data/nzData';
import { AUCKLAND_ZONE_SCHEMES, AucklandZoneScheme } from '../utils/waterLineageEngine';
import { TaumataArowaiLogo } from './TaumataArowaiLogo';
import { searchAddressesApi } from '../services/apiClient';

interface HeaderProps {
  currentUser: AuthUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onSearchSelectParcel: (parcel: ParcelFeature) => void;
  onSearchSelectZone: (zone: AucklandZoneScheme) => void;
  onLocateMe: () => void;
  isLocating: boolean;
  onOpenComplaintModal: () => void;
  onOpenDataRequestModal: () => void;
  onOpenDocumentation?: () => void;
  onProfileDashboardOpen?: () => void;
  onOpenProfileDashboard: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenLogin,
  onLogout,
  onSearchSelectParcel,
  onSearchSelectZone,
  onLocateMe,
  isLocating,
  onOpenComplaintModal,
  onOpenDataRequestModal,
  onOpenProfileDashboard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [apiParcels, setApiParcels] = useState<ParcelFeature[]>([]);

  // Debounced Live Backend Address Search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setApiParcels([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchAddressesApi(q, 8);
      if (results && results.length > 0) {
        setApiParcels(results);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fallback local parcel filter
  const localFilteredParcels = searchQuery.trim() === '' 
    ? [] 
    : VERIFIED_PARCELS.filter(p => 
        p.fullAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.streetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.streetNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.lotNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Active parcels: use backend API results if present, otherwise local
  const filteredParcels = apiParcels.length > 0 ? apiParcels : localFilteredParcels;

  // Filter official Auckland Supply Zones
  const matchingZones = searchQuery.trim() === ''
    ? []
    : AUCKLAND_ZONE_SCHEMES.filter(z =>
        z.zoneName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        z.zoneId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        z.supplyName.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', color: 'bg-indigo-900/60 text-indigo-200 border-indigo-400/40' };
      case 'user':
      case 'citizen':
        return { label: 'Resident User', color: 'bg-teal-900/60 text-teal-200 border-teal-400/40' };
      case 'official':
        return { label: 'Authorized Official', color: 'bg-sky-900/70 text-sky-200 border-sky-400/40' };
      default:
        return { label: 'Resident User', color: 'bg-teal-900/60 text-teal-200 border-teal-400/40' };
    }
  };

  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'official';

  return (
    <header className="bg-[#071A35] text-white border-b border-[#0C2548] z-30 shadow-md">
      <div className="h-16 px-4 flex items-center justify-between gap-3 lg:gap-6">
        
        {/* Left: Official Taumata Arowai Branding */}
        <div className="flex items-center gap-3 shrink-0">
          <TaumataArowaiLogo theme="dark" compact={false} className="h-9" />
          <div className="hidden xl:block h-6 w-[1px] bg-white/20 mx-1" />
          <div className="hidden xl:block">
            <span className="text-[12px] font-semibold text-slate-100 block leading-tight">
              Drinking Water Register & GIS Portal
            </span>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-xl relative">
          <div className="relative flex items-center">
            <div className="absolute left-3 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Search Auckland address, street, or supply zone..."
              className="w-full bg-[#040F20] text-white placeholder-slate-400 text-xs sm:text-sm pl-9 pr-24 py-2 rounded border border-slate-700/80 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400 transition-all shadow-inner"
            />
            {/* Geolocation Button */}
            <button
              type="button"
              onClick={onLocateMe}
              disabled={isLocating}
              title="Locate via GPS"
              className="absolute right-1.5 flex items-center gap-1 px-2 py-1 text-xs font-medium rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-sky-400' : 'text-slate-300'}`} />
              <span className="hidden sm:inline">{isLocating ? 'Locating...' : 'Locate'}</span>
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {showSearchResults && searchQuery.trim() !== '' && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white text-slate-900 rounded shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-96 overflow-y-auto">
              <div className="px-3 py-1.5 bg-slate-100 text-[11px] font-semibold text-slate-700 border-b border-slate-200 flex justify-between items-center">
                <span>Matching Addresses & Supply Zones</span>
                <button 
                  onClick={() => setShowSearchResults(false)}
                  className="text-slate-400 hover:text-slate-700 text-xs p-1"
                  aria-label="Close search dropdown"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {filteredParcels.length === 0 && matchingZones.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-500">
                  No matching registered addresses or supply zones found for "{searchQuery}".
                </div>
              )}

              {/* Matching Parcels */}
              {filteredParcels.map((parcel) => (
                <button
                  key={parcel.id}
                  onClick={() => {
                    onSearchSelectParcel(parcel);
                    setSearchQuery(parcel.fullAddress);
                    setShowSearchResults(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 transition-colors flex items-start gap-2.5"
                >
                  <MapPin className="w-4 h-4 text-[#071A35] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {parcel.fullAddress}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{parcel.lotNumber} {parcel.dpNumber}</span>
                      <span>&bull;</span>
                      <span className="font-medium text-slate-700">{parcel.zoneCode}</span>
                      <span>&bull;</span>
                      <span>{parcel.areaM2} m²</span>
                    </div>
                  </div>
                </button>
              ))}

              {/* Matching Official Supply Zones */}
              {matchingZones.map((zone) => (
                <button
                  key={zone.zoneId}
                  onClick={() => {
                    onSearchSelectZone(zone);
                    setSearchQuery(zone.zoneName);
                    setShowSearchResults(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-sky-50/70 border-b border-slate-100 transition-colors flex items-start gap-2.5"
                >
                  <Building2 className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[#071A35] flex items-center justify-between">
                      <span className="truncate">{zone.zoneName}</span>
                      <span className="text-[10px] font-mono text-slate-500">{zone.zoneId}</span>
                    </div>
                    <div className="text-[10px] text-slate-600 flex items-center gap-2 mt-0.5">
                      <span>Registered Population: {(zone.popRegist ?? 0).toLocaleString()}</span>
                      <span>&bull;</span>
                      <span>Scheme: {zone.supplyName}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Functional Navigation & Authentication */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Citizen Incident & Contamination Report Button */}
          <button
            type="button"
            onClick={onOpenComplaintModal}
            title="Report Water Contamination or Network Incident"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-amber-500 hover:bg-amber-400 text-[#071A35] transition-colors shadow-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#071A35]" />
            <span className="hidden sm:inline">Report Incident</span>
            <span className="sm:hidden">Report</span>
          </button>

          {isStaff && (
            <button
              type="button"
              onClick={onOpenDataRequestModal}
              title="Upload custom GIS datasets"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-white text-[#071A35] hover:bg-slate-100 transition-colors shadow-xs"
            >
              <Database className="w-3.5 h-3.5 text-[#071A35]" />
              <span className="hidden sm:inline">Upload Data</span>
            </button>
          )}

          {/* User Profile & Authentication State */}
          <div className="flex items-center pl-1 sm:pl-2 border-l border-white/20">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenProfileDashboard}
                  className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-left transition-colors hover:bg-white/10"
                  title="Open profile dashboard"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-cyan-600 text-[10px] font-bold text-white">
                    {currentUser.name.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden sm:block leading-tight">
                    <div className="text-[10px] font-bold text-white">{currentUser.name}</div>
                    <div className="text-[9px] text-slate-300">{getRoleBadge(currentUser.role).label}</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign Out of Session"
                  className="p-1.5 rounded bg-white/10 hover:bg-rose-900/50 text-slate-200 hover:text-white border border-white/20 transition-colors"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-[#009E91] hover:bg-[#00877C] text-white border border-[#009E91] transition-colors shadow-xs"
                title="Open AquaConnect Authentication Portal"
              >
                <LogIn className="w-3.5 h-3.5 text-white" />
                <span>Portal / Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
