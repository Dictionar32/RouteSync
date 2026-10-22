import type { ControllerAuthorizationRelation, ControllerPolicyRelation } from './controller';
import type { ControllerName } from './names';
import type { ActionName } from './names';
import type { RouteMiddlewareContract, RouteMiddlewareExclusionContract, RouteMiddlewareSemanticInput } from './routeMiddleware';
import type { SourceSpan } from './provenance';

/**
 * Canonical semantic policy for one concrete controller action.
 *
 * This is deliberately not a dataflow fact: Laravel policy is domain
 * semantics that must be normalized before generic dataflow consumes it.
 */
export type EffectiveControllerActionPolicyBlockReason =
  | import('./controller').ControllerPolicyActionScopeBlockReason
  | Readonly<{ readonly kind: 'controller_policy_inventory_unavailable'; readonly controllers: readonly ControllerName[] }>
  | Readonly<{ readonly kind: 'controller_action_policy_binding_ambiguous'; readonly candidates: readonly Readonly<{ readonly controller: ControllerName; readonly action: ActionName; readonly source: readonly SourceSpan[] }>[] }>
  | Readonly<{ readonly kind: 'controller_action_policy_binding_unbound'; readonly controller: ControllerName; readonly action: ActionName; readonly source: readonly SourceSpan[] }>;

export type EffectiveControllerActionPolicyJudgment =
  | Readonly<{ readonly kind: 'complete' }>
  | Readonly<{ readonly kind: 'blocked'; readonly reasons: readonly EffectiveControllerActionPolicyBlockReason[] }>;

export interface EffectiveControllerActionPolicyIdentity {
  readonly kind: 'effective_controller_action_policy';
  readonly controller: ControllerName;
  readonly action: ActionName;
  /** Controllers whose class policy contributed to this action. */
  readonly inheritedFrom: readonly ControllerName[];
  readonly source: readonly SourceSpan[];
}

/** A complete policy is the only variant that exposes usable policy products. */
export type CompleteEffectiveControllerActionPolicy = Readonly<
  EffectiveControllerActionPolicyIdentity & {
    readonly judgment: Readonly<{ readonly kind: 'complete' }>;
    readonly middleware: readonly RouteMiddlewareContract[];
    readonly authorization: readonly ControllerAuthorizationRelation[];
  }
>;

/** A blocked policy intentionally has no middleware/authorization products. */
export type BlockedEffectiveControllerActionPolicy = Readonly<
  EffectiveControllerActionPolicyIdentity & {
    readonly judgment: Readonly<{
      readonly kind: 'blocked';
      readonly reasons: readonly EffectiveControllerActionPolicyBlockReason[];
    }>;
  }
>;

/** Closed ADT: consumers must discriminate before accessing usable policy products. */
export type EffectiveControllerActionPolicy =
  | CompleteEffectiveControllerActionPolicy
  | BlockedEffectiveControllerActionPolicy;


/** Inputs to the canonical, AST-free effective-policy reasoning boundary. */
/** Existing typed policy inventory used to close inherited class-scope evidence. */
export interface EffectiveControllerActionPolicyCatalogEntry {
  readonly controller: ControllerName;
  readonly relations: readonly ControllerPolicyRelation[];
}

/** Completeness of the inventory is semantic evidence, not inferred from an empty list. */
export type EffectiveControllerActionPolicyCatalogJudgment =
  | Readonly<{ readonly kind: 'complete'; readonly entries: readonly EffectiveControllerActionPolicyCatalogEntry[] }>
  | Readonly<{ readonly kind: 'blocked'; readonly entries: readonly EffectiveControllerActionPolicyCatalogEntry[]; readonly reason: Readonly<{
      readonly kind: 'controller_policy_inventory_unavailable';
      /** Only these controller inventories are unavailable; known entries remain usable. */
      readonly controllers: readonly ControllerName[];
    }> }>;
export interface EffectiveControllerActionPolicyUpstreamInput {
  readonly controller: ControllerName;
  readonly action: ActionName;
  readonly middleware: RouteMiddlewareSemanticInput;
  /** Complete policy declared on this concrete action; empty means no own declaration. */
  readonly policy: readonly ControllerPolicyRelation[];
  /** Explicit completeness judgment for the upstream inventory needed to close inherited class policy. */
  readonly policyCatalog: EffectiveControllerActionPolicyCatalogJudgment;
  /** Closed inheritance lineage for the concrete action; empty means no inherited controller policy. */
  readonly inheritedFrom: readonly ControllerName[];
  /** Source provenance for this policy judgment; absence must be represented explicitly by an empty collection. */
  readonly source: readonly SourceSpan[];
}

/** Intermediate controller policy facts after ADT interpretation. */
export interface ControllerMiddlewarePolicyParts {
  readonly declarations: readonly RouteMiddlewareContract[];
  readonly exclusions: readonly RouteMiddlewareExclusionContract[];
}

/** Declarative contract for effective middleware and authorization reasoning. */
export interface EffectiveControllerActionPolicyAlgebraInterface {
  controllerMiddleware(relations: readonly ControllerPolicyRelation[]): ControllerMiddlewarePolicyParts;
  effectiveMiddleware(
    declarations: readonly RouteMiddlewareContract[],
    exclusions: readonly RouteMiddlewareExclusionContract[],
    action: ActionName,
  ): readonly RouteMiddlewareContract[];
  authorization(
    relations: readonly ControllerPolicyRelation[],
    action: ActionName,
  ): readonly ControllerAuthorizationRelation[];
}


/**
 * Canonical semantic authority contract for effective controller-action policy.
 * The authority owns closure of policy scope and the complete/blocked judgment;
 * consumers must not infer completeness from the presence or absence of products.
 *
 * The algebra is an internal semantic mechanism, not a second public authority
 * surface. Publishing it here allowed consumers to bypass `judge` and compose
 * partial policy products themselves. The authority therefore exposes one
 * semantic decision operation and one closed ADT result.
 */
export interface EffectiveControllerActionPolicySemanticAuthorityInterface {
  readonly kind: 'effective_controller_action_policy_semantic_authority';
  readonly closed: true;
  readonly contractVersion: 4;
  /** The only public semantic decision operation. Its result is the closed judgment ADT. */
  readonly judge: (input: EffectiveControllerActionPolicyUpstreamInput) => EffectiveControllerActionPolicy;
}

