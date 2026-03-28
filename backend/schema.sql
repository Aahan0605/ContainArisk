-- Drop existing tables if they exist to prevent conflicts during testing
DROP TABLE IF EXISTS risk_assessment CASCADE;
DROP TABLE IF EXISTS entity_profiles CASCADE;
DROP TABLE IF EXISTS containers CASCADE;
DROP TABLE IF EXISTS custom_users CASCADE;

-- ==========================================
-- 1. AUTHENTICATION & USER MANAGEMENT
-- ==========================================
-- Note: Supabase has built-in auth (auth.users), but often projects require 
-- a public-schema profile table to link custom application data to Auth users.

CREATE TABLE custom_users (
    id VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer',
    last_login TIMESTAMP WITH TIME ZONE
);


-- ==========================================
-- 2. SMART CONTAINER CORE DATA
-- ==========================================

-- Containers Table
CREATE TABLE containers (
    container_id VARCHAR(50) PRIMARY KEY,
    declaration_date TIMESTAMP NOT NULL,
    trade_regime VARCHAR(50),
    origin_country VARCHAR(100) NOT NULL,
    destination_country VARCHAR(100) NOT NULL,
    destination_port VARCHAR(100),
    hs_code VARCHAR(20),
    importer_id VARCHAR(50),
    exporter_id VARCHAR(50),
    declared_value DOUBLE PRECISION,
    declared_weight DOUBLE PRECISION,
    measured_weight DOUBLE PRECISION,
    shipping_line VARCHAR(100),
    dwell_time_hours INTEGER,
    clearance_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_containers_container_id ON containers(container_id);
CREATE INDEX idx_containers_importer_id ON containers(importer_id);
CREATE INDEX idx_containers_exporter_id ON containers(exporter_id);


-- Risk Assessment Table
CREATE TABLE risk_assessment (
    id SERIAL PRIMARY KEY,
    container_id VARCHAR(50) REFERENCES containers(container_id) ON DELETE CASCADE,
    risk_score DOUBLE PRECISION NOT NULL DEFAULT 0,
    risk_level VARCHAR(20),
    ml_score DOUBLE PRECISION,
    anomaly_score DOUBLE PRECISION,
    rule_score DOUBLE PRECISION,
    graph_score DOUBLE PRECISION,
    explanation TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_risk_assessment_id ON risk_assessment(id);
CREATE INDEX idx_risk_assessment_container_id ON risk_assessment(container_id);


-- Entity Profiles Table
CREATE TABLE entity_profiles (
    entity_id VARCHAR(50) PRIMARY KEY,
    entity_type VARCHAR(20), -- 'importer' or 'exporter'
    total_shipments INTEGER DEFAULT 0,
    flagged_shipments INTEGER DEFAULT 0,
    average_value DOUBLE PRECISION,
    average_weight DOUBLE PRECISION,
    risk_index DOUBLE PRECISION,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);


-- ==========================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
-- Enable RLS for all tables
ALTER TABLE custom_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessment ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_profiles ENABLE ROW LEVEL SECURITY;

-- Create Policies to allow all operations unconditionally for development
-- WARNING: In a production environment, restrict these to authenticated users
-- using `auth.uid() = custom_users.id` and checking JWT roles.
CREATE POLICY "Allow all operations for users" ON custom_users FOR ALL USING (true);
CREATE POLICY "Allow all operations for containers" ON containers FOR ALL USING (true);
CREATE POLICY "Allow all operations for risk_assessment" ON risk_assessment FOR ALL USING (true);
CREATE POLICY "Allow all operations for entity_profiles" ON entity_profiles FOR ALL USING (true);
