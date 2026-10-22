import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Droplet, 
  Building2, 
  ShieldCheck, 
  AlertTriangle, 
  Maximize2, 
  Crosshair, 
  Info, 
  ArrowDown, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown,
  ChevronUp,
  Route
} from 'lucide-react';
import { PathwayResolutionResult, PathwayResolvedZone } from '../types/gis';
import { isCoordinateInNewZealand } from '../data/nzData';

interface PathwayPanelProps {
  pathway: PathwayResolutionResult | null;
  isLoading: boolean;
  onFocusZone: (zone: PathwayResolvedZone) => void;
  onFocusAddress: (coords: [number, number]) => void;
  onFocusRoute?: (coords: [number, number][]) => void;
  onReportIncident: (address?: string) => void;
  onClear: () => void;
}

export const PathwayPanel: React.FC<PathwayPanelProps> = ({
  pathway,
  isLoading,
  onFocusZone,
  onFocusAddress,
  onFocusRoute,
  onReportIncident,
  onClear,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!pathway && !isLoading) {
    return null;
  }

  const isVerified = pathway?.status === 'VERIFIED';
  const isAmbiguous = pathway?.status === 'AMBIGUOUS';
  const isNear = pathway?.status === 'NEAR_ZONE';

  const getStatusBadge = () => {
    if (isLoading) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800 border border-sky-300 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
          Resolving Spatial Containment & Lineage...
        </span>
      );
    }
    if (isVerified) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Verified Spatial Assignment
        </span>
      );
    }
    if (isAmbiguous) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          Boundary Overlap (Review Required)
        </span>
      );
    }
    if (isNear) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
          <Info className="w-3.5 h-3.5 text-sky-600" />
          Within Buffer Corridor ({pathway?.bufferTier?.distanceMeters ?? 0}m)
        </span>
      );
    }
    const isOutsideNZ = pathway && !isCoordinateInNewZealand(pathway.coordinates[0], pathway.coordinates[1]);
    if (isOutsideNZ) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
          Outside NZ Jurisdiction
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-200 text-slate-800 border border-slate-300">
        <AlertCircle className="w-3.5 h-3.5 text-slate-600" />
        Outside Reticulation Envelope
      </span>
    );
  };

  const connectivityPath = pathway?.singleConnectivityPath;

  return (
    <aside 
      aria-label="Address to Water Supply Pathway"
      className="absolute left-3 bottom-6 z-20 w-[94vw] sm:w-[420px] max-w-[440px] bg-white rounded-lg shadow-2xl border border-slate-300 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200 select-text"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-[#072e54] text-white flex items-center justify-between border-b border-[#052340] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1 rounded bg-white/10 text-cyan-300">
            <Route className="w-4 h-4" />
          </div>
          <div className="truncate">
            <h2 className="text-xs font-bold text-white tracking-wide truncate">
              Water Supply Lineage & Connectivity
            </h2>
            <p className="text-[10px] text-slate-300 truncate font-mono">
              Dam &bull; Treatment Plant &bull; Reticulation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
            aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="p-1 rounded hover:bg-rose-900/40 text-slate-300 hover:text-white transition-colors"
            title="Clear selection and reset map highlight"
            aria-label="Clear selection"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="max-h-[75vh] overflow-y-auto p-3.5 space-y-3 custom-scrollbar text-slate-800">
          
          {/* Status Header Badge */}
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100">
            {getStatusBadge()}
            {pathway?.confidenceScore !== undefined && pathway.confidenceScore > 0 && (
              <span className="text-[10px] font-mono font-medium text-slate-500">
                Confidence: {(pathway.confidenceScore * 100).toFixed(0)}%
              </span>
            )}
          </div>

          {/* SKELETON LOADING STATE */}
          {isLoading && !pathway && (
            <div className="space-y-3 py-4 animate-pulse">
              <div className="h-16 bg-slate-100 rounded border border-slate-200" />
              <div className="h-6 w-1/2 mx-auto bg-slate-100 rounded" />
              <div className="h-20 bg-slate-100 rounded border border-slate-200" />
              <div className="h-6 w-1/2 mx-auto bg-slate-100 rounded" />
              <div className="h-20 bg-slate-100 rounded border border-slate-200" />
            </div>
          )}

          {pathway && (
            <>
              {/* STAGE 1: SELECTED RESIDENTIAL PROPERTY */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 relative group hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-rose-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Selected Property
                        </span>
                        <span className="text-[9px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded border border-rose-200">
                          Red Pin on Map
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 leading-snug mt-0.5">
                        {pathway.queriedAddress}
                      </h3>
                      {(pathway.lotNumber || pathway.dpNumber || pathway.addressId) && (
                        <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap items-center gap-1.5">
                          {pathway.addressId && (
                            <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 font-medium text-slate-700">
                              {pathway.addressId}
                            </span>
                          )}
                          {pathway.lotNumber && <span>{pathway.lotNumber}</span>}
                          {pathway.dpNumber && <span>{pathway.dpNumber}</span>}
                        </div>
                      )}
                      <div className="text-[10px] font-mono text-slate-500 mt-1.5 bg-slate-100 px-2 py-0.5 rounded inline-block">
                        WGS84: {pathway.coordinates[0].toFixed(5)}, {pathway.coordinates[1].toFixed(5)}
                        {pathway.nztm2000 && !isNaN(pathway.nztm2000.easting) && pathway.nztm2000.easting > 0 && ` • NZTM: ${pathway.nztm2000.easting.toLocaleString()}m E`}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onFocusAddress(pathway.coordinates)}
                    className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-[#072e54] hover:border-slate-300 transition-colors shrink-0 shadow-2xs cursor-pointer"
                    title="Focus on address parcel"
                    aria-label="Focus on address parcel"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* CONNECTOR 1: ADDRESS -> ZONE RELATIONSHIP */}
              <div className="flex flex-col items-center justify-center my-1">
                <div className="h-2.5 w-[2px] bg-sky-300" />
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200 shadow-2xs my-0.5">
                  <ArrowDown className="w-3 h-3 text-sky-600" />
                  <span>
                    {isVerified 
                      ? 'Authoritative Point-in-Polygon Containment' 
                      : 'Spatial Lineage Assessment'}
                  </span>
                </div>
                <div className="h-2.5 w-[2px] bg-sky-300" />
              </div>

              {/* STAGE 2: ASSIGNED SUPPLY ZONE */}
              {pathway.supplyZone ? (
                <div className="rounded-lg border-2 border-sky-400 bg-sky-50/60 p-3 relative shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-700 shrink-0 mt-0.5">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-900 block">
                          Assigned Drinking Water Supply Zone
                        </span>
                        <h3 className="text-sm font-extrabold text-[#072e54] leading-snug mt-0.5">
                          {pathway.supplyZone.zoneName}
                        </h3>
                        <div className="text-[11px] text-slate-700 mt-1 flex flex-wrap items-center gap-2">
                          <span className="font-mono bg-white px-2 py-0.5 rounded border border-sky-300 font-bold text-sky-900">
                            {pathway.supplyZone.zoneId}
                          </span>
                          <span>&bull;</span>
                          <span><strong>Pop:</strong> {pathway.supplyZone.popRegist.toLocaleString()}</span>
                          {pathway.supplyZone.urbanRural && (
                            <>
                              <span>&bull;</span>
                              <span className="font-medium text-slate-600">{pathway.supplyZone.urbanRural}</span>
                            </>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1">
                          Supplier: <strong>Watercare Services Limited</strong> &bull; Taumata Arowai Register
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onFocusZone(pathway.supplyZone!)}
                      className="p-1.5 rounded-md bg-white border border-sky-300 text-sky-800 hover:bg-sky-100 transition-colors shrink-0 shadow-2xs cursor-pointer"
                      title="Focus on complete zone boundary polygon"
                      aria-label="Focus on zone boundary polygon"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-100 p-3 text-xs text-slate-600">
                  <div className="font-bold text-slate-800">
                    {pathway && !isCoordinateInNewZealand(pathway.coordinates[0], pathway.coordinates[1])
                      ? 'Outside New Zealand Territorial Jurisdiction'
                      : 'No Municipal Supply Zone Enclosure'}
                  </div>
                  <div className="text-[11px] mt-0.5">
                    {pathway && !isCoordinateInNewZealand(pathway.coordinates[0], pathway.coordinates[1])
                      ? 'The queried coordinates fall outside Aotearoa New Zealand. Drinking water compliance registers and municipal supply networks operate under the Water Services Act 2021 within New Zealand.'
                      : 'Location sits outside official registered reticulation zones. Private bore or rainwater harvesting likely.'}
                  </div>
                </div>
              )}

              {/* CONNECTOR 2: FACILITY INFRASTRUCTURE -> IN-APP SOLID PATH */}
              {(connectivityPath || pathway.servingTreatmentPlant || pathway.sourceDamFacility) && (
                <>
                  <div className="flex flex-col items-center justify-center my-1">
                    <div className="h-2.5 w-[2px] bg-[#072e54]/30" />
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-[#072e54] border border-slate-300 shadow-2xs my-0.5">
                      <ArrowDown className="w-3 h-3 text-[#072e54]" />
                      <span>In-App Infrastructure Connectivity Path</span>
                    </div>
                    <div className="h-2.5 w-[2px] bg-[#072e54]/30" />
                  </div>

                  {/* STAGE 3: SOURCE WATER FACILITIES & SINGLE CONNECTIVITY PATH */}
                  <div className="rounded-lg border-2 border-[#072e54] bg-white p-3 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#072e54] inline-block" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#072e54]">
                          Supplying Facilities & Path
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-[#072e54] border border-slate-200">
                        Solid #072e54 Path
                      </span>
                    </div>

                    {/* Source Dam Card */}
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          1. Source Catchment Dam
                        </span>
                        {connectivityPath?.hasVerifiedDamCoords ? (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Verified Coordinates
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            Coordinates Unavailable
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-xs text-slate-900">
                        {connectivityPath?.damName || pathway.sourceDamFacility?.name || pathway.supplyZone?.primaryDam?.name || 'Regional Catchment Dam'}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {pathway.sourceDamFacility?.catchment || pathway.supplyZone?.primaryDam?.catchment || 'Auckland Native Catchment'}
                        {pathway.sourceDamFacility?.capacityML ? ` • ${pathway.sourceDamFacility.capacityML.toLocaleString()} ML storage` : ''}
                      </div>
                      {connectivityPath?.damCoordinates ? (
                        <div className="text-[10px] font-mono text-emerald-900 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200 mt-1 inline-block">
                          WGS84: {connectivityPath.damCoordinates[0].toFixed(4)}, {connectivityPath.damCoordinates[1].toFixed(4)}
                        </div>
                      ) : (
                        <div className="text-[10px] font-mono text-slate-500 mt-1">
                          Coordinates: Unavailable in authoritative dataset
                        </div>
                      )}
                    </div>

                    {/* Serving Treatment Plant Card */}
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          2. Serving Water Treatment Plant
                        </span>
                        {connectivityPath?.hasVerifiedPlantCoords ? (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Verified Coordinates
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            Coordinates Unavailable
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-xs text-slate-900">
                        {connectivityPath?.plantName || pathway.servingTreatmentPlant?.name || pathway.supplyScheme?.primaryTreatmentPlant || 'Regional Treatment Facility'}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {pathway.servingTreatmentPlant?.process || 'Multi-stage Coagulation, Rapid Sand Filtration & Disinfection'}
                      </div>
                      {connectivityPath?.plantCoordinates ? (
                        <div className="text-[10px] font-mono text-emerald-900 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200 mt-1 inline-block">
                          WGS84: {connectivityPath.plantCoordinates[0].toFixed(4)}, {connectivityPath.plantCoordinates[1].toFixed(4)}
                        </div>
                      ) : (
                        <div className="text-[10px] font-mono text-slate-500 mt-1">
                          Coordinates: Unavailable in authoritative dataset
                        </div>
                      )}
                    </div>

                    {/* Single Connectivity Path Visualizer */}
                    {connectivityPath && (
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-700">Total Schematic Lineage Distance:</span>
                          <span className="font-mono font-bold text-xs text-[#072e54]">
                            ~{connectivityPath.totalDistanceKm} km
                          </span>
                        </div>

                        {onFocusRoute && connectivityPath.coordinates.length > 0 && (
                          <button
                            type="button"
                            onClick={() => onFocusRoute(connectivityPath.coordinates)}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-[#072e54] text-white text-xs font-bold hover:bg-[#052340] transition-colors shadow-2xs cursor-pointer"
                            title="Zoom and fit complete connectivity path on in-app map"
                          >
                            <Maximize2 className="w-3.5 h-3.5 text-cyan-300" />
                            <span>Focus In-App Infrastructure Path</span>
                          </button>
                        )}

                        {/* Physical Pipeline Distinguishing Disclaimer */}
                        <div className="p-2 rounded bg-amber-50 border border-amber-200/80 text-[10px] text-amber-900 leading-snug flex items-start gap-1.5">
                          <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <span>
                            <strong>Schematic Facility Lineage Notice:</strong> This single solid #072e54 path directly on the map traces the administrative facility lineage connecting property &rarr; treatment plant &rarr; source dam. It is distinct from physical subsurface reticulation pipes (toggle the Water Network layer to inspect underground pipes).
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* WARNINGS & AUDIT ADVISORIES */}
              {pathway.warnings.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Spatial Boundary Advisory</span>
                  </div>
                  {pathway.warnings.map((w, i) => (
                    <div key={i} className="pl-5 leading-relaxed text-amber-800">
                      {w}
                    </div>
                  ))}
                </div>
              )}

              {/* DATA PROVENANCE FOOTNOTE */}
              <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
                <span className="truncate" title={pathway.dataProvenance}>
                  Provenance: {pathway.dataProvenance}
                </span>
                <span className="font-mono text-slate-400 shrink-0">WGS84 &bull; EPSG:2193</span>
              </div>

              {/* BOTTOM ACTIONS BAR */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                {connectivityPath && onFocusRoute && connectivityPath.coordinates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onFocusRoute(connectivityPath.coordinates)}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-[#072e54] text-white hover:bg-[#052340] transition-colors text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Route className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Focus Path</span>
                  </button>
                )}

                {pathway.supplyZone && (
                  <button
                    type="button"
                    onClick={() => onFocusZone(pathway.supplyZone!)}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-800 text-white transition-colors text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-white" />
                    <span>Focus Zone</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onReportIncident(pathway.queriedAddress)}
                  className="px-3 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-[#072e54] transition-colors text-xs font-bold shadow-xs cursor-pointer"
                  title="Report water contamination or incident for this address"
                >
                  Report Incident
                </button>
              </div>
            </>
          )}

        </div>
      )}
    </aside>
  );
};
