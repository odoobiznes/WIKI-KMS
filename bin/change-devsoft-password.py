#!/usr/bin/env python3
"""Change devsoft user password - SECURITY SCRIPT"""
import sys
import os
import getpass
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.auth import get_db_connection, get_password_hash

def change_devsoft_password():
    """Change devsoft user password"""
    print("=" * 60)
    print("🔒 CHANGE DEVSOPT USER PASSWORD")
    print("=" * 60)
    
    # Get new password
    new_password = getpass.getpass("Enter new password for 'devsoft' user: ")
    if len(new_password) < 8:
        print("❌ Password must be at least 8 characters long!")
        return False
    
    confirm_password = getpass.getpass("Confirm new password: ")
    if new_password != confirm_password:
        print("❌ Passwords do not match!")
        return False
    
    # Update password
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        password_hash = get_password_hash(new_password)
        cur.execute("""
            UPDATE users
            SET password_hash = %s, updated_at = NOW()
            WHERE username = 'devsoft'
            RETURNING id
        """, (password_hash,))
        
        result = cur.fetchone()
        if result:
            conn.commit()
            print("✅ Password changed successfully!")
            print("⚠️  Please update any scripts that use the old password")
            return True
        else:
            print("❌ User 'devsoft' not found!")
            return False
    finally:
        conn.close()

if __name__ == "__main__":
    change_devsoft_password()
