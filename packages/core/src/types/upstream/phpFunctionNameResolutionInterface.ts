import type { BuiltinFunction } from './expression';
import type { FunctionName, SourceFile } from './names';
import type { SourceSpan } from './provenance';
import type { StringValue } from './valueObjects';

/** Namespace identity is distinct from a short PHP function identifier. */
export interface PhpNamespaceName {
  readonly kind: 'php_namespace_name';
  readonly value: StringValue;
}

/**
 * Lexical namespace-region identity. PHP permits multiple namespace regions in one file;
 * imports and declarations belong to one region and must never leak into another.
 */
export type PhpNamespaceRegionIdentity =
  | Readonly<{
      readonly kind: 'global_php_namespace_region';
      readonly sourceFile: SourceFile;
      readonly source: SourceSpan;
    }>
  | Readonly<{
      readonly kind: 'named_php_namespace_region';
      readonly sourceFile: SourceFile;
      readonly source: SourceSpan;
      readonly namespace: PhpNamespaceName;
    }>;

/** Canonical qualified identity after PHP namespace/import rules have been applied. */
export interface PhpQualifiedFunctionName {
  readonly kind: 'php_qualified_function_name';
  readonly value: StringValue;
}

/** One lexical identifier segment; separators are represented by the enclosing syntax variant. */
export interface PhpFunctionNameSegment {
  readonly kind: 'php_function_name_segment';
  readonly name: FunctionName;
  readonly source: SourceSpan;
}

export type PhpFunctionNameSegmentSequence = readonly [
  PhpFunctionNameSegment,
  ...PhpFunctionNameSegment[],
];

/**
 * Parser-owned name syntax. Segments are preserved instead of collapsing the source
 * spelling into a canonical string before namespace/import rules have been applied.
 */
export type PhpFunctionNameSyntaxEvidence =
  | Readonly<{
      readonly kind: 'unqualified_function_name_evidence';
      readonly segment: PhpFunctionNameSegment;
    }>
  | Readonly<{
      readonly kind: 'qualified_function_name_evidence';
      readonly segments: PhpFunctionNameSegmentSequence;
    }>
  | Readonly<{
      readonly kind: 'fully_qualified_function_name_evidence';
      readonly segments: PhpFunctionNameSegmentSequence;
    }>
  | Readonly<{
      readonly kind: 'malformed_function_name_evidence';
      readonly reason: 'missing_name_segment' | 'invalid_separator_sequence';
      readonly source: SourceSpan;
    }>;

/** A namespace-prefix import is distinct from a function import: it rewrites the leading segment of qualified names. */
export interface PhpNamespaceImportBinding {
  readonly kind: 'php_namespace_import_binding';
  readonly alias: FunctionName;
  readonly target: PhpNamespaceName;
  readonly source: SourceSpan;
  readonly region: PhpNamespaceRegionIdentity;
}

/** A function import is a source fact, not a guess made from the final short name. */
export interface PhpFunctionImportBinding {
  readonly kind: 'php_function_import_binding';
  readonly alias: FunctionName;
  readonly target: PhpQualifiedFunctionName;
  readonly source: SourceSpan;
  readonly region: PhpNamespaceRegionIdentity;
}

/** A declared function symbol ties its canonical identity to its declaration evidence. */
export interface PhpDeclaredFunctionSymbol {
  readonly kind: 'php_declared_function_symbol';
  readonly name: FunctionName;
  readonly qualifiedName: PhpQualifiedFunctionName;
  readonly source: SourceSpan;
  readonly region: PhpNamespaceRegionIdentity;
}

export type PhpNamespaceImports = Readonly<{
  readonly kind: 'php_namespace_imports';
  readonly items: readonly PhpNamespaceImportBinding[];
}>;

export type PhpFunctionImports = Readonly<{
  readonly kind: 'php_function_imports';
  readonly items: readonly PhpFunctionImportBinding[];
}>;

export type PhpDeclaredFunctions = Readonly<{
  readonly kind: 'php_declared_functions';
  readonly items: readonly PhpDeclaredFunctionSymbol[];
}>;

/** A namespace region and all name-resolution facts whose lexical scope it owns. */
export interface PhpNamespaceRegionInventory {
  readonly kind: 'php_namespace_region_inventory';
  readonly region: PhpNamespaceRegionIdentity;
  readonly namespaceImports: PhpNamespaceImports;
  readonly functionImports: PhpFunctionImports;
  readonly declarations: PhpDeclaredFunctions;
  readonly completeness: PhpFunctionResolutionEnvironmentCompletenessWitness;
}

export type PhpNamespaceRegionInventoryCollection = readonly PhpNamespaceRegionInventory[];

/** Whole-file inventory contract: method-body parsing alone cannot certify this value. */
export type PhpFunctionResolutionSourceInventory =
  | Readonly<{
      readonly kind: 'php_function_resolution_source_inventory_complete';
      readonly sourceFile: SourceFile;
      readonly source: SourceSpan;
      readonly regions: PhpNamespaceRegionInventoryCollection;
      readonly obligations: readonly [
        'all-namespace-regions-inventoried',
        'all-namespace-prefix-imports-inventoried-per-region',
        'all-function-imports-inventoried-per-region',
        'all-function-declarations-inventoried-per-region',
      ];
    }>
  | Readonly<{
      readonly kind: 'php_function_resolution_source_inventory_incomplete';
      readonly sourceFile: SourceFile;
      readonly source: SourceSpan;
      readonly missingEvidence: readonly PhpFunctionResolutionSourceInventoryObligation[];
    }>;

export type PhpFunctionResolutionSourceInventoryObligation =
  | 'namespace-region-declarations'
  | 'namespace-prefix-import-declarations'
  | 'function-import-declarations'
  | 'named-function-declarations'
  | 'region-source-boundaries';

/** Declarative requirements for producing a source-complete inventory before resolution. */
export interface PhpFunctionResolutionSourceInventoryContract {
  readonly kind: 'php_function_resolution_source_inventory_contract';
  readonly version: 3;
  readonly authorityRuleOrder: readonly [
    'require-source-file-and-whole-file-span-identity',
    'require-parser-issued-whole-file-coverage-evidence',
    'require-every-region-to-belong-to-the-source-file',
    'require-every-import-and-declaration-to-belong-to-exactly-one-region',
    'reject-duplicate-or-overlapping-region-identities',
    'publish-whole-file-span-with-complete-inventory',
    'publish-complete-inventory-only-when-all-obligations-hold',
  ];
  readonly obligations: readonly [
    'bind-every-region-to-one-source-file-and-exact-source-boundaries',
    'bind-every-import-and-declaration-to-exactly-one-region',
    'keep-namespace-prefix-imports-distinct-from-function-imports',
    'preserve-alias-and-target-identity-as-source-evidence',
    'never-certify-method-body-only-evidence-as-a-whole-file-inventory',
    'retain-whole-file-span-on-complete-inventory-for-downstream-source-binding',
  ];
}

export const PHP_FUNCTION_RESOLUTION_SOURCE_INVENTORY_CONTRACT: PhpFunctionResolutionSourceInventoryContract = Object.freeze({
  kind: 'php_function_resolution_source_inventory_contract',
  version: 3,
  authorityRuleOrder: Object.freeze([
    'require-source-file-and-whole-file-span-identity',
    'require-parser-issued-whole-file-coverage-evidence',
    'require-every-region-to-belong-to-the-source-file',
    'require-every-import-and-declaration-to-belong-to-exactly-one-region',
    'reject-duplicate-or-overlapping-region-identities',
    'publish-whole-file-span-with-complete-inventory',
    'publish-complete-inventory-only-when-all-obligations-hold',
  ]),
  obligations: Object.freeze([
    'bind-every-region-to-one-source-file-and-exact-source-boundaries',
    'bind-every-import-and-declaration-to-exactly-one-region',
    'keep-namespace-prefix-imports-distinct-from-function-imports',
    'preserve-alias-and-target-identity-as-source-evidence',
    'never-certify-method-body-only-evidence-as-a-whole-file-inventory',
    'retain-whole-file-span-on-complete-inventory-for-downstream-source-binding',
  ]),
});

/** Whole-file parser coverage is evidence, not an empty-list inference. */
export type PhpFunctionResolutionSourceInventoryCoverage =
  | Readonly<{
      readonly kind: 'php_function_resolution_source_inventory_coverage_complete';
      readonly sourceFile: SourceFile;
      readonly source: SourceSpan;
      readonly obligations: readonly [
        'all-namespace-region-declarations-visited',
        'all-import-declarations-visited-per-region',
        'all-named-function-declarations-visited-per-region',
        'all-region-boundaries-accounted-for',
      ];
    }>
  | Readonly<{
      readonly kind: 'php_function_resolution_source_inventory_coverage_incomplete';
      readonly sourceFile: SourceFile;
      readonly source: SourceSpan;
      readonly missingEvidence: readonly PhpFunctionResolutionSourceInventoryObligation[];
    }>;

/** Parser evidence supplied to the inventory authority before name resolution is allowed. */
export interface PhpFunctionResolutionSourceInventoryInput {
  readonly kind: 'php_function_resolution_source_inventory_input';
  readonly sourceFile: SourceFile;
  readonly source: SourceSpan;
  readonly regions: PhpNamespaceRegionInventoryCollection;
  readonly coverage: PhpFunctionResolutionSourceInventoryCoverage;
}

/** Contract for validating source-wide inventory; it does not resolve invocation names. */
export interface PhpFunctionResolutionSourceInventoryAuthorityInterface {
  readonly kind: 'php_function_resolution_source_inventory_authority';
  readonly contract: PhpFunctionResolutionSourceInventoryContract;
  readonly inspect: (
    input: PhpFunctionResolutionSourceInventoryInput,
  ) => PhpFunctionResolutionSourceInventory;
}

/** Scope is closed: a missing namespace cannot silently be interpreted as global scope. */
export type PhpFunctionResolutionScope =
  | Readonly<{
      readonly kind: 'global_function_scope';
      readonly region: Extract<PhpNamespaceRegionIdentity, { readonly kind: 'global_php_namespace_region' }>;
      readonly namespaceImports: PhpNamespaceImports;
      readonly imports: PhpFunctionImports;
      readonly declarations: PhpDeclaredFunctions;
    }>
  | Readonly<{
      readonly kind: 'namespaced_function_scope';
      readonly region: Extract<PhpNamespaceRegionIdentity, { readonly kind: 'named_php_namespace_region' }>;
      readonly namespaceImports: PhpNamespaceImports;
      readonly imports: PhpFunctionImports;
      readonly declarations: PhpDeclaredFunctions;
    }>;

/**
 * Closed inventory of evidence required to resolve a function name in one source file.
 * An empty import/declaration sequence is meaningful only when the frontend explicitly
 * certifies that the corresponding source region was completely inventoried.
 */
export interface PhpFunctionResolutionEnvironmentCompletenessWitness {
  readonly kind: 'php_function_resolution_environment_complete';
  readonly sourceFile: SourceFile;
  readonly source: SourceSpan;
  readonly region: PhpNamespaceRegionIdentity;
  readonly obligations: readonly [
    'namespace-region-inventoried',
    'namespace-prefix-imports-inventoried',
    'function-imports-inventoried',
    'function-declarations-inventoried',
  ];
}

export type PhpFunctionResolutionEvidenceObligation =
  | 'namespace-region'
  | 'namespace-prefix-imports'
  | 'function-imports'
  | 'function-declarations';

export type PhpFunctionResolutionEnvironment =
  | Readonly<{
      readonly kind: 'complete_function_resolution_environment';
      readonly sourceFile: SourceFile;
      readonly scope: PhpFunctionResolutionScope;
      readonly completeness: PhpFunctionResolutionEnvironmentCompletenessWitness;
    }>
  | Readonly<{
      readonly kind: 'incomplete_function_resolution_environment';
      readonly sourceFile: SourceFile;
      readonly missingEvidence: readonly PhpFunctionResolutionEvidenceObligation[];
      readonly source: SourceSpan;
    }>;

/** The environment's completeness is explicit; an empty collection alone proves nothing. */
export type PhpFunctionResolutionEnvironmentJudgment =
  | Readonly<{
      readonly kind: 'function_resolution_environment_complete';
      readonly environment: Extract<PhpFunctionResolutionEnvironment, { readonly kind: 'complete_function_resolution_environment' }>;
    }>
  | Readonly<{
      readonly kind: 'function_resolution_environment_incomplete';
      readonly environment: Extract<PhpFunctionResolutionEnvironment, { readonly kind: 'incomplete_function_resolution_environment' }>;
    }>;

/** Closed reasons why a validated source inventory cannot provide an invocation scope. */
export type PhpFunctionResolutionEnvironmentProjectionFailure =
  | 'source-inventory-incomplete'
  | 'invocation-source-file-mismatch'
  | 'invocation-source-span-invalid'
  | 'no-namespace-region-owns-invocation'
  | 'multiple-namespace-regions-own-invocation';

/** Declarative projection rules; this stage selects evidence scope and never resolves a function name. */
export interface PhpFunctionResolutionEnvironmentProjectionContract {
  readonly kind: 'php_function_resolution_environment_projection_contract';
  readonly version: 1;
  readonly ruleOrder: readonly [
    'require-complete-source-inventory',
    'require-invocation-span-to-belong-to-inventory-source-file',
    'require-valid-non-empty-invocation-span',
    'require-invocation-span-within-certified-whole-file-span',
    'select-exactly-one-namespace-region-containing-invocation-span',
    'reuse-region-bound-imports-declarations-and-completeness-witness',
    'never-infer-global-scope-from-missing-region-evidence',
  ];
}

export type PhpFunctionResolutionEnvironmentProjectionResult =
  | Readonly<{
      readonly kind: 'php_function_resolution_environment_projection_complete';
      readonly inventory: Extract<PhpFunctionResolutionSourceInventory, { readonly kind: 'php_function_resolution_source_inventory_complete' }>;
      readonly invocationSource: SourceSpan;
      readonly judgment: Extract<PhpFunctionResolutionEnvironmentJudgment, { readonly kind: 'function_resolution_environment_complete' }>;
    }>
  | Readonly<{
      readonly kind: 'php_function_resolution_environment_projection_incomplete';
      readonly inventory: PhpFunctionResolutionSourceInventory;
      readonly invocationSource: SourceSpan;
      readonly reason: PhpFunctionResolutionEnvironmentProjectionFailure;
      readonly judgment: Extract<PhpFunctionResolutionEnvironmentJudgment, { readonly kind: 'function_resolution_environment_incomplete' }>;
    }>;

export interface PhpFunctionResolutionEnvironmentProjectionInput {
  readonly kind: 'php_function_resolution_environment_projection_input';
  readonly inventory: PhpFunctionResolutionSourceInventory;
  readonly invocationSource: SourceSpan;
}

export interface PhpFunctionResolutionEnvironmentProjectionInterface {
  readonly kind: 'php_function_resolution_environment_projection_authority';
  readonly contract: PhpFunctionResolutionEnvironmentProjectionContract;
  readonly project: (input: PhpFunctionResolutionEnvironmentProjectionInput) => PhpFunctionResolutionEnvironmentProjectionResult;
}

export const PHP_FUNCTION_RESOLUTION_ENVIRONMENT_PROJECTION_CONTRACT: PhpFunctionResolutionEnvironmentProjectionContract = Object.freeze({
  kind: 'php_function_resolution_environment_projection_contract',
  version: 1,
  ruleOrder: Object.freeze([
    'require-complete-source-inventory',
    'require-invocation-span-to-belong-to-inventory-source-file',
    'require-valid-non-empty-invocation-span',
    'require-invocation-span-within-certified-whole-file-span',
    'select-exactly-one-namespace-region-containing-invocation-span',
    'reuse-region-bound-imports-declarations-and-completeness-witness',
    'never-infer-global-scope-from-missing-region-evidence',
  ]),
});

/** The source frontend must provide syntax and an explicit environment judgment together. */
export interface PhpFunctionNameResolutionInput {
  readonly kind: 'php_function_name_resolution_evidence';
  readonly syntaxEvidence: PhpFunctionNameSyntaxEvidence;
  readonly environment: PhpFunctionResolutionEnvironmentJudgment;
  readonly source: SourceSpan;
}

export type PhpFunctionResolutionTarget =
  | Readonly<{
      readonly kind: 'resolved_builtin_function';
      readonly function: PhpBuiltinFunction;
      readonly qualifiedName: PhpQualifiedFunctionName;
      readonly evidence: SourceSpan;
    }>
  | Readonly<{
      readonly kind: 'resolved_declared_function';
      readonly function: FunctionName;
      readonly qualifiedName: PhpQualifiedFunctionName;
      readonly declaration: PhpDeclaredFunctionSymbol;
    }>
  | Readonly<{
      readonly kind: 'resolved_external_function';
      readonly function: FunctionName;
      readonly qualifiedName: PhpQualifiedFunctionName;
      readonly basis: 'qualified-source-name' | 'import-binding';
      readonly evidence: SourceSpan;
    }>;

/** PHP language/runtime builtins are distinct from Laravel helpers represented in Expression. */
export type PhpBuiltinFunction = Exclude<BuiltinFunction, {
  readonly kind: 'collect' | 'config' | 'now' | 'response' | 'redirect' | 'abort' | 'asset' | 'app' | 'env' | 'route' | 'storage_path' | 'public_path' | 'base_path' | 'database_path' | 'random'
}>;

/** The path by which source spelling becomes a canonical PHP function identity. */
export type PhpFunctionNameResolutionPath =
  | Readonly<{ readonly kind: 'fully_qualified_source_name'; readonly evidence: SourceSpan }>
  | Readonly<{ readonly kind: 'function_import_alias'; readonly binding: PhpFunctionImportBinding }>
  | Readonly<{ readonly kind: 'namespace_prefix_import'; readonly binding: PhpNamespaceImportBinding }>
  | Readonly<{ readonly kind: 'current_namespace_name_candidate'; readonly region: PhpNamespaceRegionIdentity; readonly evidence: SourceSpan }>
  | Readonly<{ readonly kind: 'current_namespace_qualified_name'; readonly region: PhpNamespaceRegionIdentity; readonly evidence: SourceSpan }>
  | Readonly<{ readonly kind: 'global_scope_name'; readonly evidence: SourceSpan }>;

/**
 * Proof-carrying semantic derivation. The result says what the authority concluded;
 * this ADT records why that conclusion follows from a specific source-level rule and
 * its evidence. Downstream invocation judgment consumes the proof instead of repeating
 * name-resolution reasoning.
 */
export type PhpFunctionNameResolutionDerivation =
  | Readonly<{
      readonly kind: 'fully_qualified_name_preserved';
      readonly canonicalName: PhpQualifiedFunctionName;
      readonly evidence: SourceSpan;
    }>
  | Readonly<{
      readonly kind: 'function_import_alias_applied';
      readonly binding: PhpFunctionImportBinding;
      readonly canonicalName: PhpQualifiedFunctionName;
    }>
  | Readonly<{
      readonly kind: 'namespace_prefix_import_applied';
      readonly binding: PhpNamespaceImportBinding;
      readonly canonicalName: PhpQualifiedFunctionName;
    }>
  | Readonly<{
      readonly kind: 'qualified_name_projected_into_current_namespace';
      readonly region: PhpNamespaceRegionIdentity;
      readonly canonicalName: PhpQualifiedFunctionName;
      readonly evidence: SourceSpan;
    }>
  | Readonly<{
      readonly kind: 'global_scope_name_preserved';
      readonly canonicalName: PhpQualifiedFunctionName;
      readonly evidence: SourceSpan;
    }>
  | Readonly<{
      readonly kind: 'declared_function_selected';
      readonly declaration: PhpDeclaredFunctionSymbol;
      readonly path: PhpFunctionNameResolutionPath;
    }>
  | Readonly<{
      readonly kind: 'conflicting_imports_preserved';
      readonly importKind: 'function-import' | 'namespace-prefix-import';
      readonly candidates: readonly [PhpFunctionResolutionTarget, PhpFunctionResolutionTarget, ...PhpFunctionResolutionTarget[]];
    }>
  | Readonly<{
      readonly kind: 'conflicting_declarations_preserved';
      readonly candidates: readonly [PhpFunctionResolutionTarget, PhpFunctionResolutionTarget, ...PhpFunctionResolutionTarget[]];
      readonly path: PhpFunctionNameResolutionPath;
    }>
  | Readonly<{
      readonly kind: 'runtime_fallback_candidates_preserved';
      readonly namespaceCandidate: PhpQualifiedFunctionName;
      readonly globalFallbackCandidate: PhpQualifiedFunctionName;
    }>
  | Readonly<{
      readonly kind: 'resolution_blocked_by_evidence';
      readonly reason: 'scope-evidence-incomplete' | 'name-evidence-incomplete' | 'target-not-identifiable';
    }>;

/** Ambiguity retains typed candidates; deferred retains PHP runtime fallback semantics. */
export type PhpFunctionNameResolutionJudgment =
  | Readonly<{
      readonly kind: 'function_name_resolved';
      readonly source: PhpFunctionNameResolutionInput;
      readonly target: PhpFunctionResolutionTarget;
      readonly derivation: Extract<PhpFunctionNameResolutionDerivation, {
        readonly kind: 'fully_qualified_name_preserved' | 'function_import_alias_applied' | 'namespace_prefix_import_applied' | 'qualified_name_projected_into_current_namespace' | 'global_scope_name_preserved' | 'declared_function_selected'
      }>;
    }>
  | Readonly<{
      readonly kind: 'function_name_ambiguous';
      readonly source: PhpFunctionNameResolutionInput;
      readonly candidates: readonly [PhpFunctionResolutionTarget, PhpFunctionResolutionTarget, ...PhpFunctionResolutionTarget[]];
      readonly reason: 'conflicting-imports' | 'conflicting-declarations' | 'conflicting-resolution-evidence';
      readonly derivation: Extract<PhpFunctionNameResolutionDerivation, { readonly kind: 'conflicting_imports_preserved' | 'conflicting_declarations_preserved' }>;
    }>
  | Readonly<{
      readonly kind: 'function_name_unresolved';
      readonly source: PhpFunctionNameResolutionInput;
      readonly reason: 'scope-evidence-incomplete' | 'name-evidence-incomplete' | 'target-not-identifiable';
      readonly derivation: Extract<PhpFunctionNameResolutionDerivation, { readonly kind: 'resolution_blocked_by_evidence' }>;
    }>
  | Readonly<{
      readonly kind: 'function_name_deferred';
      readonly source: PhpFunctionNameResolutionInput;
      readonly reason: 'namespace-function-or-global-fallback';
      /** PHP must try the namespaced symbol before considering the global symbol. */
      readonly namespaceCandidate: PhpQualifiedFunctionName;
      /** Global fallback is an alternative runtime lookup, not a proven target. */
      readonly globalFallbackCandidate: PhpQualifiedFunctionName;
      readonly derivation: Extract<PhpFunctionNameResolutionDerivation, { readonly kind: 'runtime_fallback_candidates_preserved' }>;
    }>;

/**
 * Ordered semantic rules for resolving PHP function names. These rules are part of
 * the public contract so the authority cannot silently replace PHP namespace rules
 * with short-name builtin classification.
 */
export type PhpFunctionNameResolutionRule =
  | 'reject-malformed-name-evidence'
  | 'require-source-file-and-environment-file-identity'
  | 'require-lexical-namespace-region-identity'
  | 'require-name-and-environment-belong-to-the-same-namespace-region'
  | 'require-imports-and-declarations-belong-to-the-same-namespace-region'
  | 'require-resolution-source-matches-name-syntax-evidence'
  | 'require-name-syntax-evidence-to-be-contained-by-invocation-source-span'
  | 'require-completeness-witness-span-matches-environment-source-file'
  | 'require-complete-source-environment'
  | 'preserve-fully-qualified-name-identity'
  | 'apply-function-import-alias-before-namespace-prefixing'
  | 'apply-namespace-prefix-import-to-qualified-leading-segment'
  | 'resolve-qualified-name-through-import-prefix-or-current-namespace'
  | 'resolve-unqualified-function-import-before-namespace-fallback'
  | 'prefer-known-namespaced-declaration'
  | 'defer-unqualified-namespaced-name-to-php-runtime-fallback'
  | 'resolve-global-scope-name-identity'
  | 'compare-function-identities-case-insensitively-preserving-source-evidence'
  | 'classify-builtin-only-after-canonical-global-function-identity'
  | 'never-infer-function-target-from-short-name-alone'
  | 'publish-proof-carrying-resolution-derivation';

export interface PhpFunctionNameResolutionContract {
  readonly kind: 'php_function_name_resolution_contract';
  readonly version: 8;
  readonly ruleOrder: readonly [
    'reject-malformed-name-evidence',
    'require-source-file-and-environment-file-identity',
    'require-lexical-namespace-region-identity',
    'require-name-and-environment-belong-to-the-same-namespace-region',
    'require-imports-and-declarations-belong-to-the-same-namespace-region',
    'require-resolution-source-matches-name-syntax-evidence',
    'require-name-syntax-evidence-to-be-contained-by-invocation-source-span',
    'require-completeness-witness-span-matches-environment-source-file',
    'require-complete-source-environment',
    'preserve-fully-qualified-name-identity',
    'apply-function-import-alias-before-namespace-prefixing',
    'apply-namespace-prefix-import-to-qualified-leading-segment',
    'resolve-unqualified-function-import-before-namespace-fallback',
    'resolve-qualified-name-through-import-prefix-or-current-namespace',
    'prefer-known-namespaced-declaration',
    'defer-unqualified-namespaced-name-to-php-runtime-fallback',
    'resolve-global-scope-name-identity',
    'compare-function-identities-case-insensitively-preserving-source-evidence',
    'classify-builtin-only-after-canonical-global-function-identity',
    'never-infer-function-target-from-short-name-alone',
    'publish-proof-carrying-resolution-derivation',
  ];
  readonly sourceFileBinding: 'resolution-source-file-must-match-the-environment-source-file-and-completeness-witness';
  readonly syntaxEvidenceBinding: 'resolution-source-and-every-name-syntax-evidence-span-must-belong-to-the-same-source-file-and-lexical-namespace-region';
  readonly syntaxContainment: 'every-name-syntax-evidence-span-must-be-non-empty-and-contained-by-the-invocation-source-span';
  readonly namespaceRegionBinding: 'each-resolution-input-import-declaration-and-completeness-witness-must-reference-the-same-lexical-namespace-region';
  readonly completenessWitnessBinding: 'completeness-witness-must-identify-the-exact-lexical-namespace-region-and-source-file-of-the-resolution-environment';
  readonly targetIdentity: 'resolved-target-is-a-canonical-qualified-function-name-not-a-short-name-classification';
  readonly aliasIdentity: 'function-import-alias-rewrites-only-an-exact-unqualified-function-name-and-namespace-prefix-import-rewrites-only-a-qualified-leading-segment';
  readonly unqualifiedImportPrecedence: 'an-exact-unqualified-function-import-is-considered-before-current-namespace-and-global-runtime-fallback';
  readonly identityComparison: 'function-symbol-and-import-alias-identity-comparison-is-case-insensitive-while-source-spelling-remains-preserved-as-evidence';
  readonly judgmentClosure: 'resolved-has-one-canonical-target-ambiguous-has-conflicting-candidates-unresolved-has-a-typed-blocker-deferred-has-runtime-fallback-candidates';
  readonly builtinIdentity: 'builtin-target-requires-canonical-global-function-identity-and-never-a-matching-short-name-alone';
  readonly deferredIdentity: 'runtime-fallback-retains-both-namespaced-and-global-candidates-without-asserting-either-exists';
  readonly incompleteEvidence: 'incomplete-environment-never-means-empty-namespace-import-or-declaration-inventory';
  readonly downstreamOwnership: 'invocation-judgment-consumes-this-resolution-and-ast-projection-does-not-repeat-name-resolution';
  readonly derivationClosure: 'every-resolution-judgment-carries-a-closed-derivation-whose-evidence-explains-the-outcome';
}

export const PHP_FUNCTION_NAME_RESOLUTION_CONTRACT: PhpFunctionNameResolutionContract = Object.freeze({
  kind: 'php_function_name_resolution_contract',
  version: 8,
  ruleOrder: Object.freeze([
    'reject-malformed-name-evidence',
    'require-source-file-and-environment-file-identity',
    'require-lexical-namespace-region-identity',
    'require-name-and-environment-belong-to-the-same-namespace-region',
    'require-imports-and-declarations-belong-to-the-same-namespace-region',
    'require-resolution-source-matches-name-syntax-evidence',
    'require-name-syntax-evidence-to-be-contained-by-invocation-source-span',
    'require-completeness-witness-span-matches-environment-source-file',
    'require-complete-source-environment',
    'preserve-fully-qualified-name-identity',
    'apply-function-import-alias-before-namespace-prefixing',
    'apply-namespace-prefix-import-to-qualified-leading-segment',
    'resolve-unqualified-function-import-before-namespace-fallback',
    'resolve-qualified-name-through-import-prefix-or-current-namespace',
    'prefer-known-namespaced-declaration',
    'defer-unqualified-namespaced-name-to-php-runtime-fallback',
    'resolve-global-scope-name-identity',
    'compare-function-identities-case-insensitively-preserving-source-evidence',
    'classify-builtin-only-after-canonical-global-function-identity',
    'never-infer-function-target-from-short-name-alone',
    'publish-proof-carrying-resolution-derivation',
  ]),
  sourceFileBinding: 'resolution-source-file-must-match-the-environment-source-file-and-completeness-witness',
  syntaxEvidenceBinding: 'resolution-source-and-every-name-syntax-evidence-span-must-belong-to-the-same-source-file-and-lexical-namespace-region',
  syntaxContainment: 'every-name-syntax-evidence-span-must-be-non-empty-and-contained-by-the-invocation-source-span',
  namespaceRegionBinding: 'each-resolution-input-import-declaration-and-completeness-witness-must-reference-the-same-lexical-namespace-region',
  completenessWitnessBinding: 'completeness-witness-must-identify-the-exact-lexical-namespace-region-and-source-file-of-the-resolution-environment',
  targetIdentity: 'resolved-target-is-a-canonical-qualified-function-name-not-a-short-name-classification',
  aliasIdentity: 'function-import-alias-rewrites-only-an-exact-unqualified-function-name-and-namespace-prefix-import-rewrites-only-a-qualified-leading-segment',
  unqualifiedImportPrecedence: 'an-exact-unqualified-function-import-is-considered-before-current-namespace-and-global-runtime-fallback',
  identityComparison: 'function-symbol-and-import-alias-identity-comparison-is-case-insensitive-while-source-spelling-remains-preserved-as-evidence',
  judgmentClosure: 'resolved-has-one-canonical-target-ambiguous-has-conflicting-candidates-unresolved-has-a-typed-blocker-deferred-has-runtime-fallback-candidates',
  builtinIdentity: 'builtin-target-requires-canonical-global-function-identity-and-never-a-matching-short-name-alone',
  deferredIdentity: 'runtime-fallback-retains-both-namespaced-and-global-candidates-without-asserting-either-exists',
  incompleteEvidence: 'incomplete-environment-never-means-empty-namespace-import-or-declaration-inventory',
  downstreamOwnership: 'invocation-judgment-consumes-this-resolution-and-ast-projection-does-not-repeat-name-resolution',
  derivationClosure: 'every-resolution-judgment-carries-a-closed-derivation-whose-evidence-explains-the-outcome',
});

/**
 * Interface-first boundary for PHP name resolution. It owns canonical function-name
 * identity and PHP namespace fallback semantics; expression construction and invocation
 * judgment remain separate upstream contracts.
 */
export interface PhpFunctionNameResolutionAuthorityInterface {
  readonly kind: 'php_function_name_resolution_authority';
  readonly contract: PhpFunctionNameResolutionContract;
  readonly resolve: (input: PhpFunctionNameResolutionInput) => PhpFunctionNameResolutionJudgment;
}
