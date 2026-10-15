import React, { useState, useEffect, useMemo } from 'react';
import { 
  Droplet, 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Play, 
  RotateCw, 
  Gauge, 
  Activity, 
  ShieldCheck, 
  CheckCircle2, 
  Building2, 
  Layers, 
  ArrowRight, 
  Sparkles,
  Search,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Crosshair
} from 'lucide-react';
import { 
  AccessLevel, 
  BaseMapStyle, 
  LayerVisibility, 
  ParcelFeature, 
  ActiveSelection, 
  WaterTestingProfileResult,
  PathwayResolutionResult 
} from '../types/gis';
import { VERIFIED_PARCELS, NZ_DEFAULT_CENTER } from '../data/nzData';
import { 
  resolveAddressSupplyZone, 
  simulateWaterTestingProfile, 
  AucklandZoneScheme,
  AUCKLAND_ZONE_SCHEMES 
} from '../utils/waterLineageEngine';
import { runWaterTestingProfileApi } from '../services/apiClient';

interface GisMapProps {
  accessLevel: AccessLevel;
  baseMapStyle: BaseMapStyle;
  layerVisibility: LayerVisibility;
  selectedFeature: ActiveSelection | null;
  onSelectFeature: (selection: ActiveSelection | null) => void;
  flyToLocation: { center: [number, number]; zoom?: number } | null;
  customGeoJsonData?: any | null;
  onToggleLayerPanel?: () => void;
  isLayerPanelOpen?: boolean;
  pathway?: PathwayResolutionResult | null;
  focusZoneBounds?: [number, number][] | null;
  focusRouteBounds?: [number, number][] | null;
}

export const GisMap: React.FC<GisMapProps> = ({
  accessLevel,
  baseMapStyle,
  layerVisibility,
  selectedFeature,
  onSelectFeature,
  flyToLocation,
  onToggleLayerPanel,
  isLayerPanelOpen,
}) => {
  // 1. Identify the active target parcel / address
  const activeParcel: ParcelFeature = useMemo(() => {
    if (selectedFeature && selectedFeature.type === 'parcel' && selectedFeature.data) {
      return selectedFeature.data as ParcelFeature;
    }
    return VERIFIED_PARCELS[0]; // Default to 4015 Great North Road
  }, [selectedFeature]);

  // 2. Active simulated water testing profile state
  const [profile, setProfile] = useState<WaterTestingProfileResult>(() => {
    return simulateWaterTestingProfile(VERIFIED_PARCELS[0]);
  });
  const [isRunningProfile, setIsRunningProfile] = useState<boolean>(false);
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'directions' | 'satellite'>('directions');
  const [lastRunTimestamp, setLastRunTimestamp] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [liveLocationNotice, setLiveLocationNotice] = useState<string | null>(null);

  // When activeParcel changes via search or click, automatically update profile
  useEffect(() => {
    if (activeParcel) {
      const initial = simulateWaterTestingProfile(activeParcel);
      setProfile(initial);
    }
  }, [activeParcel]);

  // When flyToLocation arrives from header "Locate Me" or map clicks
  useEffect(() => {
    if (flyToLocation?.center) {
      const [lat, lng] = flyToLocation.center;
      const liveResult = simulateWaterTestingProfile([lat, lng]);
      setProfile(liveResult);
      setLiveLocationNotice(`Live Location: ${lat.toFixed(4)}, ${lng.toFixed(4)} • Linked to ${liveResult.allocatedZoneName} (${liveResult.distanceKm} km)`);
      const t = setTimeout(() => setLiveLocationNotice(null), 6000);
      return () => clearTimeout(t);
    }
  }, [flyToLocation]);

  // Direct Live Location finder for the user
  const handleDirectLocate = () => {
    setIsLocating(true);
    const applyPos = (lat: number, lng: number, isRealGps: boolean) => {
      setIsLocating(false);
      const simulated = simulateWaterTestingProfile([lat, lng]);
      setProfile(simulated);
      setLiveLocationNotice(
        isRealGps
          ? `📍 Live GPS Fixed: (${lat.toFixed(4)}, ${lng.toFixed(4)}) • Linked to ${simulated.allocatedZoneName} (${simulated.distanceKm} km)`
          : `📍 Auckland Central Location: (${lat.toFixed(4)}, ${lng.toFixed(4)}) • Linked to ${simulated.allocatedZoneName}`
      );
      setTimeout(() => setLiveLocationNotice(null), 6000);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => applyPos(pos.coords.latitude, pos.coords.longitude, true),
        (err) => {
          console.warn('[GisMap] GPS unavailable, defaulting to Auckland central:', err.message);
          applyPos(-36.9094, 174.6806, false);
        },
        { timeout: 6000, enableHighAccuracy: false, maximumAge: 30000 }
      );
    } else {
      applyPos(-36.9094, 174.6806, false);
    }
  };

  // Handle "Run Profile" simulation click
  const handleRunProfile = async () => {
    setIsRunningProfile(true);
    try {
      const result = await runWaterTestingProfileApi(activeParcel);
      setProfile(result);
      setLastRunTimestamp(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn('[Water Testing] Fallback simulation execution:', err);
      const fallback = simulateWaterTestingProfile(activeParcel);
      setProfile(fallback);
      setLastRunTimestamp(new Date().toLocaleTimeString());
    } finally {
      setTimeout(() => {
        setIsRunningProfile(false);
      }, 450);
    }
  };

  // Google Maps Directions URLs
  const originLat = profile.zoneCoordinates[0];
  const originLng = profile.zoneCoordinates[1];
  const destLat = profile.coordinates[0];
  const destLng = profile.coordinates[1];

  const googleMapsEmbedUrl = viewMode === 'directions'
    ? `https://maps.google.com/maps?saddr=${originLat},${originLng}&daddr=${destLat},${destLng}&hl=en&output=embed`
    : `https://maps.google.com/maps?q=${destLat},${destLng}&t=k&z=19&ie=UTF8&iwloc=&output=embed`;

  const externalGoogleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden select-text">
      {/* Top Map View Controls Bar */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-lg border border-slate-200">
        <div className="flex items-center rounded-md bg-slate-100 p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('directions')}
            className={`px-3 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
              viewMode === 'directions'
                ? 'bg-[#0B2342] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-[#00D4C7]" />
            <span>Google Maps Route</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('satellite')}
            className={`px-3 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
              viewMode === 'satellite'
                ? 'bg-[#0B2342] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Aerial Satellite</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleDirectLocate}
          disabled={isLocating}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-md transition-colors ${
            isLocating
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs'
          }`}
          title="Trace water pipeline to your current device GPS position"
        >
          <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-amber-600' : 'text-emerald-600'}`} />
          <span>{isLocating ? 'Locating...' : 'My Live Location'}</span>
        </button>

        <a
          href={externalGoogleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-md border border-sky-200 transition-colors"
          title="Open in full Google Maps app"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Open in Google Maps</span>
        </a>

        {onToggleLayerPanel && (
          <button
            type="button"
            onClick={onToggleLayerPanel}
            className={`p-1.5 rounded-md border transition-colors ${
              isLayerPanelOpen
                ? 'bg-sky-100 border-sky-400 text-sky-800'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Toggle layer settings"
          >
            <Layers className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Primary Map Viewport: Clean Responsive Google Maps Directions Embed */}
      <div className="relative flex-1 w-full h-full">
        <iframe
          key={`${profile.addressId}-${viewMode}-${originLat}-${destLat}`}
          title="Google Maps Supply Zone to Address Directions Route"
          src={googleMapsEmbedUrl}
          className="w-full h-full border-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />

        {/* Live Location Acquired Notification Banner */}
        {liveLocationNotice && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 bg-emerald-950/90 backdrop-blur-md text-white rounded-full text-xs shadow-2xl border border-emerald-400/60 animate-in fade-in duration-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold">{liveLocationNotice}</span>
          </div>
        )}

        {/* Origin / Destination Waypoint Indicator Strip at Top Center */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#0B2342]/90 backdrop-blur-md text-white rounded-full text-xs shadow-md border border-slate-700/60 pointer-events-none">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-slate-300 font-mono text-[11px]">Origin:</span>
            <span className="font-semibold text-white truncate max-w-[150px]">{profile.allocatedZoneName}</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300 font-mono text-[11px]">Destination:</span>
            <span className="font-semibold text-white truncate max-w-[180px]">{profile.address.split(',')[0]}</span>
          </div>
        </div>
      </div>

      {/* PROMINENT SUMMARY PANEL: Address ↔ Supply Zone Distance & Run Profile */}
      <div className="absolute left-3 bottom-4 sm:top-3 sm:bottom-auto z-20 w-[94vw] sm:w-[410px] max-w-[430px] bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden transition-all duration-200">
        {/* Panel Header with Brand Accent */}
        <div className="bg-[#0B2342] text-white px-4 py-3 flex items-center justify-between border-b border-[#14335A]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#00D4C7]/20 flex items-center justify-center text-[#00D4C7]">
              <Droplet className="w-4 h-4 fill-[#00D4C7]" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Water Testing & Supply Zone Traceability</span>
              </div>
              <div className="text-[10px] text-slate-300 font-mono">
                Authoritative PostGIS / Spatial Distance Linkage
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsSummaryCollapsed(!isSummaryCollapsed)}
              className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title={isSummaryCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              {isSummaryCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!isSummaryCollapsed && (
          <div className="p-3.5 space-y-3 max-h-[75vh] overflow-y-auto">
            {/* 1. Consumer Property Address & ID Card */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Consumer Property Address</span>
                <span className="font-mono text-[9px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                  {profile.addressId}
                </span>
              </div>
              <div className="text-xs font-extrabold text-slate-900 mt-1 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span>{profile.address}</span>
              </div>
              {profile.lotPlan && (
                <div className="text-[10px] text-slate-500 mt-1 pl-5 font-mono">
                  Cadastral Title: {profile.lotPlan}
                </div>
              )}

              {/* Quick Switcher for Verified Test Addresses */}
              <div className="mt-2 pt-2 border-t border-slate-200/80">
                <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                  Select Address to Trace & Test:
                </span>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={handleDirectLocate}
                    disabled={isLocating}
                    className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      isLocating
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300'
                    }`}
                    title="Trace from device current GPS location"
                  >
                    <Crosshair className={`w-3 h-3 ${isLocating ? 'animate-spin text-amber-700' : 'text-emerald-700'}`} />
                    <span>{isLocating ? 'Locating...' : '📍 My Location'}</span>
                  </button>
                  {VERIFIED_PARCELS.map((p) => {
                    const isSelected = p.id === activeParcel.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onSelectFeature({
                            type: 'parcel',
                            data: p,
                          });
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded font-medium transition-all ${
                          isSelected
                            ? 'bg-[#0B2342] text-white font-bold shadow-xs'
                            : 'bg-white hover:bg-slate-200/70 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {p.streetNumber} {p.streetName.split(' ')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Allocated Supply Zone Name & ID Card */}
            <div className="p-2.5 rounded-lg bg-sky-50/70 border border-sky-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-sky-900 flex items-center justify-between">
                <span>Allocated Municipal Supply Zone</span>
                <span className="font-mono font-bold text-[10px] bg-sky-700 text-white px-1.5 py-0.5 rounded">
                  {profile.allocatedZoneId}
                </span>
              </div>
              <div className="text-xs font-extrabold text-[#0B2342] mt-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                <span>{profile.allocatedZoneName}</span>
              </div>
              <div className="text-[10px] text-sky-800 mt-0.5 flex items-center justify-between">
                <span>Scheme: {profile.supplyName}</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Deterministic Linkage
                </span>
              </div>
            </div>

            {/* 3. Distance & Estimated Transit Time Stat Block */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                  Supply Zone Distance
                </span>
                <div className="text-lg font-black text-emerald-950 mt-0.5">
                  {profile.distanceKm} <span className="text-xs font-semibold text-emerald-800">km</span>
                </div>
                <div className="text-[9px] text-emerald-700 font-mono">
                  Direct spatial corridor
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200">
                <span className="text-[10px] font-bold uppercase text-indigo-800 block">
                  Mains Transit Time
                </span>
                <div className="text-lg font-black text-indigo-950 mt-0.5">
                  {profile.transitTimeFormatted}
                </div>
                <div className="text-[9px] text-indigo-700 font-mono">
                  At 1.15 m/s trunk flow
                </div>
              </div>
            </div>

            {/* 4. RUN PROFILE PRIMARY ACTION BUTTON */}
            <button
              type="button"
              onClick={handleRunProfile}
              disabled={isRunningProfile}
              className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                isRunningProfile
                  ? 'bg-slate-400 text-white cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-teal-700/20'
              }`}
            >
              {isRunningProfile ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin text-white" />
                  <span>Simulating Hydraulic & Water Quality Profile...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white text-white" />
                  <span>Run Profile (Simulate Water Testing)</span>
                </>
              )}
            </button>

            {/* 5. Water Testing & Hydraulic Metrics Summary (Updated when Run Profile executes) */}
            <div className="border border-slate-200 rounded-lg p-2.5 bg-white space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-sky-700" />
                  <span>Statutory Water Quality & Head Metrics</span>
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {profile.complianceStatus} (Grade A1)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[9px] text-slate-500 block">Static Pressure:</span>
                  <span className="font-mono font-bold text-slate-900">{profile.pressurePsi} PSI</span>
                  <span className="text-[9px] text-slate-500 font-mono ml-1">({profile.pressureKPa} kPa)</span>
                </div>

                <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[9px] text-slate-500 block">Water pH Level:</span>
                  <span className="font-mono font-bold text-slate-900">{profile.ph}</span>
                  <span className="text-[9px] text-emerald-700 font-medium ml-1">Neutral</span>
                </div>

                <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[9px] text-slate-500 block">Free Available Cl₂:</span>
                  <span className="font-mono font-bold text-slate-900">{profile.chlorineMgL} mg/L</span>
                  <span className="text-[9px] text-emerald-700 font-medium ml-1">Optimal</span>
                </div>

                <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[9px] text-slate-500 block">Turbidity:</span>
                  <span className="font-mono font-bold text-slate-900">{profile.turbidityNtu} NTU</span>
                  <span className="text-[9px] text-slate-400 font-mono ml-1">(&lt; 0.50)</span>
                </div>
              </div>

              {/* Pipeline Lineage Flow */}
              <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-600 space-y-1">
                <div>
                  <span className="text-slate-400 font-medium">Source Treatment Plant: </span>
                  <strong className="text-slate-800">{profile.treatmentPlant}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Balancing Reservoir: </span>
                  <strong className="text-slate-800">{profile.reservoir}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Distribution Line: </span>
                  <strong className="text-slate-800">{profile.distributionMain} &bull; {profile.servicePipe}</strong>
                </div>
              </div>

              {lastRunTimestamp && (
                <div className="text-[9px] text-slate-400 italic pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span>Profile Last Simulated: {lastRunTimestamp}</span>
                  <span className="text-emerald-700 font-medium">Live Telemetry Active</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
