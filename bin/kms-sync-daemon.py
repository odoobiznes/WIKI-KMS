#!/usr/bin/env python3
"""
KMS Synchronization Daemon
Bidirectional sync between /opt/kms/ files and PostgreSQL database
"""
import os
import sys
import time
import json
import yaml
import hashlib
import logging
import signal
import psycopg2
from pathlib import Path
from datetime import datetime
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Configuration
KMS_ROOT = Path("/opt/kms")
CATEGORIES_DIR = KMS_ROOT / "categories"
LOG_FILE = "/var/log/kms-sync-daemon.log"
PID_FILE = "/tmp/kms-sync-daemon.pid"
POLL_INTERVAL = 5  # Seconds between DB polls

# Database connection info
DB_HOST = "localhost"
DB_NAME = "kms_db"
DB_USER = "kms_user"

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Global flag for graceful shutdown
shutdown_flag = False

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    global shutdown_flag
    logger.info(f"Received signal {signum}, shutting down gracefully...")
    shutdown_flag = True

# Register signal handlers
signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

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
    """Calculate SHA256 checksum of a file"""
    sha256 = hashlib.sha256()
    try:
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b''):
                sha256.update(chunk)
        return sha256.hexdigest()
    except Exception as e:
        logger.error(f"Failed to calculate checksum for {filepath}: {e}")
        return None

def read_metadata(meta_file):
    """Read .meta.yaml file"""
    try:
        with open(meta_file, 'r') as f:
            return yaml.safe_load(f)
    except Exception as e:
        logger.warning(f"Failed to read {meta_file}: {e}")
        return None

def write_metadata(meta_file, metadata):
    """Write .meta.yaml file"""
    try:
        with open(meta_file, 'w') as f:
            yaml.dump(metadata, f, default_flow_style=False, allow_unicode=True)
        return True
    except Exception as e:
        logger.error(f"Failed to write {meta_file}: {e}")
        return False

class FileChangeHandler(FileSystemEventHandler):
    """Handle file system events"""

    def __init__(self, sync_manager):
        self.sync_manager = sync_manager
        super().__init__()

    def on_modified(self, event):
        """Handle file modification"""
        if event.is_directory:
            return

        filepath = Path(event.src_path)

        # Ignore temporary files and hidden files
        if filepath.name.startswith('.') and not filepath.name == '.meta.yaml':
            return

        logger.info(f"File modified: {filepath}")
        self.sync_manager.sync_file_to_db(filepath)

    def on_created(self, event):
        """Handle file creation"""
        if event.is_directory:
            return

        filepath = Path(event.src_path)

        if filepath.name.startswith('.') and not filepath.name == '.meta.yaml':
            return

        logger.info(f"File created: {filepath}")
        self.sync_manager.sync_file_to_db(filepath)

    def on_deleted(self, event):
        """Handle file deletion"""
        if event.is_directory:
            return

        filepath = Path(event.src_path)

        logger.info(f"File deleted: {filepath}")
        self.sync_manager.handle_file_deletion(filepath)

class SyncManager:
    """Manage bidirectional synchronization"""

    def __init__(self):
        self.conn = get_db_connection()
        self.last_db_check = datetime.now()

    def sync_file_to_db(self, filepath):
        """Sync a file change to the database"""
        try:
            # Determine what type of file this is
            rel_path = filepath.relative_to(KMS_ROOT)
            parts = rel_path.parts

            # Check if it's a metadata file
            if filepath.name == '.meta.yaml':
                self.sync_metadata_to_db(filepath)
            # Check if it's a document
            elif len(parts) >= 4 and parts[0] == 'categories':
                self.sync_document_to_db(filepath)

        except Exception as e:
            logger.error(f"Failed to sync {filepath} to DB: {e}")
            self.conn.rollback()

    def sync_metadata_to_db(self, meta_file):
        """Sync .meta.yaml file to database"""
        metadata = read_metadata(meta_file)
        if not metadata:
            return

        cur = self.conn.cursor()
        rel_path = meta_file.relative_to(KMS_ROOT)
        parts = rel_path.parts

        try:
            # Category metadata
            if len(parts) == 3 and parts[0] == 'categories':
                cat_slug = parts[1]
                cur.execute("""
                    UPDATE categories
                    SET name = %s,
                        description = %s,
                        metadata = %s,
                        updated_at = NOW()
                    WHERE slug = %s
                """, (
                    metadata.get('name', cat_slug),
                    metadata.get('description', ''),
                    json.dumps(metadata),
                    cat_slug
                ))
                logger.info(f"Updated category metadata: {cat_slug}")

            # Subcategory metadata
            elif len(parts) == 5 and parts[2] == 'subcategories':
                cat_slug = parts[1]
                sub_slug = parts[3]

                # Get category ID
                cur.execute("SELECT id FROM categories WHERE slug = %s", (cat_slug,))
                result = cur.fetchone()
                if result:
                    cat_id = result[0]
                    # Check if subcategory exists
                    cur.execute(
                        "SELECT id FROM subcategories WHERE category_id = %s AND slug = %s",
                        (cat_id, sub_slug)
                    )
                    sub_result = cur.fetchone()

                    if sub_result:
                        # Update existing subcategory
                        cur.execute("""
                            UPDATE subcategories
                            SET name = %s,
                                description = %s,
                                metadata = %s,
                                updated_at = NOW()
                            WHERE category_id = %s AND slug = %s
                        """, (
                            metadata.get('name', sub_slug),
                            metadata.get('description', ''),
                            json.dumps(metadata),
                            cat_id,
                            sub_slug
                        ))
                        logger.info(f"Updated subcategory metadata: {cat_slug}/{sub_slug}")
                    else:
                        # Create new subcategory
                        cur.execute("""
                            INSERT INTO subcategories (category_id, slug, name, description, metadata, is_active)
                            VALUES (%s, %s, %s, %s, %s, %s)
                            RETURNING id
                        """, (
                            cat_id,
                            sub_slug,
                            metadata.get('name', sub_slug),
                            metadata.get('description', ''),
                            json.dumps(metadata),
                            metadata.get('is_active', True)
                        ))
                        sub_id = cur.fetchone()[0]
                        logger.info(f"Created subcategory: {cat_slug}/{sub_slug} (ID: {sub_id})")

            # Object metadata
            elif 'objects' in parts:
                obj_idx = parts.index('objects')
                if obj_idx + 2 <= len(parts):
                    obj_slug = parts[obj_idx + 1]

                    # Determine category and subcategory
                    cat_slug = parts[1]
                    sub_slug = None
                    if 'subcategories' in parts:
                        sub_idx = parts.index('subcategories')
                        sub_slug = parts[sub_idx + 1]

                    # Get IDs
                    cur.execute("SELECT id FROM categories WHERE slug = %s", (cat_slug,))
                    cat_result = cur.fetchone()
                    if not cat_result:
                        return
                    cat_id = cat_result[0]

                    sub_id = None
                    if sub_slug:
                        cur.execute(
                            "SELECT id FROM subcategories WHERE category_id = %s AND slug = %s",
                            (cat_id, sub_slug)
                        )
                        sub_result = cur.fetchone()
                        if sub_result:
                            sub_id = sub_result[0]

                    # Update object
                    cur.execute("""
                        UPDATE objects
                        SET name = %s,
                            description = %s,
                            status = %s,
                            author = %s,
                            metadata = %s,
                            updated_at = NOW()
                        WHERE category_id = %s
                          AND COALESCE(subcategory_id, 0) = COALESCE(%s, 0)
                          AND slug = %s
                    """, (
                        metadata.get('name', obj_slug),
                        metadata.get('description', ''),
                        metadata.get('status', 'active'),
                        metadata.get('author', 'Unknown'),
                        json.dumps(metadata),
                        cat_id,
                        sub_id,
                        obj_slug
                    ))
                    logger.info(f"Updated object metadata: {obj_slug}")

            self.conn.commit()
            cur.close()

        except Exception as e:
            logger.error(f"Failed to sync metadata {meta_file}: {e}")
            self.conn.rollback()
            cur.close()

    def sync_document_to_db(self, filepath):
        """Sync a document file to database"""
        try:
            rel_path = filepath.relative_to(KMS_ROOT)
            parts = rel_path.parts

            # Must be in categories/.../objects/... structure
            if 'objects' not in parts:
                return

            obj_idx = parts.index('objects')
            if obj_idx + 1 >= len(parts):
                return

            obj_slug = parts[obj_idx + 1]

            # Skip .meta.yaml and hidden files
            if filepath.name.startswith('.'):
                return

            # Skip binary files and non-document files
            ext = filepath.suffix.lower()
            if ext not in ['.md', '.txt', '.sh', '.yml', '.yaml', '.json', '.py', '.js', '.ts', '.html', '.css', '.sql']:
                return

            # Determine folder and filename
            # Check if file is directly in object root or in a subdirectory
            if obj_idx + 2 < len(parts):
                next_part = parts[obj_idx + 2]

                # Check if next_part is a standard folder or a file (has extension)
                if next_part in ['plany', 'instrukce', 'code', 'docs']:
                    # File is in a standard folder
                    folder = next_part
                    filename = '/'.join(parts[obj_idx + 3:]) if obj_idx + 3 < len(parts) else ''
                else:
                    # Check if it's a file directly in object root (has extension in filename)
                    # If next_part is the filename (last part), it's in root
                    if obj_idx + 2 == len(parts) - 1:
                        # File is directly in object root
                        folder = 'root'
                        filename = next_part
                    else:
                        # File is in a non-standard subdirectory, skip
                        return
            else:
                # File is directly in object root (shouldn't happen with current structure)
                folder = 'root'
                filename = parts[-1]

            # Determine category and subcategory
            cat_slug = parts[1]
            sub_slug = None
            if 'subcategories' in parts:
                sub_idx = parts.index('subcategories')
                sub_slug = parts[sub_idx + 1]

            # Get object ID
            cur = self.conn.cursor()

            cur.execute("SELECT id FROM categories WHERE slug = %s", (cat_slug,))
            cat_result = cur.fetchone()
            if not cat_result:
                cur.close()
                return
            cat_id = cat_result[0]

            sub_id = None
            if sub_slug:
                cur.execute(
                    "SELECT id FROM subcategories WHERE category_id = %s AND slug = %s",
                    (cat_id, sub_slug)
                )
                sub_result = cur.fetchone()
                if sub_result:
                    sub_id = sub_result[0]

            # Get object
            cur.execute("""
                SELECT id FROM objects
                WHERE category_id = %s
                  AND COALESCE(subcategory_id, 0) = COALESCE(%s, 0)
                  AND slug = %s
            """, (cat_id, sub_id, obj_slug))
            obj_result = cur.fetchone()
            if not obj_result:
                cur.close()
                return
            obj_id = obj_result[0]

            # Read file content
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
            except Exception:
                content = None

            # Calculate checksum and size
            checksum = calculate_checksum(filepath)
            size_bytes = filepath.stat().st_size

            # Determine content type
            suffix = filepath.suffix.lower()
            content_type = {
                '.md': 'text/markdown',
                '.txt': 'text/plain',
                '.py': 'text/x-python',
                '.js': 'text/javascript',
                '.json': 'application/json',
                '.yaml': 'application/yaml',
                '.yml': 'application/yaml',
            }.get(suffix, 'application/octet-stream')

            # Update or insert document
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
                obj_id,
                folder,
                filename,
                str(rel_path),
                content,
                content_type,
                size_bytes,
                checksum
            ))

            self.conn.commit()
            cur.close()
            logger.info(f"Synced document to DB: {filepath}")

        except Exception as e:
            logger.error(f"Failed to sync document {filepath}: {e}")
            self.conn.rollback()

    def handle_file_deletion(self, filepath):
        """Handle file deletion - mark as deleted in DB"""
        try:
            rel_path = filepath.relative_to(KMS_ROOT)

            cur = self.conn.cursor()

            # Delete document from DB
            cur.execute("DELETE FROM documents WHERE filepath = %s", (str(rel_path),))

            self.conn.commit()
            cur.close()
            logger.info(f"Deleted document from DB: {filepath}")

        except Exception as e:
            logger.error(f"Failed to handle deletion of {filepath}: {e}")
            self.conn.rollback()

    def check_db_changes(self):
        """Check for database changes and sync to files"""
        try:
            cur = self.conn.cursor()

            # Check for documents updated since last check
            cur.execute("""
                SELECT id, object_id, folder, filename, filepath, content, updated_at
                FROM documents
                WHERE updated_at > %s
            """, (self.last_db_check,))

            changed_docs = cur.fetchall()

            for doc in changed_docs:
                doc_id, obj_id, folder, filename, filepath, content, updated_at = doc

                # Get object details
                cur.execute("""
                    SELECT o.slug, c.slug, sc.slug
                    FROM objects o
                    JOIN categories c ON o.category_id = c.id
                    LEFT JOIN subcategories sc ON o.subcategory_id = sc.id
                    WHERE o.id = %s
                """, (obj_id,))
                obj_result = cur.fetchone()
                if not obj_result:
                    continue

                obj_slug, cat_slug, sub_slug = obj_result

                # Construct file path
                if sub_slug:
                    file_path = KMS_ROOT / "categories" / cat_slug / "subcategories" / sub_slug / "objects" / obj_slug / folder / filename
                else:
                    file_path = KMS_ROOT / "categories" / cat_slug / "objects" / obj_slug / folder / filename

                # Check if file exists and is different
                needs_update = False
                if not file_path.exists():
                    needs_update = True
                else:
                    # Check if content is different
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            file_content = f.read()
                        if file_content != content:
                            needs_update = True
                    except Exception:
                        needs_update = True

                if needs_update and content is not None:
                    # Create parent directory if needed
                    file_path.parent.mkdir(parents=True, exist_ok=True)

                    # Write content to file
                    try:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        logger.info(f"Synced DB change to file: {file_path}")
                    except Exception as e:
                        logger.error(f"Failed to write {file_path}: {e}")

            cur.close()
            self.last_db_check = datetime.now()

        except Exception as e:
            logger.error(f"Failed to check DB changes: {e}")

    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            logger.info("Database connection closed")

def write_pid_file():
    """Write PID file"""
    try:
        with open(PID_FILE, 'w') as f:
            f.write(str(os.getpid()))
    except Exception as e:
        logger.error(f"Failed to write PID file: {e}")

def remove_pid_file():
    """Remove PID file"""
    try:
        if os.path.exists(PID_FILE):
            os.remove(PID_FILE)
    except Exception as e:
        logger.error(f"Failed to remove PID file: {e}")

def main():
    """Main daemon function"""
    logger.info("=" * 70)
    logger.info("KMS Synchronization Daemon Starting")
    logger.info("=" * 70)
    logger.info(f"KMS Root: {KMS_ROOT}")
    logger.info(f"Database: {DB_NAME}@{DB_HOST}")
    logger.info(f"Log File: {LOG_FILE}")

    write_pid_file()

    try:
        # Initialize sync manager
        sync_manager = SyncManager()
        logger.info("Sync manager initialized")

        # Setup file watcher
        event_handler = FileChangeHandler(sync_manager)
        observer = Observer()
        observer.schedule(event_handler, str(CATEGORIES_DIR), recursive=True)
        observer.start()
        logger.info(f"File watcher started on {CATEGORIES_DIR}")

        logger.info("=" * 70)
        logger.info("Daemon running - monitoring for changes")
        logger.info("=" * 70)

        # Main loop
        while not shutdown_flag:
            try:
                # Check for database changes
                sync_manager.check_db_changes()

                # Sleep for poll interval
                time.sleep(POLL_INTERVAL)

            except KeyboardInterrupt:
                break
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                time.sleep(POLL_INTERVAL)

        # Cleanup
        logger.info("Shutting down...")
        observer.stop()
        observer.join()
        sync_manager.close()
        remove_pid_file()

        logger.info("=" * 70)
        logger.info("KMS Synchronization Daemon Stopped")
        logger.info("=" * 70)

    except Exception as e:
        logger.error(f"Fatal error: {e}")
        import traceback
        traceback.print_exc()
        remove_pid_file()
        return 1

    return 0

if __name__ == "__main__":
    sys.exit(main())
