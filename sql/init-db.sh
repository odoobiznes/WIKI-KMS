#!/bin/bash
# KMS Database Initialization Script
# Usage: ./init-db.sh <db_password>

set -e  # Exit on error

DB_NAME="kms_db"
DB_USER="kms_user"
DB_PASS="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -z "$DB_PASS" ]; then
    echo "Usage: $0 <db_password>"
    echo "Example: $0 'MySecurePassword123'"
    exit 1
fi

echo "=== KMS Database Initialization ==="
echo ""
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""

# 1. Create database and user
echo "1. Creating database and user..."
sudo -u postgres psql << SQL
-- Drop if exists (for reinstallation)
DROP DATABASE IF EXISTS ${DB_NAME};
DROP USER IF EXISTS ${DB_USER};

-- Create fresh
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

-- Connect to DB and grant schema privileges
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};
SQL

echo "✓ Database and user created"

# 2. Import schema
echo ""
echo "2. Importing schema..."
sudo -u postgres psql -d ${DB_NAME} -f ${SCRIPT_DIR}/schema.sql

echo "✓ Schema imported"

# 3. Verify
echo ""
echo "3. Verifying installation..."
sudo -u postgres psql -d ${DB_NAME} << SQL
SELECT
    schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
SQL

echo ""
echo "=== Initialization Complete! ==="
echo ""
echo "Database: ${DB_NAME}"
echo "User: ${DB_USER}"
echo "Connection string: postgresql://${DB_USER}:PASSWORD@localhost/${DB_NAME}"
echo ""
echo "Next steps:"
echo "1. Update /opt/kms-tools/api/database.py with password"
echo "2. Restart kms-api.service"
echo "3. Import data: /opt/kms-tools/bin/kms-import.py"
