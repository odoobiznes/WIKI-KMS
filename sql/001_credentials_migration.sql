-- Migration: api_keys → credentials + audit log
-- Date: 2025-12-31
-- Description: Extend api_keys table for full credentials management

-- ============================================================================
-- STEP 1: Rename and extend api_keys table
-- ============================================================================

-- Rename table
ALTER TABLE IF EXISTS api_keys RENAME TO credentials;

-- Rename sequence
ALTER SEQUENCE IF EXISTS api_keys_id_seq RENAME TO credentials_id_seq;

-- Rename constraints
ALTER INDEX IF EXISTS api_keys_pkey RENAME TO credentials_pkey;
ALTER INDEX IF EXISTS api_keys_key_hash_key RENAME TO credentials_key_hash_key;
ALTER INDEX IF EXISTS idx_api_keys_key_hash RENAME TO idx_credentials_key_hash;

-- Add new columns for extended functionality
ALTER TABLE credentials
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'api_key',
  ADD COLUMN IF NOT EXISTS encrypted_value TEXT,
  ADD COLUMN IF NOT EXISTS connection_info JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS auto_rotate BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rotation_days INTEGER,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS test_endpoint VARCHAR(500),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS environment VARCHAR(50) DEFAULT 'production';

-- Update existing records to have default category
UPDATE credentials SET category = 'api_key' WHERE category IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_credentials_category ON credentials(category);
CREATE INDEX IF NOT EXISTS idx_credentials_tags ON credentials USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_credentials_user_id ON credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_credentials_environment ON credentials(environment);
CREATE INDEX IF NOT EXISTS idx_credentials_created_at ON credentials(created_at);

-- Add comment
COMMENT ON TABLE credentials IS 'Stores encrypted credentials (API keys, SSH keys, passwords, tokens)';

-- ============================================================================
-- STEP 2: Create credentials_audit_log table
-- ============================================================================

CREATE TABLE IF NOT EXISTS credentials_audit_log (
    id SERIAL PRIMARY KEY,
    credential_id INTEGER REFERENCES credentials(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,  -- 'view', 'create', 'update', 'delete', 'decrypt', 'test', 'copy'
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',  -- Additional context
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_credential_id ON credentials_audit_log(credential_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON credentials_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON credentials_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON credentials_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_success ON credentials_audit_log(success);

COMMENT ON TABLE credentials_audit_log IS 'Audit trail for all credential access and operations';

-- ============================================================================
-- STEP 3: Create view for credentials with user info
-- ============================================================================

CREATE OR REPLACE VIEW v_credentials_full AS
SELECT
    c.*,
    u.username,
    u.full_name as user_full_name,
    u.email as user_email,
    (SELECT COUNT(*) FROM credentials_audit_log cal WHERE cal.credential_id = c.id AND cal.action = 'decrypt') as decrypt_count,
    (SELECT MAX(created_at) FROM credentials_audit_log cal WHERE cal.credential_id = c.id AND cal.action = 'decrypt') as last_decrypted_at
FROM credentials c
LEFT JOIN users u ON c.user_id = u.id;

COMMENT ON VIEW v_credentials_full IS 'Full credentials view with user info and usage statistics';

-- ============================================================================
-- STEP 4: Create function for automatic audit logging
-- ============================================================================

CREATE OR REPLACE FUNCTION log_credential_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log to existing audit_log table for general tracking
    INSERT INTO audit_log (
        entity_type,
        entity_id,
        action,
        user_name,
        new_data,
        old_data
    ) VALUES (
        'credential',
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        current_user,
        CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END,
        CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS credentials_audit_trigger ON credentials;
CREATE TRIGGER credentials_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON credentials
    FOR EACH ROW EXECUTE FUNCTION log_credential_change();

-- ============================================================================
-- STEP 5: Insert default credential categories (as reference)
-- ============================================================================

-- This is just for documentation - actual categories are defined in code
-- Valid categories: 'api_key', 'ssh_key', 'database', 'oauth_token', 'ssl_cert', 'service_credential'

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'credentials') THEN
        RAISE EXCEPTION 'Migration failed: credentials table not found';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'credentials_audit_log') THEN
        RAISE EXCEPTION 'Migration failed: credentials_audit_log table not found';
    END IF;

    RAISE NOTICE 'Migration completed successfully';
END $$;
