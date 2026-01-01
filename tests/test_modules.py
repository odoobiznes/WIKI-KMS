"""
KMS Module Tests
Unit tests for frontend JavaScript modules (using mock testing approach)
"""

import pytest
import json
from pathlib import Path

# Paths to module files
MODULES_DIR = Path(__file__).parent.parent / "frontend" / "public" / "js" / "modules"
JS_DIR = Path(__file__).parent.parent / "frontend" / "public" / "js"


class TestModuleFiles:
    """Test that all module files exist and are valid"""
    
    def test_app_modules_exists(self):
        """Test app-modules.js exists"""
        assert (JS_DIR / "app-modules.js").exists()
    
    def test_develop_module_exists(self):
        """Test module-develop.js exists"""
        assert (MODULES_DIR / "module-develop.js").exists()
    
    def test_tasks_module_exists(self):
        """Test module-tasks.js exists"""
        assert (MODULES_DIR / "module-tasks.js").exists()
    
    def test_deploy_module_exists(self):
        """Test module-deploy.js exists"""
        assert (MODULES_DIR / "module-deploy.js").exists()
    
    def test_ideas_module_exists(self):
        """Test module-ideas.js exists"""
        assert (MODULES_DIR / "module-ideas.js").exists()
    
    def test_analytics_module_exists(self):
        """Test module-analytics.js exists"""
        assert (MODULES_DIR / "module-analytics.js").exists()
    
    def test_clients_module_exists(self):
        """Test module-clients.js exists"""
        assert (MODULES_DIR / "module-clients.js").exists()
    
    def test_finance_module_exists(self):
        """Test module-finance.js exists"""
        assert (MODULES_DIR / "module-finance.js").exists()


class TestComponentFiles:
    """Test that all component files exist"""
    
    def test_components_shared_exists(self):
        """Test components-shared.js exists"""
        assert (JS_DIR / "components-shared.js").exists()
    
    def test_app_local_tools_exists(self):
        """Test app-local-tools.js exists"""
        assert (JS_DIR / "app-local-tools.js").exists()


class TestModuleContent:
    """Test module file content structure"""
    
    def test_develop_module_has_init(self):
        """Test DevelopModule has init function"""
        content = (MODULES_DIR / "module-develop.js").read_text()
        assert "DevelopModule" in content
        assert "init()" in content or "init:" in content
    
    def test_tasks_module_has_init(self):
        """Test TasksModule has init function"""
        content = (MODULES_DIR / "module-tasks.js").read_text()
        assert "TasksModule" in content
        assert "init()" in content or "init:" in content
    
    def test_module_router_has_modules(self):
        """Test ModuleRouter has all modules defined"""
        content = (JS_DIR / "app-modules.js").read_text()
        assert "ModuleRouter" in content
        assert "ideas" in content
        assert "develop" in content
        assert "deploy" in content
        assert "tasks" in content
        assert "analytics" in content
        assert "clients" in content
        assert "finance" in content


class TestWikiSysRules:
    """Test WikiSys rules files"""
    
    WIKISYS_DIR = Path(__file__).parent.parent / "WikiSys"
    
    def test_rules_directory_exists(self):
        """Test WikiSys rules directory exists"""
        assert (self.WIKISYS_DIR / "rules").exists()
    
    def test_coding_standards_exists(self):
        """Test coding-standards.md exists"""
        assert (self.WIKISYS_DIR / "rules" / "coding-standards.md").exists()
    
    def test_git_workflow_exists(self):
        """Test git-workflow.md exists"""
        assert (self.WIKISYS_DIR / "rules" / "git-workflow.md").exists()
    
    def test_security_rules_exists(self):
        """Test security.md exists"""
        assert (self.WIKISYS_DIR / "rules" / "security.md").exists()
    
    def test_main_rules_file_exists(self):
        """Test RULES.md exists"""
        assert (self.WIKISYS_DIR / "RULES.md").exists()


class TestDocumentation:
    """Test documentation files"""
    
    DOCS_DIR = Path(__file__).parent.parent / "docs"
    
    def test_api_docs_exists(self):
        """Test API.md exists"""
        assert (self.DOCS_DIR / "API.md").exists()
    
    def test_user_guide_exists(self):
        """Test USER_GUIDE.md exists"""
        assert (self.DOCS_DIR / "USER_GUIDE.md").exists()


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])

