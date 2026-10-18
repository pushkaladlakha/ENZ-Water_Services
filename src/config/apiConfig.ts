/**
 * Centralized API & Map Tile Configuration
 * Taumata Arowai - Water Services Authority GIS Platform
 * 
 * Configured permanently via environment variables (VITE_*) for dev, staging, and production.
 * End users are NEVER prompted to input API keys or URLs to unlock the application.
 */

export interface MapTileEndpointConfig {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string[];
}

export const MAP_PROVIDERS: Record<string, MapTileEndpointConfig> = {
  'google-maps': {
    id: 'google-maps',
    name: 'Google Maps (Roadmap)',
    url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; <a href="https://maps.google.com" target="_blank" rel="noopener">Google Maps</a>',
    maxZoom: 20,
    subdomains: ['0', '1', '2', '3'],
  },
  'carto-light': {
    id: 'carto-light',
    name: 'LINZ Cadastral Light (Carto Canvas)',
    url: import.meta.env.VITE_MAP_TILES_CARTO || 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
    maxZoom: 20,
    subdomains: ['a', 'b', 'c', 'd'],
  },
  'esri-satellite': {
    id: 'esri-satellite',
    name: 'Esri World Imagery (Aerial Photography)',
    url: import.meta.env.VITE_MAP_TILES_ESRI_SATELLITE || 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19,
  },
  'osm': {
    id: 'osm',
    name: 'OpenStreetMap New Zealand',
    url: import.meta.env.VITE_MAP_TILES_OSM || 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &mdash; Tiles courtesy of <a href="https://www.hotosm.org/" target="_blank" rel="noopener">Humanitarian OpenStreetMap Team</a>',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c'],
  },
  'linz-topo': {
    id: 'linz-topo',
    name: 'LINZ Topo50 / OpenTopoMap',
    url: import.meta.env.VITE_MAP_TILES_LINZ_TOPO || 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org" target="_blank" rel="noopener">OpenTopoMap</a> (CC-BY-SA)',
    maxZoom: 17,
    subdomains: ['a', 'b', 'c'],
  },
};

export const API_CONFIG = {
  // Public or proxied backend endpoint (when server is running)
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  linzPublicKey: import.meta.env.VITE_LINZ_PUBLIC_API_KEY || '',
  isConfigured: true,
  environment: import.meta.env.MODE || 'production',
};
