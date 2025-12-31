#!/usr/bin/env python3
"""
KMS Initial Data Import
Imports existing file structure from /opt/kms/ into PostgreSQL database
"""
import json

import os
import sys
import yaml
import hashlib
import psycopg2
from pathlib import Path
from datetime import datetime

# Configuration
KMS_ROOT = Path("/opt/kms")
CATEGORIES_DIR = KMS_ROOT / "categories"

# Database connection info
DB_HOST = "localhost"
DB_NAME = "kms_db"
DB_USER = "kms_user"

# Get DB password from secrets
def get_db_password():
    """Get database password from WikiSys secrets"""
    import subprocess
    result = subprocess.run(
        ["bash", os.path.expanduser("~/.wikisys-local/scripts/secrets-manager.sh"),
         "decrypt", "passwords/kms-db-password"],
        capture_output=True,
        text=True
    )
    if result.returncode == 0:
        # Extract password from output (skip the info messages)
        lines = result.stdout.strip().split('\n')
        return lines[-1]  # Last line is the password
    else:
        raise Exception(f"Failed to get DB password: {result.stderr}")

# Database connection
def get_db_connection():
    """Create database connection"""
    password = get_db_password()
    return psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=password
    )

# Calculate file checksum
def calculate_checksum(filepath):
    """Calculate SHA256 checksum of a file"""
    sha256 = hashlib.sha256()
    try:
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b''):
                sha256.update(chunk)
        return sha256.hexdigest()
    except Exception:
        return None

# Read YAML metadata
def read_metadata(meta_file):
    """Read .meta.yaml file"""
    try:
        with open(meta_file, 'r') as f:
            return yaml.safe_load(f)
    except Exception as e:
        print(f"Warning: Failed to read {meta_file}: {e}")
        return None

# Import categories
def import_categories(conn):
    """Import categories from file structure"""
    cur = conn.cursor()
    imported = 0

    print("\n📁 Importing Categories...")

    for cat_dir in CATEGORIES_DIR.iterdir():
        if not cat_dir.is_dir():
            continue

        cat_slug = cat_dir.name
        meta_file = cat_dir / ".meta.yaml"

        if not meta_file.exists():
            print(f"  ⚠️  Skipping {cat_slug} (no metadata)")
            continue

        meta = read_metadata(meta_file)
        if not meta:
            continue

        # Insert or update category
        try:
            cur.execute("""
                INSERT INTO categories (slug, name, type, description, metadata)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (slug) DO UPDATE
                SET name = EXCLUDED.name,
                    type = EXCLUDED.type,
                    description = EXCLUDED.description,
                    metadata = EXCLUDED.metadata,
                    updated_at = NOW()
                RETURNING id
            """, (
                cat_slug,
                meta.get('name', cat_slug),
                meta.get('type', 'product'),
                meta.get('description', ''),
                json.dumps(meta)
            ))
            cat_id = cur.fetchone()[0]
            conn.commit()
            imported += 1
            print(f"  ✓ {cat_slug} (ID: {cat_id})")
        except Exception as e:
            print(f"  ✗ {cat_slug}: {e}")
            conn.rollback()

    cur.close()
    print(f"\n✅ Imported {imported} categories")
    return imported

# Import subcategories
def import_subcategories(conn):
    """Import subcategories from file structure"""
    cur = conn.cursor()
    imported = 0

    print("\n📂 Importing Subcategories...")

    for cat_dir in CATEGORIES_DIR.iterdir():
        if not cat_dir.is_dir():
            continue

        subcat_dir = cat_dir / "subcategories"
        if not subcat_dir.exists():
            continue

        # Get category ID
        cat_slug = cat_dir.name
        cur.execute("SELECT id FROM categories WHERE slug = %s", (cat_slug,))
        result = cur.fetchone()
        if not result:
            continue
        cat_id = result[0]

        # Import subcategories
        for sub_dir in subcat_dir.iterdir():
            if not sub_dir.is_dir():
                continue

            sub_slug = sub_dir.name
            meta_file = sub_dir / ".meta.yaml"

            if not meta_file.exists():
                continue

            meta = read_metadata(meta_file)
            if not meta:
                continue

            try:
                cur.execute("""
                    INSERT INTO subcategories (category_id, slug, name, description, metadata)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (category_id, slug) DO UPDATE
                    SET name = EXCLUDED.name,
                        description = EXCLUDED.description,
                        metadata = EXCLUDED.metadata,
                        updated_at = NOW()
                    RETURNING id
                """, (
                    cat_id,
                    sub_slug,
                    meta.get('name', sub_slug),
                    meta.get('description', ''),
                    json.dumps(meta)
                ))
                sub_id = cur.fetchone()[0]
                conn.commit()
                imported += 1
                print(f"  ✓ {cat_slug}/{sub_slug} (ID: {sub_id})")
            except Exception as e:
                print(f"  ✗ {cat_slug}/{sub_slug}: {e}")
                conn.rollback()

    cur.close()
    print(f"\n✅ Imported {imported} subcategories")
    return imported

# Import objects
def import_objects(conn):
    """Import objects (projects) from file structure"""
    cur = conn.cursor()
    imported = 0

    print("\n📄 Importing Objects...")

    for cat_dir in CATEGORIES_DIR.iterdir():
        if not cat_dir.is_dir():
            continue

        cat_slug = cat_dir.name

        # Get category ID
        cur.execute("SELECT id FROM categories WHERE slug = %s", (cat_slug,))
        result = cur.fetchone()
        if not result:
            continue
        cat_id = result[0]

        # Import objects directly under category
        objects_dir = cat_dir / "objects"
        if objects_dir.exists():
            for obj_dir in objects_dir.iterdir():
                if not obj_dir.is_dir():
                    continue
                imported += import_single_object(conn, cur, obj_dir, cat_id, None, cat_slug, None)

        # Import objects under subcategories
        subcat_dir = cat_dir / "subcategories"
        if subcat_dir.exists():
            for sub_dir in subcat_dir.iterdir():
                if not sub_dir.is_dir():
                    continue

                sub_slug = sub_dir.name

                # Get subcategory ID
                cur.execute(
                    "SELECT id FROM subcategories WHERE category_id = %s AND slug = %s",
                    (cat_id, sub_slug)
                )
                result = cur.fetchone()
                if not result:
                    continue
                sub_id = result[0]

                # Import objects
                sub_objects_dir = sub_dir / "objects"
                if sub_objects_dir.exists():
                    for obj_dir in sub_objects_dir.iterdir():
                        if not obj_dir.is_dir():
                            continue
                        imported += import_single_object(
                            conn, cur, obj_dir, cat_id, sub_id, cat_slug, sub_slug
                        )

    cur.close()
    print(f"\n✅ Imported {imported} objects")
    return imported

def import_single_object(conn, cur, obj_dir, cat_id, sub_id, cat_slug, sub_slug):
    """Import a single object"""
    obj_slug = obj_dir.name
    meta_file = obj_dir / ".meta.yaml"

    if not meta_file.exists():
        return 0

    meta = read_metadata(meta_file)
    if not meta:
        return 0

    try:
        # Calculate relative file path
        rel_path = str(obj_dir.relative_to(KMS_ROOT))

        cur.execute("""
            INSERT INTO objects
            (category_id, subcategory_id, slug, name, description, status, author, file_path, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (category_id, COALESCE(subcategory_id, 0), slug) DO UPDATE
            SET name = EXCLUDED.name,
                description = EXCLUDED.description,
                status = EXCLUDED.status,
                author = EXCLUDED.author,
                file_path = EXCLUDED.file_path,
                metadata = EXCLUDED.metadata,
                updated_at = NOW()
            RETURNING id
        """, (
            cat_id,
            sub_id,
            obj_slug,
            meta.get('name', obj_slug),
            meta.get('description', ''),
            meta.get('status', 'active'),
            meta.get('author', 'Unknown'),
            rel_path,
            json.dumps(meta)
        ))
        obj_id = cur.fetchone()[0]
        conn.commit()

        # Import documents for this object
        docs_imported = import_documents(conn, obj_id, obj_dir)

        location = f"{cat_slug}/{sub_slug}/{obj_slug}" if sub_slug else f"{cat_slug}/{obj_slug}"
        print(f"  ✓ {location} (ID: {obj_id}, {docs_imported} docs)")
        return 1

    except Exception as e:
        print(f"  ✗ {obj_slug}: {e}")
        conn.rollback()
        return 0

# Import documents
def import_documents(conn, object_id, obj_dir):
    """Import documents for an object"""
    cur = conn.cursor()
    imported = 0

    # Standard folders
    folders = ['plany', 'instrukce', 'code', 'docs']

    # Import from standard folders
    for folder in folders:
        folder_path = obj_dir / folder
        if not folder_path.exists():
            continue

        for doc_file in folder_path.rglob('*'):
            if not doc_file.is_file():
                continue
            if doc_file.name.startswith('.'):
                continue

            imported += import_single_document(cur, object_id, doc_file, folder, folder_path)

    # Import files directly from object root
    for doc_file in obj_dir.iterdir():
        if not doc_file.is_file():
            continue
        if doc_file.name.startswith('.'):
            continue

        # Skip if file is in a standard folder (already imported)
        if doc_file.parent.name in folders:
            continue

        # Only import document files
        suffix = doc_file.suffix.lower()
        if suffix not in ['.md', '.txt', '.sh', '.yml', '.yaml', '.json', '.py', '.js', '.ts', '.html', '.css', '.sql']:
            continue

        imported += import_single_document(cur, object_id, doc_file, 'root', obj_dir)

    conn.commit()
    cur.close()
    return imported

def import_single_document(cur, object_id, doc_file, folder, base_path):
    """Import a single document"""
    try:
        # Read file content
        try:
            with open(doc_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
        except Exception:
            content = None

        # Calculate checksum and size
        checksum = calculate_checksum(doc_file)
        size_bytes = doc_file.stat().st_size

        # Determine content type
        suffix = doc_file.suffix.lower()
        content_type = {
            '.md': 'text/markdown',
            '.txt': 'text/plain',
            '.py': 'text/x-python',
            '.js': 'text/javascript',
            '.ts': 'text/typescript',
            '.json': 'application/json',
            '.yaml': 'application/yaml',
            '.yml': 'application/yaml',
            '.html': 'text/html',
            '.css': 'text/css',
            '.sql': 'text/sql',
            '.sh': 'text/x-shellscript',
        }.get(suffix, 'application/octet-stream')

        # Relative filename
        rel_filename = str(doc_file.relative_to(base_path))
        rel_filepath = str(doc_file.relative_to(KMS_ROOT))

        cur.execute("""
            INSERT INTO documents
            (object_id, folder, filename, filepath, content, content_type, size_bytes, checksum)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (object_id, folder, filename) DO UPDATE
            SET filepath = EXCLUDED.filepath,
                content = EXCLUDED.content,
                content_type = EXCLUDED.content_type,
                size_bytes = EXCLUDED.size_bytes,
                checksum = EXCLUDED.checksum,
                version = documents.version + 1,
                updated_at = NOW()
        """, (
            object_id,
            folder,
            rel_filename,
            rel_filepath,
            content,
            content_type,
            size_bytes,
            checksum
        ))
        return 1
    except Exception as e:
        print(f"    ⚠️  Failed to import {doc_file.name}: {e}")
        return 0

# Main import function
def main():
    """Main import function"""
    print("=" * 70)
    print("KMS Initial Data Import")
    print("=" * 70)
    print(f"\nKMS Root: {KMS_ROOT}")
    print(f"Database: {DB_NAME}@{DB_HOST}")

    try:
        conn = get_db_connection()
        print("\n✅ Database connection established")

        # Import in order
        cat_count = import_categories(conn)
        sub_count = import_subcategories(conn)
        obj_count = import_objects(conn)

        # Summary
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM documents")
        doc_count = cur.fetchone()[0]
        cur.close()

        print("\n" + "=" * 70)
        print("✅ IMPORT COMPLETE!")
        print("=" * 70)
        print(f"\nImported:")
        print(f"  Categories:    {cat_count}")
        print(f"  Subcategories: {sub_count}")
        print(f"  Objects:       {obj_count}")
        print(f"  Documents:     {doc_count}")
        print("\n" + "=" * 70)

        conn.close()
        return 0

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
