#!/usr/bin/env python3
"""
KMS Command Line Interface
Complete CLI tool for managing Knowledge Management System
"""
import os
import sys
import json
import yaml
import argparse
import hashlib
import psycopg2
from pathlib import Path
from datetime import datetime
from tabulate import tabulate

# Configuration
KMS_ROOT = Path("/opt/kms")
CATEGORIES_DIR = KMS_ROOT / "categories"

# Database connection info
DB_HOST = "localhost"
DB_NAME = "kms_db"
DB_USER = "kms_user"

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
        lines = result.stdout.strip().split('\n')
        return lines[-1]
    else:
        raise Exception(f"Failed to get DB password: {result.stderr}")

def get_db_connection():
    """Create database connection"""
    password = get_db_password()
    return psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=password
    )

def calculate_checksum(filepath):
    """Calculate SHA256 checksum"""
    sha256 = hashlib.sha256()
    try:
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b''):
                sha256.update(chunk)
        return sha256.hexdigest()
    except Exception:
        return None

def read_metadata(meta_file):
    """Read .meta.yaml file"""
    try:
        with open(meta_file, 'r') as f:
            return yaml.safe_load(f)
    except Exception as e:
        print(f"Warning: Failed to read {meta_file}: {e}")
        return None

def write_metadata(meta_file, metadata):
    """Write .meta.yaml file"""
    try:
        with open(meta_file, 'w') as f:
            yaml.dump(metadata, f, default_flow_style=False, allow_unicode=True)
        return True
    except Exception as e:
        print(f"Error: Failed to write {meta_file}: {e}")
        return False

# ============================================================================
# CATEGORY COMMANDS
# ============================================================================

def cmd_create_category(args):
    """Create a new category"""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Create in database
        cur.execute("""
            INSERT INTO categories (slug, name, type, description, metadata)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (
            args.slug,
            args.name,
            args.type,
            args.description or '',
            json.dumps({'tags': args.tags.split(',') if args.tags else []})
        ))
        cat_id = cur.fetchone()[0]
        conn.commit()

        # Create file structure
        cat_dir = CATEGORIES_DIR / args.slug
        cat_dir.mkdir(parents=True, exist_ok=True)

        # Create subdirectories
        (cat_dir / "objects").mkdir(exist_ok=True)
        (cat_dir / "subcategories").mkdir(exist_ok=True)

        # Create metadata file
        metadata = {
            'name': args.name,
            'type': args.type,
            'description': args.description or '',
            'created': datetime.now().isoformat(),
            'tags': args.tags.split(',') if args.tags else []
        }
        write_metadata(cat_dir / ".meta.yaml", metadata)

        print(f"✓ Category created: {args.name} (ID: {cat_id})")
        print(f"  Slug: {args.slug}")
        print(f"  Type: {args.type}")
        print(f"  Path: {cat_dir}")

        cur.close()
        conn.close()
        return 0

    except Exception as e:
        print(f"✗ Error: {e}")
        conn.rollback()
        cur.close()
        conn.close()
        return 1

def cmd_list_categories(args):
    """List all categories"""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        query = "SELECT id, slug, name, type, description, created_at FROM categories"
        params = []

        if args.type:
            query += " WHERE type = %s"
            params.append(args.type)

        query += " ORDER BY sort_order, name"

        cur.execute(query, params)
        categories = cur.fetchall()

        if not categories:
            print("No categories found.")
            return 0

        # Format as table
        headers = ['ID', 'Slug', 'Name', 'Type', 'Description', 'Created']
        rows = []
        for cat in categories:
            cat_id, slug, name, cat_type, desc, created = cat
            rows.append([
                cat_id,
                slug,
                name,
                cat_type,
                (desc[:50] + '...') if desc and len(desc) > 50 else (desc or ''),
                created.strftime('%Y-%m-%d') if created else ''
            ])

        print(tabulate(rows, headers=headers, tablefmt='simple'))
        print(f"\nTotal: {len(categories)} categories")

        cur.close()
        conn.close()
        return 0

    except Exception as e:
        print(f"✗ Error: {e}")
        cur.close()
        conn.close()
        return 1

# ============================================================================
# OBJECT COMMANDS
# ============================================================================

def cmd_create_object(args):
    """Create a new object (project)"""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Get category ID
        cur.execute("SELECT id FROM categories WHERE slug = %s", (args.category,))
        result = cur.fetchone()
        if not result:
            print(f"✗ Error: Category '{args.category}' not found")
            return 1
        cat_id = result[0]

        # Get subcategory ID if specified
        sub_id = None
        if args.subcategory:
            cur.execute(
                "SELECT id FROM subcategories WHERE category_id = %s AND slug = %s",
                (cat_id, args.subcategory)
            )
            result = cur.fetchone()
            if not result:
                print(f"✗ Error: Subcategory '{args.subcategory}' not found")
                return 1
            sub_id = result[0]

        # Generate slug from name if not provided
        slug = args.slug or args.name.lower().replace(' ', '-').replace('_', '-')

        # Determine file path
        if sub_id:
            obj_path = f"categories/{args.category}/subcategories/{args.subcategory}/objects/{slug}"
        else:
            obj_path = f"categories/{args.category}/objects/{slug}"

        # Create in database
        cur.execute("""
            INSERT INTO objects
            (category_id, subcategory_id, slug, name, description, status, author, file_path, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            cat_id,
            sub_id,
            slug,
            args.name,
            args.description or '',
            args.status or 'active',
            args.author or os.environ.get('USER', 'Unknown'),
            obj_path,
            json.dumps({'tags': args.tags.split(',') if args.tags else []})
        ))
        obj_id = cur.fetchone()[0]
        conn.commit()

        # Create file structure
        obj_dir = KMS_ROOT / obj_path
        obj_dir.mkdir(parents=True, exist_ok=True)

        # Create standard folders
        for folder in ['plany', 'instrukce', 'code', 'docs']:
            (obj_dir / folder).mkdir(exist_ok=True)

        # Create metadata file
        metadata = {
            'name': args.name,
            'description': args.description or '',
            'status': args.status or 'active',
            'author': args.author or os.environ.get('USER', 'Unknown'),
            'created': datetime.now().isoformat(),
            'tags': args.tags.split(',') if args.tags else []
        }
        write_metadata(obj_dir / ".meta.yaml", metadata)

        # Create README if requested
        if args.with_readme:
            readme_path = obj_dir / "docs" / "README.md"
            with open(readme_path, 'w') as f:
                f.write(f"# {args.name}\n\n")
                f.write(f"{args.description or 'No description provided.'}\n\n")
                f.write(f"**Created:** {datetime.now().strftime('%Y-%m-%d')}\n")
                f.write(f"**Author:** {args.author or os.environ.get('USER', 'Unknown')}\n")

        print(f"✓ Object created: {args.name} (ID: {obj_id})")
        print(f"  Slug: {slug}")
        print(f"  Category: {args.category}")
        if args.subcategory:
            print(f"  Subcategory: {args.subcategory}")
        print(f"  Path: {obj_dir}")
        print(f"  Folders: plany, instrukce, code, docs")

        cur.close()
        conn.close()
        return 0

    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
        cur.close()
        conn.close()
        return 1

def cmd_list_objects(args):
    """List objects"""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        query = """
            SELECT o.id, o.slug, o.name, c.name as category,
                   sc.name as subcategory, o.status, o.author, o.created_at
            FROM objects o
            JOIN categories c ON o.category_id = c.id
            LEFT JOIN subcategories sc ON o.subcategory_id = sc.id
        """
        params = []
        where_clauses = []

        if args.category:
            where_clauses.append("c.slug = %s")
            params.append(args.category)

        if args.status:
            where_clauses.append("o.status = %s")
            params.append(args.status)

        if where_clauses:
            query += " WHERE " + " AND ".join(where_clauses)

        query += " ORDER BY c.name, sc.name, o.name"

        cur.execute(query, params)
        objects = cur.fetchall()

        if not objects:
            print("No objects found.")
            return 0

        # Format as table
        headers = ['ID', 'Slug', 'Name', 'Category', 'Subcategory', 'Status', 'Author', 'Created']
        rows = []
        for obj in objects:
            obj_id, slug, name, category, subcategory, status, author, created = obj
            rows.append([
                obj_id,
                slug,
                name[:30],
                category,
                subcategory or '-',
                status,
                author or '-',
                created.strftime('%Y-%m-%d') if created else ''
            ])

        print(tabulate(rows, headers=headers, tablefmt='simple'))
        print(f"\nTotal: {len(objects)} objects")

        cur.close()
        conn.close()
        return 0

    except Exception as e:
        print(f"✗ Error: {e}")
        cur.close()
        conn.close()
        return 1

# ============================================================================
# SEARCH COMMANDS
# ============================================================================

def cmd_search(args):
    """Search documents"""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT document_id, object_name, folder, filename, rank
            FROM search_documents(%s)
            ORDER BY rank DESC
            LIMIT %s
        """, (args.query, args.limit))

        results = cur.fetchall()

        if not results:
            print(f"No results found for: {args.query}")
            return 0

        print(f"\n🔍 Search Results for: '{args.query}'")
        print("=" * 80)

        for doc_id, obj_name, folder, filename, rank in results:
            print(f"\n  [{doc_id}] {obj_name}/{folder}/{filename}")
            print(f"      Rank: {rank:.4f}")

        print(f"\nTotal: {len(results)} documents")

        cur.close()
        conn.close()
        return 0

    except Exception as e:
        print(f"✗ Error: {e}")
        cur.close()
        conn.close()
        return 1

# ============================================================================
# IMPORT/EXPORT COMMANDS
# ============================================================================

def cmd_import(args):
    """Import data from files to database"""
    print("Running import...")

    # Use the existing import script
    import subprocess
    result = subprocess.run(
        [sys.executable, "/opt/kms-tools/bin/kms-import.py"],
        cwd="/opt/kms-tools/bin"
    )

    return result.returncode

def cmd_export(args):
    """Export data from database to files"""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Determine what to export
        query = "SELECT * FROM v_objects_full"
        params = []

        if args.category:
            query += " WHERE category_slug = %s"
            params.append(args.category)

        cur.execute(query, params)
        objects = cur.fetchall()

        export_dir = Path(args.output) if args.output else Path("/tmp/kms-export")
        export_dir.mkdir(parents=True, exist_ok=True)

        print(f"Exporting to: {export_dir}")

        exported_count = 0
        for obj in objects:
            # Export object metadata
            obj_id = obj[0]
            obj_slug = obj[2]
            cat_slug = obj[7]

            # Get documents
            cur.execute("""
                SELECT folder, filename, content, filepath
                FROM documents
                WHERE object_id = %s
            """, (obj_id,))

            documents = cur.fetchall()

            for folder, filename, content, filepath in documents:
                if content:
                    file_path = export_dir / filepath
                    file_path.parent.mkdir(parents=True, exist_ok=True)

                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)

                    exported_count += 1

        print(f"✓ Exported {exported_count} documents")
        print(f"  Location: {export_dir}")

        cur.close()
        conn.close()
        return 0

    except Exception as e:
        print(f"✗ Error: {e}")
        cur.close()
        conn.close()
        return 1

# ============================================================================
# SYNC COMMANDS
# ============================================================================

def cmd_sync_status(args):
    """Check synchronization status"""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Get sync status
        cur.execute("""
            SELECT entity_type, entity_id, file_path, status, last_sync, error_message
            FROM sync_status
            ORDER BY updated_at DESC
            LIMIT %s
        """, (args.limit,))

        results = cur.fetchall()

        if not results:
            print("No sync status records found.")
            return 0

        # Count by status
        cur.execute("""
            SELECT status, COUNT(*)
            FROM sync_status
            GROUP BY status
        """)
        status_counts = dict(cur.fetchall())

        print("\n📊 Sync Status Summary")
        print("=" * 80)
        for status, count in status_counts.items():
            print(f"  {status}: {count}")

        if args.verbose:
            print("\n📝 Recent Sync Records")
            print("=" * 80)

            headers = ['Type', 'ID', 'Path', 'Status', 'Last Sync', 'Error']
            rows = []
            for entity_type, entity_id, file_path, status, last_sync, error in results:
                rows.append([
                    entity_type,
                    entity_id,
                    (file_path[:40] + '...') if file_path and len(file_path) > 40 else (file_path or '-'),
                    status,
                    last_sync.strftime('%Y-%m-%d %H:%M') if last_sync else '-',
                    (error[:30] + '...') if error and len(error) > 30 else (error or '-')
                ])

            print(tabulate(rows, headers=headers, tablefmt='simple'))

        cur.close()
        conn.close()
        return 0

    except Exception as e:
        print(f"✗ Error: {e}")
        cur.close()
        conn.close()
        return 1

# ============================================================================
# INFO COMMANDS
# ============================================================================

def cmd_info(args):
    """Show KMS information"""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        print("\n📊 KMS Information")
        print("=" * 80)

        # Database stats
        cur.execute("SELECT COUNT(*) FROM categories")
        cat_count = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM subcategories")
        subcat_count = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM objects")
        obj_count = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM documents")
        doc_count = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM change_log")
        change_count = cur.fetchone()[0]

        cur.execute("SELECT SUM(size_bytes) FROM documents")
        total_size = cur.fetchone()[0] or 0

        print(f"\nDatabase Statistics:")
        print(f"  Categories:    {cat_count}")
        print(f"  Subcategories: {subcat_count}")
        print(f"  Objects:       {obj_count}")
        print(f"  Documents:     {doc_count}")
        print(f"  Total Size:    {total_size / 1024 / 1024:.2f} MB")
        print(f"  Changes:       {change_count}")

        # File system stats
        if KMS_ROOT.exists():
            import subprocess
            result = subprocess.run(
                ['du', '-sh', str(KMS_ROOT)],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                size = result.stdout.split()[0]
                print(f"\nFile System:")
                print(f"  Root: {KMS_ROOT}")
                print(f"  Size: {size}")

        # Recent activity
        cur.execute("""
            SELECT action, COUNT(*)
            FROM change_log
            WHERE created_at > NOW() - INTERVAL '7 days'
            GROUP BY action
        """)
        recent_activity = cur.fetchall()

        if recent_activity:
            print(f"\nRecent Activity (7 days):")
            for action, count in recent_activity:
                print(f"  {action}: {count}")

        cur.close()
        conn.close()
        return 0

    except Exception as e:
        print(f"✗ Error: {e}")
        cur.close()
        conn.close()
        return 1

# ============================================================================
# MAIN
# ============================================================================

def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description='KMS Command Line Interface',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Create category
  kms-cli create-category --slug test --name "Test Category" --type product

  # Create object
  kms-cli create-object --category odoo --name "New Project" --with-readme

  # List objects
  kms-cli list --category odoo

  # Search
  kms-cli search "API documentation"

  # Import/Export
  kms-cli import
  kms-cli export --category odoo --output /tmp/export

  # Info
  kms-cli info
  kms-cli sync-status
        """
    )

    subparsers = parser.add_subparsers(dest='command', help='Command to execute')

    # Create Category
    parser_create_cat = subparsers.add_parser('create-category', help='Create a new category')
    parser_create_cat.add_argument('--slug', required=True, help='Category slug (unique)')
    parser_create_cat.add_argument('--name', required=True, help='Category name')
    parser_create_cat.add_argument('--type', choices=['product', 'system'], default='product', help='Category type')
    parser_create_cat.add_argument('--description', help='Category description')
    parser_create_cat.add_argument('--tags', help='Comma-separated tags')

    # List Categories
    parser_list_cat = subparsers.add_parser('list-categories', help='List all categories')
    parser_list_cat.add_argument('--type', choices=['product', 'system'], help='Filter by type')

    # Create Object
    parser_create_obj = subparsers.add_parser('create-object', help='Create a new object')
    parser_create_obj.add_argument('--category', required=True, help='Category slug')
    parser_create_obj.add_argument('--subcategory', help='Subcategory slug')
    parser_create_obj.add_argument('--name', required=True, help='Object name')
    parser_create_obj.add_argument('--slug', help='Object slug (auto-generated if not provided)')
    parser_create_obj.add_argument('--description', help='Object description')
    parser_create_obj.add_argument('--status', choices=['draft', 'active', 'archived'], help='Object status')
    parser_create_obj.add_argument('--author', help='Author name')
    parser_create_obj.add_argument('--tags', help='Comma-separated tags')
    parser_create_obj.add_argument('--with-readme', action='store_true', help='Create README.md')

    # List Objects
    parser_list_obj = subparsers.add_parser('list', help='List objects')
    parser_list_obj.add_argument('--category', help='Filter by category')
    parser_list_obj.add_argument('--status', choices=['draft', 'active', 'archived'], help='Filter by status')

    # Search
    parser_search = subparsers.add_parser('search', help='Search documents')
    parser_search.add_argument('query', help='Search query')
    parser_search.add_argument('--limit', type=int, default=20, help='Maximum results')

    # Import
    parser_import = subparsers.add_parser('import', help='Import data from files to database')

    # Export
    parser_export = subparsers.add_parser('export', help='Export data from database to files')
    parser_export.add_argument('--category', help='Export specific category')
    parser_export.add_argument('--output', help='Output directory (default: /tmp/kms-export)')

    # Sync Status
    parser_sync = subparsers.add_parser('sync-status', help='Check synchronization status')
    parser_sync.add_argument('--limit', type=int, default=10, help='Maximum records to show')
    parser_sync.add_argument('--verbose', '-v', action='store_true', help='Show detailed records')

    # Info
    parser_info = subparsers.add_parser('info', help='Show KMS information')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    # Execute command
    commands = {
        'create-category': cmd_create_category,
        'list-categories': cmd_list_categories,
        'create-object': cmd_create_object,
        'list': cmd_list_objects,
        'search': cmd_search,
        'import': cmd_import,
        'export': cmd_export,
        'sync-status': cmd_sync_status,
        'info': cmd_info,
    }

    if args.command in commands:
        return commands[args.command](args)
    else:
        print(f"Unknown command: {args.command}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
