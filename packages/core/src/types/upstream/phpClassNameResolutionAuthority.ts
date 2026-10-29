import { phpQualifiedClassNameFactory } from './phpClassNameResolutionInterface';
import type { PhpClassNameResolutionRuleInterface } from './phpClassNameResolutionInterface';

/** One canonical lexical resolver is consumed by both inheritance and static-call analysis. */
export const phpClassNameResolutionAuthority: PhpClassNameResolutionRuleInterface = Object.freeze({
  kind: 'php_class_name_resolution_rule',
  contractVersion: 2,
  judge: input => {
    const sourceName = input.sourceName;
    const spelling = sourceName.value.value;
    const normalized = spelling.replace(/^\\+/, '');
    const context = input.context;
    const blocked = Object.freeze({
      kind: 'php_class_name_resolution_blocked' as const,
      sourceName,
      reason: 'class_import_inventory_incomplete' as const,
    });
    const malformed = Object.freeze({
      kind: 'php_class_name_resolution_blocked' as const,
      sourceName,
      reason: 'malformed_class_name' as const,
    });
    const segments = normalized.split('\\');
    if (normalized.length === 0 || segments.some(segment => segment.length === 0)) return malformed;
    const resolved = (qualifiedName: string, rule: 'fully_qualified' | 'namespace_relative' | 'class_import' | 'current_namespace') => Object.freeze({
      kind: 'php_class_name_resolved' as const,
      sourceName,
      qualifiedName: phpQualifiedClassNameFactory.create(qualifiedName),
      rule,
    });
    switch (spelling.startsWith('\\')) {
      case true:
        return resolved(normalized, 'fully_qualified');
      case false:
        break;
    }
    switch (context.kind) {
      case 'php_class_name_resolution_context_unavailable':
        return Object.freeze({
          kind: 'php_class_name_resolution_blocked' as const,
          sourceName,
          reason: 'class_name_resolution_context_unavailable' as const,
        });
      case 'php_class_name_resolution_context':
        break;
    }
    if (spelling.toLowerCase().startsWith('namespace\\')) {
      return resolved([context.namespaceName.value.value, spelling.slice('namespace\\'.length)].filter(Boolean).join('\\'), 'namespace_relative');
    }
    const firstSegment = segments[0] ?? '';
    const imported = context.classImports.find(binding => binding.alias.value.value.toLowerCase() === firstSegment.toLowerCase());
    if (imported !== undefined) {
      return resolved([imported.target.value.value, ...segments.slice(1)].filter(Boolean).join('\\'), 'class_import');
    }
    if (context.importInventory === 'incomplete') return blocked;
    return resolved([context.namespaceName.value.value, normalized].filter(Boolean).join('\\'), 'current_namespace');
  },
});
