#!/bin/bash
PASS=$(bash ~/.wikisys-local/scripts/secrets-manager.sh decrypt passwords/kms-db-password 2>/dev/null | tail -1)
export PGPASSWORD="$PASS"
echo "=== Categories ===" && psql -U kms_user -d kms_db -h localhost -c "SELECT id, slug, name, type FROM categories ORDER BY id LIMIT 5;" && echo "" && echo "=== Objects with Hierarchy ===" && psql -U kms_user -d kms_db -h localhost -c "SELECT object_name, category_name, subcategory_name FROM v_objects_full;" && echo "" && echo "=== Fulltext Search Test ===" && psql -U kms_user -d kms_db -h localhost -c "SELECT object_name, folder, filename, rank FROM search_documents('README');"
unset PGPASSWORD
