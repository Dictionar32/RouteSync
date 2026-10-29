/**
 * Upstream semantic mapper derivation.
 *
 * This is the only stage allowed to turn resolved Laravel response/request
 * semantics into mapper meaning. Mapper generators/projectors only consume the
 * closed contract and render it.
 */
import type { RequestType } from '../../artifacts/RequestTypesArtifact';
import type { SemanticMappingContract } from '../../../types/upstream/semanticMapping';
import { semanticMappingRuntimeOperations } from '../../../types/upstream/semanticMapping';
import { semanticReasoningContract } from '../../../types/upstream/semanticReasoning';
import { relationFold, relationProject, relationVariantFold } from '../../../semantic/relations/relationalSequence';

const deriveSemanticMappingContractImplementation = (requestTypes: readonly RequestType[]): SemanticMappingContract => {
  const read = relationFold(requestTypes, [] as ReturnType<typeof semanticMappingRuntimeOperations.readMapperFromResource>[], (state, requestType) =>
    relationVariantFold(
      requestType.response,
      'none',
      () => state,
      response => [...state, semanticMappingRuntimeOperations.readMapperFromResource(
        requestType.identity.resource,
        relationProject(response.value.fields, field => ({ name: field.name, type: field.type })),
      )],
    ),
  );

  const write = relationFold(requestTypes, [] as ReturnType<typeof semanticMappingRuntimeOperations.writeMapperFromAction>[], (state, requestType) =>
    relationFold(requestType.actions, state, (actions, action) => [...actions, semanticMappingRuntimeOperations.writeMapperFromAction(
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



/** Public semantic contract for deriving mapper meaning from closed request-type evidence. */
export interface SemanticMappingContractDerivationInterface {
  readonly derive: (requestTypes: readonly RequestType[]) => SemanticMappingContract;
}

export const semanticMappingContractDerivation: SemanticMappingContractDerivationInterface = Object.freeze({
  derive: deriveSemanticMappingContractImplementation,
});
