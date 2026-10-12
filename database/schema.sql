-- =============================================================================
-- TAUMATA AROWAI - WATER SERVICES AUTHORITY OF NEW ZEALAND
-- Spatial Relational Database Schema for Drinking Water Supplies & GIS Portal
-- Engine: PostgreSQL 14+ with PostGIS 3.2+
-- File: database/schema.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. EXTENSIONS & DOMAIN CONFIGURATION
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- -----------------------------------------------------------------------------
-- 2. ENUMS
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('citizen', 'official', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE urban_rural_type AS ENUM ('Urban', 'Rural');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE compliance_status_type AS ENUM (
        'Compliant',
        'Provisionally Compliant',
        'Exempt',
        'Non-Compliant',
        'Under Review'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE buffer_distance_tier AS ENUM ('50m', '100m', '200m', '500m', '1500m');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE asset_category_type AS ENUM (
        'raw_dam',
        'treatment_plant',
        'service_reservoir',
        'trunk_main',
        'reticulation_main',
        'service_pipe',
        'isolation_valve',
        'fire_hydrant'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dataset_status_type AS ENUM (
        'uploaded',
        'validated',
        'staged',
        'published',
        'archived',
        'failed_validation'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- -----------------------------------------------------------------------------
-- 3. USER MANAGEMENT & ROLE-BASED ACCESS CONTROL (RBAC)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role user_role_type NOT NULL DEFAULT 'citizen',
    job_title VARCHAR(150),
    organization VARCHAR(200) NOT NULL DEFAULT 'Public',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON app_users(role);

-- Active Sessions for JWT / Bearer token validation
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);

-- Audit Logs for Governance & Data Provenance
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    details JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);

-- -----------------------------------------------------------------------------
-- 4. AUTHORITATIVE DATA SOURCES & UPLOADED DATASETS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_sources (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'TAUMATA_AROWAI', 'WATERCARE_OPEN_DATA', 'LINZ_LDS'
    name VARCHAR(200) NOT NULL,
    custodian VARCHAR(200) NOT NULL,
    license VARCHAR(100) NOT NULL DEFAULT 'Crown Copyright / Creative Commons Attribution 4.0 NZ',
    homepage_url VARCHAR(500),
    crs_declared VARCHAR(50) NOT NULL DEFAULT 'EPSG:2193 / EPSG:4326',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS uploaded_datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id VARCHAR(50) REFERENCES data_sources(id),
    uploaded_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_format VARCHAR(50) NOT NULL, -- 'geojson', 'csv', 'gdb_export', 'xlsx'
    sha256_checksum CHAR(64) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    target_layer VARCHAR(100) NOT NULL, -- 'AklDizzy', 'zone_list', 'buffers'
    status dataset_status_type NOT NULL DEFAULT 'uploaded',
    feature_count INT DEFAULT 0,
    validation_report JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_uploaded_status ON uploaded_datasets(status);

-- -----------------------------------------------------------------------------
-- 5. DRINKING WATER SCHEMES & SUPPLY ZONES
-- Matches: Auckland_zone_list.xlsx ('zone list' sheet: ~80 rows, 45 schemes)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS water_supply_schemes (
    supply_id VARCHAR(50) PRIMARY KEY, -- e.g. 'AKL-SUP-01'
    supply_name VARCHAR(200) NOT NULL, -- e.g. 'Auckland Metro Supply Scheme'
    supplier_name VARCHAR(200) NOT NULL DEFAULT 'Watercare Services Limited',
    region VARCHAR(100) NOT NULL DEFAULT 'Auckland Region',
    compliance_status compliance_status_type NOT NULL DEFAULT 'Compliant',
    source_water_type VARCHAR(100) NOT NULL DEFAULT 'Surface Water Dams & River Intake',
    registered_population INT NOT NULL DEFAULT 0,
    primary_treatment_plant VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Water Supply Zones (Spatial Boundary from AklDizzy / default.gdb)
CREATE TABLE IF NOT EXISTS water_supply_zones (
    zone_id VARCHAR(50) PRIMARY KEY, -- e.g. 'AKL-SZ-14' (joins to AklDizzy.zone)
    zone_name VARCHAR(200) NOT NULL, -- e.g. 'Titirangi & Kelston'
    supply_id VARCHAR(50) NOT NULL REFERENCES water_supply_schemes(supply_id) ON DELETE RESTRICT,
    urban_rural urban_rural_type NOT NULL DEFAULT 'Urban',
    zone_population INT NOT NULL DEFAULT 0,
    supply_latitude NUMERIC(10, 6) NOT NULL,
    supply_longitude NUMERIC(10, 6) NOT NULL,
    dataset_version_id UUID REFERENCES uploaded_datasets(id) ON DELETE SET NULL,
    
    -- Geographic CRS: EPSG:4326 (WGS84 Lat/Lng for web tiles and GeoJSON)
    geom_wgs84 GEOMETRY(MultiPolygon, 4326),
    
    -- Projected Local CRS: EPSG:2193 (NZTM2000 for millimeter-accurate meters & buffers)
    geom_nztm GEOMETRY(MultiPolygon, 2193),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial GiST Indexes for Millisecond Spatial Joins
CREATE INDEX IF NOT EXISTS idx_zones_geom_wgs84 ON water_supply_zones USING GIST (geom_wgs84);
CREATE INDEX IF NOT EXISTS idx_zones_geom_nztm ON water_supply_zones USING GIST (geom_nztm);
CREATE INDEX IF NOT EXISTS idx_zones_supply_id ON water_supply_zones(supply_id);

-- Zone Demographics (Matches AklDizzy attributes: pop_regist, deprivation indices, Maori pop)
CREATE TABLE IF NOT EXISTS zone_demographics (
    zone_id VARCHAR(50) PRIMARY KEY REFERENCES water_supply_zones(zone_id) ON DELETE CASCADE,
    pop_registered INT NOT NULL DEFAULT 0,
    pop_low_deprivation INT NOT NULL DEFAULT 0,
    pop_moderate_deprivation INT NOT NULL DEFAULT 0,
    pop_high_deprivation INT NOT NULL DEFAULT 0,
    pop_maori INT NOT NULL DEFAULT 0,
    census_source_year INT NOT NULL DEFAULT 2023,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Concentric Distance Buffers around Supply Perimeter
-- Matches: AklDizzy_Buffers50m, 100m, 200m, 500m, 1500m
CREATE TABLE IF NOT EXISTS supply_zone_buffers (
    id BIGSERIAL PRIMARY KEY,
    zone_id VARCHAR(50) NOT NULL REFERENCES water_supply_zones(zone_id) ON DELETE CASCADE,
    distance_tier buffer_distance_tier NOT NULL,
    buffer_distance_meters INT NOT NULL,
    geom_wgs84 GEOMETRY(MultiPolygon, 4326) NOT NULL,
    geom_nztm GEOMETRY(MultiPolygon, 2193) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buffers_geom_wgs84 ON supply_zone_buffers USING GIST (geom_wgs84);
CREATE INDEX IF NOT EXISTS idx_buffers_geom_nztm ON supply_zone_buffers USING GIST (geom_nztm);
CREATE INDEX IF NOT EXISTS idx_buffers_zone_tier ON supply_zone_buffers(zone_id, distance_tier);

-- -----------------------------------------------------------------------------
-- 6. PHYSICAL NETWORK ASSETS (DAMS, WTPS, RESERVOIRS, MAINS, VALVES, HYDRANTS)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS water_network_assets (
    compkey BIGINT PRIMARY KEY, -- Watercare Computer Key (unique asset ID)
    asset_category asset_category_type NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    operational_status VARCHAR(50) NOT NULL DEFAULT 'Operational - in use',
    nominal_diameter_mm INT,
    material VARCHAR(100), -- 'Ductile Iron', 'Polyethylene', 'Cast Iron', 'Concrete'
    pressure_class VARCHAR(50), -- 'PN12', 'PN16', 'Class C'
    installation_year INT,
    invert_depth_m NUMERIC(5, 2),
    cctv_condition_score INT CHECK (cctv_condition_score BETWEEN 1 AND 5),
    line_length_m NUMERIC(8, 2),
    storage_capacity_ml NUMERIC(10, 2), -- For dams & reservoirs
    treatment_technology VARCHAR(200),  -- For WTPs (e.g. DAF + Dual Media Filtration)
    parent_zone_id VARCHAR(50) REFERENCES water_supply_zones(zone_id) ON DELETE SET NULL,
    
    -- Geometry: Point or LineString in WGS84 & NZTM2000
    geom_wgs84 GEOMETRY(Geometry, 4326),
    geom_nztm GEOMETRY(Geometry, 2193),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_geom_wgs84 ON water_network_assets USING GIST (geom_wgs84);
CREATE INDEX IF NOT EXISTS idx_assets_category ON water_network_assets(asset_category);
CREATE INDEX IF NOT EXISTS idx_assets_parent_zone ON water_network_assets(parent_zone_id);

-- -----------------------------------------------------------------------------
-- 7. SPATIAL QUERY LOGS & PROPERTY EVIDENCE MATCHING
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS spatial_property_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    queried_address TEXT NOT NULL,
    query_point_wgs84 GEOMETRY(Point, 4326) NOT NULL,
    matched_zone_id VARCHAR(50) REFERENCES water_supply_zones(zone_id) ON DELETE SET NULL,
    matched_pipe_compkey BIGINT REFERENCES water_network_assets(compkey) ON DELETE SET NULL,
    distance_to_main_meters NUMERIC(6, 2),
    buffer_tier_detected VARCHAR(50),
    response_time_ms INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queries_point ON spatial_property_queries USING GIST (query_point_wgs84);
CREATE INDEX IF NOT EXISTS idx_queries_created_at ON spatial_property_queries(created_at);

-- -----------------------------------------------------------------------------
-- 8. AUTOMATED TIMESTAMP TRIGGER
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_app_users_updated ON app_users;
CREATE TRIGGER trg_app_users_updated
    BEFORE UPDATE ON app_users
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_supply_schemes_updated ON water_supply_schemes;
CREATE TRIGGER trg_supply_schemes_updated
    BEFORE UPDATE ON water_supply_schemes
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_supply_zones_updated ON water_supply_zones;
CREATE TRIGGER trg_supply_zones_updated
    BEFORE UPDATE ON water_supply_zones
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_network_assets_updated ON water_network_assets;
CREATE TRIGGER trg_network_assets_updated
    BEFORE UPDATE ON water_network_assets
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
