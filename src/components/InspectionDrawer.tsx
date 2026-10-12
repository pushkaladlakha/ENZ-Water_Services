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
  AlertTriangle
} from 'lucide-react';
import { AccessLevel, ActiveSelection, ParcelFeature, PipeAsset, FittingAsset } from '../types/gis';
import { AucklandZoneScheme } from '../utils/waterLineageEngine';

interface InspectionDrawerProps {
  selection: ActiveSelection | null;
  accessLevel: AccessLevel;
  onClose: () => void;
  onLocateAsset: (coords: [number, number]) => void;
  onReportIncident?: (address?: string) => void;
}

export const InspectionDrawer: React.FC<InspectionDrawerProps> = ({
  selection,
  accessLevel,
  onClose,
  onLocateAsset,
  onReportIncident,
}) => {
  if (!selection) return null;

  const isParcel = selection.type === 'parcel';
  const parcel = isParcel ? (selection.data as ParcelFeature) : null;
  const isPipe = selection.type === 'pipe';
  const pipe = isPipe ? (selection.data as PipeAsset) : null;
  const isFitting = selection.type === 'fitting';
  const fitting = isFitting ? (selection.data as FittingAsset) : null;
  const isZone = selection.type === 'supply_zone';
  const zone = isZone && !selection.unmapped ? (selection.data as AucklandZoneScheme) : null;

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
              {isParcel ? 'Cadastral Parcel Record' : isPipe ? 'Utility Pipeline' : isZone ? 'Drinking Water Supply Zone' : 'Network Fitting'}
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
            <div className="bg-slate-50 border border-slate-200 rounded p-3">
              <div className="text-[11px] text-slate-500 font-medium">Official Water Supply Zone</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{zone.zoneName}</div>
              <div className="text-xs text-slate-700 mt-1">
                Supply Scheme: <strong>{zone.supplyName}</strong>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Zone Identifier: <span className="font-mono font-semibold text-slate-800">{zone.zoneId}</span>
              </div>
            </div>

            <div className="border border-sky-200 bg-sky-50/60 rounded p-3 space-y-2 text-xs">
              <div className="font-bold text-[#071A35] text-xs">Drinking Water Infrastructure Lineage</div>
              <div className="space-y-1.5 text-slate-800">
                <div>
                  <span className="text-slate-500">Primary Catchment Dam: </span>
                  <span className="font-semibold">{zone.primaryDam.name}</span>
                </div>
                <div>
                  <span className="text-slate-500">Water Treatment Plant: </span>
                  <span className="font-semibold">{zone.treatmentPlant.name}</span>
                  <div className="text-[10px] text-emerald-700 font-medium">{zone.treatmentPlant.waterQualityGrade}</div>
                </div>
                <div>
                  <span className="text-slate-500">Distribution Reservoir: </span>
                  <span className="font-semibold">{zone.reservoir.name}</span>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded p-3 text-xs space-y-2">
              <div className="font-semibold text-slate-900">Demographic & Coverage Register</div>
              <div className="space-y-1 text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Registered Population:</span>
                  <span className="font-mono font-semibold">{zone.popRegist.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Classification:</span>
                  <span className="font-medium">{zone.urbanRural} Standard</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Māori Population Count:</span>
                  <span className="font-mono font-medium">{zone.popMaori.toLocaleString()}</span>
                </div>
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
