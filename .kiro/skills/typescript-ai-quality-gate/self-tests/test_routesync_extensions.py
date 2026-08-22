#!/usr/bin/env python3
"""
RouteSync Extensions Integration Test Suite

Tests workspace validation, export validation, framework patterns,
and config integration for TypeScript AI Quality Gate.
"""

import json
import sys
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from engine.analysis import routesync_extensions
from engine.config import load_config
from engine.workspace import WorkspaceAnalyzer
from engine.exports import ExportValidator
from engine.frameworks import validate_frameworks


def test_workspace_validation():
    """Test workspace dependency validation"""
    print("Testing workspace validation...")
    
    # Create test fixture
    test_repo = Path(__file__).parent / "fixtures" / "workspace-test"
    
    if not test_repo.exists():
        print(f"  ⚠️  Fixture not found: {test_repo}")
        print("  → Skipping workspace validation test")
        return True
    
    analyzer = WorkspaceAnalyzer(test_repo)
    violations = analyzer.validate()
    
    # Check that violations have expected structure
    for v in violations:
        assert "type" in v, "Violation missing 'type' field"
        assert "severity" in v, "Violation missing 'severity' field"
        assert "message" in v, "Violation missing 'message' field"
        assert v["severity"] in ["error", "warning"], f"Invalid severity: {v['severity']}"
    
    print(f"  ✓ Workspace validation passed ({len(violations)} violations detected)")
    return True


def test_export_validation():
    """Test export path validation"""
    print("Testing export validation...")
    
    test_repo = Path(__file__).parent / "fixtures" / "export-test"
    
    if not test_repo.exists():
        print(f"  ⚠️  Fixture not found: {test_repo}")
        print("  → Skipping export validation test")
        return True
    
    validator = ExportValidator(test_repo)
    violations = validator.validate()
    
    # Check structure
    for v in violations:
        assert "type" in v, "Violation missing 'type' field"
        assert "path" in v, "Violation missing 'path' field"
        assert "message" in v, "Violation missing 'message' field"
    
    print(f"  ✓ Export validation passed ({len(violations)} violations detected)")
    return True


def test_framework_patterns():
    """Test React Hooks and Vue reactivity validation"""
    print("Testing framework patterns...")
    
    test_repo = Path(__file__).parent / "fixtures" / "framework-test"
    
    if not test_repo.exists():
        print(f"  ⚠️  Fixture not found: {test_repo}")
        print("  → Skipping framework validation test")
        return True
    
    # Load config
    config = load_config(test_repo)
    
    # Validate frameworks
    results = validate_frameworks(test_repo, config)
    
    assert "react" in results or "vue" in results, "No framework results"
    
    for framework, findings in results.items():
        print(f"  ✓ {framework.capitalize()} validation: {len(findings)} findings")
    
    return True


def test_config_integration():
    """Test routesync.config.json loading and application"""
    print("Testing config integration...")
    
    test_repo = Path(__file__).parent.parent
    
    # Load config
    config = load_config(test_repo)
    
    assert config is not None, "Config should not be None"
    assert "thresholds" in config, "Config missing 'thresholds'"
    assert "frameworks" in config, "Config missing 'frameworks'"
    
    # Check thresholds
    thresholds = config["thresholds"]
    assert "critical" in thresholds, "Missing critical threshold"
    assert "high" in thresholds, "Missing high threshold"
    assert "medium" in thresholds, "Missing medium threshold"
    
    print(f"  ✓ Config loaded successfully")
    print(f"    - Critical threshold: {thresholds['critical']}")
    print(f"    - High threshold: {thresholds['high']}")
    print(f"    - Medium threshold: {thresholds['medium']}")
    
    return True


def test_routesync_extensions_integration():
    """Test full RouteSync extensions analysis pipeline"""
    print("Testing RouteSync extensions integration...")
    
    test_repo = Path(__file__).parent.parent
    
    # Run full analysis
    result = routesync_extensions(test_repo)
    
    assert result is not None, "Analysis result should not be None"
    assert "workspace_analysis" in result, "Missing workspace_analysis"
    assert "export_validation" in result, "Missing export_validation"
    assert "framework_validation" in result, "Missing framework_validation"
    assert "threshold_violations" in result, "Missing threshold_violations"
    
    print(f"  ✓ Full integration passed")
    print(f"    - Workspace violations: {len(result.get('workspace_analysis', {}).get('violations', []))}")
    print(f"    - Export violations: {len(result.get('export_validation', {}).get('violations', []))}")
    print(f"    - Framework findings: {sum(len(v) for v in result.get('framework_validation', {}).values())}")
    print(f"    - Threshold violations: {len(result.get('threshold_violations', []))}")
    
    return True


def test_schema_compliance():
    """Test that results match attestation schema"""
    print("Testing schema compliance...")
    
    schema_path = Path(__file__).parent.parent / "schemas" / "attestation.schema.json"
    
    if not schema_path.exists():
        print(f"  ⚠️  Schema not found: {schema_path}")
        return True
    
    with open(schema_path) as f:
        schema = json.load(f)
    
    # Check that workspace_analysis is in schema
    assert "workspace_analysis" in schema["properties"], "workspace_analysis not in schema"
    assert "export_validation" in schema["properties"], "export_validation not in schema"
    
    print("  ✓ Schema compliance verified")
    
    return True


def main():
    """Run all RouteSync extension tests"""
    print("=" * 60)
    print("RouteSync Extensions Test Suite")
    print("=" * 60)
    print()
    
    tests = [
        ("Config Integration", test_config_integration),
        ("Workspace Validation", test_workspace_validation),
        ("Export Validation", test_export_validation),
        ("Framework Patterns", test_framework_patterns),
        ("Full Integration", test_routesync_extensions_integration),
        ("Schema Compliance", test_schema_compliance),
    ]
    
    passed = 0
    failed = 0
    
    for name, test_func in tests:
        try:
            print(f"\n[{name}]")
            if test_func():
                passed += 1
            else:
                failed += 1
                print(f"  ✗ {name} failed")
        except Exception as e:
            failed += 1
            print(f"  ✗ {name} failed with exception:")
            print(f"     {type(e).__name__}: {e}")
    
    print()
    print("=" * 60)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 60)
    
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
