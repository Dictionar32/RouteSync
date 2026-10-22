import type { ControllerResponseReferenceJudgment } from './controller';
import type { ClassName } from './names';

/** Closed source evidence for a controller's declared response-reference attribute. */
export type ControllerActionResponseReferenceSourceEvidence =
  | Readonly<{ readonly kind: 'absent' }>
  | Readonly<{ readonly kind: 'declared'; readonly className: ClassName }>;

/** Owns the semantic judgment of a declared response reference, not HTTP return semantics. */
export interface ControllerActionResponseReferenceJudgmentInterface {
  readonly kind: 'controller_action_response_reference_judgment_authority';
  readonly judge: (evidence: ControllerActionResponseReferenceSourceEvidence) => ControllerResponseReferenceJudgment;
}
