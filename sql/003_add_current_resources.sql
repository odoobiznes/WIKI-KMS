-- Add Current System Resources
-- Adds existing ports, services, and resources to the registry
-- Author: Odoo Biznes <odoo@biznes.cz>
-- Date: 2025-12-31

-- Network ports (using 'port' type)
INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, server_hostname)
SELECT 'port', 'KMS API', '8000', 'kms-api', 'active', 'KMS REST API service', 'devsoft.it-enterprise.solutions'
WHERE NOT EXISTS (SELECT 1 FROM system_resources WHERE resource_type='port' AND resource_value='8000');

INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, server_hostname)
SELECT 'port', 'PostgreSQL', '5432', 'postgresql', 'active', 'PostgreSQL database', 'devsoft.it-enterprise.solutions'
WHERE NOT EXISTS (SELECT 1 FROM system_resources WHERE resource_type='port' AND resource_value='5432');

INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, server_hostname)
SELECT 'port', 'Nginx HTTP', '80', 'nginx', 'active', 'HTTP web server', 'devsoft.it-enterprise.solutions'
WHERE NOT EXISTS (SELECT 1 FROM system_resources WHERE resource_type='port' AND resource_value='80');

INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, server_hostname)
SELECT 'port', 'Nginx HTTPS', '443', 'nginx', 'active', 'HTTPS web server', 'devsoft.it-enterprise.solutions'
WHERE NOT EXISTS (SELECT 1 FROM system_resources WHERE resource_type='port' AND resource_value='443');

INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, server_hostname)
SELECT 'port', 'SSH', '22770', 'sshd', 'active', 'SSH server (non-standard port)', 'devsoft.it-enterprise.solutions'
WHERE NOT EXISTS (SELECT 1 FROM system_resources WHERE resource_type='port' AND resource_value='22770');

INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, server_hostname)
SELECT 'port', 'ttyd Terminal', '7681', 'kms-tools-ttyd', 'active', 'Web terminal', 'devsoft.it-enterprise.solutions'
WHERE NOT EXISTS (SELECT 1 FROM system_resources WHERE resource_type='port' AND resource_value='7681');

INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, server_hostname)
SELECT 'port', 'FileBrowser', '7682', 'kms-tools-filebrowser', 'active', 'File browser web UI', 'devsoft.it-enterprise.solutions'
WHERE NOT EXISTS (SELECT 1 FROM system_resources WHERE resource_type='port' AND resource_value='7682');

INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, server_hostname)
SELECT 'port', 'Code Server', '7683', 'kms-tools-code-server', 'active', 'VS Code Web', 'devsoft.it-enterprise.solutions'
WHERE NOT EXISTS (SELECT 1 FROM system_resources WHERE resource_type='port' AND resource_value='7683');

-- Systemd services
INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, server_hostname)
SELECT 'systemd', 'KMS API', 'kms-api.service', 'kms-tools', 'active', 'Main KMS API service', 'devsoft.it-enterprise.solutions'
WHERE NOT EXISTS (SELECT 1 FROM system_resources WHERE resource_type='systemd' AND resource_value='kms-api.service');

INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, server_hostname)
SELECT 'systemd', 'KMS Sync', 'kms-sync-daemon.service', 'kms-tools', 'active', 'Sync daemon', 'devsoft.it-enterprise.solutions'
WHERE NOT EXISTS (SELECT 1 FROM system_resources WHERE resource_type='systemd' AND resource_value='kms-sync-daemon.service');

INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, server_hostname)
SELECT 'systemd', 'ttyd', 'kms-tools-ttyd.service', 'kms-tools', 'active', 'Web terminal service', 'devsoft.it-enterprise.solutions'
WHERE NOT EXISTS (SELECT 1 FROM system_resources WHERE resource_type='systemd' AND resource_value='kms-tools-ttyd.service');

INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, server_hostname)
SELECT 'systemd', 'FileBrowser', 'kms-tools-filebrowser.service', 'kms-tools', 'active', 'File browser service', 'devsoft.it-enterprise.solutions'
WHERE NOT EXISTS (SELECT 1 FROM system_resources WHERE resource_type='systemd' AND resource_value='kms-tools-filebrowser.service');

INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, server_hostname)
SELECT 'systemd', 'Code Server', 'kms-tools-code-server.service', 'kms-tools', 'active', 'VS Code web service', 'devsoft.it-enterprise.solutions'
WHERE NOT EXISTS (SELECT 1 FROM system_resources WHERE resource_type='systemd' AND resource_value='kms-tools-code-server.service');

-- Domains
INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, server_hostname)
SELECT 'domain', 'IT Enterprise', 'it-enterprise.solutions', 'it-enterprise', 'active', 'Main domain', 'devsoft.it-enterprise.solutions'
WHERE NOT EXISTS (SELECT 1 FROM system_resources WHERE resource_type='domain' AND resource_value='it-enterprise.solutions');

INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, server_hostname)
SELECT 'domain', 'KMS', 'kms.it-enterprise.solutions', 'kms-tools', 'active', 'KMS application subdomain', 'devsoft.it-enterprise.solutions'
WHERE NOT EXISTS (SELECT 1 FROM system_resources WHERE resource_type='domain' AND resource_value='kms.it-enterprise.solutions');

-- Directories
INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, metadata, server_hostname)
SELECT 'directory', 'Root filesystem', '/', 'system', 'active', 'Root filesystem mount', '{"fstype": "ext4"}', 'devsoft.it-enterprise.solutions'
WHERE NOT EXISTS (SELECT 1 FROM system_resources WHERE resource_type='directory' AND resource_value='/');

INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, metadata, server_hostname)
SELECT 'directory', 'KMS Tools', '/opt/kms-tools', 'kms-tools', 'active', 'KMS application directory', '{"owner": "devops:devops"}', 'devsoft.it-enterprise.solutions'
WHERE NOT EXISTS (SELECT 1 FROM system_resources WHERE resource_type='directory' AND resource_value='/opt/kms-tools');

INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, metadata, server_hostname)
SELECT 'directory', 'IT Enterprise', '/opt/IT-Enterprise', 'it-enterprise', 'active', 'IT Enterprise directory', '{"owner": "devops:devops"}', 'devsoft.it-enterprise.solutions'
WHERE NOT EXISTS (SELECT 1 FROM system_resources WHERE resource_type='directory' AND resource_value='/opt/IT-Enterprise');

-- Config files
INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, server_hostname)
SELECT 'nginx_conf', 'KMS Nginx Config', '/etc/nginx/sites-available/kms-tools.conf', 'kms-tools', 'active', 'Nginx configuration for KMS', 'devsoft.it-enterprise.solutions'
WHERE NOT EXISTS (SELECT 1 FROM system_resources WHERE resource_type='nginx_conf' AND resource_value='/etc/nginx/sites-available/kms-tools.conf');

INSERT INTO system_resources (resource_type, resource_name, resource_value, owner_service, status, description, server_hostname)
SELECT 'nginx_conf', 'KMS API Service', '/etc/systemd/system/kms-api.service', 'kms-tools', 'active', 'Systemd service definition', 'devsoft.it-enterprise.solutions'
WHERE NOT EXISTS (SELECT 1 FROM system_resources WHERE resource_type='nginx_conf' AND resource_value='/etc/systemd/system/kms-api.service');

-- Summary
SELECT 'Resources added successfully' AS message;
SELECT resource_type, COUNT(*) as count
FROM system_resources
GROUP BY resource_type
ORDER BY resource_type;
