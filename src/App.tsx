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
import { SignInPage } from './components/sign-in';
import { GuestLookup } from './components/GuestLookup';
import { 
  AccessLevel, 
  BaseMapStyle, 
  LayerVisibility, 
  ActiveSelection, 
  ParcelFeature,
  AuthUser,
  WaterIncidentComplaint,
  PathwayResolutionResult,
  PathwayResolvedZone
} from './types/gis';
import { VERIFIED_PIPES, VERIFIED_PARCELS, getDocumentedWaterLineage } from './data/nzData';
import { 
  AucklandZoneScheme, 
  findNearestVerifiedParcel, 
  resolveAddressSupplyZone,
  simulateWaterTestingProfile 
} from './utils/waterLineageEngine';
import { 
  getCurrentUserApi, 
  fetchIncidentsApi, 
  clearAuthToken, 
  resolveWaterSupplyApi 
} from './services/apiClient';

export default function App() {
  // 1. Authentication State (Admin, Authorized Official, Citizen)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // View Routing: 'auth' (Authentication Portal) vs 'guest' (Public Pipeline Lookup) vs 'map' (Interactive GIS Map)
  const getInitialView = (): 'auth' | 'map' | 'guest' => {
    if (typeof window === 'undefined') return 'auth';
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    if (path.includes('guest') || hash.includes('guest') || search.includes('guest')) {
      return 'guest';
    }
    if (path.includes('map') || hash.includes('map') || search.includes('map')) {
      return 'map';
    }
    // Default to the authentication portal so the browser immediately displays the redesigned portal!
    return 'auth';
  };

  const [activeView, setActiveView] = useState<'auth' | 'map' | 'guest'>(getInitialView);

  // Keep URL in sync with view
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (path.includes('guest') || hash.includes('guest') || search.includes('guest')) {
        setActiveView('guest');
      } else if (path.includes('map') || hash.includes('map') || search.includes('map')) {
        setActiveView('map');
      } else {
        setActiveView('auth');
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Derived Access Role
  const accessLevel: AccessLevel = currentUser?.role || 'citizen';

  // 2. Map State
  const [baseMapStyle, setBaseMapStyle] = useState<BaseMapStyle>('esri-satellite');
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
    supplyZones: true,
    supplyBuffers: true,
    parcels: true,
    residentialZones: true,
    waterPipes: true,
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
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isProfileDashboardOpen, setIsProfileDashboardOpen] = useState(false);
  const [complaintAddressPrefill, setComplaintAddressPrefill] = useState('');

  // 6. Citizen Complaints State
  const [complaintsList, setComplaintsList] = useState<WaterIncidentComplaint[]>([]);

  // 7. Custom Ingested GeoJSON Data
  const [customGeoJsonData, setCustomGeoJsonData] = useState<any | null>(null);

  // 8. Water Supply Pathway Resolution State
  const [pathwayState, setPathwayState] = useState<PathwayResolutionResult | null>(null);
  const [isResolvingPathway, setIsResolvingPathway] = useState<boolean>(false);
  const [focusZoneBounds, setFocusZoneBounds] = useState<[number, number][] | null>(null);
  const [focusRouteBounds, setFocusRouteBounds] = useState<[number, number][] | null>(null);

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
    setCurrentUser(null);
    setActiveView('auth');
    try {
      window.history.pushState(null, '', '#login');
    } catch {}
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
  }, []);

  const handleSelectFeature = useCallback((selection: ActiveSelection | null) => {
    setSelectedFeature(selection);
  }, []);

  const handleSearchSelectZone = useCallback((zone: AucklandZoneScheme) => {
    setSelectedFeature({
      type: 'supply_zone',
      data: zone,
    });
    setFlyToLocation({
      center: [zone.lat, zone.lng],
      zoom: 15,
    });
  }, []);

  const handleLocateMe = useCallback(() => {
    setIsLocating(true);

    const applyLocation = (lat: number, lng: number, isRealGps: boolean) => {
      setIsLocating(false);
      setFlyToLocation({ center: [lat, lng], zoom: 18 });

      // 1. Check if user is near one of the verified cadastral parcels (within 250m)
      const nearest = findNearestVerifiedParcel(lat, lng);
      if (nearest) {
        setSelectedFeature({
          type: 'parcel',
          data: nearest,
        });
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
          zoneColor: '#00D4C7',
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
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          applyLocation(pos.coords.latitude, pos.coords.longitude, true);
        },
        (err) => {
          console.warn('[Geolocation] Browser GPS error or permission denied:', err.message);
          // High-reliability fallback to Auckland reticulation central
          applyLocation(-36.9094, 174.6806, false);
        },
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 30000 }
      );
    } else {
      applyLocation(-36.9094, 174.6806, false);
    }
  }, []);

  const handleOpenComplaintForAddress = useCallback((addr?: string) => {
    if (addr) {
      setComplaintAddressPrefill(addr);
    }
    setIsComplaintModalOpen(true);
  }, []);

  const handleSubmitComplaint = useCallback((newComplaint: WaterIncidentComplaint) => {
    setComplaintsList(prev => [newComplaint, ...prev]);
  }, []);

  // Primary Route: Render the redesigned AquaConnect Authentication Portal by default
  if (activeView === 'auth') {
    return (
      <SignInPage
        onLogin={(user) => {
          setCurrentUser(user);
          setActiveView('map');
          try {
            window.history.pushState(null, '', '#map');
          } catch {}
        }}
        onContinueToMap={() => {
          setActiveView('map');
          try {
            window.history.pushState(null, '', '#map');
          } catch {}
        }}
        onContinueAsGuest={() => {
          setActiveView('guest');
          try {
            window.history.pushState(null, '', '#guest');
          } catch {}
        }}
        currentUser={currentUser}
      />
    );
  }

  // Guest Pipeline Lookup Route (Public Resident Access without login credentials)
  if (activeView === 'guest') {
    return (
      <GuestLookup
        onBackToLogin={() => {
          setActiveView('auth');
          try {
            window.history.pushState(null, '', '#login');
          } catch {}
        }}
        onExploreMap={(searchedAddress) => {
          if (searchedAddress) {
            const matched = VERIFIED_PARCELS.find(p =>
              p.fullAddress.toLowerCase().includes(searchedAddress.toLowerCase())
            );
            if (matched) {
              handleSearchSelectParcel(matched);
            }
          }
          setActiveView('map');
          try {
            window.history.pushState(null, '', '#map');
          } catch {}
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-900 font-sans select-none">
      {/* Taumata Arowai Header Navigation */}
      <Header
        currentUser={currentUser}
        onOpenLogin={() => {
          setActiveView('auth');
          try {
            window.history.pushState(null, '', '#login');
          } catch {}
        }}
        onLogout={handleLogout}
        onSearchSelectParcel={handleSearchSelectParcel}
        onSearchSelectZone={handleSearchSelectZone}
        onLocateMe={handleLocateMe}
        isLocating={isLocating}
        onOpenComplaintModal={() => {
          setComplaintAddressPrefill(
            selectedFeature?.type === 'parcel' ? selectedFeature.data.fullAddress : ''
          );
          setIsComplaintModalOpen(true);
        }}
        onOpenDataRequestModal={() => setIsDataModalOpen(true)}
        onOpenDocumentation={() => setIsDocModalOpen(true)}
        onOpenProfileDashboard={() => setIsProfileDashboardOpen(true)}
      />

      {/* Main Map Viewport Area */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* Leaflet GIS Map Canvas */}
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
          pathway={null}
          focusZoneBounds={focusZoneBounds}
          focusRouteBounds={null}
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

        {/* Right Inspection Drawer */}
        <InspectionDrawer
          selection={selectedFeature}
          accessLevel={accessLevel}
          onClose={() => setSelectedFeature(null)}
          onLocateAsset={(coords) => {
            setFlyToLocation({ center: coords, zoom: 19 });
          }}
          onReportIncident={handleOpenComplaintForAddress}
          complaintsList={complaintsList}
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

        {/* Authentication Modal */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLogin={(user) => setCurrentUser(user)}
          currentUser={currentUser}
        />
      </main>
    </div>
  );
}