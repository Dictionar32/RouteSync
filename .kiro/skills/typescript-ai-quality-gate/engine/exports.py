#!/usr/bin/env python3
"""
ExportValidator - Validates TypeScript export paths and patterns
Part of RouteSync Extensions for typescript-ai-quality-gate
"""

import re
from pathlib import Path
from typing import Dict, List, Set, Optional
from dataclasses import dataclass

@dataclass
class ExportInfo:
    """Information about an export statement"""
    file: Path
    line: int
    export_type: str  # 'named', 'default', 'namespace', 're-export'
    names: List[str]
    from_path: Optional[str] = None


class ExportValidator:
    """
    Validates TypeScript export patterns and paths.
    Ensures proper barrel file usage, detects export conflicts,
    and validates re-export chains.
    """
    
    def __init__(self, project_root: Path):
        self.project_root = Path(project_root)
        self.exports: Dict[Path, List[ExportInfo]] = {}
        self.barrel_files: Set[Path] = set()
        
    def scan_file(self, file_path: Path) -> List[ExportInfo]:
        """Scan a TypeScript file for export statements"""
        if not file_path.exists():
            return []
        
        exports = []
        try:
            content = file_path.read_text(encoding='utf-8')
            lines = content.split('\n')
            
            for i, line in enumerate(lines, 1):
                line = line.strip()
                
                # Skip comments
                if line.startswith('//') or line.startswith('/*'):
                    continue
                
                # Named exports: export { foo, bar }
                if re.match(r'^export\s+\{', line):
                    names = self._extract_export_names(line)
                    from_path = self._extract_from_path(line)
                    exports.append(ExportInfo(
                        file=file_path,
                        line=i,
                        export_type='re-export' if from_path else 'named',
                        names=names,
                        from_path=from_path
                    ))
                
                # Default export: export default
                elif re.match(r'^export\s+default\s+', line):
                    exports.append(ExportInfo(
                        file=file_path,
                        line=i,
                        export_type='default',
                        names=['default']
                    ))
                
                # Named declarations: export const foo = ...
                elif re.match(r'^export\s+(const|let|var|function|class|interface|type|enum)\s+', line):
                    name = self._extract_declaration_name(line)
                    if name:
                        exports.append(ExportInfo(
                            file=file_path,
                            line=i,
                            export_type='named',
                            names=[name]
                        ))
                
                # Namespace export: export * from './module'
                elif re.match(r'^export\s+\*\s+from\s+', line):
                    from_path = self._extract_from_path(line)
                    exports.append(ExportInfo(
                        file=file_path,
                        line=i,
                        export_type='namespace',
                        names=['*'],
                        from_path=from_path
                    ))
                
                # Named re-export: export { foo } from './module'
                elif 'export' in line and 'from' in line:
                    names = self._extract_export_names(line)
                    from_path = self._extract_from_path(line)
                    exports.append(ExportInfo(
                        file=file_path,
                        line=i,
                        export_type='re-export',
                        names=names,
                        from_path=from_path
                    ))
        
        except Exception as e:
            print(f"Warning: Failed to scan {file_path}: {e}")
        
        self.exports[file_path] = exports
        
        # Detect barrel files (index.ts with mostly re-exports)
        if file_path.name in ['index.ts', 'index.tsx', 'index.js']:
            re_exports = [e for e in exports if e.export_type in ['re-export', 'namespace']]
            if len(re_exports) >= 2:  # At least 2 re-exports
                self.barrel_files.add(file_path)
        
        return exports
    
    def _extract_export_names(self, line: str) -> List[str]:
        """Extract exported names from export statement"""
        # Match: export { foo, bar as baz }
        match = re.search(r'\{([^}]+)\}', line)
        if not match:
            return []
        
        names_str = match.group(1)
        names = []
        for part in names_str.split(','):
            part = part.strip()
            # Handle 'as' aliases
            if ' as ' in part:
                # Use the alias name
                name = part.split(' as ')[-1].strip()
            else:
                name = part.strip()
            if name:
                names.append(name)
        
        return names
    
    def _extract_from_path(self, line: str) -> Optional[str]:
        """Extract the 'from' path from export statement"""
        # Match: from './path' or from "./path"
        match = re.search(r"from\s+['\"]([^'\"]+)['\"]", line)
        if match:
            return match.group(1)
        return None
    
    def _extract_declaration_name(self, line: str) -> Optional[str]:
        """Extract name from export declaration"""
        # Match: export const foo = ...
        patterns = [
            r'export\s+(?:const|let|var)\s+(\w+)',
            r'export\s+function\s+(\w+)',
            r'export\s+class\s+(\w+)',
            r'export\s+interface\s+(\w+)',
            r'export\s+type\s+(\w+)',
            r'export\s+enum\s+(\w+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, line)
            if match:
                return match.group(1)
        
        return None
    
    def validate_barrel_files(self) -> List[Dict]:
        """Validate barrel file patterns"""
        violations = []
        
        for barrel in self.barrel_files:
            exports = self.exports.get(barrel, [])
            
            # Check for deep re-export chains
            re_export_count = len([e for e in exports if e.export_type in ['re-export', 'namespace']])
            
            if re_export_count > 20:
                violations.append({
                    "rule": "excessive-barrel-exports",
                    "severity": "warning",
                    "message": f"Barrel file {barrel.name} has {re_export_count} re-exports (consider splitting)",
                    "file": str(barrel),
                    "count": re_export_count,
                    "suggested_limit": 20
                })
            
            # Check for mixed patterns in barrel
            has_local_exports = any(e.export_type == 'named' and not e.from_path for e in exports)
            has_re_exports = any(e.export_type in ['re-export', 'namespace'] for e in exports)
            
            if has_local_exports and has_re_exports:
                violations.append({
                    "rule": "mixed-barrel-pattern",
                    "severity": "warning",
                    "message": f"Barrel file {barrel.name} mixes local exports with re-exports",
                    "file": str(barrel),
                    "suggestion": "Barrel files should only re-export, move local exports to dedicated files"
                })
        
        return violations
    
    def detect_export_conflicts(self) -> List[Dict]:
        """Detect conflicting export names within the same directory"""
        violations = []
        
        # Group files by directory
        dir_exports: Dict[Path, Dict[str, List[tuple]]] = {}
        
        for file_path, exports in self.exports.items():
            dir_path = file_path.parent
            
            if dir_path not in dir_exports:
                dir_exports[dir_path] = {}
            
            for export in exports:
                for name in export.names:
                    if name == '*':
                        continue
                    
                    if name not in dir_exports[dir_path]:
                        dir_exports[dir_path][name] = []
                    
                    dir_exports[dir_path][name].append((file_path, export.line))
        
        # Check for conflicts
        for dir_path, names in dir_exports.items():
            for name, locations in names.items():
                if len(locations) > 1:
                    # Check if there's a barrel file
                    has_barrel = any(f in self.barrel_files for f, _ in locations)
                    
                    if not has_barrel:
                        violations.append({
                            "rule": "duplicate-export-name",
                            "severity": "warning",
                            "message": f"Export name '{name}' is defined in multiple files in {dir_path.name}",
                            "name": name,
                            "locations": [
                                {"file": str(f), "line": line}
                                for f, line in locations
                            ]
                        })
        
        return violations
    
    def validate_export_paths(self) -> List[Dict]:
        """Validate re-export paths are resolvable"""
        violations = []
        
        for file_path, exports in self.exports.items():
            for export in exports:
                if export.from_path:
                    resolved = self._resolve_import_path(file_path, export.from_path)
                    
                    if resolved and not resolved.exists():
                        violations.append({
                            "rule": "missing-export-path",
                            "severity": "error",
                            "message": f"Cannot resolve re-export path '{export.from_path}'",
                            "file": str(file_path),
                            "line": export.line,
                            "import_path": export.from_path,
                            "resolved_path": str(resolved)
                        })
        
        return violations
    
    def _resolve_import_path(self, from_file: Path, import_path: str) -> Optional[Path]:
        """Resolve relative import path to absolute file path"""
        if import_path.startswith('.'):
            # Relative import
            base_dir = from_file.parent
            resolved = (base_dir / import_path).resolve()
            
            # Try common extensions
            for ext in ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx']:
                candidate = Path(str(resolved) + ext) if not ext.startswith('/') else resolved / ext[1:]
                if candidate.exists():
                    return candidate
            
            return resolved
        
        # Absolute or node_modules import - skip validation
        return None
    
    def analyze(self, files: List[Path]) -> Dict:
        """Analyze export patterns in given files"""
        # Scan all files
        for file in files:
            if file.suffix in ['.ts', '.tsx', '.js', '.jsx']:
                self.scan_file(file)
        
        # Run validations
        violations = []
        violations.extend(self.validate_barrel_files())
        violations.extend(self.detect_export_conflicts())
        violations.extend(self.validate_export_paths())
        
        return {
            "total_files": len(self.exports),
            "barrel_files": len(self.barrel_files),
            "barrel_file_paths": [str(f) for f in self.barrel_files],
            "violations": violations,
            "summary": {
                "barrel_violations": len([v for v in violations if 'barrel' in v["rule"]]),
                "export_conflicts": len([v for v in violations if v["rule"] == "duplicate-export-name"]),
                "path_violations": len([v for v in violations if v["rule"] == "missing-export-path"])
            }
        }


def validate_exports(project_root: Path, files: List[Path]) -> Dict:
    """Public API for export validation"""
    validator = ExportValidator(project_root)
    return validator.analyze(files)
