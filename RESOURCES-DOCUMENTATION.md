# KMS Resources Management System

**Author**: Odoo Biznes <odoo@biznes.cz>
**Date**: 2025-12-31
**Version**: 1.0.0

## Overview

The Resources Management System provides centralized tracking and allocation of all system resources across the IT-Enterprise infrastructure. This prevents conflicts, duplicate allocations, and provides a complete audit trail of resource usage.

## Architecture

### Components

1. **Database Layer** (`/opt/kms-tools/sql/002_resource_management.sql`)
   - 4 main tables for resource tracking
   - PostgreSQL views for reporting
   - Functions for resource availability and port discovery
   - Triggers for automatic conflict detection

2. **API Backend** (`/opt/kms-tools/api/routers/resources_mgmt.py`)
   - RESTful API with 10 endpoints
   - JWT authentication
   - Conflict detection before allocation
   - Comprehensive audit logging

3. **Frontend Module** (`/opt/kms-tools/frontend/public/js/modules/module-resources.js`)
   - Interactive dashboard with statistics
   - Resource allocation wizard
   - Conflict monitoring
   - Port discovery tool

## Resource Types

The system tracks the following resource types:

| Type | Description | Example Value |
|------|-------------|---------------|
| `port` | Network ports | `8000`, `443` |
| `ip_address` | IP addresses | `192.168.1.100` |
| `directory` | Filesystem directories | `/opt/kms-tools` |
| `tmpfs` | tmpfs RAM mounts | `/tmp/cache` |
| `database` | PostgreSQL databases | `kms_db` |
| `db_user` | Database users | `kms_user` |
| `systemd` | Systemd services | `kms-api.service` |
| `domain` | Domains/subdomains | `kms.it-enterprise.solutions` |
| `ssl_cert` | SSL certificates | `/etc/letsencrypt/live/kms` |
| `nginx_conf` | Nginx configurations | `/etc/nginx/sites-enabled/kms` |
| `socket` | Unix sockets | `/tmp/kms.sock` |
| `redis_db` | Redis database numbers | `0`, `1` |
| `cron_job` | Cron jobs | `0 2 * * * /opt/backup.sh` |
| `user` | System users | `kms-user` |
| `env_var` | Environment variables | `KMS_API_KEY` |
| `backup_path` | Backup locations | `/backup/kms` |
| `log_path` | Log file paths | `/var/log/kms` |
| `secret` | Secret identifiers | `api-secret-key` |

## Database Schema

### Main Tables

#### `system_resources`
Stores all allocated resources:

```sql
CREATE TABLE system_resources (
    id SERIAL PRIMARY KEY,
    resource_type resource_type NOT NULL,
    resource_name VARCHAR(500) NOT NULL,
    resource_value TEXT NOT NULL,
    owner_user_id INTEGER REFERENCES users(id),
    owner_service VARCHAR(200),
    assigned_to VARCHAR(200),
    status resource_status DEFAULT 'active',
    is_locked BOOLEAN DEFAULT false,
    server_hostname VARCHAR(255),
    environment VARCHAR(50) DEFAULT 'production',
    metadata JSONB DEFAULT '{}',
    description TEXT,
    notes TEXT,
    allocated_at TIMESTAMP DEFAULT NOW(),
    released_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT unique_resource_per_env
        UNIQUE (resource_type, resource_value, environment)
);
```

#### `resource_allocation_history`
Complete audit trail:

```sql
CREATE TABLE resource_allocation_history (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER REFERENCES system_resources(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'allocated', 'modified', 'released', etc.
    old_status resource_status,
    new_status resource_status,
    changed_by INTEGER REFERENCES users(id),
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### `resource_conflicts`
Conflict detection log:

```sql
CREATE TABLE resource_conflicts (
    id SERIAL PRIMARY KEY,
    resource_type resource_type,
    resource_value TEXT,
    conflict_reason TEXT,
    severity VARCHAR(20) DEFAULT 'medium',
    detected_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);
```

### Key Functions

#### `is_resource_available()`
Checks if a resource is available for allocation:

```sql
SELECT is_resource_available('port', '8000', 'production');
-- Returns: true/false
```

#### `find_next_available_port()`
Auto-discovers available ports in a range:

```sql
SELECT find_next_available_port(8000, 9000, 'production');
-- Returns: 8123 (first available port)
```

#### `allocate_resource()`
Safe resource allocation with conflict checking:

```sql
SELECT allocate_resource(
    'port',              -- type
    'My Service Port',   -- name
    '9000',             -- value
    1,                  -- user_id
    'my-service',       -- owner_service
    'production'        -- environment
);
```

## API Endpoints

### Base URL
```
https://kms.it-enterprise.solutions/api/resources
```

### Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Endpoints

#### 1. List Resources
```http
GET /api/resources
```

**Query Parameters:**
- `resource_type` (optional): Filter by type
- `status` (optional): Filter by status (active/reserved/released)
- `owner_service` (optional): Filter by owner
- `environment` (optional): Filter by environment

**Response:**
```json
[
  {
    "id": 1,
    "resource_type": "port",
    "resource_name": "KMS API",
    "resource_value": "8000",
    "owner_service": "kms-api",
    "status": "active",
    "environment": "production",
    "allocated_at": "2025-12-31T10:00:00",
    ...
  }
]
```

#### 2. Get Resource Details
```http
GET /api/resources/{id}
```

#### 3. Allocate New Resource
```http
POST /api/resources
```

**Request Body:**
```json
{
  "resource_type": "port",
  "resource_name": "My Service Port",
  "resource_value": "9000",
  "owner_service": "my-service",
  "environment": "production",
  "description": "Port for my service",
  "notes": "Important service"
}
```

**Response:** Returns the created resource with ID

**Errors:**
- `409 Conflict`: Resource already allocated

#### 4. Update Resource
```http
PUT /api/resources/{id}
```

**Request Body:**
```json
{
  "resource_name": "Updated name",
  "description": "Updated description",
  "notes": "New notes"
}
```

**Note:** Cannot update `resource_value` or `resource_type` - must release and re-allocate

#### 5. Release Resource
```http
DELETE /api/resources/{id}
```

Marks resource as `released` (soft delete).

#### 6. Check Availability
```http
POST /api/resources/check-availability
```

**Request Body:**
```json
{
  "resource_type": "port",
  "resource_value": "9000",
  "environment": "production"
}
```

**Response:**
```json
{
  "available": true,
  "resource_type": "port",
  "resource_value": "9000",
  "environment": "production"
}
```

#### 7. Find Available Ports
```http
POST /api/resources/find-available-ports
```

**Request Body:**
```json
{
  "start_port": 8000,
  "end_port": 9000,
  "count": 5,
  "environment": "production"
}
```

**Response:**
```json
{
  "available_ports": [8123, 8124, 8125, 8126, 8127],
  "count": 5,
  "requested_count": 5,
  "range": {"start": 8000, "end": 9000}
}
```

#### 8. Get Resource Summary
```http
GET /api/resources/summary
```

Returns resource count by type.

#### 9. Get Conflicts
```http
GET /api/resources/conflicts
```

Returns all detected resource conflicts.

#### 10. Get Resource History
```http
GET /api/resources/{id}/history
```

Returns allocation history for a specific resource.

## Frontend Usage

### Accessing the Module

1. Open https://kms.it-enterprise.solutions
2. Login with your credentials
3. Click the **RESOURCES** button in the navigation bar (purple icon)

### Dashboard Features

#### Statistics Cards
- **Active Resources**: Currently allocated resources
- **Reserved**: Resources reserved for future use
- **Total Resources**: All tracked resources
- **Conflicts**: Detected conflicts (if any)

#### Filters
- **Type**: Filter by resource type (ports, databases, etc.)
- **Status**: Active, Reserved, or Released
- **Environment**: Production, Staging, Development
- **Search**: Free-text search across all fields

#### Resource Cards
Each resource is displayed as a card showing:
- Resource type with icon
- Resource name and value
- Owner service
- Environment and server
- Status badge
- Lock status (if locked)
- Action buttons (View, Edit, History, Release)

### Allocating a New Resource

1. Click **"Allocate Resource"** button
2. Select resource type from dropdown
3. Enter resource name (e.g., "My Service Port")
4. Enter resource value (e.g., "9000")
5. Click **"Check Availability"** to verify it's not allocated
6. Fill in optional fields:
   - Owner service
   - Assigned to
   - Environment
   - Server hostname
   - Description
   - Notes
7. Click **"Allocate Resource"**

**The system will:**
- ✅ Verify the resource is available
- ✅ Create allocation record
- ✅ Log the allocation in history
- ✅ Check for conflicts
- ❌ Reject if already allocated (409 error)

### Finding Available Ports

1. Click **"Find Available Ports"** button
2. Set port range (e.g., 8000-9000)
3. Specify how many ports you need
4. Select environment
5. Click **"Find Ports"**

The system displays available ports you can use.

### Viewing Resource Details

Click the 👁 (eye) icon on any resource card to see:
- Complete resource information
- Allocation date
- Created/Updated timestamps
- Lock status
- Metadata

### Viewing Resource History

Click the 🕐 (history) icon to see:
- All changes to the resource
- Who made the changes
- IP addresses
- Status transitions
- Timestamps

### Editing Resources

Click the ✏️ (edit) icon to update:
- Resource name
- Description
- Notes
- Assigned to

**Note:** Cannot edit resource value or type (would change identity)

### Releasing Resources

Click the 🗑 (trash) icon to release a resource.

**Warning:** This marks the resource as `released`, freeing it for re-allocation.

## Workflow Examples

### Example 1: Deploying New Service

**Scenario:** You're deploying a new web service and need a port.

**Steps:**
1. Go to RESOURCES module
2. Click "Find Available Ports"
3. Set range: 8000-9000
4. Request: 1 port
5. System returns: Port 8234 is available
6. Click "Allocate Resource"
7. Fill in:
   - Type: `port`
   - Name: "My Web Service"
   - Value: `8234`
   - Owner: `my-web-service`
   - Environment: `production`
8. Click "Allocate Resource"
9. ✅ Port is now registered and protected from conflicts

**Result:** Other developers will see port 8234 is allocated and won't create conflicts.

### Example 2: Setting Up Database

**Scenario:** Creating a new PostgreSQL database and user.

**Steps:**
1. Allocate database:
   - Type: `database`
   - Name: "Customer Portal DB"
   - Value: `customer_portal_db`
   - Owner: `customer-portal`

2. Allocate database user:
   - Type: `db_user`
   - Name: "Customer Portal User"
   - Value: `customer_portal_user`
   - Owner: `customer-portal`

3. Both resources are now tracked and protected

### Example 3: Conflict Detection

**Scenario:** Two developers try to use port 8000.

**What Happens:**
1. Developer A allocates port 8000 for Service A
2. Developer B tries to allocate port 8000 for Service B
3. **System rejects with 409 Conflict error**
4. Developer B checks "Find Available Ports"
5. System suggests port 8001
6. Developer B allocates port 8001 successfully

**Benefit:** No runtime conflicts or service failures due to port collisions.

### Example 4: tmpfs RAM Mount

**Scenario:** Creating a tmpfs mount for caching.

**Steps:**
1. Allocate tmpfs resource:
   - Type: `tmpfs`
   - Name: "KMS Cache"
   - Value: `/tmp/kms-cache`
   - Owner: `kms-tools`
   - Metadata: `{"size": "1G", "mode": "1777"}`
   - Notes: "tmpfs mount for API caching"

2. Resource is tracked in the system
3. Other services know this path is reserved

## Best Practices

### 1. Always Check Before Allocating

```bash
# Bad: Just assume port is free
systemctl start my-service.service  # Might conflict!

# Good: Check first via Resources module
# 1. Check if port is available
# 2. Allocate in Resources module
# 3. Then start service
```

### 2. Lock Critical Resources

For production resources that should never be modified:

```sql
UPDATE system_resources
SET is_locked = true
WHERE resource_value = '443';
```

Locked resources cannot be modified or released.

### 3. Use Environments

Always specify the environment:
- `production`: Live production resources
- `staging`: Pre-production testing
- `development`: Local development

This allows same port numbers across environments.

### 4. Descriptive Names

```bash
# Bad
Name: "Port 1"

# Good
Name: "KMS API Production Port"
```

### 5. Add Context

Use the `description` and `notes` fields:

```json
{
  "description": "Main API port for KMS REST service",
  "notes": "SSL terminated at nginx, proxied to this port"
}
```

### 6. Track Dependencies

For related resources, add metadata:

```json
{
  "metadata": {
    "depends_on": ["database:kms_db", "user:kms_user"],
    "service_version": "1.2.0"
  }
}
```

## Conflict Resolution

### Automatic Detection

The system automatically detects conflicts via triggers:
- Duplicate resource allocations
- Released resources re-allocated without cleanup
- Cross-environment conflicts (if enabled)

### Viewing Conflicts

```http
GET /api/resources/conflicts
```

Returns:
```json
[
  {
    "id": 1,
    "resource_type": "port",
    "resource_value": "8000",
    "conflict_reason": "Duplicate allocation detected",
    "severity": "high",
    "detected_at": "2025-12-31T15:30:00"
  }
]
```

### Resolving Conflicts

1. Identify the conflict from dashboard
2. Check resource history to understand what happened
3. Contact resource owner if needed
4. Release or reassign conflicting resource
5. Mark conflict as resolved:

```sql
UPDATE resource_conflicts
SET resolved_at = NOW()
WHERE id = 1;
```

## Monitoring & Reporting

### Resource Utilization Report

```sql
SELECT
    resource_type,
    environment,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'active') as active,
    COUNT(*) FILTER (WHERE status = 'reserved') as reserved,
    COUNT(*) FILTER (WHERE status = 'released') as released
FROM system_resources
GROUP BY resource_type, environment
ORDER BY resource_type, environment;
```

### Port Usage by Range

```sql
SELECT
    resource_value::integer as port,
    resource_name,
    owner_service,
    status
FROM system_resources
WHERE resource_type = 'port'
AND resource_value::integer BETWEEN 8000 AND 9000
AND environment = 'production'
ORDER BY port;
```

### Recent Allocations

```sql
SELECT
    sr.resource_type,
    sr.resource_name,
    sr.resource_value,
    u.username,
    rh.created_at
FROM resource_allocation_history rh
JOIN system_resources sr ON rh.resource_id = sr.id
JOIN users u ON rh.changed_by = u.id
WHERE rh.action = 'allocated'
ORDER BY rh.created_at DESC
LIMIT 20;
```

### Resources by Service

```sql
SELECT
    owner_service,
    COUNT(*) as resource_count,
    array_agg(DISTINCT resource_type) as types
FROM system_resources
WHERE status = 'active'
GROUP BY owner_service
ORDER BY resource_count DESC;
```

## Security

### Access Control
- All endpoints require JWT authentication
- Only authenticated users can view/allocate resources
- Resource modifications are logged with user ID and IP address

### Audit Trail
Every action is logged in `resource_allocation_history`:
- Who allocated/modified/released
- When the action occurred
- From which IP address
- What changed (old → new status)

### Resource Locking
Critical resources can be locked to prevent accidental modification:
```sql
UPDATE system_resources SET is_locked = true WHERE id = 1;
```

## Troubleshooting

### "Resource already allocated" Error

**Cause:** Trying to allocate a resource that's already in use.

**Solution:**
1. Check who owns the resource:
   ```http
   GET /api/resources?resource_type=port&resource_value=8000
   ```
2. Contact the owner if it's a mistake
3. Or find an alternative resource:
   ```http
   POST /api/resources/find-available-ports
   ```

### "Cannot modify locked resource"

**Cause:** Trying to edit or release a locked resource.

**Solution:**
1. Check if lock is intentional (production resource)
2. If modification is necessary, unlock first:
   ```sql
   UPDATE system_resources SET is_locked = false WHERE id = X;
   ```
3. Make changes
4. Re-lock if needed

### Resources Not Showing in Frontend

**Checklist:**
1. ✅ Is KMS API running? `systemctl status kms-api`
2. ✅ Can you access API? `curl https://kms.it-enterprise.solutions/api/resources/summary`
3. ✅ Are you logged in?
4. ✅ Browser console errors? (F12 → Console)
5. ✅ Cache cleared? (Ctrl+F5)

## Integration Examples

### Python (Using Requests)

```python
import requests

API = "https://kms.it-enterprise.solutions/api"
TOKEN = "your-jwt-token"

headers = {"Authorization": f"Bearer {TOKEN}"}

# Allocate port
response = requests.post(
    f"{API}/resources",
    headers=headers,
    json={
        "resource_type": "port",
        "resource_name": "My Service",
        "resource_value": "9000",
        "owner_service": "my-service"
    }
)

if response.status_code == 201:
    resource = response.json()
    print(f"Allocated: {resource['id']}")
elif response.status_code == 409:
    print("Port already allocated!")
```

### Bash (Using curl)

```bash
#!/bin/bash

# Login
TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}' \
  | jq -r '.access_token')

# Find available port
PORT=$(curl -s -X POST "$API/resources/find-available-ports" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"start_port":8000,"end_port":9000,"count":1}' \
  | jq -r '.available_ports[0]')

echo "Using port: $PORT"

# Allocate it
curl -X POST "$API/resources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"resource_type\": \"port\",
    \"resource_name\": \"My Service\",
    \"resource_value\": \"$PORT\",
    \"owner_service\": \"my-service\"
  }"
```

### Ansible Integration

```yaml
- name: Allocate resource via KMS API
  uri:
    url: "https://kms.it-enterprise.solutions/api/resources"
    method: POST
    headers:
      Authorization: "Bearer {{ kms_token }}"
    body_format: json
    body:
      resource_type: "port"
      resource_name: "{{ service_name }} Port"
      resource_value: "{{ service_port }}"
      owner_service: "{{ service_name }}"
      environment: "{{ deploy_env }}"
    status_code: [201, 409]
  register: resource_result

- name: Handle conflict
  fail:
    msg: "Port {{ service_port }} already allocated!"
  when: resource_result.status == 409
```

## Maintenance

### Cleanup Released Resources

Periodically clean up old released resources:

```sql
-- Delete resources released more than 90 days ago
DELETE FROM system_resources
WHERE status = 'released'
AND released_at < NOW() - INTERVAL '90 days';
```

### Archive Old History

```sql
-- Archive history older than 1 year
CREATE TABLE resource_allocation_history_archive
AS SELECT * FROM resource_allocation_history
WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM resource_allocation_history
WHERE created_at < NOW() - INTERVAL '1 year';
```

### Vacuum and Analyze

```sql
VACUUM ANALYZE system_resources;
VACUUM ANALYZE resource_allocation_history;
```

## Future Enhancements

Potential features for future versions:

1. **Resource Reservations**: Reserve resources for future use
2. **Auto-expiration**: Automatically release resources after X days
3. **Resource Dependencies**: Track which resources depend on others
4. **Bulk Operations**: Allocate/release multiple resources at once
5. **Resource Templates**: Pre-defined resource sets for common deployments
6. **Webhooks**: Notify external systems on resource changes
7. **Resource Pools**: Group related resources together
8. **Cost Tracking**: Associate costs with resources
9. **Capacity Planning**: Predict when resource pools will be exhausted
10. **CLI Tool**: Command-line interface for resource management

## Support

For issues or questions:
- GitHub Issues: https://github.com/odoobiznes/WIKI-KMS/issues
- Email: odoo@biznes.cz
- Documentation: https://kms.it-enterprise.solutions/api/docs

## License

Proprietary - IT-Enterprise Solutions © 2025

---

**Last Updated**: 2025-12-31
**Version**: 1.0.0
