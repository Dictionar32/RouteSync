/**
 * Historical wiring path. Semantic controller-policy authority remains upstream.
 */
export {
  resolveEffectiveControllerActionPolicy,
  resolveEffectiveControllerActionPolicyFromEvidence,
} from '../../upstream/route/effectiveControllerActionPolicyResolver';
export type {
  EffectiveControllerActionPolicyEvidence,
  ControllerPolicyCatalogEntry,
  EffectiveControllerActionPolicyInput,
} from '../../upstream/route/effectiveControllerActionPolicyResolver';
