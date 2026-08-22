"""
Framework-specific validators for React Hooks, Vue Composition API, and TanStack Query.
"""
from __future__ import annotations
import re
from pathlib import Path
from typing import List, Dict, Any


class ReactHooksValidator:
    """Validates React Hooks usage patterns."""
    
    HOOKS_PATTERNS = [
        r'\buse[A-Z]\w+\(',  # Custom hooks (useState, useEffect, useCustom)
        r'\buseState\(',
        r'\buseEffect\(',
        r'\buseContext\(',
        r'\buseReducer\(',
        r'\buseCallback\(',
        r'\buseMemo\(',
        r'\buseRef\(',
        r'\buseLayoutEffect\(',
        r'\buseImperativeHandle\(',
    ]
    
    def __init__(self):
        self.violations = []
    
    def validate(self, file_path: Path, content: str) -> List[Dict[str, Any]]:
        """Validate React Hooks usage in a file."""
        violations = []
        rel_path = str(file_path)
        
        # Check for conditional hook calls
        violations.extend(self._check_conditional_hooks(rel_path, content))
        
        # Check for hooks in loops
        violations.extend(self._check_hooks_in_loops(rel_path, content))
        
        # Check for hooks called after early returns
        violations.extend(self._check_hooks_after_returns(rel_path, content))
        
        # Check for missing dependency arrays
        violations.extend(self._check_missing_deps(rel_path, content))
        
        return violations
    
    def _check_conditional_hooks(self, path: str, content: str) -> List[Dict[str, Any]]:
        """Detect hooks called inside conditional statements."""
        violations = []
        lines = content.split('\n')
        
        in_condition = False
        condition_depth = 0
        
        for line_num, line in enumerate(lines, 1):
            # Track if/else blocks
            if re.search(r'\b(if|else\s+if)\s*\(', line):
                in_condition = True
                condition_depth += line.count('{')
            
            if in_condition:
                # Check for hook calls inside conditions
                for pattern in self.HOOKS_PATTERNS:
                    if re.search(pattern, line):
                        violations.append({
                            'path': path,
                            'line': line_num,
                            'rule': 'hooks-called-conditionally',
                            'severity': 'high',
                            'message': f'Hook called conditionally. Hooks must be called in the same order on every render.'
                        })
                
                condition_depth += line.count('{') - line.count('}')
                if condition_depth <= 0:
                    in_condition = False
                    condition_depth = 0
        
        return violations
    
    def _check_hooks_in_loops(self, path: str, content: str) -> List[Dict[str, Any]]:
        """Detect hooks called inside loops."""
        violations = []
        lines = content.split('\n')
        
        in_loop = False
        loop_depth = 0
        
        for line_num, line in enumerate(lines, 1):
            # Track loop blocks
            if re.search(r'\b(for|while|forEach|map)\s*\(', line):
                in_loop = True
                loop_depth += line.count('{')
            
            if in_loop:
                # Check for hook calls inside loops
                for pattern in self.HOOKS_PATTERNS:
                    if re.search(pattern, line):
                        violations.append({
                            'path': path,
                            'line': line_num,
                            'rule': 'hooks-in-loop',
                            'severity': 'high',
                            'message': 'Hook called inside a loop. Hooks must be called at the top level.'
                        })
                
                loop_depth += line.count('{') - line.count('}')
                if loop_depth <= 0:
                    in_loop = False
                    loop_depth = 0
        
        return violations
    
    def _check_hooks_after_returns(self, path: str, content: str) -> List[Dict[str, Any]]:
        """Detect hooks called after early returns."""
        violations = []
        lines = content.split('\n')
        
        found_return = False
        
        for line_num, line in enumerate(lines, 1):
            # Reset on function declaration
            if re.search(r'\bfunction\s+\w+|const\s+\w+\s*=\s*\(.*\)\s*=>', line):
                found_return = False
            
            # Track early returns
            if re.search(r'\breturn\b', line) and not re.search(r'//.*return', line):
                found_return = True
            
            # Check for hooks after return
            if found_return:
                for pattern in self.HOOKS_PATTERNS:
                    if re.search(pattern, line):
                        violations.append({
                            'path': path,
                            'line': line_num,
                            'rule': 'hooks-after-return',
                            'severity': 'high',
                            'message': 'Hook called after early return. Hooks must be called unconditionally.'
                        })
        
        return violations
    
    def _check_missing_deps(self, path: str, content: str) -> List[Dict[str, Any]]:
        """Check for useEffect/useCallback/useMemo with potentially missing dependencies."""
        violations = []
        lines = content.split('\n')
        
        for line_num, line in enumerate(lines, 1):
            # Check for useEffect/useCallback/useMemo without dependency array
            if re.search(r'\b(useEffect|useCallback|useMemo)\s*\([^)]+\)\s*;', line):
                if not re.search(r',\s*\[', line):
                    violations.append({
                        'path': path,
                        'line': line_num,
                        'rule': 'missing-hook-deps',
                        'severity': 'medium',
                        'message': 'Hook missing dependency array. This can cause stale closure bugs.'
                    })
        
        return violations


class VueReactivityValidator:
    """Validates Vue 3 Composition API reactivity patterns."""
    
    def __init__(self):
        self.violations = []
    
    def validate(self, file_path: Path, content: str) -> List[Dict[str, Any]]:
        """Validate Vue reactivity usage in a file."""
        violations = []
        rel_path = str(file_path)
        
        # Check for reactive destructuring without toRefs
        violations.extend(self._check_reactive_destructure(rel_path, content))
        
        # Check for ref unwrapping issues
        violations.extend(self._check_ref_unwrapping(rel_path, content))
        
        # Check for computed without return
        violations.extend(self._check_computed_return(rel_path, content))
        
        # Check for watch without cleanup
        violations.extend(self._check_watch_cleanup(rel_path, content))
        
        return violations
    
    def _check_reactive_destructure(self, path: str, content: str) -> List[Dict[str, Any]]:
        """Detect reactive object destructuring without toRefs."""
        violations = []
        lines = content.split('\n')
        
        for line_num, line in enumerate(lines, 1):
            # Check for reactive destructuring
            if re.search(r'const\s*\{[^}]+\}\s*=\s*reactive\(', line):
                if 'toRefs' not in line:
                    violations.append({
                        'path': path,
                        'line': line_num,
                        'rule': 'reactive-destructure-without-torefs',
                        'severity': 'high',
                        'message': 'Destructuring reactive object loses reactivity. Use toRefs() to preserve reactivity.'
                    })
        
        return violations
    
    def _check_ref_unwrapping(self, path: str, content: str) -> List[Dict[str, Any]]:
        """Check for missing .value access on refs."""
        violations = []
        lines = content.split('\n')
        
        # Track ref declarations
        refs = set()
        for line in lines:
            ref_match = re.search(r'const\s+(\w+)\s*=\s*ref\(', line)
            if ref_match:
                refs.add(ref_match.group(1))
        
        # Check usage
        for line_num, line in enumerate(lines, 1):
            for ref_name in refs:
                # Look for usage without .value (excluding template and setup return)
                if re.search(rf'\b{ref_name}\b(?!\.value)', line):
                    if 'return' not in line and '<template>' not in content[:content.find(line)]:
                        violations.append({
                            'path': path,
                            'line': line_num,
                            'rule': 'ref-without-value',
                            'severity': 'medium',
                            'message': f'Ref "{ref_name}" used without .value. Access ref.value in script.'
                        })
        
        return violations
    
    def _check_computed_return(self, path: str, content: str) -> List[Dict[str, Any]]:
        """Check for computed properties without return statements."""
        violations = []
        lines = content.split('\n')
        
        in_computed = False
        computed_line = 0
        has_return = False
        depth = 0
        
        for line_num, line in enumerate(lines, 1):
            if re.search(r'\bcomputed\s*\(\s*\(', line):
                in_computed = True
                computed_line = line_num
                has_return = False
                depth = line.count('(') - line.count(')')
            
            if in_computed:
                if 'return' in line:
                    has_return = True
                
                depth += line.count('(') - line.count(')')
                
                if depth <= 0:
                    if not has_return:
                        violations.append({
                            'path': path,
                            'line': computed_line,
                            'rule': 'computed-without-return',
                            'severity': 'high',
                            'message': 'Computed property must return a value.'
                        })
                    in_computed = False
        
        return violations
    
    def _check_watch_cleanup(self, path: str, content: str) -> List[Dict[str, Any]]:
        """Check for watch/watchEffect without cleanup when needed."""
        violations = []
        lines = content.split('\n')
        
        for line_num, line in enumerate(lines, 1):
            # Check for watch with async or side effects
            if re.search(r'\b(watch|watchEffect)\s*\(', line):
                # Look ahead for async, setTimeout, setInterval, addEventListener
                block_lines = lines[line_num-1:min(line_num+10, len(lines))]
                block_content = '\n'.join(block_lines)
                
                has_side_effect = any([
                    'setTimeout' in block_content,
                    'setInterval' in block_content,
                    'addEventListener' in block_content,
                    'async' in block_content
                ])
                
                has_cleanup = 'return' in block_content and '()' in block_content
                
                if has_side_effect and not has_cleanup:
                    violations.append({
                        'path': path,
                        'line': line_num,
                        'rule': 'watch-missing-cleanup',
                        'severity': 'medium',
                        'message': 'Watch with side effects should return cleanup function.'
                    })
        
        return violations


class TanStackQueryValidator:
    """Validates TanStack Query (React Query) usage patterns."""
    
    def __init__(self):
        self.violations = []
    
    def validate(self, file_path: Path, content: str) -> List[Dict[str, Any]]:
        """Validate TanStack Query usage in a file."""
        violations = []
        rel_path = str(file_path)
        
        # Check for stable query keys
        violations.extend(self._check_query_keys(rel_path, content))
        
        # Check for missing error handling
        violations.extend(self._check_error_handling(rel_path, content))
        
        # Check for mutation without onSuccess/onError
        violations.extend(self._check_mutation_handlers(rel_path, content))
        
        return violations
    
    def _check_query_keys(self, path: str, content: str) -> List[Dict[str, Any]]:
        """Check for unstable query keys (inline objects)."""
        violations = []
        lines = content.split('\n')
        
        for line_num, line in enumerate(lines, 1):
            # Check for useQuery with inline object key
            if re.search(r'useQuery\s*\(\s*\{', line):
                violations.append({
                    'path': path,
                    'line': line_num,
                    'rule': 'unstable-query-key',
                    'severity': 'medium',
                    'message': 'Query key should be a stable array, not an inline object.'
                })
        
        return violations
    
    def _check_error_handling(self, path: str, content: str) -> List[Dict[str, Any]]:
        """Check for queries without error handling."""
        violations = []
        lines = content.split('\n')
        
        for line_num, line in enumerate(lines, 1):
            if re.search(r'useQuery|useMutation', line):
                # Check next few lines for error handling
                block_lines = lines[line_num-1:min(line_num+15, len(lines))]
                block_content = '\n'.join(block_lines)
                
                has_error_handling = any([
                    'isError' in block_content,
                    'error' in block_content,
                    'onError' in block_content,
                    'try' in block_content,
                    'catch' in block_content
                ])
                
                if not has_error_handling:
                    violations.append({
                        'path': path,
                        'line': line_num,
                        'rule': 'query-missing-error-handling',
                        'severity': 'medium',
                        'message': 'Query/mutation should handle errors.'
                    })
        
        return violations
    
    def _check_mutation_handlers(self, path: str, content: str) -> List[Dict[str, Any]]:
        """Check for mutations without success/error handlers."""
        violations = []
        lines = content.split('\n')
        
        for line_num, line in enumerate(lines, 1):
            if 'useMutation' in line:
                # Check for onSuccess or onError
                block_lines = lines[line_num-1:min(line_num+10, len(lines))]
                block_content = '\n'.join(block_lines)
                
                has_handlers = 'onSuccess' in block_content or 'onError' in block_content
                
                if not has_handlers:
                    violations.append({
                        'path': path,
                        'line': line_num,
                        'rule': 'mutation-missing-handlers',
                        'severity': 'low',
                        'message': 'Mutation should have onSuccess or onError handlers for side effects.'
                    })
        
        return violations


def validate_frameworks(repo: Path, files: List[Path]) -> Dict[str, Any]:
    """
    Validate framework-specific patterns across React, Vue, and TanStack Query.
    
    Args:
        repo: Repository root path
        files: List of source files to validate
    
    Returns:
        Dictionary with violations and summary
    """
    react_validator = ReactHooksValidator()
    vue_validator = VueReactivityValidator()
    tanstack_validator = TanStackQueryValidator()
    
    all_violations = []
    
    for file_path in files:
        try:
            content = file_path.read_text(errors='ignore')
            rel_path = file_path.relative_to(repo)
            
            # React files (.tsx, .jsx)
            if file_path.suffix in {'.tsx', '.jsx'}:
                all_violations.extend(react_validator.validate(rel_path, content))
                
                # Check for TanStack Query if imported
                if 'react-query' in content or '@tanstack/react-query' in content:
                    all_violations.extend(tanstack_validator.validate(rel_path, content))
            
            # Vue files (.vue)
            if file_path.suffix == '.vue':
                all_violations.extend(vue_validator.validate(rel_path, content))
        
        except (OSError, UnicodeError):
            continue
    
    return {
        'violations': all_violations,
        'total_violations': len(all_violations),
        'by_severity': {
            'high': sum(1 for v in all_violations if v.get('severity') == 'high'),
            'medium': sum(1 for v in all_violations if v.get('severity') == 'medium'),
            'low': sum(1 for v in all_violations if v.get('severity') == 'low')
        },
        'ok': not any(v.get('severity') in {'high', 'critical'} for v in all_violations)
    }
