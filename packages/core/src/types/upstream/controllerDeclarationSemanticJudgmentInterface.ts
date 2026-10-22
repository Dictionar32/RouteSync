import type { ActionName, ClassName, ControllerName, SourceFile } from './names';
import type { PhpClassNameResolution, PhpQualifiedClassName } from './phpClassNameResolutionInterface';

export type ControllerDeclarationParentEvidence =
  | Readonly<{ readonly kind: 'no_parent' }>
  | Readonly<{ readonly kind: 'parent_declared'; readonly parent: ControllerName; readonly identity: Extract<PhpClassNameResolution, { readonly kind: 'php_class_name_resolved' }> }>
  | Readonly<{ readonly kind: 'parent_name_resolution_blocked'; readonly parent: ControllerName; readonly identity: Extract<PhpClassNameResolution, { readonly kind: 'php_class_name_resolution_blocked' }> }>;

export type ControllerDeclarationMethodVisibility = 'public' | 'protected' | 'private' | 'implicit';

export interface ControllerDeclarationMethodCandidate<TMethod> {
  readonly name: ActionName;
  readonly visibility: ControllerDeclarationMethodVisibility;
  readonly storage: 'instance' | 'static';
  readonly value: TMethod;
}

export interface ControllerDeclarationAttributeCandidate<TAttribute> {
  readonly name: ClassName;
  readonly value: TAttribute;
}

export interface ControllerDeclarationSemanticCandidate<TMethod, TAttribute> {
  /** Exact source identity binds this declaration judgment to its invocation inventory member. */
  readonly sourceFile: SourceFile;
  readonly classIdentity: PhpQualifiedClassName;
  readonly controller: ControllerName;
  readonly parent: ControllerDeclarationParentEvidence;
  readonly interfaces: readonly ClassName[];
  readonly methods: readonly ControllerDeclarationMethodCandidate<TMethod>[];
  readonly attributes: readonly ControllerDeclarationAttributeCandidate<TAttribute>[];
}

/** A source-bearing subject submitted to the declaration judgment authority. */
export interface ControllerDeclarationSemanticSubject<TSource, TMethod, TAttribute> {
  /** Exact parsed source record; it is carried through the judgment without a second lookup. */
  readonly source: TSource;
  /** Canonical identity from the source invocation judgment that owns this parsed record. */
  readonly sourceIdentity: SourceFile;
  readonly candidate: ControllerDeclarationSemanticCandidate<TMethod, TAttribute>;
}

/**
 * The correspondence authority either proves that the candidate belongs to the exact
 * source subject or rejects the pair. A rejected pair never receives a declaration
 * selection and therefore cannot enter ancestry or action execution.
 */
export type ControllerDeclarationSemanticCorrespondence<TSource, TMethod, TAttribute> =
  | Readonly<{
      readonly kind: 'controller_declaration_semantic_correspondence';
      readonly source: TSource;
      readonly sourceIdentity: SourceFile;
      readonly selection: ControllerDeclarationSemanticSelection<TMethod, TAttribute>;
    }>
  | Readonly<{
      readonly kind: 'controller_declaration_source_identity_mismatch';
      readonly source: TSource;
      readonly sourceIdentity: SourceFile;
      readonly candidateSourceIdentity: SourceFile;
    }>;
export type ControllerDeclarationAncestryTermination =
  | Readonly<{ readonly kind: 'root_reached' }>
  | Readonly<{ readonly kind: 'parent_outside_inventory'; readonly parent: ControllerName }>
  | Readonly<{ readonly kind: 'parent_ambiguous_in_inventory'; readonly parent: ControllerName; readonly candidates: readonly SourceFile[] }>
  | Readonly<{ readonly kind: 'parent_name_resolution_blocked'; readonly parent: ControllerName; readonly reason: 'class_import_inventory_incomplete' | 'malformed_class_name' }>
  | Readonly<{ readonly kind: 'inheritance_cycle'; readonly repeated: ControllerName }>;

/**
 * Fixed-point certificate for the finite lattice of canonical ancestor identities.
 *
 * Certificate validity relies on the existing declaration authority's transfer being
 * monotone over canonical-identity sets and on the inventory bounding the domain.
 * `rounds` and `knownAncestors` are runtime witnesses, not arithmetic facts that
 * TypeScript can prove: a producer must keep both within `heightBound`. The
 * `converged` discriminant means the modeled inventory reached saturation; it does
 * not independently prove that every source ancestor was resolvable.
 *
 * A blocked certificate therefore proves saturation of resolved inventory evidence
 * only; it never claims that the source project's full ancestry is complete.
 */
/**
 * Shared algebraic contract for the finite canonical-identity lattice.
 * This is type-level structure only: it does not claim that numeric runtime
 * witnesses prove the laws or the source inventory is complete.
 */
export interface ControllerDeclarationAncestryLatticeContract {
  readonly lattice: 'finite_canonical_class_identity_set';
  readonly order: 'subset_by_canonical_class_identity';
  readonly bottom: 'empty_identity_set';
  readonly join: 'set_union';
  readonly transfer: 'add-one-resolved-parent-identity-or-reach-boundary';
  readonly monotonicity: 'seen-identities-only-grow';
  readonly converged: true;
  /** Runtime witnesses only; their arithmetic relationship is not type-proven. */
  readonly heightBound: number;
  readonly rounds: number;
  readonly knownAncestors: number;
}

export type ControllerDeclarationAncestryClosure =
  | (ControllerDeclarationAncestryLatticeContract & Readonly<{
      readonly kind: 'controller_ancestry_closure_complete';
      readonly fixedPoint: 'least_fixed_point';
    }>)
  | (ControllerDeclarationAncestryLatticeContract & Readonly<{
      readonly kind: 'controller_ancestry_closure_partial';
      readonly fixedPoint: 'least_fixed_point_over_resolved_inventory';
    }>);

/**
 * A declaration projection is complete only when ancestry reaches a known root.
 * Partial ancestry facts remain available in the blocked member, but can no
 * longer be mistaken for a closed inherited-controller selection.
 */
export interface ControllerDeclarationAncestorEvidence<TAttribute> {
  /** Canonical identity of one resolved ancestor; basename matching is not sufficient. */
  readonly sourceFile: SourceFile;
  readonly classIdentity: PhpQualifiedClassName;
  readonly controller: ControllerName;
  /** Middleware attributes owned by this exact ancestor declaration. */
  readonly middlewareAttributes: readonly TAttribute[];
}

interface ControllerDeclarationSemanticSelectionBase<TMethod, TAttribute> {
  /** Exact source identity is preserved; consumers must not correlate selections by basename. */
  readonly sourceFile: SourceFile;
  readonly classIdentity: PhpQualifiedClassName;
  readonly controller: ControllerName;
  /** Parent identities in child-to-root order; unresolved parent names are retained here for compatibility. */
  readonly inheritedControllerNames: readonly ControllerName[];
  /** Exact resolved ancestor chain in child-to-root order; each item preserves source and class identity. */
  readonly inheritedDeclarations: readonly ControllerDeclarationAncestorEvidence<TAttribute>[];
  /** Parent attributes in root-to-child order, filtered by the Laravel middleware attribute rule. */
  readonly inheritedMiddlewareAttributes: readonly TAttribute[];
}

export type ControllerDeclarationActionExclusionReason =
  | 'non_public_visibility'
  | 'constructor_lifecycle_method'
  | 'laravel_middleware_registration_hook';

/**
 * Each method receives a closed selection judgment. Consumers no longer have
 * to reconstruct Laravel action eligibility from raw visibility/name/storage.
 */
export type ControllerDeclarationActionSelection<TMethod> =
  | Readonly<{
      readonly kind: 'controller_action_selected';
      readonly method: TMethod;
    }>
  | Readonly<{
      readonly kind: 'controller_action_excluded';
      readonly method: TMethod;
      readonly reason: ControllerDeclarationActionExclusionReason;
    }>;

export type ControllerDeclarationSemanticSelection<TMethod, TAttribute> =
  | (ControllerDeclarationSemanticSelectionBase<TMethod, TAttribute> & Readonly<{
      readonly kind: 'controller_declaration_selection_complete';
      /** Closed method-by-method decisions are available only after ancestry closure. */
      readonly actionSelections: readonly ControllerDeclarationActionSelection<TMethod>[];
      readonly ancestryTermination: Extract<ControllerDeclarationAncestryTermination, { readonly kind: 'root_reached' }>;
      readonly ancestryClosure: Extract<ControllerDeclarationAncestryClosure, { readonly kind: 'controller_ancestry_closure_complete' }>;
    }>)
  | (ControllerDeclarationSemanticSelectionBase<TMethod, TAttribute> & Readonly<{
      readonly kind: 'controller_declaration_selection_blocked';
      /** Blocked ancestry deliberately exposes no executable action selections. */
      readonly ancestryTermination: Exclude<ControllerDeclarationAncestryTermination, { readonly kind: 'root_reached' }>;
      readonly ancestryClosure: Extract<ControllerDeclarationAncestryClosure, { readonly kind: 'controller_ancestry_closure_partial' }>;
    }>);

/**
 * Authority contract for closing declaration, action-selection, and ancestry judgments.
 * This is an executable authority interface, not one already-produced judgment value.
 * Its result remains the closed ControllerDeclarationSemanticSelection ADT.
 */
export interface ControllerDeclarationSemanticJudgmentAuthorityInterface {
  readonly kind: 'controller_declaration_semantic_judgment';
  readonly closed: true;
  /**
   * Every result structurally carries its exact source subject beside the
   * corresponding closed selection. Consumers do not pair parallel arrays,
   * depend on positional indexes, or reconstruct identity through relations.
   */
  readonly correspondences: <TSource, TMethod, TAttribute>(
    input: readonly ControllerDeclarationSemanticSubject<TSource, TMethod, TAttribute>[],
  ) => readonly ControllerDeclarationSemanticCorrespondence<TSource, TMethod, TAttribute>[];
}

/** Compatibility name retained for existing runtime imports; it aliases the authority contract. */
export type ControllerDeclarationSemanticJudgment = ControllerDeclarationSemanticJudgmentAuthorityInterface;
