import { controllerVariableSemanticAuthority } from '../../../types/upstream/controllerVariableSemanticAuthority';
import { createControllerDataflowAnalyzer } from '../lexer/controllerDataflowAnalyzer';
import { controllerDataflowSemanticJudgmentAuthority } from '../../../types/upstream/controllerDataflowSemanticJudgmentAuthority';
import { phpAstExpressionSemanticAuthority } from '../lexer/routeAst/phpAstExpressionSemanticAuthority';

import { phpControllerDataflowSourcePayloadEvidenceAdapter } from '../lexer/routeAst/phpControllerDataflowSourcePayloadEvidenceAdapter';
import { phpControllerVariableSemanticResolutionInputAdapter } from './controllerVariableSemanticResolutionInputAdapter';
import { phpAstSemanticKnowledgeEvidenceAdapter } from '../lexer/routeAst/semanticKnowledgeDataFlowProducer';
import { createPhpControllerDataflowDefinitionProjectionAuthority } from '../lexer/routeAst/phpControllerDataflowDefinitionProjectionAuthority';
import type { LaravelControllerInvocationSemanticJudgmentInterface } from '../../../types/upstream/laravelControllerInvocationSemanticJudgmentInterface';

/** Existing expression authority shared with controller dependency evidence projection. */
export const controllerPhpAstExpressionSemanticAuthority = phpAstExpressionSemanticAuthority;

/** Scanner wiring injects the upstream semantic authority directly; no pass-through runtime wrapper. */
/** Execute source-evidence projection through one upstream-owned closed semantic judgment. */
export const analyzeControllerDataflowWithInvocationJudgment = (
  block: import('../lexer/phpAstTypes').PhpBlock,
  parameterSemantics: readonly (readonly [import('../lexer/phpAstTypes').AstIdentifier, import('../../../types/upstream/controller').ControllerVariableSemantic])[],
  judgment: LaravelControllerInvocationSemanticJudgmentInterface,
) => createControllerDataflowAnalyzer(
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
