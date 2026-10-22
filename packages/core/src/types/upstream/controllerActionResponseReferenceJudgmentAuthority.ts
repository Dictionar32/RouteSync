import { SemanticValueFactory } from '../domain/semanticValues';
import type {
  ControllerActionResponseReferenceJudgmentInterface,
  ControllerActionResponseReferenceSourceEvidence,
} from './controllerActionResponseReferenceJudgmentInterface';
import type { ControllerResponseReferenceJudgment } from './controller';

const judge = (evidence: ControllerActionResponseReferenceSourceEvidence): ControllerResponseReferenceJudgment => {
  switch (evidence.kind) {
    case 'absent':
      return Object.freeze({ kind: 'response_reference_not_declared' });
    case 'declared':
      return Object.freeze({
        kind: 'response_reference_declared',
        response: Object.freeze({
          kind: 'response_reference',
          name: SemanticValueFactory.responseTypeName(evidence.className.value.value),
        }),
      });
  }
};

export const controllerActionResponseReferenceJudgmentAuthority: ControllerActionResponseReferenceJudgmentInterface = Object.freeze({
  kind: 'controller_action_response_reference_judgment_authority',
  judge,
});
