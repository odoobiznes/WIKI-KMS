"""
Secrets Manager Wrapper
Integrates WikiSys secrets-manager.sh with KMS API
Provides encryption/decryption and connection testing
"""
import subprocess
import os
import tempfile
import logging
from typing import Optional, Dict, Any
import psycopg2
import paramiko
import requests

logger = logging.getLogger(__name__)

class SecretsManager:
    """
    Wrapper for WikiSys secrets-manager.sh script
    Handles encryption/decryption of credentials using age
    """

    SCRIPT_PATH = os.path.expanduser("~/.wikisys-local/scripts/secrets-manager.sh")
    SECRETS_DIR = os.path.expanduser("~/.wikisys-secrets")

    @staticmethod
    def encrypt(plain_text: str, name: str) -> str:
        """
        Encrypt a secret using age encryption

        Args:
            plain_text: The plain text secret to encrypt
            name: Name/path for the secret (e.g., "api-tokens/github")

        Returns:
            Base64 encoded encrypted value

        Raises:
            Exception: If encryption fails
        """
        try:
            logger.info(f"Encrypting secret: {name}")

            # Create temporary file for the secret
            with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as tmp:
                tmp.write(plain_text)
                tmp_path = tmp.name

            try:
                # Encrypt using secrets-manager.sh
                result = subprocess.run(
                    ["bash", SecretsManager.SCRIPT_PATH, "encrypt", tmp_path, name],
                    capture_output=True,
                    text=True,
                    timeout=30
                )

                if result.returncode != 0:
                    logger.error(f"Encryption failed: {result.stderr}")
                    raise Exception(f"Encryption failed: {result.stderr}")

                # Read encrypted file as binary and encode to base64
                encrypted_file = os.path.join(SecretsManager.SECRETS_DIR, f"{name}.age")
                if os.path.exists(encrypted_file):
                    import base64
                    with open(encrypted_file, 'rb') as f:
                        encrypted_bytes = f.read()
                    encrypted_value = base64.b64encode(encrypted_bytes).decode('utf-8')
                    logger.info(f"Secret encrypted successfully: {name}")
                    return encrypted_value
                else:
                    raise Exception(f"Encrypted file not found: {encrypted_file}")

            finally:
                # Clean up temporary file
                if os.path.exists(tmp_path):
                    subprocess.run(["shred", "-u", tmp_path], capture_output=True)

        except Exception as e:
            logger.error(f"Error encrypting secret: {e}", exc_info=True)
            raise

    @staticmethod
    def decrypt(encrypted_value: str, name: str) -> str:
        """
        Decrypt a secret using age decryption

        Args:
            encrypted_value: Base64 encoded encrypted value
            name: Name/path of the secret

        Returns:
            Plain text secret

        Raises:
            Exception: If decryption fails
        """
        try:
            logger.info(f"Decrypting secret: {name}")

            import base64
            # Decode from base64 and create temporary file with encrypted bytes
            encrypted_bytes = base64.b64decode(encrypted_value)
            with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.age') as tmp:
                tmp.write(encrypted_bytes)
                tmp_path = tmp.name

            try:
                # Decrypt using age
                result = subprocess.run(
                    ["age", "-d", "-i", os.path.expanduser("~/.wikisys-age-key.txt"), tmp_path],
                    capture_output=True,
                    text=True,
                    timeout=30
                )

                if result.returncode != 0:
                    logger.error(f"Decryption failed: {result.stderr}")
                    raise Exception(f"Decryption failed: {result.stderr}")

                plain_text = result.stdout.strip()
                logger.info(f"Secret decrypted successfully: {name}")
                return plain_text

            finally:
                # Clean up temporary file
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)

        except Exception as e:
            logger.error(f"Error decrypting secret: {e}", exc_info=True)
            raise

    @staticmethod
    def test_connection(credential_type: str, config: Dict[str, Any], secret: str) -> Dict[str, Any]:
        """
        Test connection using the credential

        Args:
            credential_type: Type of credential (database, api_key, ssh_key, etc.)
            config: Connection configuration
            secret: Decrypted secret value

        Returns:
            Dict with success status and message
        """
        try:
            logger.info(f"Testing {credential_type} connection")

            if credential_type == 'database':
                return SecretsManager._test_database_connection(config, secret)
            elif credential_type == 'api_key':
                return SecretsManager._test_api_connection(config, secret)
            elif credential_type == 'ssh_key':
                return SecretsManager._test_ssh_connection(config, secret)
            else:
                return {
                    "success": False,
                    "message": f"Connection test not implemented for type: {credential_type}"
                }

        except Exception as e:
            logger.error(f"Connection test failed: {e}", exc_info=True)
            return {
                "success": False,
                "message": str(e),
                "error": type(e).__name__
            }

    @staticmethod
    def _test_database_connection(config: Dict[str, Any], password: str) -> Dict[str, Any]:
        """Test database connection"""
        try:
            conn = psycopg2.connect(
                host=config.get('host', 'localhost'),
                port=config.get('port', 5432),
                database=config.get('database', 'postgres'),
                user=config.get('username', 'postgres'),
                password=password,
                connect_timeout=10
            )
            conn.close()

            return {
                "success": True,
                "message": "Database connection successful",
                "details": {
                    "host": config.get('host'),
                    "database": config.get('database')
                }
            }
        except psycopg2.Error as e:
            return {
                "success": False,
                "message": f"Database connection failed: {str(e)}",
                "error": "DatabaseError"
            }

    @staticmethod
    def _test_api_connection(config: Dict[str, Any], api_key: str) -> Dict[str, Any]:
        """Test API connection"""
        try:
            endpoint = config.get('test_endpoint')
            if not endpoint:
                return {
                    "success": False,
                    "message": "No test endpoint configured"
                }

            # Determine auth method
            auth_header = config.get('auth_header', 'Authorization')
            auth_format = config.get('auth_format', 'Bearer {}')

            headers = {
                auth_header: auth_format.format(api_key)
            }

            response = requests.get(
                endpoint,
                headers=headers,
                timeout=10
            )

            if response.status_code < 400:
                return {
                    "success": True,
                    "message": "API connection successful",
                    "details": {
                        "status_code": response.status_code,
                        "endpoint": endpoint
                    }
                }
            else:
                return {
                    "success": False,
                    "message": f"API returned error: {response.status_code}",
                    "details": {
                        "status_code": response.status_code
                    }
                }

        except requests.RequestException as e:
            return {
                "success": False,
                "message": f"API connection failed: {str(e)}",
                "error": "RequestError"
            }

    @staticmethod
    def _test_ssh_connection(config: Dict[str, Any], private_key: str) -> Dict[str, Any]:
        """Test SSH connection"""
        try:
            host = config.get('host')
            port = config.get('port', 22)
            username = config.get('username', 'root')

            if not host:
                return {
                    "success": False,
                    "message": "No host configured"
                }

            # Create SSH client
            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

            # Load private key from string
            key_file = paramiko.RSAKey.from_private_key(
                file_obj=tempfile.SpooledTemporaryFile(mode='w+')
            )

            # Connect
            client.connect(
                hostname=host,
                port=port,
                username=username,
                pkey=key_file,
                timeout=10
            )

            # Test with simple command
            stdin, stdout, stderr = client.exec_command('echo "test"')
            output = stdout.read().decode().strip()

            client.close()

            if output == 'test':
                return {
                    "success": True,
                    "message": "SSH connection successful",
                    "details": {
                        "host": host,
                        "username": username
                    }
                }
            else:
                return {
                    "success": False,
                    "message": "SSH connection established but command failed"
                }

        except Exception as e:
            return {
                "success": False,
                "message": f"SSH connection failed: {str(e)}",
                "error": type(e).__name__
            }


# Convenience functions for backward compatibility
def encrypt_secret(plain_text: str, name: str) -> str:
    """Encrypt a secret"""
    return SecretsManager.encrypt(plain_text, name)


def decrypt_secret(encrypted_value: str, name: str) -> str:
    """Decrypt a secret"""
    return SecretsManager.decrypt(encrypted_value, name)


def test_credential(credential_type: str, config: Dict[str, Any], secret: str) -> Dict[str, Any]:
    """Test a credential connection"""
    return SecretsManager.test_connection(credential_type, config, secret)
