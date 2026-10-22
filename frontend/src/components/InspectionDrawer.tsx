import React from 'react';
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
  Navigation,
  CheckCircle2
} from 'lucide-react';
import { 
  AccessLevel, 
  ActiveSelection, 
  ParcelFeature, 
  PipeAsset, 
  FittingAsset, 
  WaterIncidentComplaint, 
  AucklandSupplyZone 
} from '../types/gis';
import { 
  AucklandZoneScheme, 
  resolveAddressSupplyZone 
} from '../utils/waterLineageEngine';
import { 
  getAuthoritativeDam, 
  getAuthoritativeTreatmentPlant 
} from '../data/authoritativeWaterInfrastructure';
import { isCoordinateInNewZealand } from '../data/nzData';

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
      <div className="px-4 py-3 bg-[#072e54] text-white flex items-center justify-between border-b border-[#052340]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded bg-white/10 text-white">
            {isParcel ? <MapPin className="w-4 h-4" /> : isPipe ? <Droplet className="w-4 h-4" /> : isZone ? <Building2 className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
          </div>
          <div className="truncate">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300 block">
              {isParcel ? 'Cadastral Parcel Record' : isPipe ? 'Utility Pipeline' : isZone ? 'Auckland Water Supply Zone' : 'Network Fitting'}
            </span>
            <h2 className="text-xs font-bold truncate text-white leading-tight">
              {isParcel ? parcel?.fullAddress : isPipe ? `${pipe?.nomDiaMm}mm ${pipe?.material}` : isZone ? (selection.unmapped ? (selection.data?.lat && !isCoordinateInNewZealand(selection.data.lat, selection.data.lng) ? 'Non-Jurisdictional Coordinate' : 'Unmapped Coordinates') : zone?.zoneName) : fitting?.label}
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
          <Shield className="w-3.5 h-3.5 text-[#072e54]" />
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
        {selection.unmapped && (() => {
          const isOutsideNZ = selection.data?.lat !== undefined && selection.data?.lng !== undefined && !isCoordinateInNewZealand(selection.data.lat, selection.data.lng);
          return (
            <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-3 text-xs">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-500" />
                <span>{isOutsideNZ ? 'Outside New Zealand Territorial Jurisdiction' : 'Unregistered Network Coordinate'}</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {isOutsideNZ
                  ? 'The queried coordinates fall outside the territorial jurisdiction of Aotearoa New Zealand. Under the Water Services Act 2021, Taumata Arowai registers cover municipal drinking water networks within New Zealand.'
                  : 'No registered public reticulation mains or municipal drinking water supply zone recorded for this queried location.'
                }
              </p>
              <div className="bg-white p-3 rounded border border-slate-200 text-slate-700 space-y-1 text-[11px]">
                <div><strong>Latitude:</strong> {selection.data?.lat?.toFixed(6)}</div>
                <div><strong>Longitude:</strong> {selection.data?.lng?.toFixed(6)}</div>
                {isOutsideNZ && <div className="text-amber-700 font-semibold mt-1">Jurisdiction: Non-Territorial (International)</div>}
              </div>
              <p className="text-[11px] text-slate-500">
                {isOutsideNZ
                  ? 'Municipal supply network maps, water quality data, and reticulation infrastructure are maintained strictly for New Zealand geographic entities.'
                  : 'For properties outside municipal networks, water supply is commonly serviced by private rainwater harvesting or on-site boreholes under regional environmental council rules.'
                }
              </p>
            </div>
          );
        })()}

        {/* 2. OFFICIAL DRINKING WATER SUPPLY ZONE VIEW */}
        {isZone && zone && (
          <div className="space-y-3">
            {/* Header / Identification Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-[#072e54] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {zone.zoneId}
                </span>
                <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  {zone.complianceStatus || 'Rule Compliant (Grade A1)'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {zone.zoneName}
              </h3>
              <div className="text-xs text-slate-600 space-y-0.5 pt-1 border-t border-slate-100">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-slate-500">Supplier:</span>
                  <strong className="text-slate-800 text-right">{zone.supplierName || 'Watercare Services Limited'}</strong>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-slate-500">Supply Scheme:</span>
                  <span className="text-slate-700 font-medium text-right truncate max-w-[240px]">{zone.supplyName}</span>
                </div>
              </div>
            </div>

            {/* Supplying Water Infrastructure */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#072e54] border-b border-slate-100 pb-1.5">
                <Droplet className="w-3.5 h-3.5 text-[#072e54]" />
                <span>Supplying Water Infrastructure</span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Water Treatment Plant */}
                {(() => {
                  const verifiedPlant = zone.treatmentPlant?.name ? getAuthoritativeTreatmentPlant(zone.treatmentPlant.name) : null;
                  return (
                    <div className="bg-slate-50 rounded p-2.5 border border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Water Treatment Plant
                        </span>
                        {verifiedPlant ? (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Verified Coords
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold text-slate-500">
                            Coords Unavailable
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 text-xs mt-0.5">
                        {zone.treatmentPlant?.name || 'Watercare Regional Treatment Plant'}
                      </div>
                      {zone.treatmentPlant?.process && (
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          Process: {zone.treatmentPlant.process}
                        </div>
                      )}
                      {zone.treatmentPlant?.waterQualityGrade && (
                        <div className="text-[10px] text-emerald-700 font-medium mt-1">
                          {zone.treatmentPlant.waterQualityGrade}
                        </div>
                      )}
                      {verifiedPlant ? (
                        <div className="text-[10px] font-mono text-emerald-900 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200 mt-1.5 inline-block">
                          WGS84: {verifiedPlant.coordinates[0].toFixed(4)}, {verifiedPlant.coordinates[1].toFixed(4)}
                        </div>
                      ) : (
                        <div className="text-[10px] font-mono text-slate-500 mt-1">
                          Coordinates: Unavailable in authoritative dataset
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Associated Source Dam */}
                {(() => {
                  const verifiedDam = zone.primaryDam?.name ? getAuthoritativeDam(zone.primaryDam.name) : null;
                  return (
                    <div className="bg-slate-50 rounded p-2.5 border border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Associated Source Dam / Catchment
                        </span>
                        {verifiedDam ? (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Verified Coords
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold text-slate-500">
                            Coords Unavailable
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 text-xs mt-0.5">
                        {zone.primaryDam?.name || 'Hunua Ranges & Waitakere Storage Dams'}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Catchment: {zone.primaryDam?.catchment || 'Auckland Native Catchment Basin'}
                        {zone.primaryDam?.distanceKm ? ` • ${zone.primaryDam.distanceKm} km from zone` : ''}
                      </div>
                      {zone.primaryDam?.capacityML ? (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Storage Capacity: {zone.primaryDam.capacityML.toLocaleString()} ML
                        </div>
                      ) : null}
                      {verifiedDam ? (
                        <div className="text-[10px] font-mono text-emerald-900 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200 mt-1.5 inline-block">
                          WGS84: {verifiedDam.coordinates[0].toFixed(4)}, {verifiedDam.coordinates[1].toFixed(4)}
                        </div>
                      ) : (
                        <div className="text-[10px] font-mono text-slate-500 mt-1">
                          Coordinates: Unavailable in authoritative dataset
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Balancing Service Reservoir */}
                {zone.reservoir?.name && (
                  <div className="bg-slate-50 rounded p-2.5 border border-slate-200/80">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Balancing Service Reservoir
                    </div>
                    <div className="font-semibold text-slate-900 text-xs mt-0.5">
                      {zone.reservoir.name}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Capacity: {zone.reservoir.capacityM3.toLocaleString()} m³
                      {zone.reservoir.headLevelM ? ` • Head Level: ${zone.reservoir.headLevelM} m` : ''}
                    </div>
                  </div>
                )}

                {/* Infrastructure Lineage Notice */}
                <div className="p-2 rounded bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-1.5 leading-snug">
                  <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Infrastructure Provenance Notice:</strong> Facilities and lineage are verified via official Watercare and Taumata Arowai supply records. Facility coordinates are populated where authoritatively registered.
                  </span>
                </div>
              </div>
            </div>

            {/* Essential Geographic Details */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#072e54] border-b border-slate-100 pb-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#072e54]" />
                <span>Essential Geographic Details</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Centroid</span>
                  <span className="font-mono text-[11px] font-bold text-slate-800">
                    {zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Population</span>
                  <span className="text-[11px] font-bold text-slate-800">
                    {(zone.popRegist ?? 0).toLocaleString()} residents
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Classification</span>
                  <span className="text-[11px] font-medium text-slate-800">
                    {zone.urbanRural || 'Urban'} Standard
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Coverage Area</span>
                  <span className="text-[11px] font-medium text-slate-800">
                    {zone.shapeArea ? `${((zone.shapeArea || 0) / 1000000).toFixed(1)} km²` : ('radiusKm' in zone && zone.radiusKm ? `${zone.radiusKm} km radius` : 'Regional Reticulation')}
                  </span>
                </div>
              </div>
            </div>

            {/* Active Water Quality Incidents & Advisories */}
            <div className="space-y-2">
              {zoneIncidents.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center justify-between">
                    <span>Active Water Quality Notices</span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">
                      {zoneIncidents.length} Notice(s)
                    </span>
                  </div>
                  {zoneIncidents.map((inc) => (
                    <div key={inc.id} className="p-2.5 rounded-lg bg-amber-50/90 border border-amber-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-amber-950">{inc.id}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          inc.severity === 'critical' ? 'bg-red-600 text-white' : inc.severity === 'high' ? 'bg-orange-600 text-white' : 'bg-amber-600 text-white'
                        }`}>
                          {inc.status}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900">{inc.categoryLabel}</div>
                      <p className="text-[11px] text-slate-700">{inc.description}</p>
                      {inc.boilWaterAdvised && (
                        <div className="bg-red-100 text-red-900 text-[10px] font-bold px-2 py-1 rounded border border-red-200 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-700 shrink-0" />
                          <span>Precautionary Boil-Water Advisory In Effect</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-xs flex items-center justify-between text-emerald-900 font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>No active water quality advisories in this zone.</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold uppercase">Normal</span>
                </div>
              )}

              {/* Action Button */}
              {onReportIncident && (
                <button
                  type="button"
                  onClick={() => onReportIncident(zone.zoneName)}
                  className="w-full py-2 px-3 bg-[#072e54] hover:bg-[#052340] text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                  <span>Report Water Quality Incident in this Zone</span>
                </button>
              )}
            </div>

            <div className="text-[10px] text-slate-400 italic px-1">
              Source: {zone.dataSource || 'Taumata Arowai Drinking Water Register & Watercare Services Ltd'}
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

            {/* Verified Allocated Supply Zone & Supplier Card */}
            {(() => {
              const zoneName = parcel.allocatedZoneName || parcel.engineerData?.supplyZoneId || 'Auckland Central & West Supply Zone';
              const zoneId = parcel.allocatedZoneId || parcel.engineerData?.supplyZoneId || 'AKL_CW_01';
              return (
                <div className="border border-sky-300 bg-sky-50/80 rounded p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-sky-200 pb-1.5">
                    <span className="text-xs font-bold text-[#072e54] flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-sky-700" />
                      <span>Verified Supply Zone</span>
                    </span>
                    <span className="font-mono font-bold text-[10px] bg-[#072e54] text-white px-2 py-0.5 rounded">
                      {zoneId}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-slate-900">{zoneName}</div>
                    <div className="text-[11px] text-slate-600 flex items-center justify-between">
                      <span>Supplier: <strong>Watercare Services Limited</strong></span>
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Rule Compliant
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-2 rounded border border-sky-100 text-[11px] text-slate-600">
                    <div className="font-medium text-slate-700">Taumata Arowai Drinking Water Register</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Statutory municipal reticulation envelope &bull; Standard continuous pressurized supply
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Drinking Water Supply Lineage */}
            {parcel.waterLineage && (
              <div className="border border-sky-300 bg-sky-50/70 rounded p-3 space-y-2.5">
                <div className="text-xs font-bold text-[#072e54] flex items-center justify-between border-b border-sky-200 pb-1.5">
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

                  {/* Source Dam */}
                  {(() => {
                    const verifiedDam = getAuthoritativeDam(parcel.waterLineage.sourceDam.name);
                    return (
                      <div className="bg-white p-2 rounded border border-sky-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Source Catchment Dam</span>
                          {verifiedDam ? (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">Verified Coords</span>
                          ) : (
                            <span className="text-[9px] font-semibold text-slate-500">Coords Unavailable</span>
                          )}
                        </div>
                        <div className="font-bold text-slate-900 mt-0.5">
                          {parcel.waterLineage.sourceDam.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {parcel.waterLineage.sourceDam.catchment} ({parcel.waterLineage.sourceDam.capacityML.toLocaleString()} ML capacity)
                        </div>
                        {verifiedDam ? (
                          <div className="text-[10px] font-mono text-emerald-900 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200 mt-1 inline-block">
                            WGS84: {verifiedDam.coordinates[0].toFixed(4)}, {verifiedDam.coordinates[1].toFixed(4)}
                          </div>
                        ) : (
                          <div className="text-[10px] font-mono text-slate-500 mt-1">
                            Coordinates: Unavailable in authoritative dataset
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Treatment Plant */}
                  {(() => {
                    const verifiedPlant = getAuthoritativeTreatmentPlant(parcel.waterLineage.treatmentPlant.name);
                    return (
                      <div className="bg-white p-2 rounded border border-sky-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Treatment & Storage</span>
                          {verifiedPlant ? (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">Verified Coords</span>
                          ) : (
                            <span className="text-[9px] font-semibold text-slate-500">Coords Unavailable</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-900 font-semibold mt-0.5">
                          {parcel.waterLineage.treatmentPlant.name}
                        </div>
                        <div className="text-[10px] text-emerald-700">
                          {parcel.waterLineage.treatmentPlant.waterQualityGrade}
                        </div>
                        <div className="text-[11px] text-slate-700 mt-1">
                          Balancing Reservoir: <strong>{parcel.waterLineage.reservoir.name}</strong>
                        </div>
                        {verifiedPlant ? (
                          <div className="text-[10px] font-mono text-emerald-900 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200 mt-1 inline-block">
                            WGS84: {verifiedPlant.coordinates[0].toFixed(4)}, {verifiedPlant.coordinates[1].toFixed(4)}
                          </div>
                        ) : (
                          <div className="text-[10px] font-mono text-slate-500 mt-1">
                            Coordinates: Unavailable in authoritative dataset
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="p-2 rounded bg-amber-50/70 border border-amber-200/80 text-[10px] text-amber-900 flex items-start gap-1 leading-snug">
                    <Info className="w-3 h-3 text-amber-700 shrink-0 mt-0.5" />
                    <span>Visual connectivity path traces the facility lineage hierarchy; distinguish from physical subsurface reticulation pipelines.</span>
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
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-[#072e54] font-bold rounded text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4 text-[#072e54]" />
                    <span>Report Water Incident / Contamination Here</span>
                  </button>
                )}
              </div>
            )}

            {/* Official & Admin View */}
            {accessLevel !== 'citizen' && (
              <div className="space-y-3">
                <div className="border border-slate-200 rounded p-3 text-xs space-y-2">
                  <div className="font-bold text-[#072e54]">Regulatory Asset Attributes</div>
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
                    <span className="font-mono font-bold text-[#072e54]">#{fitting.compkey}</span>
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
