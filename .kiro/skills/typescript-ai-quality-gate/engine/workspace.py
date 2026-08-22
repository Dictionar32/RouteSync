#!/usr/bin/env python3
"""
WorkspaceAnalyzer - Monorepo workspace dependency validation
Part of RouteSync Extensions for typescript-ai-quality-gate
"""

import json
from pathlib import Path
from typing import Dict, List, Set, Optional, Tuple
from dataclasses import dataclass

@dataclass
class WorkspacePackage:
    """Represents a package in the monorepo workspace"""
    name: str
    path: Path
    version: str
    dependencies: Dict[str, str]
    dev_dependencies: Dict[str, str]
    workspace_dependencies: Set[str]
    
class WorkspaceAnalyzer:
    """
    Validates workspace dependencies in monorepo structures.
    Detects circular dependencies, invalid dependency directions,
    and missing workspace protocol declarations.
    """
    
    def __init__(self, project_root: Path):
        self.project_root = Path(project_root)
        self.packages: Dict[str, WorkspacePackage] = {}
        self.workspace_config = self._load_workspace_config()
        
    def _load_workspace_config(self) -> Optional[Dict]:
        """Load workspace configuration from package.json or pnpm-workspace.yaml"""
        # Check package.json for workspaces
        pkg_json = self.project_root / "package.json"
        if pkg_json.exists():
            with open(pkg_json) as f:
                data = json.load(f)
                if "workspaces" in data:
                    return {"type": "npm", "patterns": data["workspaces"]}
        
        # Check pnpm-workspace.yaml
        pnpm_workspace = self.project_root / "pnpm-workspace.yaml"
        if pnpm_workspace.exists():
            # Simple YAML parsing for packages list
            content = pnpm_workspace.read_text()
            if "packages:" in content:
                return {"type": "pnpm", "content": content}
        
        # Check lerna.json
        lerna_json = self.project_root / "lerna.json"
        if lerna_json.exists():
            with open(lerna_json) as f:
                data = json.load(f)
                return {"type": "lerna", "packages": data.get("packages", [])}
        
        return None
    
    def discover_packages(self) -> None:
        """Discover all packages in the workspace"""
        if not self.workspace_config:
            return
        
        # Common workspace patterns
        search_patterns = ["packages/*", "apps/*", "libs/*"]
        
        if self.workspace_config["type"] == "npm":
            search_patterns = self.workspace_config["patterns"]
        elif self.workspace_config["type"] == "lerna":
            search_patterns = self.workspace_config["packages"]
        
        for pattern in search_patterns:
            if isinstance(pattern, str):
                # Simple glob matching
                base_path = self.project_root / pattern.split("/*")[0]
                if base_path.exists() and base_path.is_dir():
                    for pkg_dir in base_path.iterdir():
                        if pkg_dir.is_dir():
                            pkg_json = pkg_dir / "package.json"
                            if pkg_json.exists():
                                self._load_package(pkg_json)
    
    def _load_package(self, pkg_json_path: Path) -> None:
        """Load a single package from package.json"""
        try:
            with open(pkg_json_path) as f:
                data = json.load(f)
            
            name = data.get("name", "")
            if not name:
                return
            
            dependencies = data.get("dependencies", {})
            dev_dependencies = data.get("devDependencies", {})
            
            # Identify workspace dependencies
            workspace_deps = set()
            for dep_name in list(dependencies.keys()) + list(dev_dependencies.keys()):
                dep_version = dependencies.get(dep_name) or dev_dependencies.get(dep_name)
                if dep_version and ("workspace:" in dep_version or dep_name.startswith("@")):
                    workspace_deps.add(dep_name)
            
            package = WorkspacePackage(
                name=name,
                path=pkg_json_path.parent,
                version=data.get("version", "0.0.0"),
                dependencies=dependencies,
                dev_dependencies=dev_dependencies,
                workspace_dependencies=workspace_deps
            )
            
            self.packages[name] = package
        except Exception as e:
            print(f"Warning: Failed to load package {pkg_json_path}: {e}")
    
    def detect_circular_dependencies(self) -> List[Dict]:
        """Detect circular dependencies between workspace packages"""
        violations = []
        visited = set()
        rec_stack = set()
        
        def dfs(pkg_name: str, path: List[str]) -> None:
            if pkg_name not in self.packages:
                return
            
            visited.add(pkg_name)
            rec_stack.add(pkg_name)
            path.append(pkg_name)
            
            pkg = self.packages[pkg_name]
            for dep in pkg.workspace_dependencies:
                if dep not in visited:
                    dfs(dep, path[:])
                elif dep in rec_stack:
                    # Circular dependency found
                    cycle_start = path.index(dep)
                    cycle = path[cycle_start:] + [dep]
                    violations.append({
                        "rule": "circular-workspace-dependency",
                        "severity": "error",
                        "message": f"Circular dependency detected: {' -> '.join(cycle)}",
                        "cycle": cycle,
                        "affected_packages": cycle
                    })
            
            path.pop()
            rec_stack.remove(pkg_name)
        
        for pkg_name in self.packages:
            if pkg_name not in visited:
                dfs(pkg_name, [])
        
        return violations
    
    def validate_dependency_direction(self) -> List[Dict]:
        """
        Validate workspace dependency direction based on common patterns:
        - apps can depend on libs/packages
        - libs/packages should not depend on apps
        - shared/common packages should be leaf dependencies
        """
        violations = []
        
        for pkg_name, pkg in self.packages.items():
            pkg_type = self._infer_package_type(pkg)
            
            for dep_name in pkg.workspace_dependencies:
                if dep_name not in self.packages:
                    continue
                
                dep_pkg = self.packages[dep_name]
                dep_type = self._infer_package_type(dep_pkg)
                
                # Check invalid directions
                if pkg_type == "lib" and dep_type == "app":
                    violations.append({
                        "rule": "invalid-workspace-dependency-direction",
                        "severity": "error",
                        "message": f"Library '{pkg_name}' should not depend on app '{dep_name}'",
                        "source": pkg_name,
                        "target": dep_name,
                        "location": str(pkg.path / "package.json")
                    })
                
                if "common" in pkg_name.lower() or "shared" in pkg_name.lower():
                    if len(dep_pkg.workspace_dependencies) > 0:
                        violations.append({
                            "rule": "invalid-workspace-dependency-direction",
                            "severity": "warning",
                            "message": f"Shared package '{pkg_name}' depends on '{dep_name}' which has dependencies",
                            "source": pkg_name,
                            "target": dep_name,
                            "location": str(pkg.path / "package.json")
                        })
        
        return violations
    
    def _infer_package_type(self, pkg: WorkspacePackage) -> str:
        """Infer package type from path or name"""
        path_str = str(pkg.path).lower()
        name_lower = pkg.name.lower()
        
        if "apps/" in path_str or "app/" in path_str:
            return "app"
        if "libs/" in path_str or "packages/" in path_str or "lib/" in path_str:
            return "lib"
        if "common" in name_lower or "shared" in name_lower or "utils" in name_lower:
            return "shared"
        
        return "unknown"
    
    def validate_workspace_protocol(self) -> List[Dict]:
        """
        Validate that workspace dependencies use proper workspace: protocol
        (for pnpm/yarn 2+/npm 7+)
        """
        violations = []
        
        for pkg_name, pkg in self.packages.items():
            all_deps = {**pkg.dependencies, **pkg.dev_dependencies}
            
            for dep_name, dep_version in all_deps.items():
                if dep_name in self.packages:
                    # This is a workspace dependency
                    if not dep_version.startswith("workspace:"):
                        violations.append({
                            "rule": "missing-workspace-protocol",
                            "severity": "warning",
                            "message": f"Package '{pkg_name}' references workspace package '{dep_name}' without 'workspace:' protocol",
                            "package": pkg_name,
                            "dependency": dep_name,
                            "current_version": dep_version,
                            "suggested_fix": "workspace:*",
                            "location": str(pkg.path / "package.json")
                        })
        
        return violations
    
    def analyze(self) -> Dict:
        """Run all workspace validations and return results"""
        self.discover_packages()
        
        if not self.packages:
            return {
                "workspace_enabled": False,
                "violations": []
            }
        
        violations = []
        violations.extend(self.detect_circular_dependencies())
        violations.extend(self.validate_dependency_direction())
        violations.extend(self.validate_workspace_protocol())
        
        return {
            "workspace_enabled": True,
            "total_packages": len(self.packages),
            "packages": [
                {
                    "name": pkg.name,
                    "path": str(pkg.path.relative_to(self.project_root)),
                    "workspace_dependencies": list(pkg.workspace_dependencies)
                }
                for pkg in self.packages.values()
            ],
            "violations": violations,
            "summary": {
                "circular_dependencies": len([v for v in violations if v["rule"] == "circular-workspace-dependency"]),
                "direction_violations": len([v for v in violations if v["rule"] == "invalid-workspace-dependency-direction"]),
                "protocol_violations": len([v for v in violations if v["rule"] == "missing-workspace-protocol"])
            }
        }


def analyze_workspace(project_root: Path) -> Dict:
    """Public API for workspace analysis"""
    analyzer = WorkspaceAnalyzer(project_root)
    return analyzer.analyze()
