import React, { useState } from 'react';
import { 
  X, 
  Map as MapIcon,
  Layers,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';
import { BaseMapStyle, LayerVisibility, AccessLevel } from '../types/gis';

interface LayerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  baseMapStyle: BaseMapStyle;
  onBaseMapChange: (style: BaseMapStyle) => void;
  layerVisibility: LayerVisibility;
  onToggleLayer: (key: keyof LayerVisibility) => void;
  accessLevel: AccessLevel;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  isOpen,
  onClose,
  baseMapStyle,
  onBaseMapChange,
  layerVisibility,
  onToggleLayer,
  accessLevel,
}) => {
  const [activeTab, setActiveTab] = useState<'layers' | 'basemap'>('layers');

  if (!isOpen) return null;

  const baseMaps: { id: BaseMapStyle; label: string; desc: string }[] = [
    {
      id: 'google-maps',
      label: 'Google Maps (Roadmap)',
      desc: 'Standard Google Maps vector cartography with street names, buildings & landmarks.',
    },
    {
      id: 'esri-satellite',
      label: 'Esri Aerial Satellite',
      desc: 'High-resolution aerial photography showing real roofs, driveways & greenery.',
    },
    {
      id: 'osm',
      label: 'OpenStreetMap NZ',
      desc: 'Standard topographic street network with street names & landmarks.',
    },
    {
      id: 'linz-topo',
      label: 'LINZ Topo50 Style',
      desc: 'Topographic contour elevation and geographic terrain features.',
    },
  ];

  const layerItems: { key: keyof LayerVisibility; label: string; desc: string; officialOnly?: boolean; color: string }[] = [
    {
      key: 'supplyZones',
      label: 'Auckland Drinking Water Supply Zones',
      desc: 'Authoritative spatial boundaries of water supply zones (AklDizzy).',
      color: 'bg-sky-600',
    },
    {
      key: 'supplyBuffers',
      label: 'Zone Buffers Corridors',
      desc: 'Concentric protection tiers & distance buffers (50m, 100m, 200m).',
      color: 'bg-sky-400',
    },
    {
      key: 'parcels',
      label: 'LINZ Primary Land Parcels',
      desc: 'Authoritative property boundaries with legal lot and DP numbers.',
      color: 'bg-amber-600',
    },
    {
      key: 'waterPipes',
      label: 'Watercare Potable Water Pipes',
      desc: 'Water_Pipe GeoJSON; loaded by visible Auckland map area when zoomed in.',
      color: 'bg-blue-600',
    },
    {
      key: 'wastewaterPipes',
      label: 'Wastewater Sewer Network',
      desc: 'Gravity sewers, rising mains, and sanitary collection pipes.',
      officialOnly: true,
      color: 'bg-red-600',
    },
    {
      key: 'stormwaterPipes',
      label: 'Stormwater Culverts & Drains',
      desc: 'Public stormwater pipes, culverts, and overland flow lines.',
      officialOnly: true,
      color: 'bg-teal-600',
    },
    {
      key: 'fittings',
      label: 'Water Valves & Network Fittings',
      desc: 'Water_Valve GeoJSON and the existing hydrant, meter, and structure layers.',
      officialOnly: true,
      color: 'bg-indigo-600',
    },
    {
      key: 'floodHazard',
      label: 'Flood Hazard Study Extents',
      desc: '1-in-100 year rainfall flood inundation corridors.',
      color: 'bg-cyan-600',
    },
  ];

  const isStaff = accessLevel === 'admin' || accessLevel === 'official';

  return (
    <div className="absolute right-4 bottom-20 w-84 max-h-[calc(100vh-140px)] bg-white border border-slate-300 rounded-lg shadow-2xl z-20 flex flex-col overflow-hidden animate-in fade-in duration-150">
      {/* Panel Header */}
      <div className="px-4 py-3 bg-[#072e54] text-white flex items-center justify-between border-b border-[#052340]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-300" />
          <h2 className="text-xs font-bold uppercase tracking-wider">Map Layers & Basemap</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close Layer Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-2 px-3 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'layers'
              ? 'border-[#072e54] text-[#072e54] bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Active Layers</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('basemap')}
          className={`flex-1 py-2 px-3 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'basemap'
              ? 'border-[#072e54] text-[#072e54] bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Basemap Style</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {activeTab === 'layers' ? (
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 px-1">
              Toggle Operational GIS Overlays
            </div>
            {layerItems.map((item) => {
              if (item.officialOnly && !isStaff) return null;
              const isVisible = layerVisibility[item.key] ?? false;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onToggleLayer(item.key)}
                  className={`w-full text-left p-2.5 rounded border text-xs transition-colors flex items-start gap-2.5 cursor-pointer ${
                    isVisible
                      ? 'bg-slate-50/80 border-slate-300 text-slate-900'
                      : 'border-slate-200 opacity-60 hover:opacity-100 bg-white text-slate-500'
                  }`}
                >
                  <div className="mt-0.5 shrink-0 text-slate-600">
                    {isVisible ? (
                      <Eye className="w-4 h-4 text-[#072e54]" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.color}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 px-1">
              Select Background Imagery
            </div>
            {baseMaps.map((map) => {
              const isSelected = baseMapStyle === map.id;
              return (
                <button
                  key={map.id}
                  type="button"
                  onClick={() => onBaseMapChange(map.id)}
                  className={`w-full text-left p-2.5 rounded border text-xs transition-colors flex items-start gap-2.5 cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50/70 border-[#072e54] text-[#072e54] font-medium ring-1 ring-[#072e54]'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-[#072e54] bg-[#072e54]' : 'border-slate-400'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{map.label}</div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{map.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
