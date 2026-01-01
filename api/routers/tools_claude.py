"""
Claude AI Integration for KMS Tools
This module provides actual Claude API integration when API key is configured
Includes WikiSys rules auto-loading for consistent development practices
"""

import os
from pathlib import Path
from typing import Optional, TYPE_CHECKING
import logging

logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    import anthropic

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False
    anthropic = None  # type: ignore

# WikiSys rules locations
WIKISYS_PATHS = [
    "/opt/kms/WikiSys",
    "/opt/kms-tools/WikiSys",
    Path.home() / ".wikisys-local",
    Path.home() / ".wikisys"
]


def get_claude_client(api_key: Optional[str] = None) -> Optional[object]:
    """Get Claude API client if API key is configured

    Args:
        api_key: API key from request (optional). If not provided, falls back to ANTHROPIC_API_KEY env var.
    """
    # Use provided API key or fall back to environment variable
    if not api_key:
        api_key = os.environ.get("ANTHROPIC_API_KEY")

    if not api_key:
        return None

    if not ANTHROPIC_AVAILABLE:
        return None

    return anthropic.Anthropic(api_key=api_key)


def load_wikisys_rules() -> str:
    """
    Load WikiSys rules for inclusion in Claude context
    Returns formatted rules text for AI assistant guidance
    """
    rules_content = []

    # Priority rules files to load
    priority_files = [
        "rules/coding-standards.md",
        "rules/project-structure.md",
        "rules/git-workflow.md",
        "rules/documentation.md",
        "rules/security.md",
        "RULES.md",
        "standards.md"
    ]

    for wikisys_path in WIKISYS_PATHS:
        base_path = Path(wikisys_path)
        if not base_path.exists():
            continue

        logger.debug(f"Loading WikiSys rules from: {base_path}")

        # Load priority files first
        for rule_file in priority_files:
            file_path = base_path / rule_file
            if file_path.exists():
                try:
                    content = file_path.read_text(encoding='utf-8', errors='ignore')
                    if len(content) > 100:  # Only include non-trivial files
                        rules_content.append(f"### WikiSys Rule: {rule_file}\n{content[:3000]}")  # Limit size
                        logger.debug(f"  Loaded: {rule_file}")
                except Exception as e:
                    logger.warning(f"  Failed to load {rule_file}: {e}")

        # Also check for any .md files in rules directory
        rules_dir = base_path / "rules"
        if rules_dir.exists():
            for md_file in rules_dir.glob("*.md"):
                if md_file.name not in [Path(f).name for f in priority_files]:
                    try:
                        content = md_file.read_text(encoding='utf-8', errors='ignore')
                        if len(content) > 100:
                            rules_content.append(f"### WikiSys Rule: {md_file.name}\n{content[:2000]}")
                    except Exception:
                        pass

        # Stop after finding first valid WikiSys location
        if rules_content:
            break

    if rules_content:
        return "\n\n---\n\n".join(rules_content)
    return ""


def load_project_context(project_path: str, max_files: int = 20) -> str:
    """Load project files for context"""
    context_parts = []
    project_dir = Path(project_path)

    if not project_dir.exists():
        return ""

    # File patterns to include
    patterns = ['*.py', '*.js', '*.md', '*.txt', '*.json', '*.yaml', '*.yml']

    files_loaded = 0
    for pattern in patterns:
        for file_path in project_dir.rglob(pattern):
            if files_loaded >= max_files:
                break

            try:
                # Skip large files
                if file_path.stat().st_size > 50000:  # 50KB limit
                    continue

                rel_path = file_path.relative_to(project_dir)
                content = file_path.read_text(encoding='utf-8', errors='ignore')

                context_parts.append(f"File: {rel_path}\n```\n{content}\n```\n")
                files_loaded += 1

            except Exception as e:
                continue

    return "\n\n".join(context_parts)


async def chat_with_claude(
    project_name: str,
    project_path: str,
    user_message: str,
    include_context: bool = True,
    api_key: Optional[str] = None
) -> tuple[str, int]:
    """
    Chat with Claude AI with project context

    Args:
        project_name: Name of the project
        project_path: Path to the project directory
        user_message: User's message
        include_context: Whether to include project context
        api_key: API key from frontend (optional, falls back to env var)

    Returns:
        (response_text, context_files_count)
    """
    client = get_claude_client(api_key)

    if not client:
        return (
            "⚠️ Claude AI není nakonfigurován. Nastavte API klíč.\n\n"
            "Jak nastavit Claude API:\n"
            "1. Získejte API klíč z https://console.anthropic.com/\n"
            "2. V KMS: Klikněte na ikonu uživatele (vpravo nahoře) → Settings → AI Agents → Claude\n"
            "3. Vložte API klíč do pole \"API Key\"\n"
            "4. Zaškrtněte \"Enabled\"\n"
            "5. Klikněte na \"Save Changes\"\n\n"
            "Po uložení můžete znovu použít Claude AI.",
            0
        )

    # Build context
    context = ""
    context_files_count = 0
    wikisys_rules = ""

    if include_context:
        context = load_project_context(project_path)
        context_files_count = context.count("File:")

        # Load WikiSys rules for guidance
        wikisys_rules = load_wikisys_rules()
        if wikisys_rules:
            logger.info(f"Loaded WikiSys rules ({len(wikisys_rules)} chars)")

    # Build system prompt with WikiSys rules
    system_prompt = f"""You are a helpful AI assistant integrated into a Knowledge Management System (KMS) developed by IT-Enterprise Solutions.

You are currently helping with project: "{project_name}"
Project location: {project_path}

You have access to the project's code and documentation files.
Help the user with code review, debugging, documentation, and development tasks.

IMPORTANT: Follow the WikiSys coding standards and best practices defined below.
Be concise and practical. Provide code examples when relevant.
Always consider security, maintainability, and performance.

{f'=== WIKISYS DEVELOPMENT RULES ===' if wikisys_rules else ''}
{wikisys_rules if wikisys_rules else ''}
{'=== END WIKISYS RULES ===' if wikisys_rules else ''}"""

    # Build user message with context
    full_message = user_message
    if context:
        full_message = f"""Here is the current project context:

{context}

---

User question: {user_message}"""

    try:
        # Call Claude API
        message = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=4096,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": full_message
                }
            ]
        )

        response_text = message.content[0].text
        return (response_text, context_files_count)

    except Exception as e:
        error_message = f"❌ Error communicating with Claude API: {str(e)}\n\n"
        error_message += "Please check:\n"
        error_message += "- API key is valid\n"
        error_message += "- You have API credits\n"
        error_message += "- Network connection is working"

        return (error_message, 0)
