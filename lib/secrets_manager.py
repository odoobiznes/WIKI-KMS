#!/usr/bin/env python3
"""
WikiSys Secrets Manager
Manages encrypted credentials using age encryption
"""

import os
import subprocess
import json
from pathlib import Path
from typing import Optional, Dict, Any

class SecretsManager:
    """Manage encrypted secrets using age encryption"""

    def __init__(self):
        self.age_key = Path.home() / ".wikisys-age-key.txt"
        self.secrets_dir = Path.home() / ".wikisys-secrets"
        self.categories = ["api-tokens", "passwords", "ssh-keys", "restore-codes", "config"]

        # Ensure directories exist
        for category in self.categories:
            (self.secrets_dir / category).mkdir(parents=True, exist_ok=True)

        # Verify age key exists
        if not self.age_key.exists():
            raise FileNotFoundError(
                f"Age key not found at {self.age_key}. "
                f"Generate with: age-keygen -o {self.age_key}"
            )

    def encrypt(self, plaintext: str, name: str, category: str = "passwords") -> Path:
        """
        Encrypt plaintext and save to secrets directory

        Args:
            plaintext: The secret value to encrypt
            name: Name of the secret (e.g., 'database-password')
            category: Category folder (api-tokens, passwords, etc.)

        Returns:
            Path to encrypted file
        """
        if category not in self.categories:
            raise ValueError(f"Invalid category. Must be one of: {self.categories}")

        output_file = self.secrets_dir / category / f"{name}.age"

        # Encrypt using age
        cmd = ["age", "-e", "-i", str(self.age_key), "-o", str(output_file)]
        result = subprocess.run(
            cmd,
            input=plaintext.encode(),
            capture_output=True,
            check=True
        )

        # Set permissions
        output_file.chmod(0o600)

        return output_file

    def decrypt(self, name: str, category: str = "passwords") -> str:
        """
        Decrypt secret and return plaintext

        Args:
            name: Name of the secret
            category: Category folder

        Returns:
            Decrypted secret as string
        """
        secret_file = self.secrets_dir / category / f"{name}.age"

        if not secret_file.exists():
            raise FileNotFoundError(f"Secret not found: {secret_file}")

        # Decrypt using age
        cmd = ["age", "-d", "-i", str(self.age_key), str(secret_file)]
        result = subprocess.run(cmd, capture_output=True, check=True, text=True)

        return result.stdout.strip()

    def list_secrets(self, category: Optional[str] = None) -> Dict[str, list]:
        """
        List all secrets, optionally filtered by category

        Returns:
            Dictionary with category as key, list of secret names as value
        """
        secrets = {}

        categories = [category] if category else self.categories

        for cat in categories:
            cat_dir = self.secrets_dir / cat
            if cat_dir.exists():
                secrets[cat] = [
                    f.stem  # Remove .age extension
                    for f in cat_dir.glob("*.age")
                ]

        return secrets

    def exists(self, name: str, category: str = "passwords") -> bool:
        """Check if secret exists"""
        secret_file = self.secrets_dir / category / f"{name}.age"
        return secret_file.exists()

    def delete(self, name: str, category: str = "passwords") -> bool:
        """
        Securely delete secret

        Returns:
            True if deleted, False if not found
        """
        secret_file = self.secrets_dir / category / f"{name}.age"

        if not secret_file.exists():
            return False

        # Secure delete using shred (if available)
        if subprocess.run(["which", "shred"], capture_output=True).returncode == 0:
            subprocess.run(["shred", "-u", str(secret_file)], check=True)
        else:
            secret_file.unlink()

        return True

    def encrypt_file(self, input_file: Path, name: str, category: str = "config") -> Path:
        """
        Encrypt entire file

        Args:
            input_file: Path to file to encrypt
            name: Name for encrypted secret
            category: Category folder

        Returns:
            Path to encrypted file
        """
        if not input_file.exists():
            raise FileNotFoundError(f"Input file not found: {input_file}")

        output_file = self.secrets_dir / category / f"{name}.age"

        # Encrypt file
        cmd = ["age", "-e", "-i", str(self.age_key), "-o", str(output_file), str(input_file)]
        subprocess.run(cmd, check=True)

        output_file.chmod(0o600)

        return output_file

    def decrypt_to_file(self, name: str, output_file: Path, category: str = "config") -> Path:
        """
        Decrypt secret to file

        Args:
            name: Name of secret
            output_file: Where to save decrypted content
            category: Category folder

        Returns:
            Path to output file
        """
        secret_file = self.secrets_dir / category / f"{name}.age"

        if not secret_file.exists():
            raise FileNotFoundError(f"Secret not found: {secret_file}")

        # Decrypt to file
        cmd = ["age", "-d", "-i", str(self.age_key), "-o", str(output_file), str(secret_file)]
        subprocess.run(cmd, check=True)

        return output_file

    def encrypt_json(self, data: Dict[Any, Any], name: str, category: str = "config") -> Path:
        """
        Encrypt JSON data

        Args:
            data: Dictionary to encrypt
            name: Name for secret
            category: Category folder

        Returns:
            Path to encrypted file
        """
        json_str = json.dumps(data, indent=2)
        return self.encrypt(json_str, name, category)

    def decrypt_json(self, name: str, category: str = "config") -> Dict[Any, Any]:
        """
        Decrypt JSON data

        Args:
            name: Name of secret
            category: Category folder

        Returns:
            Decrypted dictionary
        """
        json_str = self.decrypt(name, category)
        return json.loads(json_str)


def main():
    """CLI interface for secrets manager"""
    import sys
    import argparse

    parser = argparse.ArgumentParser(description="WikiSys Secrets Manager")
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Encrypt command
    encrypt_parser = subparsers.add_parser("encrypt", help="Encrypt a secret")
    encrypt_parser.add_argument("name", help="Secret name")
    encrypt_parser.add_argument("--category", default="passwords", help="Category")
    encrypt_parser.add_argument("--value", help="Secret value (or use stdin)")
    encrypt_parser.add_argument("--file", help="Encrypt file instead of value")

    # Decrypt command
    decrypt_parser = subparsers.add_parser("decrypt", help="Decrypt a secret")
    decrypt_parser.add_argument("name", help="Secret name")
    decrypt_parser.add_argument("--category", default="passwords", help="Category")

    # List command
    list_parser = subparsers.add_parser("list", help="List secrets")
    list_parser.add_argument("--category", help="Filter by category")

    # Delete command
    delete_parser = subparsers.add_parser("delete", help="Delete a secret")
    delete_parser.add_argument("name", help="Secret name")
    delete_parser.add_argument("--category", default="passwords", help="Category")

    args = parser.parse_args()

    try:
        sm = SecretsManager()

        if args.command == "encrypt":
            if args.file:
                output = sm.encrypt_file(Path(args.file), args.name, args.category)
                print(f"✓ Encrypted file: {output}")
            else:
                value = args.value if args.value else sys.stdin.read().strip()
                output = sm.encrypt(value, args.name, args.category)
                print(f"✓ Encrypted: {output}")

        elif args.command == "decrypt":
            value = sm.decrypt(args.name, args.category)
            print(value)

        elif args.command == "list":
            secrets = sm.list_secrets(args.category)
            for category, names in secrets.items():
                if names:
                    print(f"\n{category}:")
                    for name in names:
                        print(f"  - {name}")

        elif args.command == "delete":
            if sm.delete(args.name, args.category):
                print(f"✓ Deleted: {args.name}")
            else:
                print(f"✗ Not found: {args.name}")
                sys.exit(1)

        else:
            parser.print_help()
            sys.exit(1)

    except Exception as e:
        print(f"✗ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
