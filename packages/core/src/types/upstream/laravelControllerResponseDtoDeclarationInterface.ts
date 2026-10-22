import type { LaravelSourceIdentitySemanticsInterface } from './sourceProjectIdentity';
import type { DtoAst } from './ast';
import type { SourceProjectIdentity } from './highLevelSourceModel';
import type { SourceFile } from './names';
import type { PhpClassNameResolution, PhpQualifiedClassName } from './phpClassNameResolutionInterface';
import type { SourceSpan } from './provenance';
import type { ControllerMethodEvidence, ControllerResponseAttributeSourceEvidence } from './controllerEvidence';

/**
 * The scanner's actual discovery boundary. Project-wide completeness must not be
 * inferred from the current app/Http/DTOs scan root.
 */
export interface LaravelDtoDeclarationDiscoveryScope<Project extends SourceProjectIdentity = SourceProjectIdentity> {
  readonly kind: 'laravel_dto_declaration_discovery_scope';
  readonly projectRoot: Project['root'];
  readonly relativeDirectory: 'app/Http/DTOs';
}

/**
 * A declaration keeps its AST and source identity alongside the PHP lexical-name
 * judgment. A short class token alone is not a canonical class identity.
 */
export type LaravelDtoDeclarationClassIdentity =
  | Readonly<{
      readonly kind: 'dto_class_identity_resolved';
      readonly resolution: Extract<PhpClassNameResolution, { readonly kind: 'php_class_name_resolved' }>;
    }>
  | Readonly<{
      readonly kind: 'dto_class_identity_unresolved';
      readonly resolution: Extract<PhpClassNameResolution, { readonly kind: 'php_class_name_resolution_blocked' }>;
    }>;

export interface LaravelDtoDeclarationSourceEvidence<Project extends SourceProjectIdentity = SourceProjectIdentity> {
  readonly kind: 'laravel_dto_declaration_source_evidence';
  /** The project provenance is retained on each declaration, not only on its enclosing inventory. */
  readonly sourceProject: Project;
  readonly declaration: DtoAst;
  readonly sourceFile: SourceFile;
  readonly classIdentity: LaravelDtoDeclarationClassIdentity;
}

/** A resolved DTO declaration cannot retain an unresolved lexical class identity or lose project provenance. */
export type LaravelDtoDeclarationResolvedSourceEvidence<
  Project extends SourceProjectIdentity = SourceProjectIdentity,
> = Omit<
  LaravelDtoDeclarationSourceEvidence<Project>,
  'classIdentity'
> & Readonly<{
  readonly classIdentity: Extract<
    LaravelDtoDeclarationClassIdentity,
    { readonly kind: 'dto_class_identity_resolved' }
  >;
}>;

/** Evidence retained by a completed scan of the declared scope. */
export interface LaravelDtoDeclarationDiscoveryReceipt<Project extends SourceProjectIdentity = SourceProjectIdentity> {
  readonly kind: 'laravel_dto_declaration_discovery_receipt';
  readonly sourceProject: Project;
  readonly scope: LaravelDtoDeclarationDiscoveryScope<Project>;
  /** Every PHP source file discovered inside the scope, including files with no DTO declaration. */
  readonly discoveredSourceFiles: readonly SourceFile[];
  /** Each parsed declaration retains AST, canonical source file, and class-name resolution evidence. */
  readonly declarations: readonly LaravelDtoDeclarationSourceEvidence<Project>[];
  readonly obligations: readonly [
    'all-php-files-discovered-within-declared-scope',
    'each-discovered-file-was-considered-for-a-dto-declaration',
    'each-produced-declaration-retains-canonical-source-identity',
    'class-identity-is-qualified-by-the-existing-php-class-name-resolution-authority-or-explicitly-unresolved',
  ];
}

/** A discovery failure must retain the source operand that prevented closure. */
export type LaravelDtoDeclarationDiscoveryBlocker =
  | Readonly<{
      readonly kind: 'dto_discovery_root_missing';
      readonly root: SourceFile;
    }>
  | Readonly<{
      readonly kind: 'dto_source_file_unreadable';
      readonly sourceFile: SourceFile;
    }>
  | Readonly<{
      readonly kind: 'dto_discovery_directory_unreadable';
      readonly directory: SourceFile;
    }>
  | Readonly<{
      readonly kind: 'dto_declaration_parse_failed';
      readonly sourceFile: SourceFile;
    }>;

/**
 * A missing scan root, unreadable file, or parse failure cannot be represented as
 * a successful empty inventory. An incomplete inventory must carry at least one
 * concrete blocker. A completed scan may still contain declarations whose class
 * identity is unresolved; discovery closure and name-resolution closure are
 * different judgments.
 */
export type LaravelProjectDtoDeclarationInventoryInterface<Project extends SourceProjectIdentity = SourceProjectIdentity> =
  | Readonly<{
      readonly kind: 'laravel_project_dto_declaration_inventory_complete';
      readonly contractVersion: 4;
      readonly sourceProject: Project;
      readonly receipt: LaravelDtoDeclarationDiscoveryReceipt<Project>;
    }>
  | Readonly<{
      readonly kind: 'laravel_project_dto_declaration_inventory_incomplete';
      readonly contractVersion: 4;
      readonly sourceProject: Project;
      readonly scope: LaravelDtoDeclarationDiscoveryScope<Project>;
      /** Partial source evidence is retained; an incomplete scan is never collapsed to an empty inventory. */
      readonly partialEvidence: Readonly<{
        readonly discoveredSourceFiles: readonly SourceFile[];
        readonly declarations: readonly LaravelDtoDeclarationSourceEvidence<Project>[];
      }>;
      readonly blockers: readonly [LaravelDtoDeclarationDiscoveryBlocker, ...LaravelDtoDeclarationDiscoveryBlocker[]];
    }>;

/** The request owner stays attached to the declaration judgment; consumers never reconstruct it from source-span equality. */
export type LaravelControllerResponseDtoDeclarationRequestOwner =
  | Readonly<{
      readonly kind: 'controller_response_attribute_owner';
      readonly methodEvidence: ControllerMethodEvidence & Readonly<{
        readonly responseAttribute: Extract<ControllerResponseAttributeSourceEvidence, { readonly kind: 'response_attribute_declared' }>;
      }>;
    }>
  | Readonly<{
      readonly kind: 'dto_property_type_reference_owner';
      readonly propertySource: SourceSpan;
    }>;

/** The controller's class reference must pass through the existing PHP name authority. */
export interface LaravelControllerResponseDtoDeclarationResolutionInput<Project extends SourceProjectIdentity = SourceProjectIdentity> {
  readonly kind: 'laravel_controller_response_dto_declaration_resolution_input';
  readonly sourceProject: Project;
  readonly inventory: LaravelProjectDtoDeclarationInventoryInterface<Project>;
  readonly requestedClassResolution: PhpClassNameResolution;
  /** Exact request provenance, retained for compatibility and diagnostics. */
  readonly requestSource: SourceSpan;
  /** Closed upstream ownership provenance; source spans are evidence, not a join key. */
  readonly owner: LaravelControllerResponseDtoDeclarationRequestOwner;
}

export interface LaravelControllerResponseDtoDeclarationIdentity<Project extends SourceProjectIdentity = SourceProjectIdentity> {
  readonly kind: 'laravel_controller_response_dto_declaration_identity';
  /** Identity is project-correlated; equal PHP class names in different roots are distinct declarations. */
  readonly sourceProject: Project;
  readonly className: PhpQualifiedClassName;
  readonly sourceFile: SourceFile;
}

/** Only a complete discovery inventory and a resolved request can produce a positive judgment. */
export type LaravelControllerResponseDtoDeclarationResolvedInput<
  Project extends SourceProjectIdentity = SourceProjectIdentity,
> = Omit<
  LaravelControllerResponseDtoDeclarationResolutionInput<Project>,
  'inventory' | 'requestedClassResolution'
> & Readonly<{
  readonly inventory: Extract<
    LaravelProjectDtoDeclarationInventoryInterface<Project>,
    { readonly kind: 'laravel_project_dto_declaration_inventory_complete' }
  >;
  readonly requestedClassResolution: Extract<
    PhpClassNameResolution,
    { readonly kind: 'php_class_name_resolved' }
  >;
}>;

/** Closed outcomes: absence and ambiguity cannot be silently converted to an empty response. */
export type LaravelControllerResponseDtoDeclarationResolutionJudgment<
  Project extends SourceProjectIdentity = SourceProjectIdentity,
> =
  | Readonly<{
      readonly kind: 'response_dto_declaration_resolved';
      readonly request: LaravelControllerResponseDtoDeclarationResolvedInput<Project>;
      readonly identity: LaravelControllerResponseDtoDeclarationIdentity<Project>;
      readonly declaration: LaravelDtoDeclarationResolvedSourceEvidence<Project>;
      readonly matchingDeclarations: readonly [LaravelDtoDeclarationResolvedSourceEvidence<Project>];
    }>
  | Readonly<{
      readonly kind: 'response_dto_declaration_unresolved';
      readonly request: LaravelControllerResponseDtoDeclarationResolutionInput<Project>;
      readonly matchingDeclarations: readonly [];
      readonly reason:
        | 'project_identity_mismatch'
        | 'declaration_not_found'
        | 'inventory_incomplete'
        | 'requested_class_name_unresolved'
        | 'declaration_class_identity_unresolved';
    }>
  | Readonly<{
      readonly kind: 'response_dto_declaration_ambiguous';
      readonly request: LaravelControllerResponseDtoDeclarationResolvedInput<Project>;
      readonly matchingDeclarations: readonly [LaravelDtoDeclarationResolvedSourceEvidence<Project>, LaravelDtoDeclarationResolvedSourceEvidence<Project>, ...LaravelDtoDeclarationResolvedSourceEvidence<Project>[]];
      readonly reason: 'multiple_declarations_match_requested_qualified_class';
    }>;

export interface LaravelControllerResponseDtoDeclarationResolutionContract {
  readonly kind: 'laravel_controller_response_dto_declaration_resolution_contract';
  readonly version: 5;
  readonly projectBinding: 'inventory-and-receipt-must-retain-the-request-project-identity';
  readonly scopeRule: 'inventory-proves-discovery-only-within-its-declared-scope';
  readonly nameResolutionOwner: 'PhpClassNameResolutionRuleInterface';
  readonly identityRule: 'match-only-canonical-php-qualified-class-identities-issued-by-the-existing-class-name-resolution-authority';
  readonly noFallbackRule: 'short-class-name-and-file-name-matching-cannot-substitute-for-qualified-class-identity';
  readonly cardinality: 'exactly-one-declaration-is-required';
  readonly unresolvedRule: 'missing-or-incomplete-inventory-or-unresolved-class-identity-remains-an-explicit-blocker';
  readonly ambiguityRule: 'multiple-matches-remain-a-distinct-ambiguous-outcome';
  readonly evidenceRule: 'resolved-declaration-retains-exact-DTO-AST-source-identity-qualified-class-identity-and-the-same-project-provenance-as-its-inventory';
  readonly noPromotion: 'declaration-resolution-does-not-itself-claim-a-ResponseContract-or-response-semantic-product';
  readonly integratedResponseRule: 'the-existing-integrated-response-authority-consumes-this-judgment-without-duplicating-invocation-semantic-ownership';
  readonly ownerProvenanceRule: 'each-declaration-judgment-retains-its-closed-controller-response-attribute-or-DTO-property-reference-owner;consumers-must-not-reconstruct-method-ownership-by-source-span-lookup';
  readonly runtimeRule: 'the-runtime-executor-delegates-to-this-authority-and-forwards-its-closed-judgment-without-reclassification';
}

/** Interface-first semantic authority. Runtime execution is a separate delegation concern. */
export interface LaravelControllerResponseDtoDeclarationResolutionAuthorityDependenciesInterface {
  readonly sourceIdentitySemantics: LaravelSourceIdentitySemanticsInterface;
}

export interface LaravelControllerResponseDtoDeclarationResolutionAuthorityInterface<
  Project extends SourceProjectIdentity = SourceProjectIdentity,
> {
  readonly kind: 'laravel_controller_response_dto_declaration_resolution_authority';
  readonly contract: LaravelControllerResponseDtoDeclarationResolutionContract;
  readonly dependencies: LaravelControllerResponseDtoDeclarationResolutionAuthorityDependenciesInterface;
  readonly resolve: (
    input: LaravelControllerResponseDtoDeclarationResolutionInput<Project>,
  ) => LaravelControllerResponseDtoDeclarationResolutionJudgment<Project>;
}

/** Runtime executor is a transparent projection of the chosen upstream authority. */
export interface LaravelControllerResponseDtoDeclarationResolutionRuntimeExecutorInterface<
  Project extends SourceProjectIdentity = SourceProjectIdentity,
  Authority extends LaravelControllerResponseDtoDeclarationResolutionAuthorityInterface<Project> = LaravelControllerResponseDtoDeclarationResolutionAuthorityInterface<Project>,
> {
  readonly kind: 'laravel_controller_response_dto_declaration_resolution_runtime_executor';
  readonly closed: true;
  readonly contractVersion: 1;
  readonly authority: Authority;
  readonly contract: Authority['contract'];
  readonly execute: Authority['resolve'];
  readonly executionRule: 'delegate-to-the-bound-authority-and-return-its-exact-judgment';
}
