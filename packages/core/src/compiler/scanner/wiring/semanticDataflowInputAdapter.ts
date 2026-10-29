/** Converts scanner-local semantic knowledge into the canonical upstream dataflow input. */
import type { SourceSpan } from '../../../types/upstream/provenance';
import type {
  SemanticDataflowIdentity,
  SemanticDataflowInput,
  SemanticDataflowGuard,
} from '../../../types/upstream/semanticDataflow';
import type { SemanticDataflowRuntimeExecutionRequest } from '../../../types/upstream/semanticDataflowInterface';
import { stringValue, numberValue } from '../../../types/upstream/valueObjects';
import type { KnowledgeId, SemanticDataFlowFact, SemanticKnowledgeDataFlow } from '../../frontend/php/routeAst/semanticKnowledgeDataFlowRelations';
import { relationVariantFold, relationResolve } from '../../../semantic/relations/relationalSequence';
import { relationEqual } from '../../../semantic/relations/semanticRelations';
import { semanticDataflowInputProducer, type SemanticDataflowEvidence, type SemanticDataflowInputProducerInterface } from '../../../types/upstream/semanticDataflowInputFactory';

const identity = (factIdentity: SemanticDataFlowFact['source']): SemanticDataflowIdentity => {
  const source: SourceSpan = Object.freeze({
    kind: 'source_span',
    file: Object.freeze({ kind: 'source_file', value: stringValue.create(factIdentity.identity.source.filePath.value) }),
    start: numberValue(factIdentity.identity.source.span.start.value),
    end: numberValue(factIdentity.identity.source.span.end.value),
  });
  return Object.freeze({
    kind: 'semantic_dataflow_identity',
    source,
    role: factIdentity.identity.role,
    slot: stringValue.create(factIdentity.identity.slot.value),
  });
};


const sourceSpanOf = (knowledgeId: KnowledgeId): SourceSpan => Object.freeze({
  kind: 'source_span',
  file: Object.freeze({ kind: 'source_file', value: stringValue.create(knowledgeId.identity.source.filePath.value) }),
  start: numberValue(knowledgeId.identity.source.span.start.value),
  end: numberValue(knowledgeId.identity.source.span.end.value),
});

const guard = (fact: SemanticDataFlowFact): SemanticDataflowGuard | undefined =>
  relationVariantFold(fact.guard, 'present', () => undefined, value => Object.freeze({ predicate: identity(value.value.predicate), polarity: value.value.polarity }));

const canonicalFactKind = (kind: SemanticDataFlowFact['kind']): 'dependency' | 'value_flow' =>
  relationResolve(relationEqual(kind, 'dependency'), () => 'dependency', () => 'value_flow');

export interface SemanticDataflowInputAdapterInterface {
  readonly kind: 'semantic_dataflow_input_adapter';
  readonly create: (
    node: SemanticDataflowIdentity,
    source: SourceSpan,
    knowledge: SemanticKnowledgeDataFlow,
    producer: 'route' | 'controller',
  ) => SemanticDataflowInput;
}

export interface SemanticDataflowInputAdapterOperationsInterface {
  readonly createAdapter: (
    producer: SemanticDataflowInputProducerInterface,
  ) => SemanticDataflowInputAdapterInterface;
  readonly createInput: (
    node: SemanticDataflowIdentity,
    source: SourceSpan,
    knowledge: SemanticKnowledgeDataFlow,
    producer: 'route' | 'controller',
  ) => SemanticDataflowInput;
  readonly runtimeRequestFromKnowledge: (
    knowledge: SemanticKnowledgeDataFlow,
  ) => SemanticDataflowRuntimeExecutionRequest;
}

/** Runtime operations are exposed as one explicitly typed authority object. */
export const semanticDataflowInputAdapterOperations: SemanticDataflowInputAdapterOperationsInterface = Object.freeze({
  createAdapter: (producer: SemanticDataflowInputProducerInterface): SemanticDataflowInputAdapterInterface => Object.freeze({
    kind: 'semantic_dataflow_input_adapter',
    create: (
      node: SemanticDataflowIdentity,
      source: SourceSpan,
      knowledge: SemanticKnowledgeDataFlow,
      producerKind: 'route' | 'controller',
    ): SemanticDataflowInput => {
      const evidence: SemanticDataflowEvidence = Object.freeze({
        node,
        source,
        facts: Object.freeze(knowledge.dataFlow.map((fact: SemanticDataFlowFact) => ({
          kind: canonicalFactKind(fact.kind),
          source: identity(fact.source),
          target: identity(fact.target),
          role: fact.role.code,
          guard: guard(fact),
        }))),
        producer: producerKind,
      });
      return producer.create(evidence);
    },
  }),
  createInput: (
    node: SemanticDataflowIdentity,
    source: SourceSpan,
    knowledge: SemanticKnowledgeDataFlow,
    producer: 'route' | 'controller',
  ): SemanticDataflowInput => semanticDataflowInputAdapter.create(node, source, knowledge, producer),
  runtimeRequestFromKnowledge: (knowledge: SemanticKnowledgeDataFlow): SemanticDataflowRuntimeExecutionRequest => {
    const anchor = knowledge.dataFlow[0]?.source ?? knowledge.facts[0]?.value.id;
    if (!anchor) {
      return Object.freeze({
        kind: 'semantic_dataflow_execution_request',
        input: Object.freeze({ kind: 'no_evidence', reason: 'no_dataflow_facts' }),
      });
    }

    return Object.freeze({
      kind: 'semantic_dataflow_execution_request',
      input: Object.freeze({
        kind: 'evidence_input',
        value: semanticDataflowInputAdapterOperations.createInput(identity(anchor), sourceSpanOf(anchor), knowledge, 'route'),
      }),
    });
  },
});

export const semanticDataflowInputAdapter: SemanticDataflowInputAdapterInterface = semanticDataflowInputAdapterOperations.createAdapter(semanticDataflowInputProducer);

