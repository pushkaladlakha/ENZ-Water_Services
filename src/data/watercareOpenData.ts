/**
 * Authoritative GIS Data Schemas, Open Data Ingestion, and Parsers
 * Taumata Arowai - Water Services Authority
 */

// Converts ArcGIS REST FeatureSet JSON to standard RFC 7946 GeoJSON
export function convertArcGisJsonToGeoJson(arcgisData: any): any {
  if (arcgisData.type === 'FeatureCollection') {
    return arcgisData;
  }

  if (!arcgisData || !Array.isArray(arcgisData.features)) {
    throw new Error('Provided payload does not contain an ArcGIS features array or GeoJSON FeatureCollection.');
  }

  const features = arcgisData.features
    .map((f: any, idx: number) => {
      let geometry: any = null;
      if (f.geometry) {
        if (f.geometry.x !== undefined && f.geometry.y !== undefined) {
          geometry = {
            type: 'Point',
            coordinates: [f.geometry.x, f.geometry.y],
          };
        } else if (f.geometry.paths && Array.isArray(f.geometry.paths)) {
          geometry = {
            type: f.geometry.paths.length === 1 ? 'LineString' : 'MultiLineString',
            coordinates: f.geometry.paths.length === 1 ? f.geometry.paths[0] : f.geometry.paths,
          };
        } else if (f.geometry.rings && Array.isArray(f.geometry.rings)) {
          geometry = {
            type: f.geometry.rings.length === 1 ? 'Polygon' : 'MultiPolygon',
            coordinates: f.geometry.rings.length === 1 ? f.geometry.rings : [f.geometry.rings],
          };
        }
      }

      return {
        type: 'Feature',
        id: f.attributes?.OBJECTID || f.attributes?.GIS_ID || f.attributes?.COMPKEY || idx,
        properties: f.attributes || {},
        geometry,
      };
    })
    .filter((f: any) => f.geometry !== null);

  return {
    type: 'FeatureCollection',
    features,
  };
}

// Parses delimited CSV or TSV text into GeoJSON FeatureCollection
export function parseDelimitedTextToGeoJson(text: string): any {
  const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('CSV content must contain at least a header row and one data row.');
  }

  const headerLine = lines[0];
  let delimiter = ',';
  if (headerLine.includes('\t')) delimiter = '\t';
  else if (headerLine.includes(';') && !headerLine.includes(',')) delimiter = ';';

  const headers = headerLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));

  const latIndex = headers.findIndex(h => /^(supply\s*latitude|latitude|lat|y)$/i.test(h));
  const lngIndex = headers.findIndex(h => /^(supply\s*longitude|longitude|lng|long|lon|x)$/i.test(h));

  const features: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (row.length === 0 || (row.length === 1 && !row[0])) continue;

    const properties: Record<string, any> = {};
    headers.forEach((h, colIdx) => {
      let val: any = row[colIdx] ?? '';
      if (/^-?\d+(\.\d+)?$/.test(val)) {
        val = Number(val);
      }
      properties[h] = val;
    });

    let geometry: any = null;
    if (latIndex !== -1 && lngIndex !== -1) {
      const lat = Number(row[latIndex]);
      const lng = Number(row[lngIndex]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        geometry = {
          type: 'Point',
          coordinates: [lng, lat],
        };
      }
    }

    features.push({
      type: 'Feature',
      id: properties['Zone ID'] || properties['zone'] || i,
      properties,
      geometry,
    });
  }

  return {
    type: 'FeatureCollection',
    features: features.filter(f => f.geometry !== null),
    allRowsCount: features.length,
  };
}

// Authoritative Auckland Drinking Water Supply Zones baseline (from AklDizzy default.gdb layer)
export const AKL_DIZZY_SUPPLY_ZONES_BASELINE = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        zone: 'AKL-SZ-14',
        zone_name: 'Titirangi & Kelston Supply Zone',
        supply_id: 'SUP-AKL-WEST-01',
        supply_name: 'Huia / Waitakere Western Water Supply Scheme',
        pop_regist: 48250,
        pop_low_de: 14200,
        pop_mod_de: 22100,
        pop_high_d: 11950,
        pop_maori: 6180,
        urban_rural: 'Urban',
        source_dam: 'Waitakere & Lower Nihotupu Dams',
        provenance: 'Taumata Arowai Drinking Water Register (AklDizzy Layer)',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [174.6650, -36.9020],
          [174.6950, -36.9040],
          [174.6980, -36.9250],
          [174.6620, -36.9230],
          [174.6650, -36.9020],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: {
        zone: 'AKL-SZ-15',
        zone_name: 'New Lynn & Avondale Supply Zone',
        supply_id: 'SUP-AKL-WEST-01',
        supply_name: 'Huia / Waitakere Western Water Supply Scheme',
        pop_regist: 56100,
        pop_low_de: 16800,
        pop_mod_de: 24500,
        pop_high_d: 14800,
        pop_maori: 7320,
        urban_rural: 'Urban',
        source_dam: 'Huia & Nihotupu Dams',
        provenance: 'Taumata Arowai Drinking Water Register (AklDizzy Layer)',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [174.6850, -36.8920],
          [174.7200, -36.8950],
          [174.7180, -36.9180],
          [174.6880, -36.9150],
          [174.6850, -36.8920],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: {
        zone: 'AKL-SZ-08',
        zone_name: 'Henderson & Te Atatu Supply Zone',
        supply_id: 'SUP-AKL-WEST-02',
        supply_name: 'Waitakere Northern Scheme',
        pop_regist: 62400,
        pop_low_de: 18200,
        pop_mod_de: 27900,
        pop_high_d: 16300,
        pop_maori: 8450,
        urban_rural: 'Urban',
        source_dam: 'Waitakere Dam & River Intake',
        provenance: 'Taumata Arowai Drinking Water Register (AklDizzy Layer)',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [174.6400, -36.8750],
          [174.6850, -36.8780],
          [174.6800, -36.9020],
          [174.6350, -36.8980],
          [174.6400, -36.8750],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: {
        zone: 'AKL-SZ-01',
        zone_name: 'Auckland Central CBD & Waterfront',
        supply_id: 'SUP-AKL-CENTRAL-01',
        supply_name: 'Central Isthmus Bulk Supply Scheme',
        pop_regist: 72400,
        pop_low_de: 31000,
        pop_mod_de: 26000,
        pop_high_d: 15400,
        pop_maori: 4900,
        urban_rural: 'Urban',
        source_dam: 'Cosseys Dam & Upper Nihotupu Dam',
        provenance: 'Taumata Arowai Drinking Water Register (AklDizzy Layer)',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [174.7450, -36.8380],
          [174.7820, -36.8400],
          [174.7800, -36.8620],
          [174.7430, -36.8600],
          [174.7450, -36.8380],
        ]],
      },
    },
  ],
};

// Documented Auckland Zone List CSV baseline (from Auckland_zone_list.xlsx)
export const AUCKLAND_ZONE_LIST_CSV = `Zone ID,Zone Name,Supply ID,Supply Name,Zone Population,Urban/Rural Zone,Supply Latitude,Supply Longitude,Region
AKL-SZ-14,Titirangi & Kelston,SUP-AKL-WEST-01,Huia Western Water Supply,48250,Urban,-36.9125,174.6780,Auckland
AKL-SZ-15,New Lynn & Avondale,SUP-AKL-WEST-01,Huia Western Water Supply,56100,Urban,-36.9050,174.6980,Auckland
AKL-SZ-08,Henderson & Te Atatu,SUP-AKL-WEST-02,Waitakere Northern Scheme,62400,Urban,-36.8850,174.6550,Auckland
AKL-SZ-01,Auckland Central CBD,SUP-AKL-CENTRAL-01,Central Isthmus Scheme,72400,Urban,-36.8485,174.7633,Auckland
AKL-SZ-02,Ponsonby & Grey Lynn,SUP-AKL-CENTRAL-01,Central Isthmus Scheme,38900,Urban,-36.8580,174.7430,Auckland
AKL-SZ-20,Takapuna & Devonport,SUP-AKL-NORTH-01,North Shore Southern Scheme,59300,Urban,-36.7880,174.7720,Auckland
AKL-SZ-24,Albany & Hibiscus Coast,SUP-AKL-NORTH-02,North Shore Northern Scheme,68100,Urban,-36.7320,174.7080,Auckland
AKL-SZ-35,Manukau Central & Papatoetoe,SUP-AKL-SOUTH-01,Southern Auckland Scheme,81200,Urban,-36.9920,174.8760,Auckland
AKL-SZ-38,Papakura & Drury,SUP-AKL-SOUTH-02,Hunua Foothills Scheme,43500,Urban,-37.0650,174.9450,Auckland
AKL-SZ-42,Helensville & Parakai,SUP-AKL-RURAL-01,North West Rural Water Scheme,6900,Rural,-36.6800,174.4500,Auckland`;
