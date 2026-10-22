import { WaterIncidentComplaint, AuthUser } from '../types/gis';
import { AUCKLAND_ZONE_SCHEMES, resolveAddressSupplyZone } from './waterLineageEngine';
import { getSavedAuthToken } from '../services/apiClient';

/**
 * Checks if the user has statutory authority credentials (Official or Administrator)
 */
export function isAuthorityUser(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'official' || user.role === 'admin';
}

/**
 * Sanitizes and escapes a cell value for standard RFC 4180 CSV export
 * Prevents formula injection in Excel / Google Sheets
 */
function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  // Double-quote escape
  str = str.replace(/"/g, '""');
  // Formula injection mitigation for spreadsheet software
  if (/^[=\+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return `"${str}"`;
}

/**
 * Resolves comprehensive infrastructure metadata for a given incident
 */
export function resolveIncidentInfrastructure(inc: WaterIncidentComplaint) {
  // 1. Try finding zone by exact ID
  let zone = inc.supplyZoneId 
    ? AUCKLAND_ZONE_SCHEMES.find(z => z.zoneId === inc.supplyZoneId) 
    : undefined;

  // 2. Try finding zone by scheme name
  if (!zone && inc.supplySchemeName) {
    zone = AUCKLAND_ZONE_SCHEMES.find(z => 
      z.supplyName.toLowerCase() === inc.supplySchemeName?.toLowerCase() ||
      z.zoneName.toLowerCase() === inc.supplySchemeName?.toLowerCase()
    );
  }

  // 3. Try resolving via address if zone still not found
  if (!zone && inc.address) {
    const addressResult = resolveAddressSupplyZone(inc.address);
    if (addressResult && addressResult.zone) {
      zone = addressResult.zone;
    }
  }

  const zoneName = zone?.zoneName || inc.supplySchemeName || 'Kelston Supply Zone';
  const zoneId = zone?.zoneId || inc.supplyZoneId || 'AKL-SZ-14';
  const treatmentPlant = zone?.treatmentPlant?.name || 'Huia Water Treatment Plant';
  const sourceDam = zone?.primaryDam?.name || 'Waitakere Ranges Native Catchment';
  const treatmentPlantDamCombined = `${treatmentPlant} / ${sourceDam}`;

  return {
    zoneName,
    zoneId,
    treatmentPlant,
    sourceDam,
    treatmentPlantDamCombined,
  };
}

/**
 * Generates and downloads the official incident register CSV (Excel format)
 * Enforces role-based authority access check.
 */
export async function exportIncidentData(
  complaints: WaterIncidentComplaint[],
  currentUser: AuthUser | null | undefined
): Promise<{ success: boolean; message: string; filename?: string; count?: number }> {
  // 1. Strict Authority Access Guard
  if (!isAuthorityUser(currentUser)) {
    return {
      success: false,
      message: 'Access Restricted: Only authorized officials or GIS administrators can export reported incident data containing citizen residential addresses, water supply zones, associated treatment plants/dams, and contact details (Water Services Act 2021 & Privacy Act 2020).',
    };
  }

  if (!complaints || complaints.length === 0) {
    return {
      success: false,
      message: 'No registered incidents available to export.',
    };
  }

  const token = getSavedAuthToken();
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `taumata_arowai_incident_register_${dateStr}.csv`;

  // 2. Attempt direct backend authenticated download if available
  if (token) {
    try {
      const res = await fetch('/api/v1/incidents/export', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const blob = await res.blob();
        triggerDownload(blob, filename);
        return {
          success: true,
          message: `Successfully exported ${complaints.length} incident records via statutory API.`,
          filename,
          count: complaints.length,
        };
      }
    } catch {
      // Fall through to client-side generation
    }
  }

  // 3. High-Fidelity Client-Side CSV / Excel Generation
  const headers = [
    'Incident ID',
    "Citizen's Residential Address",
    'Supply Zone Name',
    'Supply Zone ID',
    'Treatment Plant / Dam Associated',
    'Associated Treatment Plant',
    'Associated Source Dam',
    'Problem / Category',
    'Severity Level',
    'Incident Description',
    'Citizen Contact Name',
    'Citizen Contact Email',
    'Citizen Contact Phone',
    'Anonymous Submission',
    'Observed Date & Time',
    'Date Logged in System',
    'Regulatory Investigation Status',
    'Boil Water Notice Advised',
    'Officer Compliance Notes',
  ];

  const rows = complaints.map((inc) => {
    const infra = resolveIncidentInfrastructure(inc);
    const problem = `${inc.categoryLabel || inc.category} [${inc.severity.toUpperCase()}]`;

    return [
      escapeCsvCell(inc.id),
      escapeCsvCell(inc.address),
      escapeCsvCell(infra.zoneName),
      escapeCsvCell(infra.zoneId),
      escapeCsvCell(infra.treatmentPlantDamCombined),
      escapeCsvCell(infra.treatmentPlant),
      escapeCsvCell(infra.sourceDam),
      escapeCsvCell(problem),
      escapeCsvCell(inc.severity.toUpperCase()),
      escapeCsvCell(inc.description),
      escapeCsvCell(inc.isAnonymous ? 'Anonymous Citizen' : (inc.reporterName || 'N/A')),
      escapeCsvCell(inc.isAnonymous ? 'N/A (Anonymous)' : (inc.reporterEmail || 'N/A')),
      escapeCsvCell(inc.isAnonymous ? 'N/A (Anonymous)' : (inc.reporterPhone || 'Not provided')),
      escapeCsvCell(inc.isAnonymous ? 'Yes (Anonymous)' : 'No'),
      escapeCsvCell(inc.observedAt),
      escapeCsvCell(inc.createdAt),
      escapeCsvCell(inc.status),
      escapeCsvCell(inc.boilWaterAdvised ? 'YES (Active Advisory)' : 'NO'),
      escapeCsvCell(inc.officerNotes || 'Logged in Taumata Arowai triage registry.'),
    ].join(',');
  });

  // UTF-8 BOM (\uFEFF) ensures Microsoft Excel displays all characters and macrons correctly
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);

  return {
    success: true,
    message: `Successfully exported ${complaints.length} incident records to Excel-compatible CSV.`,
    filename,
    count: complaints.length,
  };
}

/**
 * Triggers a native browser file download from a Blob
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
