import type { ActionName, ControllerName } from './names';

/** Canonical typed identity for one concrete Laravel controller action. */
export interface ControllerActionIdentity {
  readonly controller: ControllerName;
  readonly action: ActionName;
}

export interface ControllerActionBindingCandidate<T> {
  readonly identity: ControllerActionIdentity;
  readonly value: T;
}

export interface ControllerActionBindingInput<TPolicy, TController> {
  readonly identity: ControllerActionIdentity;
  readonly suppliedPolicies: readonly ControllerActionBindingCandidate<TPolicy>[];
  readonly catalogControllers: readonly ControllerActionBindingCandidate<TController>[];
}

export type ControllerActionBindingResult<TPolicy, TController> =
  | { readonly kind: 'supplied_policy'; readonly value: TPolicy }
  | { readonly kind: 'supplied_policy_ambiguous'; readonly candidates: readonly ControllerActionBindingCandidate<TPolicy>[] }
  | { readonly kind: 'catalog_controller'; readonly value: TController }
  | { readonly kind: 'catalog_controller_ambiguous'; readonly candidates: readonly ControllerActionBindingCandidate<TController>[] }
  | { readonly kind: 'unbound' };

/** Algebra contract: exact identity matching and precedence are canonicalized here. */
export interface ControllerActionBindingAlgebraInterface {
  resolve<TPolicy, TController>(
    input: ControllerActionBindingInput<TPolicy, TController>,
  ): ControllerActionBindingResult<TPolicy, TController>;
}

/** Authority boundary consumed by source-model construction. */
export interface ControllerActionBindingAuthorityInterface extends ControllerActionBindingAlgebraInterface {}
