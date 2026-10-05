import type { ControllerAuthorizationRelation } from './controller';
import type { ControllerName } from './names';
import type { ActionName } from './names';
import type { RouteMiddlewareContract } from './routeMiddleware';
import type { SourceSpan } from './provenance';

/**
 * Canonical semantic policy for one concrete controller action.
 *
 * This is deliberately not a dataflow fact: Laravel policy is domain
 * semantics that must be normalized before generic dataflow consumes it.
 */
export interface EffectiveControllerActionPolicy {
  readonly kind: 'effective_controller_action_policy';
  readonly controller: ControllerName;
  readonly action: ActionName;
  readonly middleware: readonly RouteMiddlewareContract[];
  readonly authorization: readonly ControllerAuthorizationRelation[];
  /** Controllers whose class policy contributed to this action. */
  readonly inheritedFrom: readonly ControllerName[];
  readonly source: readonly SourceSpan[];
}
