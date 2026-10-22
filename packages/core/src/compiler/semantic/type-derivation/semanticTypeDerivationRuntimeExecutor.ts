import { assertSemanticTypeDerivationJudgment } from '../../../types/upstream/semanticTypeDerivationInterface';
import type {
  SemanticTypeDerivationAuthorityInterface,
  SemanticTypeDerivationRequest,
  SemanticTypeDerivationRuntimeExecutorInterface,
} from '../../../types/upstream/semanticTypeDerivationInterface';

export const createSemanticTypeDerivationRuntimeExecutor = (
  authority: SemanticTypeDerivationAuthorityInterface,
): SemanticTypeDerivationRuntimeExecutorInterface => Object.freeze({
  execute: (request: SemanticTypeDerivationRequest) => assertSemanticTypeDerivationJudgment(request, authority.resolve(request)),
  authority: 'upstream',
});
