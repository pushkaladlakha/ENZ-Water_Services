import React, { useState } from 'react';
import { 
  Droplet, 
  MapPin, 
  Hash, 
  Search, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Gauge, 
  Layers, 
  Building2,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VERIFIED_PARCELS } from '../data/nzData';

interface GuestLookupProps {
  onBackToLogin: () => void;
  onExploreMap: (selectedAddress?: string) => void;
}

export const GuestLookup: React.FC<GuestLookupProps> = ({
  onBackToLogin,
  onExploreMap,
}) => {
  const [addressInput, setAddressInput] = useState('');
  const [propertyIdInput, setPropertyIdInput] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchedRecord, setSearchedRecord] = useState<{
    address: string;
    propertyId?: string;
    zoneId: string;
    zoneName: string;
    schemeName: string;
    treatmentPlant: string;
    mainPipe: string;
    tobyMeter: string;
    nominalPressure: string;
    complianceGrade: string;
  } | null>(null);

  const sampleAddresses = [
    { label: '4015 Great North Rd', full: '4015 Great North Road, Kelston, Auckland', id: 'LOT 14 DP 48291' },
    { label: '12 Titirangi Rd', full: '12 Titirangi Road, New Lynn, Auckland', id: 'LOT 8 DP 32190' },
    { label: '88 West Coast Rd', full: '88 West Coast Road, Glen Eden, Auckland', id: 'LOT 3 DP 51042' },
  ];

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanAddr = addressInput.trim();

    if (!cleanAddr) {
      setSearchError('Please enter a street address or property location to look up pipeline connectivity.');
      return;
    }

    setSearchError('');
    setIsSearching(true);

    setTimeout(() => {
      setIsSearching(false);
      // Match against known parcel or generate realistic demonstration connection record
      const matched = VERIFIED_PARCELS.find(p => 
        p.fullAddress.toLowerCase().includes(cleanAddr.toLowerCase()) ||
        cleanAddr.toLowerCase().includes(p.streetName.toLowerCase())
      );

      if (matched) {
        setSearchedRecord({
          address: matched.fullAddress,
          propertyId: propertyIdInput.trim() || `${matched.lotNumber} ${matched.dpNumber}`,
          zoneId: matched.engineerData?.supplyZoneId || 'AKL-SZ-14',
          zoneName: 'Kelston / Waitakere Reticulation DMA',
          schemeName: 'Huia / Waitakere Western Water Supply Scheme',
          treatmentPlant: matched.waterLineage?.treatmentPlant?.name || 'Huia Water Treatment Plant',
          mainPipe: matched.waterLineage?.streetMain?.name 
            ? `${matched.waterLineage.streetMain.name} (${matched.waterLineage.streetMain.nominalDiaMm}mm ${matched.waterLineage.streetMain.material})` 
            : 'Great North Rd 150mm Ductile Iron Reticulation Main',
          tobyMeter: matched.waterLineage?.servicePipe 
            ? `${matched.waterLineage.servicePipe.nominalDiaMm}mm ${matched.waterLineage.servicePipe.material} Boundary Toby Pit & Meter` 
            : '20mm PE100 Boundary Toby Pit & Class C Meter',
          nominalPressure: '520 kPa (Nominal Operating Range)',
          complianceGrade: matched.waterLineage?.treatmentPlant?.waterQualityGrade || 'Taumata Arowai Rule Compliant (Grade A1)',
        });
      } else {
        setSearchedRecord({
          address: cleanAddr,
          propertyId: propertyIdInput.trim() || 'NZ-PARCEL-DEMO',
          zoneId: 'AKL-SZ-14',
          zoneName: 'Auckland Western Supply Reticulation DMA',
          schemeName: 'Huia / Waitakere Western Water Supply Scheme',
          treatmentPlant: 'Huia Water Treatment Plant',
          mainPipe: 'Municipal Reticulation Main (150mm Ductile Iron)',
          tobyMeter: '20mm Boundary Toby Box & Domestic Meter',
          nominalPressure: '480 - 540 kPa (Zone Standard)',
          complianceGrade: 'Taumata Arowai Rule Compliant (Grade A1)',
        });
      }
    }, 400);
  };

  const handleSelectSample = (sample: typeof sampleAddresses[0]) => {
    setAddressInput(sample.full);
    setPropertyIdInput(sample.id);
    setSearchError('');
  };

  return (
    <div className="min-h-screen w-full bg-[#F2F5F9] font-sans antialiased text-[#0B2342] selection:bg-[#009E91] selection:text-white py-6 sm:py-10 px-4 sm:px-6 flex items-center justify-center">
      {/* Centred Application Surface */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col lg:flex-row min-h-[640px] xl:min-h-[680px]">
        
        {/* Left Section: Guest Pipeline Lookup (approx 48% desktop) */}
        <div className="w-full lg:w-[48%] flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14 bg-white relative">
          
          <div className="max-w-[460px] mx-auto w-full">
            {/* Brand Header */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0B2342] flex items-center justify-center text-[#00D4C7] shadow-xs">
                  <Droplet className="w-5 h-5 fill-[#00D4C7] text-[#00D4C7]" />
                </div>
                <div>
                  <span className="text-sm font-bold tracking-tight text-[#0B2342] block leading-none">
                    AquaConnect GIS
                  </span>
                  <span className="text-xs text-slate-500 font-medium block mt-1">
                    Water Pipeline Connectivity Portal
                  </span>
                </div>
              </div>

              {/* Return to Login */}
              <button
                type="button"
                onClick={onBackToLogin}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#009E91] hover:text-[#007D73] bg-[#F2F5F9] hover:bg-slate-200/80 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </button>
            </div>

            {/* Page Heading & Context */}
            <div className="mt-8 mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-semibold mb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-[#009E91]" />
                <span>Public Resident Access • No Login Required</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2342] tracking-tight">
                Check Your Water Connection
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                Enter your property details to look up its connected water supply pipeline, reticulation main, and supply zone.
              </p>
            </div>

            {/* Demonstration Notice */}
            <div className="p-3.5 mb-5 rounded-xl bg-slate-50 border border-slate-200/90 text-[11.5px] text-slate-600 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 block mb-0.5">Public Demonstration Lookup:</strong>
                <span>
                  This search provides demonstration pipeline connections. Full live SCADA pressure and cadastral property records will be queried directly once municipal backend integration is complete.
                </span>
              </div>
            </div>

            {/* Lookup Form */}
            <form onSubmit={handleSearch} className="space-y-4" noValidate>
              
              {/* Property Address Input */}
              <div>
                <label className="block text-xs font-semibold text-[#0B2342] mb-1.5">
                  Property Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={addressInput}
                    onChange={(e) => {
                      setAddressInput(e.target.value);
                      if (searchError) setSearchError('');
                    }}
                    placeholder="e.g. 4015 Great North Road, Kelston"
                    className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-xs text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-[#009E91]/30 ${
                      searchError
                        ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                        : 'border-slate-300 focus:border-[#009E91] bg-white'
                    }`}
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                {searchError && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{searchError}</span>
                  </p>
                )}
              </div>

              {/* Optional House / Consumer ID */}
              <div>
                <label className="block text-xs font-semibold text-[#0B2342] mb-1.5">
                  Optional House Number or Consumer / Property ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={propertyIdInput}
                    onChange={(e) => setPropertyIdInput(e.target.value)}
                    placeholder="e.g. Lot 14 DP 48291 or Meter # 2017826"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-[#009E91]/30 focus:border-[#009E91] bg-white"
                  />
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Quick Sample Address Chips */}
              <div className="pt-1">
                <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
                  Try verified demonstration properties:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sampleAddresses.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSample(sample)}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-colors cursor-pointer border border-slate-200"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Search Button */}
              <button
                type="submit"
                disabled={isSearching}
                className="w-full py-2.5 px-4 mt-2 rounded-lg bg-[#009E91] hover:bg-[#00877C] active:bg-[#007369] text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isSearching ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Querying Reticulation Cadastre...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Find My Pipeline</span>
                  </>
                )}
              </button>
            </form>

            {/* Search Results Display */}
            <AnimatePresence>
              {searchedRecord && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-6 p-4 rounded-xl bg-teal-50/70 border border-teal-200 text-teal-950 text-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-teal-200/60 pb-2">
                    <div className="flex items-center gap-2 font-bold text-[#0B2342]">
                      <CheckCircle2 className="w-4 h-4 text-[#009E91]" />
                      <span>Pipeline Connection Identified</span>
                    </div>
                    <span className="text-[10.5px] font-mono font-semibold bg-teal-100 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                      {searchedRecord.zoneId}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11.5px] text-slate-700">
                    <div>
                      <strong className="text-[#0B2342]">Address:</strong> {searchedRecord.address}
                    </div>
                    <div>
                      <strong className="text-[#0B2342]">Supply Zone:</strong> {searchedRecord.zoneName}
                    </div>
                    <div>
                      <strong className="text-[#0B2342]">Scheme:</strong> {searchedRecord.schemeName}
                    </div>
                    <div>
                      <strong className="text-[#0B2342]">Treatment Plant:</strong> {searchedRecord.treatmentPlant}
                    </div>
                    <div>
                      <strong className="text-[#0B2342]">Reticulation Main:</strong> {searchedRecord.mainPipe}
                    </div>
                    <div>
                      <strong className="text-[#0B2342]">Toby Box & Meter:</strong> {searchedRecord.tobyMeter}
                    </div>
                    <div>
                      <strong className="text-[#0B2342]">Operating Pressure:</strong> {searchedRecord.nominalPressure}
                    </div>
                  </div>

                  {/* Actions for Guest */}
                  <div className="pt-2 border-t border-teal-200/60 flex flex-col sm:flex-row items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onExploreMap(searchedRecord.address)}
                      className="w-full sm:w-auto flex-1 py-2 px-3 rounded-lg bg-[#0B2342] hover:bg-[#07172D] text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5 text-[#00D4C7]" />
                      <span>View on Public GIS Map</span>
                    </button>
                    <button
                      type="button"
                      onClick={onBackToLogin}
                      className="w-full sm:w-auto py-2 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Sign In for Official Records
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Subtle Divider */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>AquaConnect GIS • Public Water Service</span>
              <button
                type="button"
                onClick={onBackToLogin}
                className="text-[#009E91] hover:underline font-medium cursor-pointer"
              >
                Sign In to Resident Account
              </button>
            </div>
          </div>
        </div>

        {/* Right Section: Visual Panel with Provided Abstract Artwork (~52% desktop) */}
        <div className="hidden lg:block lg:w-[52%] relative min-h-[640px] xl:min-h-[680px] overflow-hidden bg-[#0e0320]">
          <img
            src="/images/abstract-fluid-artwork.png"
            alt="AquaConnect GIS Abstract Fluid Artwork with icy blue ribbons, deep purple shadows, and coral accents"
            className="w-full h-full object-cover object-center absolute inset-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/abstract-fluid-artwork.svg';
            }}
          />
        </div>

      </div>
    </div>
  );
};
export default GuestLookup;
