import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { GisMap } from './components/GisMap';
import { InspectionDrawer } from './components/InspectionDrawer';
import { LayerPanel } from './components/LayerPanel';
import { CitizenComplaintModal } from './components/CitizenComplaintModal';
import { DataRequestModal } from './components/DataRequestModal';
import { DocumentationModal } from './components/DocumentationModal';
import { LoginModal } from './components/LoginModal';
import { ProfileDashboard } from './components/ProfileDashboard';
import { 
  AccessLevel, 
  BaseMapStyle, 
  LayerVisibility, 
  ActiveSelection, 
  ParcelFeature,
  AuthUser,
  WaterIncidentComplaint,
  PathwayResolutionResult
} from './types/gis';
import { VERIFIED_PIPES, VERIFIED_PARCELS, getDocumentedWaterLineage, isCoordinateInNewZealand } from './data/nzData';
import { 
  AucklandZoneScheme, 
  findNearestVerifiedParcel, 
  resolveAddressSupplyZone 
} from './utils/waterLineageEngine';
import { 
  getCurrentUserApi, 
  fetchIncidentsApi, 
  clearAuthToken,
  resolveWaterSupplyApi,
  getSavedCurrentUser,
  saveCurrentUser,
  clearSavedCurrentUser
} from './services/apiClient';
import { PathwayPanel } from './components/PathwayPanel';

export default function App() {
  // 1. Authentication & Incident-Triggered Login State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getSavedCurrentUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginReason, setLoginReason] = useState<'report_incident' | 'general'>('general');
  const [pendingIncidentAddress, setPendingIncidentAddress] = useState<string>('');

  // Derived Access Role (Guests have 'citizen' public access level)
  const accessLevel: AccessLevel = currentUser?.role || 'citizen';

  // 2. Map State
  const [baseMapStyle, setBaseMapStyle] = useState<BaseMapStyle>('google-maps');
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
    supplyZones: true,
    supplyBuffers: true,
    parcels: true,
    residentialZones: true,
    waterPipes: false, // 4th Layer inactive by default
    wastewaterPipes: false,
    stormwaterPipes: true,
    fittings: true,
    floodHazard: true,
    streetNumbers: true,
  });

  // 3. Selection State
  const [selectedFeature, setSelectedFeature] = useState<ActiveSelection | null>(null);

  // 4. Navigation & Fly-To State
  const [flyToLocation, setFlyToLocation] = useState<{ center: [number, number]; zoom?: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // 5. Modals & Side Panels
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [complaintModalTab, setComplaintModalTab] = useState<'submit' | 'registry'>('submit');
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isProfileDashboardOpen, setIsProfileDashboardOpen] = useState(false);
  const [complaintAddressPrefill, setComplaintAddressPrefill] = useState('');

  // 6. Citizen Complaints State
  const [complaintsList, setComplaintsList] = useState<WaterIncidentComplaint[]>([]);

  // 7. Custom Ingested GeoJSON Data
  const [customGeoJsonData, setCustomGeoJsonData] = useState<any | null>(null);

  // 8. Water Supply Pathway & Connectivity State
  const [pathwayState, setPathwayState] = useState<PathwayResolutionResult | null>(null);
  const [isResolvingPathway, setIsResolvingPathway] = useState<boolean>(false);
  const [focusZoneBounds, setFocusZoneBounds] = useState<[number, number][] | null>(null);
  const [focusRouteBounds, setFocusRouteBounds] = useState<[number, number][] | null>(null);
  const [gpsAdvisory, setGpsAdvisory] = useState<string | null>(null);

  // Resolve authoritative water supply pathway & single connectivity path for a parcel
  const resolvePathwayForParcel = useCallback(async (parcel: ParcelFeature) => {
    if (parcel.isOutsideNewZealand || !isCoordinateInNewZealand(parcel.center[0], parcel.center[1])) {
      setPathwayState(null);
      return;
    }
    setIsResolvingPathway(true);
    try {
      const result = await resolveWaterSupplyApi({
        address: parcel.fullAddress,
        coordinates: parcel.center,
        address_id: parcel.id,
      });
      setPathwayState(result);
    } catch (err) {
      console.error('Failed to resolve water supply pathway:', err);
    } finally {
      setIsResolvingPathway(false);
    }
  }, []);

  // Restore authenticated session and live incidents from backend if available
  useEffect(() => {
    getCurrentUserApi().then((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });

    fetchIncidentsApi().then((incidents) => {
      if (incidents && incidents.length > 0) {
        setComplaintsList(incidents);
      }
    });
  }, []);

  const handleLogout = useCallback(() => {
    clearAuthToken();
    clearSavedCurrentUser();
    setCurrentUser(null);
  }, []);

  // When users click "Report an Incident" (either in Header or InspectionDrawer)
  // If guest: open compact login modal instead of navigating away.
  // After successful authentication: continue directly to incident reporting!
  const handleReportIncident = useCallback((address?: string) => {
    const targetAddress = address || (selectedFeature?.type === 'parcel' ? selectedFeature.data.fullAddress : '');
    setComplaintModalTab('submit');
    
    if (currentUser) {
      if (targetAddress) {
        setComplaintAddressPrefill(targetAddress);
      }
      setIsComplaintModalOpen(true);
    } else {
      setPendingIncidentAddress(targetAddress);
      setLoginReason('report_incident');
      setIsLoginModalOpen(true);
    }
  }, [currentUser, selectedFeature]);

  const handleOpenIncidentRegister = useCallback(() => {
    setComplaintModalTab('registry');
    setIsComplaintModalOpen(true);
  }, []);

  // Handle successful login from LoginModal
  const handleLoginSuccess = useCallback((user: AuthUser) => {
    saveCurrentUser(user);
    setCurrentUser(user);
    setIsLoginModalOpen(false);

    // If login was triggered by clicking "Report an Incident", continue to reporting!
    if (loginReason === 'report_incident') {
      if (pendingIncidentAddress) {
        setComplaintAddressPrefill(pendingIncidentAddress);
      }
      setIsComplaintModalOpen(true);
      setPendingIncidentAddress('');
      setLoginReason('general');
    }
  }, [loginReason, pendingIncidentAddress]);

  // General login button clicked in Header
  const handleOpenGeneralLogin = useCallback(() => {
    setPendingIncidentAddress('');
    setLoginReason('general');
    setIsLoginModalOpen(true);
  }, []);

  // Handlers
  const handleToggleLayer = (layerKey: keyof LayerVisibility) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layerKey]: !prev[layerKey],
    }));
  };

  const handleSearchSelectParcel = useCallback((parcel: ParcelFeature) => {
    setSelectedFeature({
      type: 'parcel',
      data: parcel,
      relatedAssets: VERIFIED_PIPES.filter(
        p => p.assetType !== 'water' && p.compkey === parcel.engineerData.pipeConnectionCompkey
      ),
    });
    setFlyToLocation({
      center: parcel.center,
      zoom: 18,
    });
    resolvePathwayForParcel(parcel);
  }, [resolvePathwayForParcel]);

  const handleSelectFeature = useCallback((selection: ActiveSelection | null) => {
    setSelectedFeature(selection);
    if (selection?.type === 'parcel') {
      resolvePathwayForParcel(selection.data as ParcelFeature);
    }
  }, [resolvePathwayForParcel]);

  const handleSearchSelectZone = useCallback((zone: AucklandZoneScheme) => {
    setSelectedFeature({
      type: 'supply_zone',
      data: zone,
    });
    setFlyToLocation({
      center: [zone.lat, zone.lng],
      zoom: 15,
    });
    setPathwayState(null);
  }, []);

  const handleLocateMe = useCallback(() => {
    setIsLocating(true);

    const applyLocation = (lat: number, lng: number, isRealGps: boolean) => {
      setIsLocating(false);

      if (isRealGps && !isCoordinateInNewZealand(lat, lng)) {
        setFlyToLocation({ center: [-36.8485, 174.7633], zoom: 14 });
        setSelectedFeature(null);
        setPathwayState(null);
        setGpsAdvisory(
          `Your detected GPS location (${lat >= 0 ? `${lat.toFixed(4)}° N` : `${Math.abs(lat).toFixed(4)}° S`}, ${lng >= 0 ? `${lng.toFixed(4)}° E` : `${Math.abs(lng).toFixed(4)}° W`}) sits outside New Zealand territorial jurisdiction. Under the Water Services Act 2021, Taumata Arowai registers cover municipal drinking water networks within Aotearoa New Zealand. Map centered on Auckland municipal reticulation.`
        );
        return;
      }
      setGpsAdvisory(null);
      setFlyToLocation({ center: [lat, lng], zoom: 18 });

      // 1. Check if user is near one of the verified cadastral parcels (within 250m)
      const nearest = findNearestVerifiedParcel(lat, lng);
      if (nearest) {
        setSelectedFeature({
          type: 'parcel',
          data: nearest,
        });
        resolvePathwayForParcel(nearest);
      } else {
        // 2. Resolve supply zone for user's coordinates
        const { zone } = resolveAddressSupplyZone([lat, lng]);
        const liveParcel: ParcelFeature = {
          id: `LIVE-GPS-${Math.abs(Math.round(lat * 10000))}`,
          streetNumber: '',
          streetName: isRealGps ? 'Current GPS Location' : 'Auckland Central Reticulation',
          suburb: 'Auckland',
          city: 'Auckland',
          fullAddress: isRealGps
            ? `Current GPS Fix (${lat.toFixed(4)}, ${lng.toFixed(4)})`
            : `Auckland Reticulation Hub (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          center: [lat, lng],
          coordinates: [
            [lat - 0.0002, lng - 0.0002],
            [lat - 0.0002, lng + 0.0002],
            [lat + 0.0002, lng + 0.0002],
            [lat + 0.0002, lng - 0.0002],
          ],
          lotNumber: 'Live GPS',
          dpNumber: 'WGS84',
          titleReference: 'LIVE-COORDINATE',
          areaM2: 685,
          zoneCode: 'MHU',
          zoneName: 'Residential - Urban Reticulation',
          zoneColor: '#008080',
          zoneDescription: 'Live GPS coordinate bound to closest municipal water supply zone',
          dataSource: isRealGps ? 'Device Geolocation Sensor (WGS84)' : 'Municipal Reticulation Network Baseline',
          allocatedZoneId: zone.zoneId,
          allocatedZoneName: zone.zoneName,
          services: {
            waterConnected: true,
            wastewaterConnected: true,
            stormwaterConnected: true,
            rubbishCollectionDay: 'Wednesday morning',
            meterLocationDescription: 'Front boundary water meter manifold',
            outageStatus: 'Normal',
            outageDetails: 'Reticulation active under standard operating pressure.',
          },
          planning: {
            maxBuildingCoveragePct: 45,
            maxHeightM: 11.0,
            minLandscapedAreaPct: 35,
            imperviousAreaLimitPct: 60,
            floodRisk: 'Low',
            overlandFlowPath: false,
            heritageOverlay: false,
            catchmentZone: 'Auckland Central Catchment Basin',
          },
          engineerData: {
            supplyZoneId: zone.zoneId,
            sewerSubcatchmentId: 'WW-LIVE-01',
            pipeConnectionCompkey: 2017826,
            meterSerialNumber: 'WM-LIVE-CURRENT',
            meterSizeMm: 20,
            meterLastReadM3: 412.8,
            backflowHazardLevel: 'Low',
            staticPressureKPa: 490,
            cathodicProtectionStatus: 'N/A',
            scadaZoneId: 'SC-LIVE-AKL',
          },
          waterLineage: getDocumentedWaterLineage('Current Location', 2017826, 20),
        };
        setSelectedFeature({
          type: 'parcel',
          data: liveParcel,
        });
        resolvePathwayForParcel(liveParcel);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          applyLocation(pos.coords.latitude, pos.coords.longitude, true);
        },
        (err) => {
          console.warn('[Geolocation] Browser GPS error or permission denied:', err.message);
          applyLocation(-36.9094, 174.6806, false);
        },
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 30000 }
      );
    } else {
      applyLocation(-36.9094, 174.6806, false);
    }
  }, [resolvePathwayForParcel]);

  const handleSubmitComplaint = useCallback((newComplaint: WaterIncidentComplaint) => {
    setComplaintsList(prev => [newComplaint, ...prev]);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 font-sans select-none">
      {/* Taumata Arowai Public-Sector Header Navigation */}
      <Header
        currentUser={currentUser}
        onOpenLogin={handleOpenGeneralLogin}
        onLogout={handleLogout}
        onSearchSelectParcel={handleSearchSelectParcel}
        onSearchSelectZone={handleSearchSelectZone}
        onLocateMe={handleLocateMe}
        isLocating={isLocating}
        onOpenComplaintModal={() => handleReportIncident()}
        onOpenDataRequestModal={() => setIsDataModalOpen(true)}
        onOpenDocumentation={() => setIsDocModalOpen(true)}
        onOpenProfileDashboard={() => setIsProfileDashboardOpen(true)}
      />

      {/* Main Map Viewport Area (Default Landing Page) */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* Non-Jurisdictional GPS Location Alert */}
        {gpsAdvisory && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] max-w-xl w-[92%] bg-[#072e54] text-white px-4 py-3 rounded-lg shadow-xl border border-sky-400/40 flex items-start gap-3">
            <div className="p-1 rounded bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1 text-xs leading-relaxed">
              <div className="font-bold text-sky-200 uppercase tracking-wider text-[10px] mb-0.5">
                Territorial Boundary Notice
              </div>
              <div>{gpsAdvisory}</div>
            </div>
            <button
              type="button"
              onClick={() => setGpsAdvisory(null)}
              className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              aria-label="Dismiss notice"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Leaflet GIS Map Canvas - Available to all guests */}
        <GisMap
          accessLevel={accessLevel}
          baseMapStyle={baseMapStyle}
          layerVisibility={layerVisibility}
          selectedFeature={selectedFeature}
          onSelectFeature={handleSelectFeature}
          flyToLocation={flyToLocation}
          customGeoJsonData={customGeoJsonData}
          onToggleLayerPanel={() => setIsLayerPanelOpen(prev => !prev)}
          isLayerPanelOpen={isLayerPanelOpen}
          pathway={pathwayState}
          focusZoneBounds={focusZoneBounds}
          focusRouteBounds={focusRouteBounds}
        />

        {/* Map Layers & Basemap Control Panel */}
        <LayerPanel
          isOpen={isLayerPanelOpen}
          onClose={() => setIsLayerPanelOpen(false)}
          baseMapStyle={baseMapStyle}
          onBaseMapChange={setBaseMapStyle}
          layerVisibility={layerVisibility}
          onToggleLayer={handleToggleLayer}
          accessLevel={accessLevel}
        />

        {/* Right Inspection Drawer - Fully functional for guests */}
        <InspectionDrawer
          selection={selectedFeature}
          accessLevel={accessLevel}
          onClose={() => setSelectedFeature(null)}
          onLocateAsset={(coords) => {
            setFlyToLocation({ center: coords, zoom: 19 });
          }}
          onReportIncident={handleReportIncident}
          complaintsList={complaintsList}
        />

        {/* Water Supply Pathway & Single Connectivity Path Panel */}
        <PathwayPanel
          pathway={pathwayState}
          isLoading={isResolvingPathway}
          onFocusZone={(zone) => {
            if (zone.polygon && zone.polygon.length > 0) {
              setFocusZoneBounds(zone.polygon);
            } else {
              setFlyToLocation({ center: [zone.lat, zone.lng], zoom: 15 });
            }
          }}
          onFocusAddress={(coords) => {
            setFlyToLocation({ center: coords, zoom: 18 });
          }}
          onFocusRoute={(coords) => {
            setFocusRouteBounds(coords);
          }}
          onReportIncident={(addr) => handleReportIncident(addr)}
          onClear={() => {
            setPathwayState(null);
            setFocusRouteBounds(null);
          }}
        />

        {/* Citizen Water Contamination & Service Complaint Modal */}
        <CitizenComplaintModal
          isOpen={isComplaintModalOpen}
          onClose={() => setIsComplaintModalOpen(false)}
          onSubmitComplaint={handleSubmitComplaint}
          currentUser={currentUser}
          selectedAddress={complaintAddressPrefill}
          selectedCoordinates={
            selectedFeature?.type === 'parcel' ? selectedFeature.data.center : undefined
          }
          complaintsList={complaintsList}
          onOpenLoginModal={(reason) => {
            setLoginReason(reason || 'general');
            setIsLoginModalOpen(true);
          }}
          initialTab={complaintModalTab}
        />

        <DataRequestModal
          isOpen={isDataModalOpen}
          onClose={() => setIsDataModalOpen(false)}
          onLoadCustomGeoJson={setCustomGeoJsonData}
          onClearCustomData={() => setCustomGeoJsonData(null)}
          hasCustomData={Boolean(customGeoJsonData)}
          onOpenDocumentation={() => {
            setIsDataModalOpen(false);
            setIsDocModalOpen(true);
          }}
          currentUser={currentUser}
        />

        {/* Technical Documentation & Architecture Modal */}
        <DocumentationModal
          isOpen={isDocModalOpen}
          onClose={() => setIsDocModalOpen(false)}
        />

        <ProfileDashboard
          currentUser={currentUser}
          isOpen={isProfileDashboardOpen}
          onClose={() => setIsProfileDashboardOpen(false)}
        />

        {/* Compact Login Modal */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLogin={handleLoginSuccess}
          currentUser={currentUser}
          reason={loginReason}
          pendingIncidentAddress={pendingIncidentAddress}
        />
      </main>
    </div>
  );
}