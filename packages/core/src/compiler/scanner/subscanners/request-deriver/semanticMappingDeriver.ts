/**
 * Upstream semantic mapper derivation.
 *
 * This is the only stage allowed to turn resolved Laravel response/request
 * semantics into mapper meaning. Mapper generators/projectors only consume the
 * closed contract and render it.
 */
import type { RequestType } from '../../../artifacts/RequestTypesArtifact';
import type { SemanticMappingContract } from '../../../../types/upstream/semanticMapping';
import { semanticReadMapperFromResource, semanticWriteMapperFromAction } from '../../../../types/upstream/semanticMapping';
import { semanticReasoningContract } from '../../../../types/upstream/semanticReasoning';
import { relationFold, relationProject, relationVariantFold } from '../../../../semantic/foundation/relationalSequence';

export function deriveSemanticMappingContract(requestTypes: readonly RequestType[]): SemanticMappingContract {
  const read = relationFold(requestTypes, [] as ReturnType<typeof semanticReadMapperFromResource>[], (state, requestType) =>
    relationVariantFold(
      requestType.response,
      'none',
      () => state,
      response => [...state, semanticReadMapperFromResource(
        requestType.identity.resource,
        relationProject(response.value.fields, field => ({ name: field.name, type: field.type })),
      )],
    ),
  );

  const write = relationFold(requestTypes, [] as ReturnType<typeof semanticWriteMapperFromAction>[], (state, requestType) =>
    relationFold(requestType.actions, state, (actions, action) => [...actions, semanticWriteMapperFromAction(
      requestType.identity.resource,
      action.name,
      requestType.identity.source.formType,
      action.fields,
    )]),
  );

  return Object.freeze({
    kind: 'semantic_mapping_contract',
    authority: 'upstream',
    reasoning: semanticReasoningContract('evidence_resolution'),
    evidence: Object.freeze({
      kind: 'semantic_mapping_evidence',
      closed: true,
      directions: Object.freeze(['read', 'write']),
    }),
    read: Object.freeze(read),
    write: Object.freeze(write),
    closed: true,
  });
}
