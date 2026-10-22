import type { ExpressionArguments } from './expression';
import type { ControllerMethodAttributeScope, ControllerPolicyActionScope, ControllerPolicyActionScopeJudgment } from './controller';
import type { ActionName } from './names';

/** Closed semantic contract for Laravel's only:/except: action applicability. */
export interface ControllerPolicyActionScopeJudgmentInterface {
  readonly kind: 'controller_policy_action_scope_judgment';
  readonly closed: true;
  readonly analyze: (arguments_: ExpressionArguments) => ControllerPolicyActionScopeJudgment;
  /** Resolves action applicability from attribute scope before interpreting only:/except: evidence. */
  readonly analyzeAttribute: (scope: ControllerMethodAttributeScope, action: ActionName | undefined, arguments_: ExpressionArguments) => ControllerPolicyActionScopeJudgment;
}
