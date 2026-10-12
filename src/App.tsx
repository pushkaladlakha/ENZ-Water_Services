import React, { useState, useCallback } from 'react';
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
  WaterIncidentComplaint
} from './types/gis';
import { VERIFIED_PIPES } from './data/nzData';
import { AucklandZoneScheme } from './utils/waterLineageEngine';

export default function App() {
  // 1. Authentication State (Admin, Authorized Official, Citizen)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

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
    wastewaterPipes: true,
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
    if (!navigator.geolocation) {
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        setFlyToLocation({
          center: [latitude, longitude],
          zoom: 18,
        });
      },
      (error) => {
        setIsLocating(false);
        console.warn('Geolocation unavailable, defaulting to Auckland central:', error.message);
        setFlyToLocation({
          center: [-36.9094, 174.6806],
          zoom: 18,
        });
      },
      { timeout: 8000 }
    );
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

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-900 font-sans select-none">
      {/* Taumata Arowai Header Navigation */}
      <Header
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={() => setCurrentUser(null)}
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
          onSelectFeature={setSelectedFeature}
          flyToLocation={flyToLocation}
          customGeoJsonData={customGeoJsonData}
          onToggleLayerPanel={() => setIsLayerPanelOpen(prev => !prev)}
          isLayerPanelOpen={isLayerPanelOpen}
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