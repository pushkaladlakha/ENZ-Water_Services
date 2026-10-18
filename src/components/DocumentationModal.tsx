import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Server, 
  FolderArchive, 
  Table, 
  Compass, 
  Code2, 
  ShieldCheck, 
  Copy, 
  Check, 
  ChevronRight, 
  Lock,
  ExternalLink,
  Terminal,
  Route,
  MapPin,
  Droplet
} from 'lucide-react';
import { TaumataArowaiLogo } from './TaumataArowaiLogo';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeSection, setActiveSection] = useState<
    'overview' | 'auth-roles' | 'infrastructure' | 'api-config' | 'database-schema' | 'lpkx-qgis' | 'excel-schemes' | 'crs-guide' | 'python-script' | 'safe-run-guide'
  >('overview');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const pythonScript = `# Batch Convert Esri File Geodatabase layers to Web GeoJSON (EPSG:4326)
import geopandas as gpd

gdb_path = "default.gdb"  # Path to extracted p30/default.gdb folder

# Layers inside Auckland_Supply_Areas.lpkx
layers = [
    "AklDizzy", 
    "AklDizzy_Buffers50m", 
    "AklDizzy_Buffers100m", 
    "AklDizzy_Buffers200m", 
    "AklDizzy_Buffers500m", 
    "AklDizzy_Buffers1500m"
]

for layer in layers:
    print(f"Reading {layer}...")
    gdf = gpd.read_file(gdb_path, layer=layer)
    
    # Reproject from EPSG:3857 (Web Mercator) to EPSG:4326 (WGS84 Lat/Lng)
    gdf_4326 = gdf.to_crs(epsg=4326)
    
    output_file = f"{layer}.geojson"
    gdf_4326.to_file(output_file, driver="GeoJSON")
    print(f"Saved {output_file} with {len(gdf_4326)} features.")
`;

  const copyPythonCode = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-4xl overflow-hidden flex flex-col h-[90vh]">
        
        {/* Modal Top Header with Taumata Arowai Branding */}
        <div className="px-5 py-3.5 bg-[#071A35] text-white flex items-center justify-between border-b border-[#0C2548] shrink-0">
          <div className="flex items-center gap-3">
            <TaumataArowaiLogo theme="dark" compact={false} className="h-8" />
            <div className="h-6 w-[1px] bg-white/20 hidden sm:block" />
            <div className="hidden sm:block">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Technical Documentation & Architecture
              </h2>
              <p className="text-[10px] text-slate-300">
                Spatial data workflows, PostGIS schema deliverable, and security specifications
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close Documentation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Left Navigation Sidebar */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Navigation Menu */}
          <nav className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-3 space-y-1 shrink-0 overflow-y-auto">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Documentation Index
            </div>

            <button
              type="button"
              onClick={() => setActiveSection('overview')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-semibold flex items-center justify-between transition-colors ${
                activeSection === 'overview'
                  ? 'bg-[#071A35] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-300" />
                <span>1. System Architecture</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('auth-roles')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-semibold flex items-center justify-between transition-colors ${
                activeSection === 'auth-roles'
                  ? 'bg-[#071A35] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-sky-300" />
                <span>2. Roles & Permissions</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('infrastructure')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-semibold flex items-center justify-between transition-colors ${
                activeSection === 'infrastructure'
                  ? 'bg-[#071A35] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <div className="flex items-center gap-2">
                <Route className="w-3.5 h-3.5 text-cyan-300" />
                <span>3. Verified Facilities & Path</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('api-config')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-semibold flex items-center justify-between transition-colors ${
                activeSection === 'api-config'
                  ? 'bg-[#071A35] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-sky-300" />
                <span>4. Permanent API Config</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('database-schema')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-semibold flex items-center justify-between transition-colors ${
                activeSection === 'database-schema'
                  ? 'bg-[#071A35] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <div className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-sky-300" />
                <span>5. PostGIS SQL Schema</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('lpkx-qgis')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-semibold flex items-center justify-between transition-colors ${
                activeSection === 'lpkx-qgis'
                  ? 'bg-[#071A35] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderArchive className="w-3.5 h-3.5 text-sky-300" />
                <span>6. LPKX & QGIS Guide</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('excel-schemes')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-semibold flex items-center justify-between transition-colors ${
                activeSection === 'excel-schemes'
                  ? 'bg-[#071A35] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <div className="flex items-center gap-2">
                <Table className="w-3.5 h-3.5 text-sky-300" />
                <span>7. Auckland Zone List</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('crs-guide')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-semibold flex items-center justify-between transition-colors ${
                activeSection === 'crs-guide'
                  ? 'bg-[#071A35] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <div className="flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-sky-300" />
                <span>8. NZTM & WGS84 CRS</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('python-script')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-semibold flex items-center justify-between transition-colors ${
                activeSection === 'python-script'
                  ? 'bg-[#071A35] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <div className="flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-sky-300" />
                <span>9. Python Batch Script</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('safe-run-guide')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-semibold flex items-center justify-between transition-colors ${
                activeSection === 'safe-run-guide'
                  ? 'bg-[#071A35] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>10. Safe Execution & Tunnels</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </nav>

          {/* Right Content Area */}
          <main className="flex-1 overflow-y-auto p-5 text-xs text-slate-800 space-y-4 custom-scrollbar">
            
            {/* SECTION 1: SYSTEM OVERVIEW */}
            {activeSection === 'overview' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#071A35]" />
                    <span>System Architecture & Data Scope</span>
                  </h3>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    The Taumata Arowai GIS platform provides authoritative spatial visualization and regulatory query capabilities for drinking water services across New Zealand.
                  </p>
                </div>

                <div className="bg-sky-50/70 border border-sky-200 rounded p-4 text-[#071A35] space-y-2">
                  <div className="font-bold text-[#071A35] text-sm">
                    Authoritative Infrastructure Mapping
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    The platform links water supply schemes to spatial distribution zones and property parcels:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-700">
                    <li><strong>Originating Dams:</strong> Waitakere Dam, Lower & Upper Nihotupu, Huia, Cosseys, Mangatangi, Mangatawhiri, and Waikato River intake.</li>
                    <li><strong>Treatment Plants:</strong> Huia WTP, Ardmore WTP, and Waikato WTP with Water Quality Assurance grading.</li>
                    <li><strong>Balancing Reservoirs:</strong> Titirangi High-Level Balancing Reservoir, Khyber Pass, Ponsonby Reservoir, Redoubt Road.</li>
                    <li><strong>Reticulation Pipelines:</strong> Nominal diameters (50mm to 375mm), material classes (Ductile Iron, PE, UPVC, Cast Iron, Concrete), and verified COMPKEYs.</li>
                  </ul>
                </div>

                <div className="border border-amber-200 rounded p-4 bg-amber-50 space-y-1.5 text-xs">
                  <div className="font-bold text-amber-950">Custom dataset upload — available for testing</div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Staff can open Upload Data from the header to load GeoJSON/ArcGIS JSON or zone-list CSV as a temporary map layer. Uploads remain in browser memory and are not saved to a backend. Water pipes and network fittings come from preprocessed GeoJSON tiles in <code>public/data/water-network</code>; the full source files are kept in <code>source-data</code> and are not automatically loaded as a single large file.
                  </p>
                </div>
              </div>
            )}

            {/* SECTION 2: ROLES & PERMISSIONS */}
            {activeSection === 'auth-roles' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-[#071A35]" />
                    <span>Authentication & Role-Based Access Control (RBAC)</span>
                  </h3>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Enforces clear boundaries between public residents and regulatory compliance officers:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="border border-slate-200 rounded p-3 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">Citizen</span>
                      <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Public</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Public address lookups, drinking water supply zone boundary, supply scheme name, public boil-water or outage notices, and general cadastral parcel boundary.
                    </p>
                    <div className="pt-1 text-[10px] font-mono text-slate-500 bg-slate-50 p-1.5 rounded">
                      citizen@nzwater.org.nz
                    </div>
                  </div>

                  <div className="border border-sky-200 rounded p-3 bg-sky-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#071A35] text-xs">Authorized Official</span>
                      <span className="text-[10px] font-mono bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-bold">Regulatory</span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      Compliance inspections, full reticulation pipe attributes (diameter, material, pressure rating, COMPKEY), supply buffer corridors, and CCTV condition ratings.
                    </p>
                    <div className="pt-1 text-[10px] font-mono text-[#071A35] bg-white p-1.5 rounded border border-sky-200">
                      official@taumataarowai.govt.nz
                    </div>
                  </div>

                  <div className="border border-purple-200 rounded p-3 bg-purple-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-950 text-xs">Administrator</span>
                      <span className="text-[10px] font-mono bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded font-bold">Governance</span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      Dataset ingestion (<code>AklDizzy</code>, <code>Auckland_zone_list.xlsx</code>), schema migration execution, user access governance, and spatial audit records.
                    </p>
                    <div className="pt-1 text-[10px] font-mono text-purple-900 bg-white p-1.5 rounded border border-purple-200">
                      admin@taumataarowai.govt.nz
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: AUTHORITATIVE WATER INFRASTRUCTURE & LINEAGE PATH */}
            {activeSection === 'infrastructure' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Route className="w-5 h-5 text-[#071A35]" />
                    <span>Authoritative Facilities & Lineage Path Architecture</span>
                  </h3>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    AquaConnect GIS links property addresses to municipal drinking water supply zones, authoritative treatment plants, and raw water catchment dams based on verified geographic coordinates and records from Watercare Services Limited, Auckland Council, and LINZ.
                  </p>
                </div>

                {/* 1. Verified Treatment Facilities */}
                <div className="border border-slate-200 rounded overflow-hidden">
                  <div className="bg-[#072e54] text-white px-3 py-2 font-bold text-xs flex items-center justify-between">
                    <span>Verified Water Treatment Facilities</span>
                    <span className="text-[10px] font-mono text-cyan-300">WGS84 Coordinates</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <th className="px-3 py-1.5 text-left font-semibold">Facility Name</th>
                        <th className="px-3 py-1.5 text-left font-semibold">Coordinates</th>
                        <th className="px-3 py-1.5 text-left font-semibold">Capacity</th>
                        <th className="px-3 py-1.5 text-left font-semibold">Treatment Technology</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      <tr>
                        <td className="px-3 py-1.5 font-bold text-slate-900">Huia Water Treatment Plant</td>
                        <td className="px-3 py-1.5 font-mono text-emerald-700">-36.9388, 174.6366</td>
                        <td className="px-3 py-1.5">110 ML/day</td>
                        <td className="px-3 py-1.5 text-slate-600">DAF, Rapid Gravity Sand Filtration & Disinfection</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-bold text-slate-900">Ardmore Water Treatment Plant</td>
                        <td className="px-3 py-1.5 font-mono text-emerald-700">-37.0425, 175.0298</td>
                        <td className="px-3 py-1.5">320 ML/day</td>
                        <td className="px-3 py-1.5 text-slate-600">Clarification, Dual Media Sand Filtration, Chlorination</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-bold text-slate-900">Waikato Water Treatment Plant (Tuakau)</td>
                        <td className="px-3 py-1.5 font-mono text-emerald-700">-37.2625, 174.9548</td>
                        <td className="px-3 py-1.5">150 ML/day</td>
                        <td className="px-3 py-1.5 text-slate-600">Membrane Ultrafiltration, Ozone & Granular Activated Carbon</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-bold text-slate-900">Waitakere Water Treatment Plant</td>
                        <td className="px-3 py-1.5 font-mono text-emerald-700">-36.8833, 174.5500</td>
                        <td className="px-3 py-1.5">25 ML/day</td>
                        <td className="px-3 py-1.5 text-slate-600">DAF Clarification, Sand Filtration & Disinfection</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-bold text-slate-900">Hays Creek Water Treatment Plant</td>
                        <td className="px-3 py-1.5 font-mono text-emerald-700">-37.0789, 175.0089</td>
                        <td className="px-3 py-1.5">12 ML/day</td>
                        <td className="px-3 py-1.5 text-slate-600">Ultrafiltration Membranes, Coagulation & Disinfection</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 2. Verified Catchment Dams */}
                <div className="border border-slate-200 rounded overflow-hidden">
                  <div className="bg-[#072e54] text-white px-3 py-2 font-bold text-xs flex items-center justify-between">
                    <span>Verified Source Catchment Dams</span>
                    <span className="text-[10px] font-mono text-cyan-300">Watercare Dam Register</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <th className="px-3 py-1.5 text-left font-semibold">Catchment Dam</th>
                        <th className="px-3 py-1.5 text-left font-semibold">Coordinates</th>
                        <th className="px-3 py-1.5 text-left font-semibold">Storage</th>
                        <th className="px-3 py-1.5 text-left font-semibold">Catchment Basin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      <tr>
                        <td className="px-3 py-1.5 font-bold text-slate-900">Waitakere Dam & Lower Nihotupu</td>
                        <td className="px-3 py-1.5 font-mono text-emerald-700">-36.9633, 174.5683</td>
                        <td className="px-3 py-1.5">29,800 ML</td>
                        <td className="px-3 py-1.5 text-slate-600">Waitakere Native Rainforest Catchment</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-bold text-slate-900">Mangatangi Dam (Hunua Ranges)</td>
                        <td className="px-3 py-1.5 font-mono text-emerald-700">-37.1567, 175.2417</td>
                        <td className="px-3 py-1.5">52,000 ML</td>
                        <td className="px-3 py-1.5 text-slate-600">Mangatangi & Mangatawhiri Headwaters</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-bold text-slate-900">Waitakere Dam (Swanson)</td>
                        <td className="px-3 py-1.5 font-mono text-emerald-700">-36.8911, 174.5244</td>
                        <td className="px-3 py-1.5">12,500 ML</td>
                        <td className="px-3 py-1.5 text-slate-600">Waitakere Northern Forest Inflows</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 3. In-App Solid Path & Red Pin Architecture */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border border-sky-200 bg-sky-50/50 rounded p-3 space-y-1.5">
                    <div className="font-bold text-[#072e54] text-xs flex items-center gap-1.5">
                      <Route className="w-4 h-4 text-[#072e54]" />
                      <span>Single Solid In-App Connectivity Path</span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      Rendered directly on the Leaflet map with a uniform <strong>#072e54 solid stroke</strong> and subtle white casing. Connects the queried residential property to its serving treatment plant and primary dam.
                    </p>
                    <div className="bg-white p-2 rounded border border-sky-100 text-[10px] text-slate-600">
                      <strong>Zero External Navigation Redirects:</strong> All facility markers and pathways remain within the AquaConnect GIS application.
                    </div>
                  </div>

                  <div className="border border-rose-200 bg-rose-50/50 rounded p-3 space-y-1.5">
                    <div className="font-bold text-rose-950 text-xs flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-rose-600" />
                      <span>Property Identification & Red Pin</span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      Matches the queried citizen address against verified LINZ cadastral parcels. Drops a distinct <strong>red pin</strong> with a pulsing halo at the parcel's true coordinates.
                    </p>
                    <div className="bg-white p-2 rounded border border-rose-100 text-[10px] text-slate-600">
                      <strong>No Centroid Substitution:</strong> The property pin sits at the true cadastral parcel location, maintaining distinct geometry from the broader supply zone boundary.
                    </div>
                  </div>
                </div>

                {/* 4. Distinction Disclaimer Notice */}
                <div className="border border-amber-200 rounded p-3.5 bg-amber-50 space-y-1 text-xs">
                  <div className="font-bold text-amber-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>Regulatory Distinction: Schematic Lineage vs Physical Pipelines</span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    The solid #072e54 path visualizes the administrative and statutory facility supply lineage (Dam &rarr; Treatment Plant &rarr; Reticulated Property). It is not an engineering representation of subsurface pipeline trenches. Physical water mains and fittings are visualized independently via the tiled <strong>Water Network</strong> GeoJSON layer.
                  </p>
                </div>
              </div>
            )}

            {/* SECTION 4: PERMANENT API CONFIGURATION */}
            {activeSection === 'api-config' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#071A35]" />
                    <span>Permanent Environment API Configuration</span>
                  </h3>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    All GIS map tile endpoints and service connections are configured via deployment environment variables, removing manual user-facing key prompts:
                  </p>
                </div>

                <div className="bg-slate-950 text-slate-100 rounded p-4 font-mono text-[11px] overflow-x-auto border border-slate-800 space-y-1">
                  <div># .env / Deployment Environment Configuration</div>
                  <div className="text-slate-400"># Permanent map tile endpoints (Carto Light, OSM, Esri Satellite, LINZ Topo)</div>
                  <div className="text-sky-300">VITE_MAP_TILES_CARTO="https://&#123;s&#125;.basemaps.cartocdn.com/light_all/&#123;z&#125;/&#123;x&#125;/&#123;y&#125;&#123;r&#125;.png"</div>
                  <div className="text-sky-300">VITE_MAP_TILES_OSM="https://&#123;s&#125;.tile.openstreetmap.fr/hot/&#123;z&#125;/&#123;x&#125;/&#123;y&#125;.png"</div>
                  <div className="text-sky-300">VITE_MAP_TILES_ESRI_SATELLITE="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/&#123;z&#125;/&#123;y&#125;/&#123;x&#125;"</div>
                  <div className="text-sky-300">VITE_MAP_TILES_LINZ_TOPO="https://basemaps.linz.govt.nz/v1/tiles/aerial/EPSG:3857/&#123;z&#125;/&#123;x&#125;/&#123;y&#125;.png"</div>
                  <div className="pt-2 text-slate-400"># Server-side PostGIS Database URL (Never exposed in client bundle)</div>
                  <div className="text-emerald-400">DATABASE_URL="postgresql://postgres:password@localhost:5432/taumata_arowai_gis"</div>
                </div>
              </div>
            )}

            {/* SECTION 4: POSTGIS SQL SCHEMA */}
            {activeSection === 'database-schema' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Server className="w-5 h-5 text-[#071A35]" />
                    <span>PostgreSQL & PostGIS Database Deliverable</span>
                  </h3>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Delivered in version-controlled <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-900">database/schema.sql</code> and documented in <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-900">database/README.md</code>:
                  </p>
                </div>

                <div className="border border-slate-200 rounded overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 font-bold text-slate-800 text-xs border-b border-slate-200">
                    Core Relational Tables & Spatial Models
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <th className="px-3 py-1.5 text-left font-semibold">Table</th>
                        <th className="px-3 py-1.5 text-left font-semibold">Primary Key</th>
                        <th className="px-3 py-1.5 text-left font-semibold">Spatial Geometry</th>
                        <th className="px-3 py-1.5 text-left font-semibold">Domain Entity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      <tr>
                        <td className="px-3 py-1.5 font-mono font-semibold text-slate-900">water_supply_schemes</td>
                        <td className="px-3 py-1.5 font-mono text-slate-500">supply_id</td>
                        <td className="px-3 py-1.5 text-slate-400">—</td>
                        <td className="px-3 py-1.5">45 supply schemes from Auckland_zone_list.xlsx</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-mono font-semibold text-slate-900">water_supply_zones</td>
                        <td className="px-3 py-1.5 font-mono text-slate-500">zone_id</td>
                        <td className="px-3 py-1.5 font-mono text-sky-800">MultiPolygon (4326 & 2193)</td>
                        <td className="px-3 py-1.5">43 supply zones from AklDizzy default.gdb</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-mono font-semibold text-slate-900">zone_demographics</td>
                        <td className="px-3 py-1.5 font-mono text-slate-500">zone_id (FK)</td>
                        <td className="px-3 py-1.5 text-slate-400">—</td>
                        <td className="px-3 py-1.5">pop_regist, deprivation indices, pop_maori</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-mono font-semibold text-slate-900">supply_zone_buffers</td>
                        <td className="px-3 py-1.5 font-mono text-slate-500">id</td>
                        <td className="px-3 py-1.5 font-mono text-sky-800">MultiPolygon (4326 & 2193)</td>
                        <td className="px-3 py-1.5">Buffer tiers: 50m, 100m, 200m, 500m, 1500m</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-mono font-semibold text-slate-900">water_network_assets</td>
                        <td className="px-3 py-1.5 font-mono text-slate-500">compkey</td>
                        <td className="px-3 py-1.5 font-mono text-sky-800">Point / LineString (4326)</td>
                        <td className="px-3 py-1.5">Mains, dams, WTPs, balancing reservoirs, valves</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-mono font-semibold text-slate-900">spatial_property_queries</td>
                        <td className="px-3 py-1.5 font-mono text-slate-500">id (UUID)</td>
                        <td className="px-3 py-1.5 font-mono text-sky-800">Point (4326)</td>
                        <td className="px-3 py-1.5">Audit log of user parcel lookups and matched evidence</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-1">
                  <strong>Spatial Indexing Strategy:</strong>
                  <p className="text-[11px] text-slate-600">
                    Geometry columns are indexed using <strong>GiST</strong> (<code>CREATE INDEX ... USING GIST (geom_wgs84)</code> and <code>geom_nztm</code>). Dual CRS stores standard WGS84 for web displays and NZTM2000 (EPSG:2193) for accurate meter distance checks.
                  </p>
                </div>
              </div>
            )}

            {/* SECTION 5: LPKX & QGIS GUIDE */}
            {activeSection === 'lpkx-qgis' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Extracting <code>Auckland_Supply_Areas.lpkx</code> with 7-Zip & QGIS
                  </h3>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    ArcGIS Pro Layer Packages (<code>.lpkx</code>) are 7-Zip compressed archives encapsulating Esri File Geodatabases (<code>.gdb</code>). Follow this procedure to export to GeoJSON:
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="border border-slate-200 rounded p-3 bg-slate-50 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#071A35] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                    <div>
                      <div className="font-bold text-slate-900">Extract Archive with 7-Zip</div>
                      <p className="text-slate-600 mt-0.5 leading-relaxed text-[11px]">
                        Right-click <code>Auckland_Supply_Areas.lpkx</code> &gt; <strong>7-Zip</strong> &gt; <strong>Extract to "Auckland_Supply_Areas/"</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded p-3 bg-slate-50 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#071A35] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                    <div>
                      <div className="font-bold text-slate-900">Locate <code>default.gdb</code></div>
                      <p className="text-slate-600 mt-0.5 leading-relaxed text-[11px]">
                        Both <code>p20/</code> and <code>p30/</code> directories contain an identical <code>default.gdb</code> geodatabase containing the 6 supply zone and buffer layers.
                      </p>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded p-3 bg-slate-50 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#071A35] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
                    <div>
                      <div className="font-bold text-slate-900">Load into QGIS & Export GeoJSON</div>
                      <p className="text-slate-600 mt-0.5 leading-relaxed text-[11px]">
                        In QGIS: <strong>Layer &gt; Add Layer &gt; Add Vector Layer &gt; OpenFileGDB &gt; select default.gdb</strong>. Then right-click <code>AklDizzy</code> &gt; Export &gt; Save Features As... GeoJSON with CRS: <strong>EPSG:4326 - WGS 84</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 6: AUCKLAND ZONE LIST */}
            {activeSection === 'excel-schemes' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Auckland Zone List (<code>Auckland_zone_list.xlsx</code>) Integration
                  </h3>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    The spreadsheet contains the tabular relationship connecting Zone IDs to Watercare Supply Schemes:
                  </p>
                </div>

                <div className="border border-slate-200 rounded overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <th className="px-3 py-1.5 text-left font-semibold">Column</th>
                        <th className="px-3 py-1.5 text-left font-semibold">Type</th>
                        <th className="px-3 py-1.5 text-left font-semibold">Description</th>
                        <th className="px-3 py-1.5 text-left font-semibold">Join Key</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      <tr>
                        <td className="px-3 py-1.5 font-mono font-semibold text-slate-900">Zone ID</td>
                        <td className="px-3 py-1.5 text-slate-500">String</td>
                        <td className="px-3 py-1.5">Water supply zone code (e.g. AKL-SZ-14)</td>
                        <td className="px-3 py-1.5 font-mono text-sky-800">Joins to AklDizzy 'zone'</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-mono font-semibold text-slate-900">Zone Name</td>
                        <td className="px-3 py-1.5 text-slate-500">String</td>
                        <td className="px-3 py-1.5">Official geographical zone title</td>
                        <td className="px-3 py-1.5 text-slate-400">Display</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-mono font-semibold text-slate-900">Supply ID</td>
                        <td className="px-3 py-1.5 text-slate-500">String</td>
                        <td className="px-3 py-1.5">Parent water supply scheme code (45 schemes)</td>
                        <td className="px-3 py-1.5 font-mono text-sky-800">Scheme hierarchy</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-mono font-semibold text-slate-900">Supply Name</td>
                        <td className="px-3 py-1.5 text-slate-500">String</td>
                        <td className="px-3 py-1.5">Name of the water supply scheme</td>
                        <td className="px-3 py-1.5 text-slate-400">Lineage tracing</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION 7: CRS GUIDE */}
            {activeSection === 'crs-guide' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Coordinate Reference Systems (CRS) in New Zealand GIS
                  </h3>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Comparison of coordinate systems used across New Zealand geospatial datasets:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="border border-slate-200 rounded p-3 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <span className="font-mono text-[10px] bg-[#071A35] text-white px-1.5 py-0.5 rounded font-bold">EPSG:4326</span>
                      <div className="font-bold text-slate-900 mt-1.5">WGS 84 (Geographic)</div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        Units: <strong>Decimal Degrees</strong> (e.g. -36.9094, 174.6806). Standard for Leaflet web maps and GeoJSON payloads.
                      </p>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded p-3 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <span className="font-mono text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-bold">EPSG:3857</span>
                      <div className="font-bold text-slate-900 mt-1.5">Web Mercator (Projected)</div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        Units: <strong>Meters</strong>. Used by Esri layer packages (<code>.lpkx</code>) and default geodatabase exports.
                      </p>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded p-3 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <span className="font-mono text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-bold">EPSG:2193</span>
                      <div className="font-bold text-slate-900 mt-1.5">NZTM2000 (Local Projected)</div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        Units: <strong>Meters</strong>. Official New Zealand cadastral and engineering survey standard. Used for accurate buffer distance calculations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 8: AUTOMATED PYTHON SCRIPT */}
            {activeSection === 'python-script' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Automated Python Batch Converter (<code>GeoPandas</code>)
                    </h3>
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      Run this script to convert all layers in <code>default.gdb</code> directly to WGS84 GeoJSON:
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={copyPythonCode}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold transition-colors shrink-0"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied' : 'Copy Script'}</span>
                  </button>
                </div>

                <div className="bg-slate-950 text-slate-100 rounded p-4 font-mono text-[11px] overflow-x-auto border border-slate-800">
                  <pre>{pythonScript}</pre>
                </div>
              </div>
            )}

            {/* SECTION 9: SAFE EXECUTION & TUNNELING GUIDE */}
            {activeSection === 'safe-run-guide' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-emerald-600" />
                    Safe Execution, VS Code Tunnels & Local Run Guide
                  </h3>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Standard operating procedures for launching, tunneling, and maintaining the Taumata Arowai GIS platform safely without package corruption or port collision.
                  </p>
                </div>

                {/* Important Clarification Card */}
                <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-md">
                  <h4 className="text-xs font-bold text-[#071A35] flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    Do I need to run 'npm install' every time I open CMD?
                  </h4>
                  <p className="text-slate-700 text-[11px] leading-relaxed">
                    <strong>No!</strong> Once installed, dependencies remain persistently saved in your local <code className="bg-sky-100 px-1 py-0.5 rounded text-sky-900 font-mono">node_modules/</code> folder. When resuming work in a new terminal session, simply run <code className="bg-sky-100 px-1 py-0.5 rounded text-sky-900 font-mono font-bold">npm run dev</code>. Only re-run <code className="bg-sky-100 px-1 py-0.5 rounded text-sky-900 font-mono">npm install</code> if you delete node_modules or add new packages to <code className="bg-sky-100 px-1 py-0.5 rounded text-sky-900 font-mono">package.json</code>.
                  </p>
                </div>

                {/* Step-by-Step Command Cards */}
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <div className="font-bold text-slate-800 text-xs mb-1">
                      1. Safe Daily Launch (Port 3000)
                    </div>
                    <div className="bg-slate-950 text-emerald-400 p-2.5 rounded font-mono text-[11px] space-y-1">
                      <div><span className="text-slate-500"># Start Vite Development Server</span></div>
                      <div>npm run dev</div>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1.5">
                      Open <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer" className="text-sky-700 underline font-mono">http://localhost:3000</a>. To safely shut down at any time, press <kbd className="px-1 py-0.5 bg-slate-200 rounded text-slate-800 text-[10px]">Ctrl + C</kbd>.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <div className="font-bold text-slate-800 text-xs mb-1">
                      2. VS Code Port Forwarding & Dev Tunnels
                    </div>
                    <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-1">
                      <li>Start dev server: <code className="bg-slate-200 px-1 rounded font-mono">npm run dev</code></li>
                      <li>In VS Code bottom dock, click <strong>PORTS</strong> tab (View &rarr; Open View &rarr; Ports).</li>
                      <li>Click <strong>Forward a Port</strong>, enter <code className="bg-slate-200 px-1 rounded font-mono">3000</code>.</li>
                      <li>Right-click port 3000 &rarr; <strong>Port Visibility</strong> &rarr; Select <em>Public</em> or <em>Private</em>.</li>
                      <li>Open the generated <code className="text-sky-700 font-mono">https://xxxx-3000.devtunnels.ms</code> URL.</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                    <div className="font-bold text-amber-900 text-xs mb-1">
                      3. Why Tunneled Maps Work Seamlessly Now
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed mb-2">
                      When accessed over dev tunnels, raw <code className="font-mono">tile.openstreetmap.org</code> servers block reverse proxy headers with HTTP 403 Forbidden. This platform incorporates automated proxy fallback routing:
                    </p>
                    <div className="bg-amber-950 text-amber-200 p-2 rounded font-mono text-[10px]">
                      &bull; Auto-routes to CORS-unrestricted Carto Voyager & Esri satellite tiles<br/>
                      &bull; Enforces HTTPS protocol matching tunnel security contexts<br/>
                      &bull; Eliminates Mixed Content browser blocking
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <div className="font-bold text-slate-800 text-xs mb-1">
                      4. Safe Python Geospatial Environment (.venv)
                    </div>
                    <p className="text-[11px] text-slate-600 mb-2">
                      Never install Python GIS libraries globally. Always use an isolated virtual environment:
                    </p>
                    <div className="bg-slate-950 text-slate-200 p-2.5 rounded font-mono text-[10px] space-y-1">
                      <div><span className="text-slate-500"># Windows:</span></div>
                      <div>python -m venv .venv</div>
                      <div>.\.venv\Scripts\Activate.ps1</div>
                      <div className="pt-1"><span className="text-slate-500"># macOS / Linux:</span></div>
                      <div>python3 -m venv .venv</div>
                      <div>source .venv/bin/activate</div>
                      <div className="pt-1"><span className="text-slate-500"># Install & run:</span></div>
                      <div>pip install geopandas pyogrio shapely fiona openpyxl pandas</div>
                      <div>python scripts/process_mentor_data.py --gdb path/to/default.gdb --excel path/to/Auckland_zone_list.xlsx</div>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded">
                    <div className="font-bold text-emerald-900 text-xs mb-1">
                      5. Complete Text Guide Available on Disk
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      A standalone plain-text guide with quick copy-paste commands and troubleshooting tables is available at the project root: <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold text-emerald-950">SAFE_RUN_GUIDE.txt</code>.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[10px] text-slate-500">
            Taumata Arowai &bull; Water Services Authority of New Zealand (Te Mana o te Wai)
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold text-xs transition-colors"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
