import type { AstIdentifier, PhpBlock } from './phpAstTypes';
import type { LaravelControllerInvocationSemanticJudgmentInterface } from '../../../types/upstream/laravelControllerInvocationSemanticJudgmentInterface';
import type { SemanticKnowledgeEvidenceAdapter } from '../../../types/upstream/semanticKnowledgeEvidenceAdapterInterface';
import type { ControllerVariableSemantic } from '../../../types/upstream/controller';
import type {
  ControllerDataflowDefinitionProjectionAuthorityInterface,
  ControllerDataflowSemanticJudgmentAuthorityInterface,
} from '../../../types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface';
import type { ControllerDataflowSourcePayloadEvidenceAdapterInterface } from '../../../types/upstream/controllerDataflowSourcePayloadEvidenceAdapterInterface';
import type { PhpControllerDataflowPayload } from './routeAst/phpControllerDataflowSourcePayloadEvidenceAdapter';
import type { SemanticBinding } from '../../../types/upstream/semanticDataflowKnowledge';
import { controllerDataflowAnalysisOutcomeOperations, type ControllerDataflowAnalysisOutcome } from '../../../types/upstream/controllerDataflowAnalysisOutcomeInterface';

/** Source-evidence adapter boundary. All binding/identity reasoning is delegated to one upstream judgment authority. */
export const createControllerDataflowAnalyzer = (
  judgment: LaravelControllerInvocationSemanticJudgmentInterface,
  semanticJudgmentAuthority: ControllerDataflowSemanticJudgmentAuthorityInterface,
  sourcePayloadEvidenceAdapter: ControllerDataflowSourcePayloadEvidenceAdapterInterface<PhpBlock, PhpControllerDataflowPayload>,
  definitionProjectionAuthorityFor: (
    parameterSemantics: readonly (readonly [AstIdentifier, ControllerVariableSemantic])[],
  ) => ControllerDataflowDefinitionProjectionAuthorityInterface<SemanticBinding, PhpControllerDataflowPayload>,
  semanticKnowledgeEvidenceAdapter: SemanticKnowledgeEvidenceAdapter<PhpBlock>,
) => (
  block: PhpBlock,
  parameterSemantics: readonly (readonly [AstIdentifier, ControllerVariableSemantic])[] = [],
): ControllerDataflowAnalysisOutcome<PhpControllerDataflowPayload> => {
  // Bind one canonical source subject before collecting either evidence family.
  // The projection and payload evidence therefore inherit the exact subject retained
  // by the closed invocation judgment; the scanner does not rebuild identity from a path.
  const sourceFile = judgment.sourceFile;
  const semanticKnowledgeProjection = semanticKnowledgeEvidenceAdapter.project({
    kind: 'semantic_knowledge_evidence_projection_input',
    evidence: block,
    sourceFile,
  });
  const statementPayloads = sourcePayloadEvidenceAdapter.collect({
    kind: 'controller_dataflow_source_payload_evidence_input',
    sourceFile,
    source: block,
  });
  if (semanticKnowledgeProjection.productionOutcome.kind === 'blocked') {
    return controllerDataflowAnalysisOutcomeOperations.blocked({
      sourceFile,
      invocationJudgment: judgment,
      projection: semanticKnowledgeProjection.productionOutcome,
      semanticKnowledgeProjection,
      statementPayloads,
    });
  }
  const completeJudgment = semanticJudgmentAuthority.derive({
    kind: 'controller_dataflow_semantic_judgment_authority_input',
    sourceCorrelation: {
      kind: 'controller_dataflow_source_correlation',
      sourceFile,
      invocationJudgment: judgment,
      semanticKnowledgeProjection,
      statementPayloads,
    },
    definitionProjectionAuthority: definitionProjectionAuthorityFor(parameterSemantics),
  });
  return controllerDataflowAnalysisOutcomeOperations.completed(completeJudgment);
};
