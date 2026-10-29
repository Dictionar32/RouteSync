import { controllerVariableSemanticAuthority } from '../../../types/upstream/controllerVariableSemanticAuthority';
import { createControllerDataflowAnalyzer } from '../../frontend/php/controllerDataflowAnalyzer';
import { controllerDataflowSemanticJudgmentAuthority } from '../../../types/upstream/controllerDataflowSemanticJudgmentAuthority';
import { phpAstExpressionSemanticAuthority } from '../../frontend/php/routeAst/phpAstExpressionSemanticAuthority';

import { phpControllerDataflowSourcePayloadEvidenceAdapter } from '../../frontend/php/routeAst/phpControllerDataflowSourcePayloadEvidenceAdapter';
import { phpControllerVariableSemanticResolutionInputAdapter } from './controllerVariableSemanticResolutionInputAdapter';
import { phpAstSemanticKnowledgeEvidenceAdapter } from '../../frontend/php/routeAst/semanticKnowledgeDataFlowProducer';
import { createPhpControllerDataflowDefinitionProjectionAuthority } from '../../frontend/php/routeAst/phpControllerDataflowDefinitionProjectionAuthority';
import type { LaravelControllerInvocationSemanticJudgmentInterface } from '../../../types/upstream/laravelControllerInvocationSemanticJudgmentInterface';
import type { ControllerDataflowAnalysisOutcome } from '../../../types/upstream/controllerDataflowAnalysisOutcomeInterface';
import type { PhpControllerDataflowPayload } from '../../frontend/php/routeAst/phpControllerDataflowSourcePayloadEvidenceAdapter';

/** Existing expression authority shared with controller dependency evidence projection. */
export const controllerPhpAstExpressionSemanticAuthority = phpAstExpressionSemanticAuthority;

type ControllerDataflowInput = import('../../frontend/php/phpAstTypes').PhpBlock;
type ControllerParameterSemantics = readonly (readonly [
  import('../../frontend/php/phpAstTypes').AstIdentifier,
  import('../../../types/upstream/controller').ControllerVariableSemantic,
])[];

/** Public runtime contract for scanner wiring; semantic judgments remain upstream-owned. */
export interface ControllerVariableSemanticRuntimeBindingInterface {
  readonly analyze: (
    block: ControllerDataflowInput,
    parameterSemantics: ControllerParameterSemantics,
    judgment: LaravelControllerInvocationSemanticJudgmentInterface,
  ) => ControllerDataflowAnalysisOutcome<PhpControllerDataflowPayload>;
}

/** Compose the canonical upstream authorities without introducing a second semantic decision path. */
const analyzeControllerDataflowWithInvocationJudgmentImplementation = (
  block: ControllerDataflowInput,
  parameterSemantics: ControllerParameterSemantics,
  judgment: LaravelControllerInvocationSemanticJudgmentInterface,
): ControllerDataflowAnalysisOutcome<PhpControllerDataflowPayload> => createControllerDataflowAnalyzer(
  judgment,
  controllerDataflowSemanticJudgmentAuthority,
  phpControllerDataflowSourcePayloadEvidenceAdapter,
  (bindings) => createPhpControllerDataflowDefinitionProjectionAuthority({
    parameterSemantics: bindings,
    semanticAuthority: controllerVariableSemanticAuthority,
    expressionAuthority: phpAstExpressionSemanticAuthority,
    semanticResolutionInputAdapter: phpControllerVariableSemanticResolutionInputAdapter,
  }),
  phpAstSemanticKnowledgeEvidenceAdapter,
)(block, parameterSemantics);

export const controllerVariableSemanticRuntimeBinding: ControllerVariableSemanticRuntimeBindingInterface = Object.freeze({
  analyze: analyzeControllerDataflowWithInvocationJudgmentImplementation,
});
