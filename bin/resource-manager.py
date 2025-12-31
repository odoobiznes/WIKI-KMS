#!/usr/bin/env python3
"""
Resource Block System - CLI Tool
Manages server resources: ports, directories, databases, services, etc.

Usage:
    resource-manager.py ports list                    # List all registered ports
    resource-manager.py ports available [--range 8100-9000]  # Find available ports
    resource-manager.py ports check 8080              # Check if port is available
    resource-manager.py ports allocate 8080 "My API" --project kms-tools

    resource-manager.py dirs list                     # List all directories
    resource-manager.py dirs allocate /opt/myapp --project my-project

    resource-manager.py db list                       # List all databases
    resource-manager.py services list                 # List all services
    resource-manager.py domains list                  # List all domains

    resource-manager.py projects list                 # List all projects
    resource-manager.py projects create "My Project" --slug my-project --path /opt/myproject

    resource-manager.py summary                       # Full resource summary
    resource-manager.py conflicts                     # Check for conflicts
    resource-manager.py sync                          # Sync with system state
"""

import argparse
import sys
import os
import json
import socket
import subprocess
from pathlib import Path
from tabulate import tabulate
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "api"))

from database import get_db_cursor

# Colors for terminal output
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

def color(text, c):
    return f"{c}{text}{Colors.END}"

def check_port_in_use(port):
    """Check if a port is in use on the system"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(('127.0.0.1', port))
        sock.close()
        return result == 0
    except:
        return False

def get_system_ports():
    """Get ports in use from system"""
    try:
        result = subprocess.run(["ss", "-tlnp"], capture_output=True, text=True, timeout=10)
        ports = []
        for line in result.stdout.split('\n')[1:]:
            if line.strip():
                parts = line.split()
                if len(parts) >= 4:
                    local_addr = parts[3]
                    if ':' in local_addr:
                        port = local_addr.rsplit(':', 1)[-1]
                        try:
                            ports.append(int(port))
                        except ValueError:
                            pass
        return sorted(set(ports))
    except Exception as e:
        print(f"Error getting system ports: {e}")
        return []

# ============================================================================
# COMMANDS
# ============================================================================

def cmd_ports_list(args):
    """List all registered ports"""
    with get_db_cursor() as (cur, conn):
        cur.execute("""
            SELECT r.id, r.name, r.value::integer as port, r.port_binding, r.port_protocol,
                   p.name as project, r.status, r.description
            FROM resources r
            LEFT JOIN resource_projects p ON r.project_id = p.id
            WHERE r.resource_type = 'port'
            ORDER BY r.value::integer
        """)
        ports = cur.fetchall()

        if not ports:
            print("No ports registered.")
            return

        system_ports = get_system_ports() if args.check_system else []

        table = []
        for p in ports:
            status = p['status']
            if args.check_system:
                in_use = p['port'] in system_ports
                if in_use:
                    status = color("● active", Colors.GREEN)
                else:
                    status = color("○ not running", Colors.YELLOW)

            table.append([
                p['port'],
                p['name'],
                p['project'] or '-',
                f"{p['port_binding']}:{p['port']}" if p['port_binding'] else f"*:{p['port']}",
                status
            ])

        print(f"\n{color('Registered Ports', Colors.BOLD)}")
        print(tabulate(table, headers=['Port', 'Name', 'Project', 'Binding', 'Status'], tablefmt='simple'))
        print(f"\nTotal: {len(ports)} ports")

def cmd_ports_available(args):
    """Find available ports"""
    start, end = args.range.split('-') if '-' in args.range else (args.range, str(int(args.range) + 100))
    start, end = int(start), int(end)

    with get_db_cursor() as (cur, conn):
        cur.execute("""
            SELECT value::integer as port FROM resources
            WHERE resource_type = 'port' AND status = 'active'
        """)
        registered = {r['port'] for r in cur.fetchall()}

    system_ports = set(get_system_ports())
    used = registered | system_ports

    available = []
    for port in range(start, end + 1):
        if port not in used:
            available.append(port)
            if len(available) >= args.count:
                break

    print(f"\n{color('Available Ports', Colors.BOLD)} ({start}-{end})")
    if available:
        for p in available:
            print(f"  {color(p, Colors.GREEN)}")
        print(f"\nFound {len(available)} available ports")
    else:
        print(f"  {color('No available ports in range', Colors.RED)}")

def cmd_ports_check(args):
    """Check if a port is available"""
    port = int(args.port)

    with get_db_cursor() as (cur, conn):
        cur.execute("""
            SELECT r.*, p.name as project_name
            FROM resources r
            LEFT JOIN resource_projects p ON r.project_id = p.id
            WHERE r.resource_type = 'port' AND r.value = %s
        """, (str(port),))
        registered = cur.fetchone()

    system_in_use = check_port_in_use(port)

    print(f"\n{color('Port Check:', Colors.BOLD)} {port}")
    print(f"  Registered: {color('Yes', Colors.YELLOW) if registered else color('No', Colors.GREEN)}")
    if registered:
        print(f"    Name: {registered['name']}")
        print(f"    Project: {registered['project_name']}")
        print(f"    Status: {registered['status']}")
    print(f"  System in use: {color('Yes', Colors.RED) if system_in_use else color('No', Colors.GREEN)}")

    if not registered and not system_in_use:
        print(f"\n  {color('✓ Port is available for allocation', Colors.GREEN)}")
    elif registered and system_in_use:
        print(f"\n  {color('✓ Port is properly registered and in use', Colors.GREEN)}")
    elif registered and not system_in_use:
        print(f"\n  {color('⚠ Port is registered but not running', Colors.YELLOW)}")
    else:
        print(f"\n  {color('⚠ Port is in use but NOT registered!', Colors.RED)}")

def cmd_ports_allocate(args):
    """Allocate a port to a project"""
    port = int(args.port)

    with get_db_cursor() as (cur, conn):
        # Check availability
        cur.execute("SELECT is_resource_available('port', %s) as available", (str(port),))
        if not cur.fetchone()['available']:
            print(f"{color('Error:', Colors.RED)} Port {port} is already registered")
            return

        if check_port_in_use(port):
            print(f"{color('Warning:', Colors.YELLOW)} Port {port} is in use on system but not registered")
            if not args.force:
                print("Use --force to register anyway")
                return

        # Get project
        cur.execute("SELECT id FROM resource_projects WHERE slug = %s", (args.project,))
        project = cur.fetchone()
        if not project:
            print(f"{color('Error:', Colors.RED)} Project '{args.project}' not found")
            return

        # Allocate
        cur.execute("""
            INSERT INTO resources (project_id, resource_type, name, value, port_protocol, port_binding, description)
            VALUES (%s, 'port', %s, %s, %s, %s, %s)
            RETURNING id
        """, (project['id'], args.name, str(port), args.protocol, args.binding, args.description))
        new_id = cur.fetchone()['id']

        # Log history
        cur.execute("""
            INSERT INTO resource_history (resource_id, action, new_value, changed_by, reason)
            VALUES (%s, 'created', %s, %s, 'Port allocated via CLI')
        """, (new_id, str(port), os.environ.get('USER', 'unknown')))

        conn.commit()
        print(f"{color('✓', Colors.GREEN)} Port {port} allocated successfully (ID: {new_id})")

def cmd_projects_list(args):
    """List all projects"""
    with get_db_cursor() as (cur, conn):
        cur.execute("""
            SELECT p.*,
                   COUNT(r.id) as resource_count,
                   COUNT(CASE WHEN r.resource_type = 'port' THEN 1 END) as ports,
                   COUNT(CASE WHEN r.resource_type = 'directory' THEN 1 END) as dirs,
                   COUNT(CASE WHEN r.resource_type = 'database' THEN 1 END) as dbs
            FROM resource_projects p
            LEFT JOIN resources r ON p.id = r.project_id AND r.status = 'active'
            GROUP BY p.id
            ORDER BY p.name
        """)
        projects = cur.fetchall()

        table = []
        for p in projects:
            table.append([
                p['slug'],
                p['name'],
                p['base_path'] or '-',
                p['resource_count'],
                f"P:{p['ports']} D:{p['dirs']} DB:{p['dbs']}",
                p['status']
            ])

        print(f"\n{color('Resource Projects', Colors.BOLD)}")
        print(tabulate(table, headers=['Slug', 'Name', 'Path', 'Resources', 'Types', 'Status'], tablefmt='simple'))

def cmd_projects_create(args):
    """Create a new project"""
    with get_db_cursor() as (cur, conn):
        try:
            cur.execute("""
                INSERT INTO resource_projects (name, slug, description, base_path, owner)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (args.name, args.slug, args.description, args.path, args.owner))
            new_id = cur.fetchone()['id']
            conn.commit()
            print(f"{color('✓', Colors.GREEN)} Project created: {args.name} (ID: {new_id})")
        except Exception as e:
            conn.rollback()
            print(f"{color('Error:', Colors.RED)} {e}")

def cmd_summary(args):
    """Show full resource summary"""
    with get_db_cursor() as (cur, conn):
        # Projects
        cur.execute("SELECT COUNT(*) as count FROM resource_projects")
        project_count = cur.fetchone()['count']

        # Resources by type
        cur.execute("""
            SELECT resource_type, COUNT(*) as count
            FROM resources WHERE status = 'active'
            GROUP BY resource_type ORDER BY count DESC
        """)
        by_type = cur.fetchall()

        # Port ranges
        cur.execute("""
            SELECT name, start_port, end_port,
                   (SELECT COUNT(*) FROM resources r
                    WHERE r.resource_type = 'port'
                      AND r.value::integer >= start_port
                      AND r.value::integer <= end_port) as used
            FROM port_ranges
        """)
        ranges = cur.fetchall()

        print(f"\n{color('═' * 50, Colors.CYAN)}")
        print(f"{color('  RESOURCE BLOCK SYSTEM SUMMARY', Colors.BOLD)}")
        print(f"{color('═' * 50, Colors.CYAN)}")

        print(f"\n{color('Projects:', Colors.BOLD)} {project_count}")

        print(f"\n{color('Resources by Type:', Colors.BOLD)}")
        for r in by_type:
            print(f"  {r['resource_type']}: {r['count']}")

        print(f"\n{color('Port Ranges:', Colors.BOLD)}")
        for r in ranges:
            print(f"  {r['name']}: {r['start_port']}-{r['end_port']} ({r['used']} used)")

        # Quick conflict check
        system_ports = set(get_system_ports())
        cur.execute("SELECT value::integer as port FROM resources WHERE resource_type = 'port' AND status = 'active'")
        registered_ports = {r['port'] for r in cur.fetchall()}

        unregistered = system_ports - registered_ports
        stale = registered_ports - system_ports

        print(f"\n{color('Quick Health Check:', Colors.BOLD)}")
        if unregistered:
            print(f"  {color('⚠', Colors.YELLOW)} {len(unregistered)} unregistered ports in use")
        else:
            print(f"  {color('✓', Colors.GREEN)} All active ports registered")

        if stale:
            print(f"  {color('⚠', Colors.YELLOW)} {len(stale)} registered ports not running")

def cmd_conflicts(args):
    """Check for resource conflicts"""
    print(f"\n{color('Checking for conflicts...', Colors.BOLD)}")

    system_ports = set(get_system_ports())

    with get_db_cursor() as (cur, conn):
        cur.execute("""
            SELECT r.value::integer as port, r.name, p.name as project
            FROM resources r
            LEFT JOIN resource_projects p ON r.project_id = p.id
            WHERE r.resource_type = 'port' AND r.status = 'active'
        """)
        registered = {r['port']: r for r in cur.fetchall()}

    registered_ports = set(registered.keys())

    # Unregistered ports
    unregistered = system_ports - registered_ports
    if unregistered:
        print(f"\n{color('⚠ Unregistered ports in use:', Colors.YELLOW)}")
        for p in sorted(unregistered):
            print(f"  Port {p}")

    # Stale registrations
    stale = registered_ports - system_ports
    if stale:
        print(f"\n{color('⚠ Registered but not running:', Colors.YELLOW)}")
        for p in sorted(stale):
            info = registered[p]
            print(f"  Port {p}: {info['name']} ({info['project']})")

    if not unregistered and not stale:
        print(f"\n{color('✓ No conflicts detected!', Colors.GREEN)}")

def cmd_sync(args):
    """Sync resources with system state"""
    print(f"\n{color('Syncing with system state...', Colors.BOLD)}")

    system_ports = get_system_ports()

    with get_db_cursor() as (cur, conn):
        # Get system project for unassigned resources
        cur.execute("SELECT id FROM resource_projects WHERE slug = 'system'")
        system_project = cur.fetchone()

        if not system_project:
            cur.execute("""
                INSERT INTO resource_projects (name, slug, description, owner)
                VALUES ('System Services', 'system', 'System-level services', 'root')
                RETURNING id
            """)
            system_project = cur.fetchone()
            conn.commit()

        system_id = system_project['id']

        # Check for unregistered ports
        cur.execute("SELECT value::integer as port FROM resources WHERE resource_type = 'port'")
        registered = {r['port'] for r in cur.fetchall()}

        added = 0
        for port in system_ports:
            if port not in registered:
                if args.auto_register:
                    cur.execute("""
                        INSERT INTO resources (project_id, resource_type, name, value, description, status)
                        VALUES (%s, 'port', %s, %s, 'Auto-discovered port', 'active')
                    """, (system_id, f"Port {port}", str(port)))
                    added += 1
                    print(f"  {color('+', Colors.GREEN)} Registered port {port}")
                else:
                    print(f"  {color('?', Colors.YELLOW)} Found unregistered port {port}")

        if args.auto_register:
            conn.commit()
            print(f"\n{color('✓', Colors.GREEN)} Added {added} new port registrations")
        elif added == 0 and not args.auto_register:
            print(f"\n{color('✓', Colors.GREEN)} All ports are registered")

# ============================================================================
# MAIN
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description='Resource Block System - CLI Tool',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    subparsers = parser.add_subparsers(dest='command', help='Commands')

    # Ports commands
    ports_parser = subparsers.add_parser('ports', help='Manage ports')
    ports_sub = ports_parser.add_subparsers(dest='ports_cmd')

    ports_list = ports_sub.add_parser('list', help='List registered ports')
    ports_list.add_argument('--check-system', action='store_true', help='Check against system ports')

    ports_available = ports_sub.add_parser('available', help='Find available ports')
    ports_available.add_argument('--range', default='8100-9000', help='Port range (default: 8100-9000)')
    ports_available.add_argument('--count', type=int, default=10, help='Number of ports to show')

    ports_check = ports_sub.add_parser('check', help='Check if port is available')
    ports_check.add_argument('port', help='Port number to check')

    ports_allocate = ports_sub.add_parser('allocate', help='Allocate a port')
    ports_allocate.add_argument('port', help='Port number')
    ports_allocate.add_argument('name', help='Port name/description')
    ports_allocate.add_argument('--project', required=True, help='Project slug')
    ports_allocate.add_argument('--protocol', default='tcp', help='Protocol (tcp/udp)')
    ports_allocate.add_argument('--binding', default='127.0.0.1', help='IP binding')
    ports_allocate.add_argument('--description', help='Description')
    ports_allocate.add_argument('--force', action='store_true', help='Force allocation')

    # Projects commands
    projects_parser = subparsers.add_parser('projects', help='Manage projects')
    projects_sub = projects_parser.add_subparsers(dest='projects_cmd')

    projects_list = projects_sub.add_parser('list', help='List projects')

    projects_create = projects_sub.add_parser('create', help='Create project')
    projects_create.add_argument('name', help='Project name')
    projects_create.add_argument('--slug', required=True, help='Project slug')
    projects_create.add_argument('--path', help='Base path')
    projects_create.add_argument('--description', help='Description')
    projects_create.add_argument('--owner', default='devops', help='Owner')

    # Other commands
    subparsers.add_parser('summary', help='Show resource summary')
    subparsers.add_parser('conflicts', help='Check for conflicts')

    sync_parser = subparsers.add_parser('sync', help='Sync with system state')
    sync_parser.add_argument('--auto-register', action='store_true', help='Auto-register missing resources')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    # Route commands
    if args.command == 'ports':
        if args.ports_cmd == 'list':
            cmd_ports_list(args)
        elif args.ports_cmd == 'available':
            cmd_ports_available(args)
        elif args.ports_cmd == 'check':
            cmd_ports_check(args)
        elif args.ports_cmd == 'allocate':
            cmd_ports_allocate(args)
        else:
            ports_parser.print_help()
    elif args.command == 'projects':
        if args.projects_cmd == 'list':
            cmd_projects_list(args)
        elif args.projects_cmd == 'create':
            cmd_projects_create(args)
        else:
            projects_parser.print_help()
    elif args.command == 'summary':
        cmd_summary(args)
    elif args.command == 'conflicts':
        cmd_conflicts(args)
    elif args.command == 'sync':
        cmd_sync(args)

if __name__ == '__main__':
    main()
