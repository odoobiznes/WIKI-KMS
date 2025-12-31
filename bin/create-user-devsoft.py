#!/usr/bin/env python3
"""Create devsoft user and disable admin"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.auth import get_db_connection, get_password_hash

def create_devsoft_user():
    """Create devsoft user and disable admin"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()

        # Disable admin user
        cur.execute("UPDATE users SET is_active = false WHERE username = 'admin'")
        print("✅ Admin user disabled")

        # Check if devsoft user exists
        cur.execute("SELECT id FROM users WHERE username = 'devsoft'")
        if cur.fetchone():
            print("⚠️  Devsoft user already exists, updating...")
            cur.execute("""
                UPDATE users
                SET password_hash = %s, is_active = true, is_superuser = true,
                    role = 'superuser', updated_at = NOW()
                WHERE username = 'devsoft'
                RETURNING id
            """, (get_password_hash('devsoft123'),))
            user_id = cur.fetchone()[0]
            print(f"✅ Devsoft user updated (ID: {user_id})")
        else:
            # Create devsoft user
            password_hash = get_password_hash('devsoft123')
            cur.execute("""
                INSERT INTO users (username, email, password_hash, full_name, is_active, is_superuser, role)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                'devsoft',
                'devsoft@it-enterprise.solutions',
                password_hash,
                'DevSoft Administrator',
                True,
                True,
                'superuser'
            ))
            user_id = cur.fetchone()[0]
            print(f"✅ Devsoft user created (ID: {user_id})")

        conn.commit()
        print("⚠️  DEFAULT PASSWORD SET - PLEASE CHANGE IT IMMEDIATELY!")
        print("⚠️  Use: python3 bin/change-devsoft-password.py")
    finally:
        conn.close()

if __name__ == "__main__":
    create_devsoft_user()
