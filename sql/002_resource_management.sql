-- Resource Management System
-- Centralized registry for all system resources to prevent conflicts
-- Author: Odoo Biznes <odoo@biznes.cz>
-- Date: 2025-12-31

-- ============================================================================
-- RESOURCE CATEGORIES
-- ============================================================================

-- Main resource types enum
DO $$ BEGIN
    CREATE TYPE resource_type AS ENUM (
    'network_port',      -- TCP/UDP ports
    'ip_address',        -- IP addresses (public/private)
    'disk_mount',        -- Mounted filesystems
    'tmpfs_mount',       -- tmpfs in RAM
    'database',          -- Database names
    'db_user',           -- Database users
    'service',           -- Systemd services
    'domain',            -- Domain names
    'subdomain',         -- Subdomains
    'ssl_cert',          -- SSL certificates
    'api_endpoint',      -- API endpoints/paths
    'system_user',       -- Linux users
    'system_group',      -- Linux groups
    'cron_job',          -- Cron jobs
    'docker_container',  -- Docker containers
    'docker_network',    -- Docker networks
    'docker_volume',     -- Docker volumes
    'env_variable',      -- Environment variables
    'config_file',       -- Configuration files
    'log_file',          -- Log file paths
    'backup_location',   -- Backup directories
    'git_repo',          -- Git repositories
    'ssh_key',           -- SSH key pairs
    'process_name'       -- Process/daemon names
);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Resource status
DO $$ BEGIN
    CREATE TYPE resource_status AS ENUM (
    'reserved',    -- Reserved but not yet active
    'active',      -- Currently in use
    'deprecated',  -- Being phased out
    'released',    -- Released, can be reused
    'conflicted'   -- Conflict detected
);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- MAIN RESOURCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_resources (
    id SERIAL PRIMARY KEY,

    -- Resource identification
    resource_type resource_type NOT NULL,
    resource_name VARCHAR(500) NOT NULL,
    resource_value TEXT NOT NULL,  -- Port number, IP, path, etc.

    -- Ownership and assignment
    owner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    owner_service VARCHAR(200),    -- Service/project that owns it
    assigned_to VARCHAR(200),       -- What it's assigned to

    -- Status
    status resource_status DEFAULT 'active',
    is_locked BOOLEAN DEFAULT FALSE,  -- Prevent modification

    -- Location/scope
    server_hostname VARCHAR(255),
    environment VARCHAR(50) DEFAULT 'production',  -- prod, staging, dev, test

    -- Technical details
    metadata JSONB DEFAULT '{}',    -- Type-specific metadata
    dependencies TEXT[],            -- Other resources this depends on
    conflicts_with TEXT[],          -- Resources that conflict with this

    -- Validation
    min_value INTEGER,              -- For numeric resources (ports)
    max_value INTEGER,
    pattern VARCHAR(500),           -- Regex pattern for validation

    -- Lifecycle
    allocated_at TIMESTAMP DEFAULT NOW(),
    activated_at TIMESTAMP,
    expires_at TIMESTAMP,
    released_at TIMESTAMP,
    last_verified_at TIMESTAMP,

    -- Alerts
    alert_before_expiry INTERVAL DEFAULT '7 days',
    notify_on_conflict BOOLEAN DEFAULT TRUE,

    -- Documentation
    description TEXT,
    notes TEXT,
    documentation_url VARCHAR(500),

    -- Audit
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Unique constraint per server/environment
    UNIQUE(resource_type, resource_value, server_hostname, environment, status)
);

-- ============================================================================
-- RESOURCE ALLOCATION HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS resource_allocation_history (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER REFERENCES system_resources(id) ON DELETE CASCADE,

    action VARCHAR(50) NOT NULL,  -- allocated, activated, modified, released, conflicted
    old_status resource_status,
    new_status resource_status,
    old_value TEXT,
    new_value TEXT,

    -- Change details
    changed_by INTEGER REFERENCES users(id),
    change_reason TEXT,
    metadata JSONB DEFAULT '{}',

    -- Audit
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- RESOURCE CONFLICTS LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS resource_conflicts (
    id SERIAL PRIMARY KEY,

    resource_id_1 INTEGER REFERENCES system_resources(id),
    resource_id_2 INTEGER REFERENCES system_resources(id),

    conflict_type VARCHAR(100) NOT NULL,  -- duplicate_port, overlapping_range, etc.
    severity VARCHAR(20) DEFAULT 'warning',  -- info, warning, error, critical

    detected_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    resolved_by INTEGER REFERENCES users(id),
    resolution_notes TEXT,

    auto_detected BOOLEAN DEFAULT TRUE,
    notified BOOLEAN DEFAULT FALSE,

    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- RESOURCE DEPENDENCIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS resource_dependencies (
    id SERIAL PRIMARY KEY,

    parent_resource_id INTEGER REFERENCES system_resources(id) ON DELETE CASCADE,
    child_resource_id INTEGER REFERENCES system_resources(id) ON DELETE CASCADE,

    dependency_type VARCHAR(50),  -- requires, recommends, conflicts_with
    is_critical BOOLEAN DEFAULT TRUE,

    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(parent_resource_id, child_resource_id)
);

-- ============================================================================
-- RESOURCE RESERVATION QUEUE
-- ============================================================================

CREATE TABLE IF NOT EXISTS resource_reservations (
    id SERIAL PRIMARY KEY,

    resource_type resource_type NOT NULL,
    requested_value TEXT,  -- Specific value or NULL for auto-assign

    -- Request details
    requested_by INTEGER REFERENCES users(id),
    requested_for VARCHAR(200) NOT NULL,  -- Service/project name
    priority INTEGER DEFAULT 5,  -- 1-10, higher = more urgent

    -- Metadata
    requirements JSONB DEFAULT '{}',  -- min_port, preferred_range, etc.
    justification TEXT,

    -- Status
    status VARCHAR(50) DEFAULT 'pending',  -- pending, approved, rejected, fulfilled
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    fulfilled_resource_id INTEGER REFERENCES system_resources(id),

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,  -- Reservation expires if not fulfilled
    fulfilled_at TIMESTAMP
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Performance indexes
CREATE INDEX idx_resources_type_status ON system_resources(resource_type, status);
CREATE INDEX idx_resources_owner ON system_resources(owner_service);
CREATE INDEX idx_resources_server ON system_resources(server_hostname, environment);
CREATE INDEX idx_resources_value ON system_resources(resource_value);
CREATE INDEX idx_resources_expires ON system_resources(expires_at) WHERE expires_at IS NOT NULL;

-- Search indexes
CREATE INDEX idx_resources_search ON system_resources USING gin(to_tsvector('english',
    coalesce(resource_name, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(owner_service, '')
));

-- JSONB indexes
CREATE INDEX idx_resources_metadata ON system_resources USING gin(metadata);

-- History indexes
CREATE INDEX idx_history_resource ON resource_allocation_history(resource_id, created_at DESC);
CREATE INDEX idx_conflicts_resources ON resource_conflicts(resource_id_1, resource_id_2);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to check if resource is available
CREATE OR REPLACE FUNCTION is_resource_available(
    p_type resource_type,
    p_value TEXT,
    p_environment VARCHAR DEFAULT 'production'
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM system_resources
        WHERE resource_type = p_type
        AND resource_value = p_value
        AND environment = p_environment
        AND status IN ('reserved', 'active')
    );
END;
$$ LANGUAGE plpgsql;

-- Function to find next available port
CREATE OR REPLACE FUNCTION find_next_available_port(
    p_start_port INTEGER DEFAULT 8000,
    p_end_port INTEGER DEFAULT 9000,
    p_environment VARCHAR DEFAULT 'production'
) RETURNS INTEGER AS $$
DECLARE
    v_port INTEGER;
BEGIN
    FOR v_port IN p_start_port..p_end_port LOOP
        IF is_resource_available('network_port', v_port::TEXT, p_environment) THEN
            RETURN v_port;
        END IF;
    END LOOP;
    RETURN NULL;  -- No available port found
END;
$$ LANGUAGE plpgsql;

-- Function to allocate resource
CREATE OR REPLACE FUNCTION allocate_resource(
    p_type resource_type,
    p_name VARCHAR,
    p_value TEXT,
    p_owner_service VARCHAR,
    p_user_id INTEGER,
    p_metadata JSONB DEFAULT '{}'
) RETURNS INTEGER AS $$
DECLARE
    v_resource_id INTEGER;
BEGIN
    -- Check if available
    IF NOT is_resource_available(p_type, p_value) THEN
        RAISE EXCEPTION 'Resource % % is already allocated', p_type, p_value;
    END IF;

    -- Insert resource
    INSERT INTO system_resources (
        resource_type, resource_name, resource_value,
        owner_service, status, created_by, metadata
    ) VALUES (
        p_type, p_name, p_value,
        p_owner_service, 'active', p_user_id, p_metadata
    ) RETURNING id INTO v_resource_id;

    -- Log allocation
    INSERT INTO resource_allocation_history (
        resource_id, action, new_status, changed_by
    ) VALUES (
        v_resource_id, 'allocated', 'active', p_user_id
    );

    RETURN v_resource_id;
END;
$$ LANGUAGE plpgsql;

-- Function to detect conflicts
CREATE OR REPLACE FUNCTION detect_resource_conflicts()
RETURNS TABLE(resource_id INTEGER, conflict_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT r1.id, COUNT(*)
    FROM system_resources r1
    JOIN system_resources r2 ON (
        r1.resource_type = r2.resource_type
        AND r1.resource_value = r2.resource_value
        AND r1.environment = r2.environment
        AND r1.id < r2.id
        AND r1.status IN ('active', 'reserved')
        AND r2.status IN ('active', 'reserved')
    )
    GROUP BY r1.id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_resource_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER resources_update_timestamp
    BEFORE UPDATE ON system_resources
    FOR EACH ROW
    EXECUTE FUNCTION update_resource_timestamp();

-- Conflict detection trigger
CREATE OR REPLACE FUNCTION check_resource_conflict()
RETURNS TRIGGER AS $$
DECLARE
    v_conflict_id INTEGER;
BEGIN
    -- Check for existing resource with same type/value
    SELECT id INTO v_conflict_id
    FROM system_resources
    WHERE resource_type = NEW.resource_type
    AND resource_value = NEW.resource_value
    AND environment = NEW.environment
    AND status IN ('active', 'reserved')
    AND id != COALESCE(NEW.id, 0);

    IF v_conflict_id IS NOT NULL THEN
        -- Log conflict
        INSERT INTO resource_conflicts (
            resource_id_1, resource_id_2, conflict_type, severity
        ) VALUES (
            v_conflict_id, NEW.id, 'duplicate_resource', 'error'
        );

        -- Mark as conflicted
        NEW.status = 'conflicted';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_conflicts
    BEFORE INSERT OR UPDATE ON system_resources
    FOR EACH ROW
    EXECUTE FUNCTION check_resource_conflict();

-- ============================================================================
-- INITIAL DATA - EXISTING RESOURCES
-- ============================================================================

-- Network ports currently in use
INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, server_hostname) VALUES
('network_port', 'KMS API', '8000', 'kms-api', 'active', 'KMS REST API service', 'devsoft.it-enterprise.solutions'),
('network_port', 'PostgreSQL', '5432', 'postgresql', 'active', 'PostgreSQL database', 'devsoft.it-enterprise.solutions'),
('network_port', 'Nginx HTTP', '80', 'nginx', 'active', 'HTTP web server', 'devsoft.it-enterprise.solutions'),
('network_port', 'Nginx HTTPS', '443', 'nginx', 'active', 'HTTPS web server', 'devsoft.it-enterprise.solutions'),
('network_port', 'SSH', '22770', 'sshd', 'active', 'SSH server (non-standard port)', 'devsoft.it-enterprise.solutions'),
('network_port', 'ttyd Terminal', '7681', 'kms-tools-ttyd', 'active', 'Web terminal', 'devsoft.it-enterprise.solutions'),
('network_port', 'FileBrowser', '7682', 'kms-tools-filebrowser', 'active', 'File browser web UI', 'devsoft.it-enterprise.solutions'),
('network_port', 'Code Server', '7683', 'kms-tools-code-server', 'active', 'VS Code Web', 'devsoft.it-enterprise.solutions');

-- Services
INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, server_hostname) VALUES
('service', 'KMS API', 'kms-api.service', 'kms-tools', 'active', 'Main KMS API service', 'devsoft.it-enterprise.solutions'),
('service', 'KMS Sync', 'kms-sync-daemon.service', 'kms-tools', 'active', 'Sync daemon', 'devsoft.it-enterprise.solutions'),
('service', 'ttyd', 'kms-tools-ttyd.service', 'kms-tools', 'active', 'Web terminal service', 'devsoft.it-enterprise.solutions'),
('service', 'FileBrowser', 'kms-tools-filebrowser.service', 'kms-tools', 'active', 'File browser service', 'devsoft.it-enterprise.solutions'),
('service', 'Code Server', 'kms-tools-code-server.service', 'kms-tools', 'active', 'VS Code web service', 'devsoft.it-enterprise.solutions');

-- Databases
INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, metadata, server_hostname) VALUES
('database', 'KMS Database', 'kms_db', 'kms-tools', 'active', 'Main KMS database', '{"encoding": "UTF8", "locale": "C.UTF-8"}', 'devsoft.it-enterprise.solutions'),
('db_user', 'KMS User', 'kms_user', 'kms-tools', 'active', 'KMS database user', '{"privileges": ["ALL"]}', 'devsoft.it-enterprise.solutions');

-- Domains
INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, server_hostname) VALUES
('domain', 'IT Enterprise', 'it-enterprise.solutions', 'it-enterprise', 'active', 'Main domain', 'devsoft.it-enterprise.solutions'),
('subdomain', 'KMS', 'kms.it-enterprise.solutions', 'kms-tools', 'active', 'KMS application', 'devsoft.it-enterprise.solutions');

-- Disk mounts
INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, metadata, server_hostname) VALUES
('disk_mount', 'Root filesystem', '/', 'system', 'active', 'Root filesystem mount', '{"fstype": "ext4", "size": "auto"}', 'devsoft.it-enterprise.solutions'),
('disk_mount', 'KMS Tools', '/opt/kms-tools', 'kms-tools', 'active', 'KMS application directory', '{"owner": "devops:devops"}', 'devsoft.it-enterprise.solutions'),
('disk_mount', 'IT Enterprise', '/opt/IT-Enterprise', 'it-enterprise', 'active', 'IT Enterprise directory', '{"owner": "devops:devops"}', 'devsoft.it-enterprise.solutions');

-- Config files
INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, server_hostname) VALUES
('config_file', 'KMS Nginx Config', '/etc/nginx/sites-available/kms-tools.conf', 'kms-tools', 'active', 'Nginx configuration for KMS', 'devsoft.it-enterprise.solutions'),
('config_file', 'KMS API Service', '/etc/systemd/system/kms-api.service', 'kms-tools', 'active', 'Systemd service definition', 'devsoft.it-enterprise.solutions');

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active resources summary
CREATE OR REPLACE VIEW v_active_resources AS
SELECT
    resource_type,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE status = 'active') as active_count,
    COUNT(*) FILTER (WHERE status = 'reserved') as reserved_count,
    COUNT(*) FILTER (WHERE status = 'conflicted') as conflicted_count
FROM system_resources
WHERE status != 'released'
GROUP BY resource_type
ORDER BY resource_type;

-- Resource conflicts view
CREATE OR REPLACE VIEW v_resource_conflicts AS
SELECT
    rc.id,
    rc.conflict_type,
    rc.severity,
    r1.resource_type,
    r1.resource_name as resource_1_name,
    r1.resource_value as resource_1_value,
    r1.owner_service as owner_1,
    r2.resource_name as resource_2_name,
    r2.resource_value as resource_2_value,
    r2.owner_service as owner_2,
    rc.detected_at,
    rc.resolved_at
FROM resource_conflicts rc
JOIN system_resources r1 ON rc.resource_id_1 = r1.id
JOIN system_resources r2 ON rc.resource_id_2 = r2.id
WHERE rc.resolved_at IS NULL
ORDER BY rc.severity DESC, rc.detected_at DESC;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON system_resources TO kms_user;
GRANT SELECT, INSERT ON resource_allocation_history TO kms_user;
GRANT SELECT, INSERT ON resource_conflicts TO kms_user;
GRANT SELECT, INSERT, UPDATE ON resource_dependencies TO kms_user;
GRANT SELECT, INSERT, UPDATE ON resource_reservations TO kms_user;

GRANT USAGE, SELECT ON SEQUENCE system_resources_id_seq TO kms_user;
GRANT USAGE, SELECT ON SEQUENCE resource_allocation_history_id_seq TO kms_user;
GRANT USAGE, SELECT ON SEQUENCE resource_conflicts_id_seq TO kms_user;
GRANT USAGE, SELECT ON SEQUENCE resource_dependencies_id_seq TO kms_user;
GRANT USAGE, SELECT ON SEQUENCE resource_reservations_id_seq TO kms_user;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE system_resources IS 'Central registry of all system resources to prevent conflicts';
COMMENT ON COLUMN system_resources.resource_value IS 'The actual value: port number, IP address, path, name, etc.';
COMMENT ON COLUMN system_resources.metadata IS 'Type-specific additional data in JSONB format';
COMMENT ON FUNCTION is_resource_available IS 'Check if a resource value is available for allocation';
COMMENT ON FUNCTION find_next_available_port IS 'Find next available network port in given range';
COMMENT ON FUNCTION allocate_resource IS 'Allocate a new resource and log the action';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
