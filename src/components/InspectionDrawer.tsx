import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Droplet, 
  Shield, 
  Calendar, 
  CheckCircle, 
  Layers,
  Building2,
  Info,
  AlertTriangle,
  FlaskConical,
  Play,
  RotateCw,
  Navigation,
  ExternalLink,
  Activity
} from 'lucide-react';
import { 
  AccessLevel, 
  ActiveSelection, 
  ParcelFeature, 
  PipeAsset, 
  FittingAsset, 
  WaterIncidentComplaint, 
  AucklandSupplyZone,
  WaterTestingProfileResult 
} from '../types/gis';
import { 
  AucklandZoneScheme, 
  resolveAddressSupplyZone, 
  simulateWaterTestingProfile 
} from '../utils/waterLineageEngine';

interface InspectionDrawerProps {
  selection: ActiveSelection | null;
  accessLevel: AccessLevel;
  onClose: () => void;
  onLocateAsset: (coords: [number, number]) => void;
  onReportIncident?: (address?: string) => void;
  complaintsList?: WaterIncidentComplaint[];
}

export const InspectionDrawer: React.FC<InspectionDrawerProps> = ({
  selection,
  accessLevel,
  onClose,
  onLocateAsset,
  onReportIncident,
  complaintsList = [],
}) => {
  const isParcel = selection?.type === 'parcel';
  const parcel = isParcel ? (selection.data as ParcelFeature) : null;
  const isPipe = selection?.type === 'pipe';
  const pipe = isPipe ? (selection.data as PipeAsset) : null;
  const isFitting = selection?.type === 'fitting';
  const fitting = isFitting ? (selection.data as FittingAsset) : null;
  const isZone = selection?.type === 'supply_zone';
  const zone = isZone && !selection?.unmapped ? (selection.data as AucklandZoneScheme | AucklandSupplyZone) : null;

  // Active simulated water testing profile state for parcel
  const [parcelProfile, setParcelProfile] = useState<WaterTestingProfileResult | null>(null);
  const [isRunningProfile, setIsRunningProfile] = useState(false);

  useEffect(() => {
    if (parcel) {
      setParcelProfile(simulateWaterTestingProfile(parcel));
    } else {
      setParcelProfile(null);
    }
  }, [parcel]);

  const handleRunDrawerProfile = () => {
    if (!parcel) return;
    setIsRunningProfile(true);
    setTimeout(() => {
      const simulated = simulateWaterTestingProfile(parcel);
      setParcelProfile(simulated);
      setIsRunningProfile(false);
    }, 450);
  };

  if (!selection) return null;

  // Filter water-testing incidents for the selected zone
  const zoneIncidents = isZone && zone ? complaintsList.filter(c => 
    (zone.zoneId && c.supplyZoneId === zone.zoneId) || 
    (c.supplySchemeName && zone.supplyName && c.supplySchemeName.toLowerCase() === zone.supplyName.toLowerCase()) || 
    (zone.zoneName && c.address && c.address.toLowerCase().includes(zone.zoneName.toLowerCase()))
  ) : [];

  return (
    <aside className="absolute right-0 top-16 bottom-6 w-full sm:w-96 md:w-[420px] bg-white border-l border-slate-300 shadow-2xl z-20 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="px-4 py-3 bg-[#071A35] text-white flex items-center justify-between border-b border-[#0C2548]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded bg-white/10 text-white">
            {isParcel ? <MapPin className="w-4 h-4" /> : isPipe ? <Droplet className="w-4 h-4" /> : isZone ? <Building2 className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
          </div>
          <div className="truncate">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300 block">
              {isParcel ? 'Cadastral Parcel Record' : isPipe ? 'Utility Pipeline' : isZone ? 'Auckland Water Supply Zone' : 'Network Fitting'}
            </span>
            <h2 className="text-xs font-bold truncate text-white leading-tight">
              {isParcel ? parcel?.fullAddress : isPipe ? `${pipe?.nomDiaMm}mm ${pipe?.material}` : isZone ? (selection.unmapped ? 'Unmapped Coordinates' : zone?.zoneName) : fitting?.label}
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
          aria-label="Close inspector drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Access Role Indicator */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-[#071A35]" />
          <span className="text-slate-600 font-medium">Access Permission:</span>
          <span className={`font-semibold capitalize ${
            accessLevel === 'citizen' ? 'text-emerald-700' : accessLevel === 'official' ? 'text-sky-800' : 'text-purple-800'
          }`}>
            {accessLevel === 'citizen' ? 'Citizen (Public Disclosure)' : accessLevel === 'official' ? 'Authorized Official' : 'Administrator'}
          </span>
        </div>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">

        {/* 1. UNMAPPED COORDINATES STATE */}
        {selection.unmapped && (
          <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-3 text-xs">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-500" />
              <span>Unregistered Network Coordinate</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              No registered public reticulation mains or municipal drinking water supply zone recorded for this queried location.
            </p>
            <div className="bg-white p-3 rounded border border-slate-200 text-slate-700 space-y-1 text-[11px]">
              <div><strong>Latitude:</strong> {selection.data?.lat?.toFixed(6)}</div>
              <div><strong>Longitude:</strong> {selection.data?.lng?.toFixed(6)}</div>
            </div>
            <p className="text-[11px] text-slate-500">
              For properties outside municipal networks, water supply is commonly serviced by private rainwater harvesting or on-site boreholes under regional environmental council rules.
            </p>
          </div>
        )}

        {/* 2. OFFICIAL DRINKING WATER SUPPLY ZONE VIEW */}
        {isZone && zone && (
          <div className="space-y-3">
            {/* Zone Identity Card */}
            <div className="bg-slate-50 border border-slate-200 rounded p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">Authoritative Auckland Supply Area</span>
                <span className="font-mono text-xs font-bold text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded border border-sky-200">
                  {zone.zoneId}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900 mt-1">{zone.zoneName}</div>
              <div className="text-xs text-slate-700 mt-1">
                Scheme: <strong>{zone.supplyName}</strong>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Operator: <strong>{zone.supplierName || 'Watercare Services Limited'}</strong>
              </div>
            </div>

            {/* Statutory Compliance & Quality Status */}
            <div className="border border-emerald-300 bg-emerald-50/70 rounded p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-700" />
                  <span>Statutory Compliance Status</span>
                </span>
                <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  {zone.complianceStatus || 'Compliant (Grade A1)'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-900 leading-relaxed">
                Registered under the <em>Water Services Act 2021</em> (Taumata Arowai Drinking Water Quality Assurance Rules).
              </p>
            </div>

            {/* Water Testing Records & Quality Information */}
            <div className="border border-slate-200 bg-white rounded p-3 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-[#071A35] flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-sky-700" />
                  <span>Water Testing & Quality Information</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  {zoneIncidents.length > 0 ? `${zoneIncidents.length} Active Notice(s)` : '0 Active Alerts'}
                </span>
              </div>

              {zoneIncidents.length > 0 ? (
                <div className="space-y-2">
                  {zoneIncidents.map((inc) => (
                    <div key={inc.id} className="p-2.5 rounded bg-amber-50/80 border border-amber-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-amber-900">{inc.id}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          inc.severity === 'critical' ? 'bg-red-600 text-white' : inc.severity === 'high' ? 'bg-orange-600 text-white' : 'bg-amber-600 text-white'
                        }`}>
                          {inc.status}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900">{inc.categoryLabel}</div>
                      <p className="text-[11px] text-slate-700">{inc.description}</p>
                      <div className="text-[10px] text-slate-600 flex flex-wrap gap-x-2">
                        <span><strong>Location:</strong> {inc.address}</span>
                        <span>&bull;</span>
                        <span><strong>Observed:</strong> {new Date(inc.observedAt).toLocaleDateString()}</span>
                      </div>
                      {inc.boilWaterAdvised && (
                        <div className="bg-red-100 text-red-900 text-[10px] font-bold px-2 py-1 rounded border border-red-200 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-700 shrink-0" />
                          <span>Precautionary Boil-Water Advisory In Effect</span>
                        </div>
                      )}
                      {inc.officerNotes && (
                        <div className="bg-white p-1.5 rounded border border-amber-100 text-[10px] text-slate-700">
                          <strong>Testing Dispatch / Officer Notes:</strong> {inc.officerNotes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-[11px]">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>No active contamination incidents or boil-water advisories.</span>
                  </div>
                  <div className="text-[11px] text-slate-600 leading-relaxed">
                    All statutory water-testing criteria currently meet Taumata Arowai standards.
                  </div>
                </div>
              )}

              {/* Statutory Testing Target Parameters */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Statutory Drinking Water Quality Targets (DWQAR)
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="bg-white p-1.5 rounded border border-slate-100">
                    <span className="text-slate-500 block text-[10px]">E. coli (Bacteria):</span>
                    <strong className="text-slate-800">&lt; 1 cfu / 100 mL</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-100">
                    <span className="text-slate-500 block text-[10px]">Turbidity Target:</span>
                    <strong className="text-slate-800">&lt; 0.50 NTU</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-100">
                    <span className="text-slate-500 block text-[10px]">Free Available Chlorine:</span>
                    <strong className="text-slate-800">0.20 – 2.00 mg/L</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-100">
                    <span className="text-slate-500 block text-[10px]">Target pH:</span>
                    <strong className="text-slate-800">7.0 – 8.5</strong>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-200/60">
                  Note: Real-time sensor streams require direct integration with Watercare SCADA telemetry / laboratory LIMS feeds.
                </div>
              </div>

              {/* Action Button */}
              {onReportIncident && (
                <button
                  type="button"
                  onClick={() => onReportIncident(zone.zoneName)}
                  className="w-full py-1.5 px-3 bg-sky-700 hover:bg-sky-800 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Report Water Quality Incident in this Zone</span>
                </button>
              )}
            </div>

            {/* Infrastructure Lineage */}
            {(zone.primaryDam || zone.treatmentPlant || zone.reservoir) && (
              <div className="border border-sky-200 bg-sky-50/60 rounded p-3 space-y-2 text-xs">
                <div className="font-bold text-[#071A35] text-xs">Drinking Water Infrastructure Lineage</div>
                <div className="space-y-1.5 text-slate-800">
                  {zone.primaryDam && (
                    <div>
                      <span className="text-slate-500">Primary Catchment Dam: </span>
                      <span className="font-semibold">{zone.primaryDam.name}</span>
                    </div>
                  )}
                  {zone.treatmentPlant && (
                    <div>
                      <span className="text-slate-500">Water Treatment Plant: </span>
                      <span className="font-semibold">{zone.treatmentPlant.name}</span>
                      <div className="text-[10px] text-emerald-700 font-medium">{zone.treatmentPlant.waterQualityGrade}</div>
                    </div>
                  )}
                  {zone.reservoir && (
                    <div>
                      <span className="text-slate-500">Distribution Reservoir: </span>
                      <span className="font-semibold">{zone.reservoir.name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Demographic & Spatial Coverage Register */}
            <div className="border border-slate-200 rounded p-3 text-xs space-y-2">
              <div className="font-semibold text-slate-900">Demographic & Spatial Coverage (Otago / ArcGIS)</div>
              <div className="space-y-1 text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Registered Population:</span>
                  <span className="font-mono font-semibold">{(zone.popRegist ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Classification:</span>
                  <span className="font-medium">{zone.urbanRural || 'Urban'} Standard</span>
                </div>
                {zone.popMaori !== undefined && zone.popMaori !== null && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Māori Population Count:</span>
                    <span className="font-mono font-medium">{(zone.popMaori ?? 0).toLocaleString()}</span>
                  </div>
                )}
                {zone.popLowDe !== undefined && zone.popLowDe !== null && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Deprivation Breakdown:</span>
                    <span className="font-mono text-[10px]">
                      Low: {(zone.popLowDe ?? 0).toLocaleString()} | Mod: {(zone.popModDe ?? 0).toLocaleString()} | High: {(zone.popHighDe ?? 0).toLocaleString()}
                    </span>
                  </div>
                )}
                {zone.shapeArea && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Area Coverage:</span>
                    <span className="font-mono font-semibold">{((zone.shapeArea || 0) / 1000000).toFixed(2)} km²</span>
                  </div>
                )}
                {zone.shapeLength && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Perimeter Length:</span>
                    <span className="font-mono font-semibold">{((zone.shapeLength || 0) / 1000).toFixed(2)} km</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-[10px] text-slate-500 italic p-1">
              Source: {zone.dataSource}
            </div>
          </div>
        )}

        {/* 3. PARCEL DETAIL VIEW */}
        {isParcel && parcel && (
          <>
            {/* Identification Card */}
            <div className="bg-slate-50 border border-slate-200 rounded p-3">
              <div className="text-[11px] text-slate-500 font-medium">Property Identification</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{parcel.fullAddress}</div>
              <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                <span><strong>Lot:</strong> {parcel.lotNumber}</span>
                <span>&bull;</span>
                <span><strong>Plan:</strong> {parcel.dpNumber}</span>
                <span>&bull;</span>
                <span><strong>Area:</strong> {parcel.areaM2} m²</span>
              </div>
              <div className="mt-2 text-xs">
                <span className="text-slate-500">Title Record: </span>
                <span className="font-mono font-medium text-slate-800">{parcel.titleReference}</span>
              </div>
            </div>

            {/* Allocated Supply Zone Traceability & Run Profile */}
            {parcelProfile && (
              <div className="border border-sky-300 bg-sky-50/80 rounded p-3 space-y-2.5">
                <div className="flex items-center justify-between border-b border-sky-200 pb-1.5">
                  <span className="text-xs font-bold text-[#071A35] flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-sky-700" />
                    <span>Allocated Supply Zone</span>
                  </span>
                  <span className="font-mono font-bold text-[10px] bg-sky-700 text-white px-2 py-0.5 rounded">
                    {parcelProfile.allocatedZoneId}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="font-bold text-slate-900">{parcelProfile.allocatedZoneName}</div>
                  <div className="text-[11px] text-slate-600">Scheme: {parcelProfile.supplyName}</div>
                </div>

                {/* Distance & Transit Time */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border border-sky-100">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Zone Distance</span>
                    <strong className="text-sm text-slate-900 font-extrabold">{parcelProfile.distanceKm} km</strong>
                  </div>
                  <div className="bg-white p-2 rounded border border-sky-100">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Mains Transit</span>
                    <strong className="text-sm text-slate-900 font-extrabold">{parcelProfile.transitTimeFormatted}</strong>
                  </div>
                </div>

                {/* Run Profile Action */}
                <button
                  type="button"
                  onClick={handleRunDrawerProfile}
                  disabled={isRunningProfile}
                  className={`w-full py-2 px-3 rounded font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isRunningProfile
                      ? 'bg-slate-400 text-white cursor-not-allowed'
                      : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                  }`}
                >
                  {isRunningProfile ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Simulating Profile...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white text-white" />
                      <span>Run Profile (Water Testing)</span>
                    </>
                  )}
                </button>

                {/* Simulated Metrics Card */}
                <div className="bg-white p-2 rounded border border-sky-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 border-b border-slate-100 pb-1">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3 text-sky-600" />
                      <span>Hydraulic & Quality Testing</span>
                    </span>
                    <span className="text-emerald-700 font-bold">{parcelProfile.complianceStatus} (Grade A1)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <div>Pressure: <strong>{parcelProfile.pressurePsi} PSI</strong> <span className="text-[9px] text-slate-400 font-mono">({parcelProfile.pressureKPa} kPa)</span></div>
                    <div>pH Target: <strong>{parcelProfile.ph}</strong></div>
                    <div>Free Chlorine: <strong>{parcelProfile.chlorineMgL} mg/L</strong></div>
                    <div>Turbidity: <strong>{parcelProfile.turbidityNtu} NTU</strong></div>
                  </div>

                  <a
                    href={parcelProfile.googleMapsDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full mt-1 pt-1 border-t border-slate-100 flex items-center justify-center gap-1 text-[10px] font-bold text-blue-700 hover:text-blue-900"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>View Driving Route on Google Maps</span>
                  </a>
                </div>
              </div>
            )}

            {/* Drinking Water Supply Lineage */}
            {parcel.waterLineage && (
              <div className="border border-sky-300 bg-sky-50/70 rounded p-3 space-y-2.5">
                <div className="text-xs font-bold text-[#071A35] flex items-center justify-between border-b border-sky-200 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Droplet className="w-4 h-4 text-sky-700" />
                    <span>Drinking Water Supply Lineage</span>
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-white p-2 rounded border border-sky-100">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Connected Reticulation Main</div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {parcel.waterLineage.streetMain.nominalDiaMm}mm {parcel.waterLineage.streetMain.material} Main
                    </div>
                    {accessLevel !== 'citizen' && (
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        COMPKEY: #{parcel.waterLineage.streetMain.compkey}
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-2 rounded border border-sky-100">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Source Catchment Dam</div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {parcel.waterLineage.sourceDam.name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {parcel.waterLineage.sourceDam.catchment} ({parcel.waterLineage.sourceDam.capacityML.toLocaleString()} ML capacity)
                    </div>
                  </div>

                  <div className="bg-white p-2 rounded border border-sky-100">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Treatment & Storage</div>
                    <div className="text-xs text-slate-900 font-semibold mt-0.5">
                      {parcel.waterLineage.treatmentPlant.name}
                    </div>
                    <div className="text-[10px] text-emerald-700">
                      {parcel.waterLineage.treatmentPlant.waterQualityGrade}
                    </div>
                    <div className="text-[11px] text-slate-700 mt-1">
                      Balancing Reservoir: <strong>{parcel.waterLineage.reservoir.name}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Citizen View */}
            {accessLevel === 'citizen' && (
              <div className="space-y-3">
                <div className="border border-emerald-200 bg-emerald-50/50 rounded p-3">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-semibold text-xs mb-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Public Water Reticulation Status</span>
                  </div>
                  <div className="text-xs text-emerald-950 space-y-1">
                    <div className="flex justify-between py-0.5 border-b border-emerald-100">
                      <span>Drinking Water:</span>
                      <span className="font-semibold text-emerald-700">Connected & Operational</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span>Outage / Boil Water Status:</span>
                      <span className="font-semibold text-emerald-700">{parcel.services.outageStatus}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded p-3 space-y-2 text-xs">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Resident Essentials</span>
                  </div>
                  <div className="text-slate-600 space-y-1 text-[11px]">
                    <div><strong>Rubbish Collection:</strong> {parcel.services.rubbishCollectionDay}</div>
                    <div><strong>Water Meter Location:</strong> {parcel.services.meterLocationDescription}</div>
                  </div>
                </div>

                {onReportIncident && (
                  <button
                    type="button"
                    onClick={() => onReportIncident(parcel.fullAddress)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-[#071A35] font-bold rounded text-xs transition-colors shadow-xs"
                  >
                    <AlertTriangle className="w-4 h-4 text-[#071A35]" />
                    <span>Report Water Incident / Contamination Here</span>
                  </button>
                )}
              </div>
            )}

            {/* Official & Admin View */}
            {accessLevel !== 'citizen' && (
              <div className="space-y-3">
                <div className="border border-slate-200 rounded p-3 text-xs space-y-2">
                  <div className="font-bold text-[#071A35]">Regulatory Asset Attributes</div>
                  <div className="space-y-1.5 text-slate-800">
                    <div className="flex justify-between py-0.5 border-b border-slate-100">
                      <span className="text-slate-500">Connection COMPKEY:</span>
                      <span className="font-mono font-bold text-slate-900">{parcel.engineerData.pipeConnectionCompkey}</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-slate-100">
                      <span className="text-slate-500">Meter Serial Number:</span>
                      <span className="font-mono">{parcel.engineerData.meterSerialNumber}</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-slate-100">
                      <span className="text-slate-500">Meter Size & Read:</span>
                      <span>{parcel.engineerData.meterSizeMm}mm &bull; {parcel.engineerData.meterLastReadM3} m³</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-slate-100">
                      <span className="text-slate-500">Static Head Pressure:</span>
                      <span>{parcel.engineerData.staticPressureKPa} kPa</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500">Sewer Subcatchment:</span>
                      <span className="font-mono">{parcel.engineerData.sewerSubcatchmentId}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded p-3 text-xs space-y-1.5">
                  <div className="font-semibold text-slate-900">Planning & Catchment Controls</div>
                  <div className="text-[11px] text-slate-600 space-y-1">
                    <div><strong>Zoning:</strong> {parcel.zoneCode} - {parcel.zoneName}</div>
                    <div><strong>Max Building Height:</strong> {parcel.planning.maxHeightM}m</div>
                    <div><strong>Flood Risk:</strong> {parcel.planning.floodRisk}</div>
                    <div><strong>Catchment:</strong> {parcel.planning.catchmentZone}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-[10px] text-slate-500 italic p-1">
              Source: {parcel.dataSource}
            </div>
          </>
        )}

        {/* 4. PIPE DETAIL VIEW */}
        {isPipe && pipe && (
          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-200 rounded p-3">
              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                {pipe.assetType === 'water' ? 'Potable Water Asset' : pipe.assetType === 'wastewater' ? 'Wastewater Asset' : 'Stormwater Asset'}
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {pipe.nomDiaMm}mm {pipe.material} {pipe.process}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Status: <span className="font-semibold text-emerald-700">{pipe.status}</span>
              </div>
            </div>

            {accessLevel === 'citizen' ? (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded text-xs text-slate-700">
                This pipe is a registered public municipal asset servicing connected properties in this street.
              </div>
            ) : (
              <div className="border border-slate-200 rounded overflow-hidden">
                <div className="bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-800 border-b border-slate-200">
                  Watercare Asset Registry
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-500 font-medium">COMPKEY</td>
                      <td className="px-3 py-2 font-mono font-bold text-slate-900">{pipe.compkey}</td>
                    </tr>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <td className="px-3 py-2 text-slate-500 font-medium">MATERIAL</td>
                      <td className="px-3 py-2 font-semibold text-slate-800">{pipe.material}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-500 font-medium">NOM DIA (MM)</td>
                      <td className="px-3 py-2 font-bold text-slate-900">{pipe.nomDiaMm}</td>
                    </tr>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <td className="px-3 py-2 text-slate-500 font-medium">PROCESS</td>
                      <td className="px-3 py-2 text-slate-800">{pipe.process}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-500 font-medium">PRESSURE CLASS</td>
                      <td className="px-3 py-2 text-slate-800">{pipe.pressureRating}</td>
                    </tr>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <td className="px-3 py-2 text-slate-500 font-medium">INVERT DEPTH</td>
                      <td className="px-3 py-2 text-slate-800">{pipe.depthM} meters</td>
                    </tr>
                    {pipe.cctvScore && (
                      <tr>
                        <td className="px-3 py-2 text-slate-500 font-medium">CCTV SCORE</td>
                        <td className="px-3 py-2 font-semibold">Grade {pipe.cctvScore} / 5</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-[10px] text-slate-500 italic p-1">
              Source: {pipe.dataSource}
            </div>
          </div>
        )}

        {/* 5. FITTING VIEW */}
        {isFitting && fitting && (
          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-200 rounded p-3">
              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{fitting.network}</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{fitting.label}</div>
              <div className="text-xs text-slate-600 mt-1">Status: {fitting.status}</div>
            </div>

            <div className="border border-slate-200 rounded p-3 text-xs space-y-2">
              <div className="font-semibold text-slate-900">Fitting Attributes</div>
              <div className="space-y-1 text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Asset Type:</span>
                  <span className="capitalize">{fitting.type.replace('_', ' ')}</span>
                </div>
                {fitting.nomDiaMm && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Nominal Diameter:</span>
                    <span className="font-bold">{fitting.nomDiaMm} mm</span>
                  </div>
                )}
                {accessLevel !== 'citizen' && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">COMPKEY:</span>
                    <span className="font-mono font-bold text-[#071A35]">#{fitting.compkey}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-[10px] text-slate-500 italic p-1">
              Source: {fitting.dataSource}
            </div>
          </div>
        )}

      </div>

      {/* Drawer Footer Actions */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => {
            if (isParcel && parcel) onLocateAsset(parcel.center);
            else if (isPipe && pipe) onLocateAsset(pipe.coordinates[0]);
            else if (isFitting && fitting) onLocateAsset(fitting.position);
            else if (isZone && zone) onLocateAsset([zone.lat, zone.lng]);
          }}
          className="text-sky-800 hover:text-sky-950 font-semibold flex items-center gap-1"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Zoom to Asset Location</span>
        </button>
        <span className="text-[10px] text-slate-400 font-mono">
          Taumata Arowai GIS
        </span>
      </div>
    </aside>
  );
};
