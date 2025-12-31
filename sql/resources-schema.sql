-- ============================================================================
-- Resource Block System - Schema
-- KMS Integration for tracking ports, directories, databases, and other resources
-- Created: 2025-12-30
-- ============================================================================

-- Resource Types enum
CREATE TYPE resource_type AS ENUM (
    'port',           -- TCP/UDP ports
    'directory',      -- Filesystem paths
    'database',       -- PostgreSQL databases
    'db_user',        -- Database users
    'domain',         -- Domain names / subdomains
    'ssl_cert',       -- SSL certificates
    'systemd',        -- Systemd services
    'nginx_conf',     -- Nginx configurations
    'api_key',        -- API keys / tokens
    'cron_job',       -- Scheduled tasks
    'user',           -- System users
    'env_var',        -- Environment variables
    'socket',         -- Unix sockets
    'redis_db',       -- Redis database numbers
    'backup_path',    -- Backup storage paths
    'log_path',       -- Log file paths
    'secret',         -- Secrets managed by wikisys
    'other'           -- Other resources
);

-- Resource Status enum
CREATE TYPE resource_status AS ENUM (
    'active',         -- Currently in use
    'reserved',       -- Reserved but not yet active
    'deprecated',     -- Being phased out
    'available',      -- Free to use
    'conflict'        -- Conflict detected
);

-- ============================================================================
-- MAIN TABLES
-- ============================================================================

-- Projects table - links to KMS objects or standalone projects
CREATE TABLE IF NOT EXISTS resource_projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    kms_object_id INTEGER REFERENCES objects(id) ON DELETE SET NULL,
    owner VARCHAR(100) DEFAULT 'devops',
    base_path VARCHAR(500),               -- Main project directory
    status resource_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Main resources table
CREATE TABLE IF NOT EXISTS resources (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES resource_projects(id) ON DELETE CASCADE,
    resource_type resource_type NOT NULL,
    name VARCHAR(255) NOT NULL,           -- Human readable name
    value VARCHAR(500) NOT NULL,          -- The actual value (port, path, etc.)
    description TEXT,
    status resource_status DEFAULT 'active',

    -- Port-specific fields
    port_protocol VARCHAR(10),            -- tcp, udp, both
    port_binding VARCHAR(50),             -- 127.0.0.1, 0.0.0.0, specific IP

    -- Path-specific fields
    path_type VARCHAR(20),                -- data, config, logs, backup, code
    path_permissions VARCHAR(10),         -- 755, 644, etc.

    -- Database-specific fields
    db_cluster VARCHAR(50),               -- PostgreSQL cluster name
    db_version VARCHAR(20),               -- Database version

    -- Service-specific fields
    service_unit VARCHAR(100),            -- Systemd unit name
    service_user VARCHAR(50),             -- User running the service

    -- Domain-specific fields
    domain_ssl BOOLEAN DEFAULT FALSE,
    domain_cert_path VARCHAR(500),

    -- Meta
    priority INTEGER DEFAULT 0,           -- For sorting/importance
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,                 -- For temporary allocations
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Ensure unique resources per type
    CONSTRAINT unique_resource_value UNIQUE (resource_type, value)
);

-- Resource dependencies (e.g., service depends on port, database)
CREATE TABLE IF NOT EXISTS resource_dependencies (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
    depends_on_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) DEFAULT 'requires',  -- requires, optional, conflicts
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT no_self_dependency CHECK (resource_id != depends_on_id),
    CONSTRAINT unique_dependency UNIQUE (resource_id, depends_on_id)
);

-- Resource allocation history
CREATE TABLE IF NOT EXISTS resource_history (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER REFERENCES resources(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,          -- created, updated, deleted, reserved, released
    old_value TEXT,
    new_value TEXT,
    changed_by VARCHAR(100) DEFAULT 'system',
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Port ranges reserved for specific purposes
CREATE TABLE IF NOT EXISTS port_ranges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    start_port INTEGER NOT NULL,
    end_port INTEGER NOT NULL,
    purpose VARCHAR(100),                 -- development, production, internal, etc.
    owner VARCHAR(100),
    status resource_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT valid_port_range CHECK (start_port > 0 AND end_port > start_port AND end_port < 65536)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_project ON resources(project_id);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);
CREATE INDEX IF NOT EXISTS idx_resources_value ON resources(value);
CREATE INDEX IF NOT EXISTS idx_resource_history_resource ON resource_history(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_projects_kms ON resource_projects(kms_object_id);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active ports view
CREATE OR REPLACE VIEW v_active_ports AS
SELECT
    r.id,
    r.name,
    r.value::integer as port,
    r.port_protocol,
    r.port_binding,
    p.name as project_name,
    r.status,
    r.description
FROM resources r
LEFT JOIN resource_projects p ON r.project_id = p.id
WHERE r.resource_type = 'port' AND r.status = 'active'
ORDER BY r.value::integer;

-- Active directories view
CREATE OR REPLACE VIEW v_active_directories AS
SELECT
    r.id,
    r.name,
    r.value as path,
    r.path_type,
    p.name as project_name,
    r.status
FROM resources r
LEFT JOIN resource_projects p ON r.project_id = p.id
WHERE r.resource_type = 'directory' AND r.status = 'active'
ORDER BY r.value;

-- Active databases view
CREATE OR REPLACE VIEW v_active_databases AS
SELECT
    r.id,
    r.name,
    r.value as database_name,
    r.db_cluster,
    r.db_version,
    p.name as project_name,
    r.status
FROM resources r
LEFT JOIN resource_projects p ON r.project_id = p.id
WHERE r.resource_type = 'database' AND r.status = 'active'
ORDER BY r.value;

-- Resources summary by project
CREATE OR REPLACE VIEW v_project_resources AS
SELECT
    p.id as project_id,
    p.name as project_name,
    p.slug,
    p.status as project_status,
    COUNT(r.id) as total_resources,
    COUNT(CASE WHEN r.resource_type = 'port' THEN 1 END) as ports,
    COUNT(CASE WHEN r.resource_type = 'directory' THEN 1 END) as directories,
    COUNT(CASE WHEN r.resource_type = 'database' THEN 1 END) as databases,
    COUNT(CASE WHEN r.resource_type = 'systemd' THEN 1 END) as services
FROM resource_projects p
LEFT JOIN resources r ON p.id = r.project_id AND r.status = 'active'
GROUP BY p.id, p.name, p.slug, p.status
ORDER BY p.name;

-- Available ports (not in use)
CREATE OR REPLACE VIEW v_available_ports AS
WITH used_ports AS (
    SELECT value::integer as port FROM resources WHERE resource_type = 'port' AND status = 'active'
),
port_series AS (
    SELECT generate_series(1024, 65535) as port
)
SELECT port
FROM port_series
WHERE port NOT IN (SELECT port FROM used_ports)
  AND port NOT IN (1024, 3306, 5432, 5433, 6379, 11211, 22, 80, 443) -- Reserved system ports
ORDER BY port
LIMIT 100;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Find next available port in a range
CREATE OR REPLACE FUNCTION get_next_available_port(
    start_port INTEGER DEFAULT 8100,
    end_port INTEGER DEFAULT 9000
)
RETURNS INTEGER AS $$
DECLARE
    next_port INTEGER;
BEGIN
    SELECT port INTO next_port
    FROM v_available_ports
    WHERE port >= start_port AND port <= end_port
    LIMIT 1;

    RETURN next_port;
END;
$$ LANGUAGE plpgsql;

-- Check if a resource value is available
CREATE OR REPLACE FUNCTION is_resource_available(
    p_type resource_type,
    p_value VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM resources
        WHERE resource_type = p_type
          AND value = p_value
          AND status IN ('active', 'reserved')
    );
END;
$$ LANGUAGE plpgsql;

-- Allocate a new resource
CREATE OR REPLACE FUNCTION allocate_resource(
    p_project_id INTEGER,
    p_type resource_type,
    p_name VARCHAR,
    p_value VARCHAR,
    p_description TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    new_id INTEGER;
BEGIN
    -- Check availability
    IF NOT is_resource_available(p_type, p_value) THEN
        RAISE EXCEPTION 'Resource % of type % is already in use', p_value, p_type;
    END IF;

    -- Insert resource
    INSERT INTO resources (project_id, resource_type, name, value, description, status)
    VALUES (p_project_id, p_type, p_name, p_value, p_description, 'active')
    RETURNING id INTO new_id;

    -- Log history
    INSERT INTO resource_history (resource_id, action, new_value, reason)
    VALUES (new_id, 'created', p_value, 'Resource allocated');

    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Release a resource
CREATE OR REPLACE FUNCTION release_resource(p_resource_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    -- Log history before update
    INSERT INTO resource_history (resource_id, action, old_value, new_value, reason)
    SELECT id, 'released', value, value, 'Resource released'
    FROM resources WHERE id = p_resource_id;

    -- Mark as available
    UPDATE resources
    SET status = 'available', updated_at = NOW()
    WHERE id = p_resource_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_resources_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_resources_timestamp
    BEFORE UPDATE ON resources
    FOR EACH ROW
    EXECUTE FUNCTION update_resources_timestamp();

CREATE TRIGGER trigger_projects_timestamp
    BEFORE UPDATE ON resource_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_resources_timestamp();

-- ============================================================================
-- INITIAL DATA - Current Server Resources
-- ============================================================================

-- Create default projects based on current server state
INSERT INTO resource_projects (name, slug, description, base_path, owner) VALUES
    ('KMS Tools', 'kms-tools', 'Knowledge Management System - Tools & API', '/opt/kms-tools', 'devops'),
    ('KMS Data', 'kms', 'Knowledge Management System - Data Repository', '/opt/kms', 'devops'),
    ('Odoo 19', 'odoo19', 'Odoo ERP System', '/opt/Odoo', 'devops'),
    ('BUS Tickets', 'bus-tickets', 'Bus Ticket Booking System', '/opt/BUS-Tickets', 'devops'),
    ('WikiSys Local', 'wikisys', 'Wiki System Local Configuration', '/home/devops/.wikisys-local', 'devops'),
    ('IT Enterprise', 'it-enterprise', 'IT Enterprise Solutions', '/opt/IT-Enterprise', 'devops'),
    ('System Services', 'system', 'System-level services and configurations', '/', 'root')
ON CONFLICT (slug) DO NOTHING;

-- Register current ports
INSERT INTO resources (project_id, resource_type, name, value, port_protocol, port_binding, description) VALUES
    ((SELECT id FROM resource_projects WHERE slug = 'system'), 'port', 'SSH', '22770', 'tcp', '0.0.0.0', 'Custom SSH port'),
    ((SELECT id FROM resource_projects WHERE slug = 'system'), 'port', 'HTTP', '80', 'tcp', '0.0.0.0', 'Nginx HTTP'),
    ((SELECT id FROM resource_projects WHERE slug = 'system'), 'port', 'HTTPS', '443', 'tcp', '0.0.0.0', 'Nginx HTTPS'),
    ((SELECT id FROM resource_projects WHERE slug = 'system'), 'port', 'PostgreSQL 16', '5432', 'tcp', '127.0.0.1', 'PostgreSQL 16 cluster'),
    ((SELECT id FROM resource_projects WHERE slug = 'system'), 'port', 'PostgreSQL 18', '5433', 'tcp', '127.0.0.1', 'PostgreSQL 18 cluster'),
    ((SELECT id FROM resource_projects WHERE slug = 'system'), 'port', 'Redis', '6379', 'tcp', '0.0.0.0', 'Redis server'),
    ((SELECT id FROM resource_projects WHERE slug = 'system'), 'port', 'Memcached', '11211', 'tcp', '127.0.0.1', 'Memcached'),
    ((SELECT id FROM resource_projects WHERE slug = 'kms-tools'), 'port', 'KMS API', '8000', 'tcp', '127.0.0.1', 'KMS FastAPI backend'),
    ((SELECT id FROM resource_projects WHERE slug = 'kms-tools'), 'port', 'KMS Terminal', '7681', 'tcp', '127.0.0.1', 'ttyd web terminal'),
    ((SELECT id FROM resource_projects WHERE slug = 'kms-tools'), 'port', 'KMS FileBrowser', '8082', 'tcp', '127.0.0.1', 'FileBrowser web'),
    ((SELECT id FROM resource_projects WHERE slug = 'kms-tools'), 'port', 'KMS VS Code', '8443', 'tcp', '127.0.0.1', 'code-server VS Code'),
    ((SELECT id FROM resource_projects WHERE slug = 'odoo19'), 'port', 'Odoo Web', '8069', 'tcp', '0.0.0.0', 'Odoo web interface'),
    ((SELECT id FROM resource_projects WHERE slug = 'odoo19'), 'port', 'Odoo Longpolling', '8072', 'tcp', '0.0.0.0', 'Odoo longpolling'),
    ((SELECT id FROM resource_projects WHERE slug = 'bus-tickets'), 'port', 'Bus Tickets App', '44770', 'tcp', '*', 'Next.js application')
ON CONFLICT (resource_type, value) DO NOTHING;

-- Register current databases
INSERT INTO resources (project_id, resource_type, name, value, db_cluster, db_version, description) VALUES
    ((SELECT id FROM resource_projects WHERE slug = 'kms-tools'), 'database', 'KMS Database', 'kms_db', '16-main', '16', 'KMS knowledge management database'),
    ((SELECT id FROM resource_projects WHERE slug = 'odoo19'), 'database', 'Odoo Database', 'odoo19', '18-main', '18', 'Odoo ERP database')
ON CONFLICT (resource_type, value) DO NOTHING;

-- Register current directories
INSERT INTO resources (project_id, resource_type, name, value, path_type, description) VALUES
    ((SELECT id FROM resource_projects WHERE slug = 'kms-tools'), 'directory', 'KMS Tools Root', '/opt/kms-tools', 'code', 'KMS tools application'),
    ((SELECT id FROM resource_projects WHERE slug = 'kms'), 'directory', 'KMS Data Root', '/opt/kms', 'data', 'KMS data repository'),
    ((SELECT id FROM resource_projects WHERE slug = 'odoo19'), 'directory', 'Odoo Root', '/opt/Odoo', 'code', 'Odoo installation'),
    ((SELECT id FROM resource_projects WHERE slug = 'bus-tickets'), 'directory', 'Bus Tickets Root', '/opt/BUS-Tickets', 'code', 'Bus tickets application'),
    ((SELECT id FROM resource_projects WHERE slug = 'system'), 'directory', 'Backups', '/opt/BackUps', 'backup', 'System backup directory'),
    ((SELECT id FROM resource_projects WHERE slug = 'wikisys'), 'directory', 'WikiSys Root', '/home/devops/.wikisys-local', 'config', 'WikiSys local configuration')
ON CONFLICT (resource_type, value) DO NOTHING;

-- Register current systemd services
INSERT INTO resources (project_id, resource_type, name, value, service_user, description) VALUES
    ((SELECT id FROM resource_projects WHERE slug = 'kms-tools'), 'systemd', 'KMS API Service', 'kms-api.service', 'devops', 'KMS FastAPI application'),
    ((SELECT id FROM resource_projects WHERE slug = 'kms-tools'), 'systemd', 'KMS ttyd Service', 'kms-tools-ttyd.service', 'devops', 'Web terminal service'),
    ((SELECT id FROM resource_projects WHERE slug = 'kms-tools'), 'systemd', 'KMS FileBrowser Service', 'kms-tools-filebrowser.service', 'devops', 'File browser service'),
    ((SELECT id FROM resource_projects WHERE slug = 'kms-tools'), 'systemd', 'KMS Code-Server Service', 'kms-tools-code-server.service', 'devops', 'VS Code web service'),
    ((SELECT id FROM resource_projects WHERE slug = 'odoo19'), 'systemd', 'Odoo 19 Service', 'odoo19.service', 'odoo', 'Odoo application server'),
    ((SELECT id FROM resource_projects WHERE slug = 'system'), 'systemd', 'Nginx Service', 'nginx.service', 'www-data', 'Nginx web server'),
    ((SELECT id FROM resource_projects WHERE slug = 'system'), 'systemd', 'PostgreSQL 16', 'postgresql@16-main.service', 'postgres', 'PostgreSQL cluster 16'),
    ((SELECT id FROM resource_projects WHERE slug = 'system'), 'systemd', 'PostgreSQL 18', 'postgresql@18-main.service', 'postgres', 'PostgreSQL cluster 18')
ON CONFLICT (resource_type, value) DO NOTHING;

-- Register domains
INSERT INTO resources (project_id, resource_type, name, value, domain_ssl, domain_cert_path, description) VALUES
    ((SELECT id FROM resource_projects WHERE slug = 'kms-tools'), 'domain', 'KMS Domain', 'kms.it-enterprise.solutions', TRUE, '/etc/letsencrypt/live/kms.it-enterprise.solutions', 'KMS web interface'),
    ((SELECT id FROM resource_projects WHERE slug = 'bus-tickets'), 'domain', 'Bus Tickets Domain', 'sell.bus-ticket.info', TRUE, '/etc/letsencrypt/live/sell.bus-ticket.info', 'Bus ticket booking')
ON CONFLICT (resource_type, value) DO NOTHING;

-- Register nginx configs
INSERT INTO resources (project_id, resource_type, name, value, description) VALUES
    ((SELECT id FROM resource_projects WHERE slug = 'kms-tools'), 'nginx_conf', 'KMS Nginx', '/etc/nginx/sites-available/kms', 'KMS nginx configuration'),
    ((SELECT id FROM resource_projects WHERE slug = 'bus-tickets'), 'nginx_conf', 'Bus Tickets Nginx', '/etc/nginx/sites-available/sell.bus-ticket.info.conf', 'Bus tickets nginx config')
ON CONFLICT (resource_type, value) DO NOTHING;

-- Define port ranges
INSERT INTO port_ranges (name, description, start_port, end_port, purpose, owner) VALUES
    ('Development APIs', 'Reserved for development API services', 8100, 8199, 'development', 'devops'),
    ('Web Applications', 'Reserved for web application frontends', 3000, 3099, 'development', 'devops'),
    ('Internal Services', 'Reserved for internal microservices', 9000, 9099, 'internal', 'system'),
    ('Test Environments', 'Reserved for testing', 8500, 8599, 'testing', 'devops'),
    ('Custom SSH', 'Custom SSH ports', 22000, 23000, 'security', 'system')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE resources IS 'Central registry for all server resources (ports, directories, databases, etc.)';
COMMENT ON TABLE resource_projects IS 'Projects that own resources, linked to KMS objects';
COMMENT ON TABLE resource_dependencies IS 'Dependencies between resources';
COMMENT ON TABLE resource_history IS 'Audit log of resource changes';
COMMENT ON TABLE port_ranges IS 'Predefined port ranges for different purposes';

COMMENT ON FUNCTION get_next_available_port IS 'Find next available port in a given range';
COMMENT ON FUNCTION is_resource_available IS 'Check if a resource value is available for allocation';
COMMENT ON FUNCTION allocate_resource IS 'Allocate a new resource to a project';
COMMENT ON FUNCTION release_resource IS 'Release a resource back to available pool';
