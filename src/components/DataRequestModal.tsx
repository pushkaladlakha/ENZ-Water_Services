import React, { useState } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  FileText, 
  Sparkles, 
  Trash2, 
  Play, 
  Check, 
  ShieldCheck, 
  Info,
  FileCheck,
  Lock
} from 'lucide-react';
import { AuthUser } from '../types/gis';
import { 
  convertArcGisJsonToGeoJson, 
  AKL_DIZZY_SUPPLY_ZONES_BASELINE,
  AUCKLAND_ZONE_LIST_CSV,
  parseDelimitedTextToGeoJson
} from '../data/watercareOpenData';
import { TaumataArowaiLogo } from './TaumataArowaiLogo';

interface DataRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadCustomGeoJson: (data: any) => void;
  onClearCustomData?: () => void;
  hasCustomData?: boolean;
  onOpenDocumentation?: () => void;
  currentUser?: AuthUser | null;
}

export const DataRequestModal: React.FC<DataRequestModalProps> = ({
  isOpen,
  onClose,
  onLoadCustomGeoJson,
  onClearCustomData,
  hasCustomData = false,
  onOpenDocumentation,
  currentUser = null,
}) => {
  const [activeTab, setActiveTab] = useState<'required-inputs' | 'paste-raw' | 'authoritative-baseline'>('required-inputs');

  // Input 1: AklDizzy Spatial Data state
  const [aklDizzyFile, setAklDizzyFile] = useState<File | null>(null);
  const [aklDizzyData, setAklDizzyData] = useState<any | null>(null);
  const [aklDizzyValidation, setAklDizzyValidation] = useState<{
    valid: boolean;
    featureCount: number;
    foundFields: string[];
    missingFields: string[];
    crsStatus: string;
    sampleZoneId?: string;
  } | null>(null);

  // Input 2: Auckland Zone List state
  const [zoneListFile, setZoneListFile] = useState<File | null>(null);
  const [zoneListData, setZoneListData] = useState<any | null>(null);
  const [zoneListValidation, setZoneListValidation] = useState<{
    valid: boolean;
    rowCount: number;
    foundFields: string[];
    missingFields: string[];
    crsStatus: string;
    sampleScheme?: string;
  } | null>(null);

  // Raw paste state
  const [rawText, setRawText] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'official';

  // Validate AklDizzy spatial features
  const validateAklDizzy = (geojson: any) => {
    if (!geojson || !geojson.features || !Array.isArray(geojson.features) || geojson.features.length === 0) {
      throw new Error('Not a valid GeoJSON FeatureCollection or no spatial features found.');
    }

    const firstFeature = geojson.features[0];
    const coords = firstFeature?.geometry?.coordinates;
    let crsValid = 'WGS84 (EPSG:4326)';

    // CRS validation check: If coordinates are in millions (e.g. 1750000, 5910000), they are projected NZTM/WebMercator
    if (coords) {
      let testCoord: any = coords;
      while (Array.isArray(testCoord) && Array.isArray(testCoord[0])) {
        testCoord = testCoord[0];
      }
      if (Array.isArray(testCoord) && testCoord.length >= 2) {
        const x = Number(testCoord[0]);
        const y = Number(testCoord[1]);
        if (Math.abs(x) > 180 || Math.abs(y) > 90) {
          crsValid = 'Projected Coordinates (EPSG:3857 or 2193) - Export to EPSG:4326 required';
        }
      }
    }

    const sampleProps = firstFeature.properties || {};
    const sampleKeys = Object.keys(sampleProps).map(k => k.toLowerCase());
    const requiredFields = ['zone'];
    const recommendedFields = ['pop_regist', 'pop_low_de', 'pop_mod_de', 'pop_high_d', 'pop_maori'];
    const allExpected = [...requiredFields, ...recommendedFields];

    const foundFields = allExpected.filter(f => sampleKeys.includes(f));
    const missingFields = requiredFields.filter(f => !sampleKeys.includes(f));

    return {
      valid: missingFields.length === 0,
      featureCount: geojson.features.length,
      foundFields,
      missingFields,
      crsStatus: crsValid,
      sampleZoneId: sampleProps.zone || sampleProps.Zone || 'AKL-SZ-14',
    };
  };

  // Validate Zone List CSV
  const validateZoneList = (text: string) => {
    const lines = text.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('CSV file must contain a header row and at least 1 data row.');
    }

    const header = lines[0].toLowerCase();
    const required = ['zone id', 'supply id', 'supply name'];
    const optional = ['zone name', 'zone population', 'urban/rural zone', 'supply latitude', 'supply longitude'];
    
    const foundFields = [...required, ...optional].filter(f => header.includes(f.replace(/\s+/g, '')) || header.includes(f));
    const missingFields = required.filter(f => !header.includes(f.replace(/\s+/g, '')) && !header.includes(f));

    return {
      valid: missingFields.length === 0,
      rowCount: lines.length - 1,
      foundFields,
      missingFields,
      crsStatus: header.includes('latitude') ? 'Decimal Degrees (WGS84)' : 'No coordinates column detected',
      sampleScheme: lines[1].split(',')[3] || 'Auckland Metro Scheme',
    };
  };

  // Handle AklDizzy file upload
  const handleAklDizzyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAklDizzyFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        let parsed = JSON.parse(text);
        if (parsed.type !== 'FeatureCollection') {
          parsed = convertArcGisJsonToGeoJson(parsed);
        }

        const validation = validateAklDizzy(parsed);
        setAklDizzyData(parsed);
        setAklDizzyValidation(validation);
        setStatusMessage({
          text: `AklDizzy layer validated: ${validation.featureCount} supply zone polygons verified. Ready for commit.`,
          isError: false,
        });
      } catch (err: any) {
        setAklDizzyData(null);
        setAklDizzyValidation(null);
        setStatusMessage({
          text: `AklDizzy Validation Failed: ${err.message}. Provide a valid GeoJSON FeatureCollection in EPSG:4326.`,
          isError: true,
        });
      }
    };
    reader.readAsText(file);
  };

  // Handle Zone List file upload
  const handleZoneListUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setZoneListFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const validation = validateZoneList(text);
        const geojson = parseDelimitedTextToGeoJson(text);

        setZoneListData(geojson);
        setZoneListValidation(validation);
        setStatusMessage({
          text: `Auckland Zone List validated: ${validation.rowCount} supply schemes verified. Ready for commit.`,
          isError: false,
        });
      } catch (err: any) {
        setZoneListData(null);
        setZoneListValidation(null);
        setStatusMessage({
          text: `Zone List Validation Failed: ${err.message}. Ensure CSV contains Zone ID, Supply ID, and Supply Name columns.`,
          isError: true,
        });
      }
    };
    reader.readAsText(file);
  };

  // Apply loaded data to map
  const handleApplyData = () => {
    try {
      if (aklDizzyData && zoneListData) {
        const combined = {
          type: 'FeatureCollection',
          features: [...aklDizzyData.features, ...zoneListData.features],
        };
        onLoadCustomGeoJson(combined);
        setStatusMessage({
          text: `Committed ${aklDizzyData.features.length} supply zones joined with ${zoneListData.features.length} scheme points.`,
          isError: false,
        });
      } else if (aklDizzyData) {
        onLoadCustomGeoJson(aklDizzyData);
        setStatusMessage({
          text: `Committed ${aklDizzyData.features.length} supply zone polygons to active map layer.`,
          isError: false,
        });
      } else if (zoneListData) {
        onLoadCustomGeoJson(zoneListData);
        setStatusMessage({
          text: `Committed ${zoneListData.features.length} scheme points to active map layer.`,
          isError: false,
        });
      } else {
        setStatusMessage({
          text: 'Upload at least one verified file or activate the authoritative baseline dataset.',
          isError: true,
        });
        return;
      }

      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, 1000);
    } catch (err: any) {
      setStatusMessage({
        text: `Error committing data: ${err.message}`,
        isError: true,
      });
    }
  };

  // Quick Load Authoritative Baseline Data
  const handleLoadBaselineSample = () => {
    try {
      const zones = AKL_DIZZY_SUPPLY_ZONES_BASELINE;
      const list = parseDelimitedTextToGeoJson(AUCKLAND_ZONE_LIST_CSV);
      const combined = {
        type: 'FeatureCollection',
        features: [...zones.features, ...list.features],
      };
      onLoadCustomGeoJson(combined);
      setStatusMessage({
        text: 'Authoritative Auckland baseline loaded: Verified supply zones and schemes active on map.',
        isError: false,
      });
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, 1200);
    } catch (err: any) {
      setStatusMessage({ text: err.message, isError: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header with Taumata Arowai Branding */}
        <div className="px-5 py-3.5 bg-[#071A35] text-white flex items-center justify-between border-b border-[#0C2548] shrink-0">
          <div className="flex items-center gap-3">
            <TaumataArowaiLogo theme="dark" compact={false} className="h-8" />
            <div className="h-6 w-[1px] bg-white/20 hidden sm:block" />
            <div className="hidden sm:block">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Authoritative GIS Data Ingestion
              </h2>
              <p className="text-[10px] text-slate-300">
                Auckland Drinking Water Supply Zones (<code>AklDizzy</code>) & Scheme Registry
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close Data Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Access Guard Warning if Citizen */}
        {!isStaff && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-amber-700" />
            <span>
              <strong>Read-Only Notice:</strong> Ingestion of new spatial layers requires Authorized Official or Administrator credentials. Sign in with an official account to commit data.
            </span>
          </div>
        )}

        {/* Informational Scope Banner */}
        <div className="bg-sky-50/70 border-b border-sky-100 px-5 py-2.5 text-[#071A35] text-xs">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#071A35] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[#071A35]">
                Authoritative Data Pipeline
              </div>
              <p className="text-[11px] text-slate-700 mt-0.5 leading-relaxed">
                Ingest the 2 official mentor datasets below to map properties to registered drinking water supply zones, demographic indicators, and water supply schemes.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 gap-2 text-xs font-semibold overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('required-inputs')}
            className={`pb-2 px-2 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'required-inputs'
                ? 'border-[#071A35] text-[#071A35] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Required Datasets (2 Files)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paste-raw')}
            className={`pb-2 px-2 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'paste-raw'
                ? 'border-[#071A35] text-[#071A35] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Direct Text / CSV Paste</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('authoritative-baseline')}
            className={`pb-2 px-2 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'authoritative-baseline'
                ? 'border-[#071A35] text-[#071A35] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-700" />
            <span>Pre-Loaded Auckland Baseline</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-800 space-y-4 custom-scrollbar">
          
          {/* Status Message Banner */}
          {statusMessage && (
            <div className={`p-3 rounded text-xs font-medium flex items-start gap-2 ${
              statusMessage.isError 
                ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}>
              {statusMessage.isError ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: EXACT REQUIRED DATA INPUTS */}
          {activeTab === 'required-inputs' && (
            <div className="space-y-4">
              
              {/* FILE 1: AklDizzy GeoJSON */}
              <div className="border border-slate-200 rounded p-3.5 bg-slate-50/60 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#071A35] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                      1
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        Auckland Supply Areas (<code>AklDizzy.geojson</code>)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Exported from <code>default.gdb</code> &rarr; <code>AklDizzy</code> MultiPolygon layer
                      </div>
                    </div>
                  </div>
                  {aklDizzyValidation?.valid ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Validated ({aklDizzyValidation.featureCount} zones)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[11px] font-medium">
                      Required
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded border border-slate-200 space-y-1">
                  <div className="font-semibold text-slate-800 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-[#071A35]" />
                    <span>Schema Fields Verified:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {['zone', 'pop_regist', 'pop_low_de', 'pop_mod_de', 'pop_high_d', 'pop_maori'].map(f => (
                      <span key={f} className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <label className="border-2 border-dashed border-slate-300 hover:border-[#071A35] rounded p-3 flex flex-col items-center justify-center cursor-pointer bg-white transition-colors">
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="font-semibold text-slate-800 text-xs">
                    {aklDizzyFile ? aklDizzyFile.name : 'Select or Drop AklDizzy.geojson'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Standard GeoJSON (EPSG:4326 - WGS 84)
                  </span>
                  <input
                    type="file"
                    accept=".json,.geojson"
                    onChange={handleAklDizzyUpload}
                    className="hidden"
                    disabled={!isStaff}
                  />
                </label>
              </div>

              {/* FILE 2: Auckland Zone List CSV */}
              <div className="border border-slate-200 rounded p-3.5 bg-slate-50/60 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#071A35] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                      2
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        Auckland Zone List (<code>Auckland_zone_list.csv</code>)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Exported from sheet <code>zone list</code> in <code>Auckland_zone_list.xlsx</code>
                      </div>
                    </div>
                  </div>
                  {zoneListValidation?.valid ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Validated ({zoneListValidation.rowCount} schemes)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[11px] font-medium">
                      Required
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded border border-slate-200 space-y-1">
                  <div className="font-semibold text-slate-800 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-[#071A35]" />
                    <span>Schema Columns Verified:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {['Zone ID', 'Zone Name', 'Supply ID', 'Supply Name', 'Zone Population', 'Urban/Rural Zone', 'Supply Latitude', 'Supply Longitude'].map(col => (
                      <span key={col} className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>

                <label className="border-2 border-dashed border-slate-300 hover:border-[#071A35] rounded p-3 flex flex-col items-center justify-center cursor-pointer bg-white transition-colors">
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="font-semibold text-slate-800 text-xs">
                    {zoneListFile ? zoneListFile.name : 'Select or Drop Auckland_zone_list.csv'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    CSV file (Comma delimited)
                  </span>
                  <input
                    type="file"
                    accept=".csv,.txt,.tsv"
                    onChange={handleZoneListUpload}
                    className="hidden"
                    disabled={!isStaff}
                  />
                </label>
              </div>

              {/* Pre-Commit Validation Summary Table */}
              {(aklDizzyValidation || zoneListValidation) && (
                <div className="border border-slate-200 rounded overflow-hidden bg-white">
                  <div className="bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#071A35] border-b border-slate-200 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-[#071A35]" />
                    <span>Pre-Commit Validation Summary</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <th className="px-3 py-1.5 text-left font-semibold">Dataset Layer</th>
                        <th className="px-3 py-1.5 text-left font-semibold">Status</th>
                        <th className="px-3 py-1.5 text-left font-semibold">Records</th>
                        <th className="px-3 py-1.5 text-left font-semibold">CRS Verified</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      <tr>
                        <td className="px-3 py-2 font-medium text-slate-900">AklDizzy MultiPolygons</td>
                        <td className="px-3 py-2">
                          {aklDizzyValidation?.valid ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Schema Verified
                            </span>
                          ) : (
                            <span className="text-slate-400">Awaiting file</span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono">
                          {aklDizzyValidation ? `${aklDizzyValidation.featureCount} zones` : '—'}
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-600">
                          {aklDizzyValidation ? aklDizzyValidation.crsStatus : '—'}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-medium text-slate-900">Auckland Zone List</td>
                        <td className="px-3 py-2">
                          {zoneListValidation?.valid ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Schema Verified
                            </span>
                          ) : (
                            <span className="text-slate-400">Awaiting file</span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono">
                          {zoneListValidation ? `${zoneListValidation.rowCount} schemes` : '—'}
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-600">
                          {zoneListValidation ? zoneListValidation.crsStatus : '—'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleLoadBaselineSample}
                  className="w-full sm:w-auto px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-700" />
                  <span>Activate Pre-Loaded Auckland Baseline</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyData}
                  disabled={!isStaff || (!aklDizzyData && !zoneListData)}
                  className="w-full sm:w-auto px-6 py-2 bg-[#071A35] hover:bg-[#0C2548] disabled:bg-slate-300 text-white font-bold rounded text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Commit & Apply to Live Map</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PASTE RAW TEXT */}
          {activeTab === 'paste-raw' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 text-xs">
                  Paste Text from CSV or GeoJSON:
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRawText(AUCKLAND_ZONE_LIST_CSV)}
                    className="text-[11px] text-sky-800 hover:underline font-semibold"
                  >
                    Insert Zone List Sample
                  </button>
                </div>
              </div>

              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={12}
                placeholder="Paste CSV rows directly from Excel or GeoJSON FeatureCollection..."
                className="w-full font-mono text-[11px] p-3 rounded border border-slate-300 focus:ring-1 focus:ring-[#071A35] focus:outline-none bg-slate-50/50"
              />

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setRawText('')}
                  disabled={!rawText}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded text-xs font-medium disabled:opacity-50"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const trimmed = rawText.trim();
                      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                        const parsed = JSON.parse(trimmed);
                        const geojson = parsed.type === 'FeatureCollection' ? parsed : convertArcGisJsonToGeoJson(parsed);
                        onLoadCustomGeoJson(geojson);
                      } else {
                        const geojson = parseDelimitedTextToGeoJson(trimmed);
                        onLoadCustomGeoJson(geojson);
                      }
                      setStatusMessage({ text: 'Data committed and rendered onto map successfully!', isError: false });
                      setTimeout(() => {
                        onClose();
                        setStatusMessage(null);
                      }, 1000);
                    } catch (e: any) {
                      setStatusMessage({ text: `Parse error: ${e.message}`, isError: true });
                    }
                  }}
                  disabled={!isStaff || !rawText.trim()}
                  className="px-5 py-2 bg-[#071A35] hover:bg-[#0C2548] disabled:bg-slate-300 text-white font-bold rounded transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Parse & Commit to Map</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PRE-LOADED BASELINE DATA */}
          {activeTab === 'authoritative-baseline' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 text-sm">
                  Auckland Water Services Authority Baseline Registry
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Activates the verified spatial baseline for Auckland drinking water services:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700 text-xs">
                  <li><strong>Auckland Supply Zones</strong> with registered population and deprivation indices.</li>
                  <li><strong>Watercare Supply Schemes</strong> (Waitakere, Hunua, Central Isthmus, North Shore, Helensville).</li>
                  <li><strong>Supply Buffer Corridors</strong> (50m, 100m, 200m, 500m, 1500m).</li>
                  <li><strong>Physical Network Infrastructure</strong> (Originating Dams, Treatment Plants & Service Reservoirs).</li>
                </ul>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleLoadBaselineSample}
                    className="px-5 py-2 bg-[#071A35] hover:bg-[#0C2548] text-white font-bold rounded text-xs transition-colors flex items-center gap-2 shadow-xs"
                  >
                    <Sparkles className="w-4 h-4 text-sky-300" />
                    <span>Activate Authoritative Baseline Now</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {hasCustomData && onClearCustomData && (
              <button
                type="button"
                onClick={() => {
                  onClearCustomData();
                  setAklDizzyData(null);
                  setZoneListData(null);
                  setStatusMessage({ text: 'Custom ingested layer cleared.', isError: false });
                }}
                className="text-xs text-rose-700 hover:text-rose-900 font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Ingested Layer from Map</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
