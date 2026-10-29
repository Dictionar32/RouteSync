import type {
  PhpBuiltinFunction,
  PhpFunctionNameResolutionAuthorityInterface,
  PhpFunctionNameResolutionInput,
  PhpFunctionNameResolutionJudgment,
  PhpFunctionResolutionTarget,
  PhpFunctionNameResolutionDerivation,
  PhpFunctionNameResolutionPath,
  PhpQualifiedFunctionName,
  PhpNamespaceRegionIdentity,
} from './phpFunctionNameResolutionInterface';
import { PHP_FUNCTION_NAME_RESOLUTION_CONTRACT } from './phpFunctionNameResolutionInterface';
import type { FunctionName, SourceFile } from './names';
import { sourceSpanOperations, type SourceSpan } from './provenance';
import { stringValue } from './valueObjects';

const builtinNames: readonly (readonly [string, PhpBuiltinFunction])[] = Object.freeze([
  ['isset', { kind: 'isset' }], ['implode', { kind: 'implode' }], ['method_exists', { kind: 'method_exists' }],
  ['array_key_exists', { kind: 'array_key_exists' }], ['array_map', { kind: 'array_map' }], ['array_filter', { kind: 'array_filter' }],
  ['array_sum', { kind: 'array_sum' }], ['array_column', { kind: 'array_column' }], ['array_diff', { kind: 'array_diff' }],
  ['array_merge', { kind: 'array_merge' }], ['array_slice', { kind: 'array_slice' }], ['array_shift', { kind: 'array_shift' }],
  ['array_unshift', { kind: 'array_unshift' }], ['base64_decode', { kind: 'base64_decode' }], ['base64_encode', { kind: 'base64_encode' }],
  ['filter_var', { kind: 'filter_var' }], ['floor', { kind: 'floor' }], ['hash_equals', { kind: 'hash_equals' }],
  ['http_build_query', { kind: 'http_build_query' }], ['json_decode', { kind: 'json_decode' }], ['json_encode', { kind: 'json_encode' }],
  ['is_array', { kind: 'is_array' }], ['is_numeric', { kind: 'is_numeric' }], ['is_object', { kind: 'is_object' }],
  ['is_string', { kind: 'is_string' }], ['is_dir', { kind: 'is_dir' }], ['is_file', { kind: 'is_file' }], ['is_a', { kind: 'is_a' }],
  ['in_array', { kind: 'in_array' }], ['max', { kind: 'max' }], ['min', { kind: 'min' }], ['round', { kind: 'round' }],
  ['strlen', { kind: 'strlen' }], ['str_replace', { kind: 'str_replace' }], ['strtr', { kind: 'strtr' }], ['str_pad', { kind: 'str_pad' }],
  ['str_starts_with', { kind: 'str_starts_with' }], ['str_ends_with', { kind: 'str_ends_with' }], ['str_contains', { kind: 'str_contains' }],
  ['strtolower', { kind: 'strtolower' }], ['strtoupper', { kind: 'strtoupper' }], ['substr', { kind: 'substr' }], ['trim', { kind: 'trim' }], ['ltrim', { kind: 'ltrim' }],
  ['rtrim', { kind: 'rtrim' }], ['explode', { kind: 'explode' }], ['preg_match', { kind: 'preg_match' }], ['preg_match_all', { kind: 'preg_match_all' }],
  ['preg_replace', { kind: 'preg_replace' }], ['preg_quote', { kind: 'preg_quote' }], ['sprintf', { kind: 'sprintf' }],
  ['call_user_func', { kind: 'call_user_func' }], ['empty', { kind: 'empty' }], ['hash', { kind: 'hash' }], ['copy', { kind: 'copy' }],
  ['number_format', { kind: 'number_format' }], ['file_exists', { kind: 'file_exists' }],
  ['extension_loaded', { kind: 'extension_loaded' }], ['sys_get_temp_dir', { kind: 'sys_get_temp_dir' }], ['realpath', { kind: 'realpath' }], ['parse_url', { kind: 'parse_url' }],
]);

const normalized = (value: string): string => value.replace(/^\\+/, '').toLocaleLowerCase('en-US');
const qualified = (value: string): PhpQualifiedFunctionName => Object.freeze({ kind: 'php_qualified_function_name', value: stringValue.create(value.replace(/^\\+/, '')) });
const functionName = (value: string): FunctionName => Object.freeze({ kind: 'function_name', value: stringValue.create(value.split('\\').at(-1) ?? value) });
const sameFile = (left: SourceFile, right: SourceFile): boolean => left.value.value === right.value.value;
const sameSpan = (left: SourceSpan, right: SourceSpan): boolean => sourceSpanOperations.same(left, right).kind === 'same_source_span';
const sameSpanFile = (span: SourceSpan, file: SourceFile): boolean => sameFile(span.file, file);
const validSpan = (span: SourceSpan): boolean => sourceSpanOperations.validateNonEmpty(span).kind === 'source_span_ordered';
const spanWithin = (span: SourceSpan, region: SourceSpan): boolean => validSpan(span)
  && validSpan(region)
  && sourceSpanOperations.contains(region, span).kind === 'source_span_contained';
const sameRegion = (left: PhpNamespaceRegionIdentity, right: PhpNamespaceRegionIdentity): boolean => {
  if (left.kind !== right.kind || !sameFile(left.sourceFile, right.sourceFile) || !sameSpan(left.source, right.source)) return false;
  if (left.kind === 'global_php_namespace_region' && right.kind === 'global_php_namespace_region') return true;
  if (left.kind === 'named_php_namespace_region' && right.kind === 'named_php_namespace_region') return normalized(left.namespace.value.value) === normalized(right.namespace.value.value);
  return false;
};
const syntaxSegments = (input: PhpFunctionNameResolutionInput) => {
  switch (input.syntaxEvidence.kind) {
    case 'unqualified_function_name_evidence': return [input.syntaxEvidence.segment];
    case 'qualified_function_name_evidence':
    case 'fully_qualified_function_name_evidence': return input.syntaxEvidence.segments;
    case 'malformed_function_name_evidence': return [];
  }
};
const syntaxName = (input: PhpFunctionNameResolutionInput): string => syntaxSegments(input).map(segment => segment.name.value.value).join('\\');
const scopeDeclarations = (input: PhpFunctionNameResolutionInput) => input.environment.kind === 'function_resolution_environment_complete' ? input.environment.environment.scope.declarations.items : [];
const scopeImports = (input: PhpFunctionNameResolutionInput) => input.environment.kind === 'function_resolution_environment_complete' ? input.environment.environment.scope.imports.items : [];
const scopeNamespaceImports = (input: PhpFunctionNameResolutionInput) => input.environment.kind === 'function_resolution_environment_complete' ? input.environment.environment.scope.namespaceImports.items : [];
const namespaceOf = (input: PhpFunctionNameResolutionInput): string => input.environment.kind === 'function_resolution_environment_complete' && input.environment.environment.scope.region.kind === 'named_php_namespace_region' ? input.environment.environment.scope.region.namespace.value.value : '';
const sourceEvidenceIsBound = (input: PhpFunctionNameResolutionInput): boolean => {
  const judgment = input.environment;
  const environment = judgment.environment;
  const sourceFile = environment.sourceFile;
  const syntaxSource = input.syntaxEvidence.kind === 'malformed_function_name_evidence' ? input.syntaxEvidence.source : syntaxSegments(input)[0]?.source;
  const segmentSources = syntaxSegments(input).map(segment => segment.source);
  if (!sameSpanFile(input.source, sourceFile)
    || !validSpan(input.source)
    || syntaxSource === undefined
    || !sameSpanFile(syntaxSource, sourceFile)
    || !validSpan(syntaxSource)
    || !spanWithin(syntaxSource, input.source)
    || !segmentSources.every(source => sameSpanFile(source, sourceFile) && spanWithin(source, input.source))) return false;
  if (environment.kind === 'incomplete_function_resolution_environment') return sameSpanFile(environment.source, sourceFile) && environment.missingEvidence.length > 0;

  const scope = environment.scope;
  const region = scope.region;
  const evidence = [
    ...scope.namespaceImports.items.map(binding => ({ source: binding.source, region: binding.region })),
    ...scope.imports.items.map(binding => ({ source: binding.source, region: binding.region })),
    ...scope.declarations.items.map(declaration => ({ source: declaration.source, region: declaration.region })),
  ];
  const witness = environment.completeness;
  const witnessBound = sameFile(witness.sourceFile, sourceFile)
    && sameSpanFile(witness.source, sourceFile)
    && sameSpan(witness.source, region.source)
    && sameRegion(witness.region, region)
    && witness.obligations.length === 4
    && witness.obligations[0] === 'namespace-region-inventoried'
    && witness.obligations[1] === 'namespace-prefix-imports-inventoried'
    && witness.obligations[2] === 'function-imports-inventoried'
    && witness.obligations[3] === 'function-declarations-inventoried';
  return sameFile(region.sourceFile, sourceFile)
    && sameSpanFile(region.source, sourceFile)
    && spanWithin(input.source, region.source)
    && segmentSources.every(source => spanWithin(source, region.source))
    && evidence.every(item => sameRegion(item.region, region) && spanWithin(item.source, region.source))
    && witnessBound;
};
const builtinTarget = (targetName: string, evidence: SourceSpan): PhpFunctionResolutionTarget | undefined => {
  const identity = normalized(targetName);
  const builtin = builtinNames.find(([name]) => normalized(name) === identity);
  return builtin === undefined ? undefined : Object.freeze({ kind: 'resolved_builtin_function', function: builtin[1], qualifiedName: qualified(targetName), evidence });
};
const externalTarget = (targetName: string, evidence: SourceSpan, basis: 'qualified-source-name' | 'import-binding'): PhpFunctionResolutionTarget => Object.freeze({ kind: 'resolved_external_function', function: functionName(targetName), qualifiedName: qualified(targetName), basis, evidence });
const candidateSequence = (items: readonly PhpFunctionResolutionTarget[]): readonly [PhpFunctionResolutionTarget, PhpFunctionResolutionTarget, ...PhpFunctionResolutionTarget[]] | undefined => {
  const [first, second, ...rest] = items;
  if (first === undefined || second === undefined) return undefined;
  const sequence: [PhpFunctionResolutionTarget, PhpFunctionResolutionTarget, ...PhpFunctionResolutionTarget[]] = [first, second, ...rest];
  return Object.freeze(sequence);
};
const resolved = (input: PhpFunctionNameResolutionInput, target: PhpFunctionResolutionTarget, derivation: Extract<PhpFunctionNameResolutionDerivation, { readonly kind: 'fully_qualified_name_preserved' | 'function_import_alias_applied' | 'namespace_prefix_import_applied' | 'qualified_name_projected_into_current_namespace' | 'global_scope_name_preserved' | 'declared_function_selected' }>): PhpFunctionNameResolutionJudgment => Object.freeze({ kind: 'function_name_resolved', source: input, target, derivation });
const unresolved = (input: PhpFunctionNameResolutionInput, reason: 'scope-evidence-incomplete' | 'name-evidence-incomplete' | 'target-not-identifiable'): PhpFunctionNameResolutionJudgment => Object.freeze({ kind: 'function_name_unresolved', source: input, reason, derivation: Object.freeze({ kind: 'resolution_blocked_by_evidence', reason }) });

const declaredResolution = (input: PhpFunctionNameResolutionInput, targetName: string, path: PhpFunctionNameResolutionPath): PhpFunctionNameResolutionJudgment | undefined => {
  const declarations = scopeDeclarations(input).filter(symbol => normalized(symbol.qualifiedName.value.value) === normalized(targetName));
  const targets: readonly Extract<PhpFunctionResolutionTarget, { readonly kind: 'resolved_declared_function' }>[] = declarations.map((declaration): Extract<PhpFunctionResolutionTarget, { readonly kind: 'resolved_declared_function' }> => Object.freeze({ kind: 'resolved_declared_function', function: declaration.name, qualifiedName: declaration.qualifiedName, declaration }));
  const [first, second] = targets;
  if (first === undefined) return undefined;
  if (second === undefined) return resolved(input, first, Object.freeze({ kind: 'declared_function_selected', declaration: first.declaration, path }));
  const candidates = candidateSequence(targets);
  return candidates === undefined ? unresolved(input, 'target-not-identifiable') : Object.freeze({ kind: 'function_name_ambiguous', source: input, candidates, reason: 'conflicting-declarations', derivation: Object.freeze({ kind: 'conflicting_declarations_preserved', candidates, path }) });
};

const resolutionPath = (derivation: Extract<PhpFunctionNameResolutionDerivation, { readonly kind: 'fully_qualified_name_preserved' | 'function_import_alias_applied' | 'namespace_prefix_import_applied' | 'qualified_name_projected_into_current_namespace' | 'global_scope_name_preserved' }>): PhpFunctionNameResolutionPath => {
  switch (derivation.kind) {
    case 'fully_qualified_name_preserved': return Object.freeze({ kind: 'fully_qualified_source_name', evidence: derivation.evidence });
    case 'function_import_alias_applied': return Object.freeze({ kind: 'function_import_alias', binding: derivation.binding });
    case 'namespace_prefix_import_applied': return Object.freeze({ kind: 'namespace_prefix_import', binding: derivation.binding });
    case 'qualified_name_projected_into_current_namespace': return Object.freeze({ kind: 'current_namespace_qualified_name', region: derivation.region, evidence: derivation.evidence });
    case 'global_scope_name_preserved': return Object.freeze({ kind: 'global_scope_name', evidence: derivation.evidence });
  }
};

const resolveCanonicalTarget = (input: PhpFunctionNameResolutionInput, targetName: string, evidence: SourceSpan, basis: 'qualified-source-name' | 'import-binding', derivation: Extract<PhpFunctionNameResolutionDerivation, { readonly kind: 'fully_qualified_name_preserved' | 'function_import_alias_applied' | 'namespace_prefix_import_applied' | 'qualified_name_projected_into_current_namespace' | 'global_scope_name_preserved' }>): PhpFunctionNameResolutionJudgment => {
  const declaration = declaredResolution(input, targetName, resolutionPath(derivation));
  return declaration ?? resolved(input, builtinTarget(targetName, evidence) ?? externalTarget(targetName, evidence, basis), derivation);
};

const resolve = (input: PhpFunctionNameResolutionInput): PhpFunctionNameResolutionJudgment => {
  const syntax = input.syntaxEvidence;
  if (syntax.kind === 'malformed_function_name_evidence') return unresolved(input, 'name-evidence-incomplete');
  if (!sourceEvidenceIsBound(input)) return unresolved(input, 'scope-evidence-incomplete');
  if (input.environment.kind === 'function_resolution_environment_incomplete') return unresolved(input, 'scope-evidence-incomplete');

  const name = syntaxName(input);
  const segments = syntaxSegments(input);
  const source = segments[0]?.source ?? input.source;
  const scope = input.environment.environment.scope;
  const namespace = namespaceOf(input);
  const imports = scopeImports(input);

  if (syntax.kind === 'fully_qualified_function_name_evidence') {
    const identity = name;
    return resolveCanonicalTarget(input, identity, source, 'qualified-source-name', Object.freeze({ kind: 'fully_qualified_name_preserved', canonicalName: qualified(identity), evidence: source }));
  }

  if (syntax.kind === 'unqualified_function_name_evidence') {
    const alias = imports.filter(binding => normalized(binding.alias.value.value) === normalized(name));
    const firstAlias = alias[0];
    const conflictingAliases = firstAlias !== undefined && alias.some(binding => normalized(binding.target.value.value) !== normalized(firstAlias.target.value.value));
    if (conflictingAliases) {
      const candidates = candidateSequence(alias.map(binding => externalTarget(binding.target.value.value, binding.source, 'import-binding')));
      return candidates === undefined ? unresolved(input, 'target-not-identifiable') : Object.freeze({ kind: 'function_name_ambiguous', source: input, candidates, reason: 'conflicting-imports', derivation: Object.freeze({ kind: 'conflicting_imports_preserved', importKind: 'function-import', candidates }) });
    }
    const imported = alias[0];
    if (imported !== undefined) {
      const target = imported.target.value.value;
      return resolveCanonicalTarget(input, target, imported.source, 'import-binding', Object.freeze({ kind: 'function_import_alias_applied', binding: imported, canonicalName: qualified(target) }));
    }
    const localName = namespace.length === 0 ? name : `${namespace}\\${name}`;
    const localPath: PhpFunctionNameResolutionPath = scope.region.kind === 'named_php_namespace_region'
      ? Object.freeze({ kind: 'current_namespace_name_candidate', region: scope.region, evidence: source })
      : Object.freeze({ kind: 'global_scope_name', evidence: source });
    const declaration = declaredResolution(input, localName, localPath);
    if (declaration !== undefined) return declaration;
    if (scope.kind === 'namespaced_function_scope') return Object.freeze({ kind: 'function_name_deferred', source: input, reason: 'namespace-function-or-global-fallback', namespaceCandidate: qualified(localName), globalFallbackCandidate: qualified(name), derivation: Object.freeze({ kind: 'runtime_fallback_candidates_preserved', namespaceCandidate: qualified(localName), globalFallbackCandidate: qualified(name) }) });
    return resolveCanonicalTarget(input, name, source, 'qualified-source-name', Object.freeze({ kind: 'global_scope_name_preserved', canonicalName: qualified(name), evidence: source }));
  }

  const leading = segments[0]?.name.value.value ?? '';
  const namespaceAliases = scopeNamespaceImports(input).filter(binding => normalized(binding.alias.value.value) === normalized(leading));
  const suffix = segments.slice(1).map(segment => segment.name.value.value).join('\\');
  const firstNamespaceAlias = namespaceAliases[0];
  const conflictingNamespaceAliases = firstNamespaceAlias !== undefined && namespaceAliases.some(binding => normalized(binding.target.value.value) !== normalized(firstNamespaceAlias.target.value.value));
  if (conflictingNamespaceAliases) {
    const candidates = candidateSequence(namespaceAliases.map(binding => externalTarget(`${binding.target.value.value}${suffix.length === 0 ? '' : `\\${suffix}`}`, binding.source, 'import-binding')));
    return candidates === undefined ? unresolved(input, 'target-not-identifiable') : Object.freeze({ kind: 'function_name_ambiguous', source: input, candidates, reason: 'conflicting-imports', derivation: Object.freeze({ kind: 'conflicting_imports_preserved', importKind: 'namespace-prefix-import', candidates }) });
  }
  const importedNamespace = firstNamespaceAlias;
  const identity = importedNamespace === undefined ? (namespace.length === 0 ? name : `${namespace}\\${name}`) : `${importedNamespace.target.value.value}${suffix.length === 0 ? '' : `\\${suffix}`}`;
  const derivation: Extract<PhpFunctionNameResolutionDerivation, { readonly kind: 'namespace_prefix_import_applied' | 'qualified_name_projected_into_current_namespace' }> | Extract<PhpFunctionNameResolutionDerivation, { readonly kind: 'global_scope_name_preserved' }> = importedNamespace === undefined
    ? (scope.region.kind === 'named_php_namespace_region'
      ? Object.freeze({ kind: 'qualified_name_projected_into_current_namespace', region: scope.region, canonicalName: qualified(identity), evidence: source })
      : Object.freeze({ kind: 'global_scope_name_preserved', canonicalName: qualified(identity), evidence: source }))
    : Object.freeze({ kind: 'namespace_prefix_import_applied', binding: importedNamespace, canonicalName: qualified(identity) });
  return resolveCanonicalTarget(input, identity, source, importedNamespace === undefined ? 'qualified-source-name' : 'import-binding', derivation);
};

export const phpFunctionNameResolutionAuthority: PhpFunctionNameResolutionAuthorityInterface = Object.freeze({
  kind: 'php_function_name_resolution_authority',
  contract: PHP_FUNCTION_NAME_RESOLUTION_CONTRACT,
  resolve,
});
