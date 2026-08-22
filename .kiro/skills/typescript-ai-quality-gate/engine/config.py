"""
config.py - RouteSync Configuration Loader

Membaca routesync.config.json dan menyediakan akses ke thresholds,
budgets, blocking rules, dan extension settings.
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from dataclasses import dataclass


@dataclass
class QualityThresholds:
    """Quality score thresholds dari config"""
    minimum_score: int
    pass_score: int
    complexity_max: int
    file_length_max: int
    function_length_max: int


@dataclass
class MonorepoConfig:
    """Monorepo workspace configuration"""
    enabled: bool
    workspace_pattern: str
    enforce_dependency_direction: bool
    allowed_dependencies: Dict[str, List[str]]
    block_on_circular: bool


@dataclass
class FrameworkConfig:
    """Framework-specific configuration"""
    enabled: bool
    package_path: str
    strict_rules: bool
    peer_dependencies: Dict[str, str]


@dataclass
class BundleSizeConfig:
    """Bundle size budgets"""
    enabled: bool
    measure_gzip: bool
    budgets: Dict[str, str]  # package name -> size limit
    severity_on_exceed: str
    check_tree_shaking: bool


@dataclass
class SecurityConfig:
    """Security audit configuration"""
    npm_audit: bool
    block_on_high_severity: bool
    block_on_critical_severity: bool
    allowed_licenses: List[str]
    check_peer_dependencies: bool


@dataclass
class DocumentationConfig:
    """Documentation requirements"""
    tsdoc_coverage: bool
    public_api_must_document: bool
    check_readme_consistency: bool
    validate_examples: bool
    severity: str


class RouteSyncConfig:
    """
    Main configuration loader for RouteSync Quality Gate.
    
    Reads routesync.config.json and provides typed access to all settings.
    """
    
    def __init__(self, config_path: Optional[Path] = None):
        self.config_path = config_path
        self.raw_config: Dict[str, Any] = {}
        self._loaded = False
        
        if config_path and config_path.exists():
            self.load()
    
    def load(self) -> bool:
        """Load config from file"""
        if not self.config_path or not self.config_path.exists():
            return False
        
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                self.raw_config = json.load(f)
            self._loaded = True
            return True
        except Exception as e:
            print(f"⚠️ Failed to load config: {e}")
            return False
    
    @property
    def is_loaded(self) -> bool:
        """Check if config was loaded successfully"""
        return self._loaded
    
    def get_quality_thresholds(self) -> QualityThresholds:
        """Get quality score thresholds"""
        thresholds = self.raw_config.get('quality_thresholds', {})
        return QualityThresholds(
            minimum_score=thresholds.get('minimum_score', 70),
            pass_score=thresholds.get('pass_score', 90),
            complexity_max=thresholds.get('complexity_max', 20),
            file_length_max=thresholds.get('file_length_max', 500),
            function_length_max=thresholds.get('function_length_max', 50)
        )
    
    def get_monorepo_config(self) -> Optional[MonorepoConfig]:
        """Get monorepo workspace configuration"""
        ext = self.raw_config.get('extensions', {}).get('monorepo', {})
        if not ext.get('enabled', False):
            return None
        
        return MonorepoConfig(
            enabled=True,
            workspace_pattern=ext.get('workspace_pattern', 'packages/*'),
            enforce_dependency_direction=ext.get('enforce_dependency_direction', True),
            allowed_dependencies=ext.get('allowed_dependencies', {}),
            block_on_circular=ext.get('block_on_circular', True)
        )
    
    def get_react_config(self) -> Optional[FrameworkConfig]:
        """Get React framework configuration"""
        react = self.raw_config.get('extensions', {}).get('frameworks', {}).get('react', {})
        if not react.get('enabled', False):
            return None
        
        return FrameworkConfig(
            enabled=True,
            package_path=react.get('package_path', 'packages/react'),
            strict_rules=react.get('strict_hooks_rules', True),
            peer_dependencies=react.get('peer_dependencies', {})
        )
    
    def get_vue_config(self) -> Optional[FrameworkConfig]:
        """Get Vue framework configuration"""
        vue = self.raw_config.get('extensions', {}).get('frameworks', {}).get('vue', {})
        if not vue.get('enabled', False):
            return None
        
        return FrameworkConfig(
            enabled=True,
            package_path=vue.get('package_path', 'packages/vue'),
            strict_rules=vue.get('strict_reactivity', True),
            peer_dependencies=vue.get('peer_dependencies', {})
        )
    
    def get_bundle_size_config(self) -> Optional[BundleSizeConfig]:
        """Get bundle size budget configuration"""
        bundle = self.raw_config.get('extensions', {}).get('bundle_size', {})
        if not bundle.get('enabled', False):
            return None
        
        return BundleSizeConfig(
            enabled=True,
            measure_gzip=bundle.get('measure_gzip', True),
            budgets=bundle.get('budgets', {}),
            severity_on_exceed=bundle.get('severity_on_exceed', 'warning'),
            check_tree_shaking=bundle.get('check_tree_shaking', True)
        )
    
    def get_security_config(self) -> SecurityConfig:
        """Get security audit configuration"""
        security = self.raw_config.get('extensions', {}).get('security', {})
        return SecurityConfig(
            npm_audit=security.get('npm_audit', True),
            block_on_high_severity=security.get('block_on_high_severity', True),
            block_on_critical_severity=security.get('block_on_critical_severity', True),
            allowed_licenses=security.get('allowed_licenses', ['MIT', 'Apache-2.0', 'ISC']),
            check_peer_dependencies=security.get('check_peer_dependencies', True)
        )
    
    def get_documentation_config(self) -> DocumentationConfig:
        """Get documentation requirements"""
        docs = self.raw_config.get('extensions', {}).get('documentation', {})
        return DocumentationConfig(
            tsdoc_coverage=docs.get('tsdoc_coverage', True),
            public_api_must_document=docs.get('public_api_must_document', True),
            check_readme_consistency=docs.get('check_readme_consistency', True),
            validate_examples=docs.get('validate_examples', False),
            severity=docs.get('severity', 'high')
        )
    
    def get_blocking_rules(self) -> List[str]:
        """Get list of rules that block quality gate"""
        return self.raw_config.get('blocking_rules', [])
    
    def get_warning_rules(self) -> List[str]:
        """Get list of rules that produce warnings"""
        return self.raw_config.get('warning_rules', [])
    
    def is_file_excluded(self, file_path: str) -> bool:
        """Check if file should be excluded from strict checks"""
        excludes = self.raw_config.get('exclude_from_strict_checks', [])
        
        # Simple glob matching
        from fnmatch import fnmatch
        for pattern in excludes:
            if fnmatch(file_path, pattern):
                return True
        return False
    
    def is_generated_file(self, file_path: str, content: str) -> bool:
        """Check if file is generated based on markers"""
        gen_config = self.raw_config.get('extensions', {}).get('generated_code', {})
        if not gen_config.get('enabled', False):
            return False
        
        markers = gen_config.get('markers', [])
        # Check first 10 lines for markers
        lines = content.split('\n')[:10]
        for line in lines:
            for marker in markers:
                if marker in line:
                    return True
        return False
    
    def should_relax_for_generated(self, rule_id: str) -> bool:
        """Check if rule should be relaxed for generated code"""
        relaxed = self.raw_config.get('relaxed_rules_for_generated', {})
        disabled = relaxed.get('disable', [])
        return rule_id in disabled
    
    def is_cli_validation_enabled(self) -> bool:
        """Check if CLI validation is enabled"""
        cli = self.raw_config.get('extensions', {}).get('cli', {})
        return cli.get('enabled', False)
    
    def get_cli_shebang(self) -> str:
        """Get required shebang for CLI scripts"""
        cli = self.raw_config.get('extensions', {}).get('cli', {})
        return cli.get('required_shebang', '#!/usr/bin/env node')
    
    def is_turbo_enabled(self) -> bool:
        """Check if Turbo validation is enabled"""
        turbo = self.raw_config.get('extensions', {}).get('build_tools', {}).get('turbo', {})
        return turbo.get('enabled', False)
    
    def is_tsup_enabled(self) -> bool:
        """Check if tsup validation is enabled"""
        tsup = self.raw_config.get('extensions', {}).get('build_tools', {}).get('tsup', {})
        return tsup.get('enabled', False)


def load_config(project_root: Path) -> RouteSyncConfig:
    """
    Load RouteSync configuration from project root.
    
    Args:
        project_root: Root directory of the project
        
    Returns:
        RouteSyncConfig instance (may not be loaded if file missing)
    """
    config_path = project_root / 'routesync.config.json'
    config = RouteSyncConfig(config_path)
    
    if not config.is_loaded:
        # Try alternative locations
        alt_path = project_root / '.kiro' / 'skills' / 'typescript-ai-quality-gate' / 'routesync.config.json'
        if alt_path.exists():
            config = RouteSyncConfig(alt_path)
            config.load()
    
    return config
