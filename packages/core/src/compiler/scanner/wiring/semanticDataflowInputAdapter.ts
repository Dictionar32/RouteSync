/** Converts scanner-local semantic knowledge into the canonical upstream dataflow input. */
import type { SourceSpan } from '../../../types/upstream/provenance';
import type {
  SemanticDataflowIdentity,
  SemanticDataflowInput,
  SemanticDataflowGuard,
} from '../../../types/upstream/semanticDataflow';
import { stringValue, numberValue } from '../../../types/upstream/valueObjects';
import type { SemanticDataFlowFact, SemanticKnowledgeDataFlow } from '../lexer/routeAst/semanticKnowledgeDataFlowRelations';
import { relationVariantFold, relationResolve } from '../../../semantic/foundation/relationalSequence';
import { relationEqual } from '../../../semantic/foundation/semanticRelations';
import { semanticDataflowInputProducer, type SemanticDataflowEvidence } from '../../../types/upstream/semanticDataflowInputFactory';

const identity = (factIdentity: SemanticDataFlowFact['source']): SemanticDataflowIdentity => {
  const source: SourceSpan = Object.freeze({
    kind: 'source_span',
    file: Object.freeze({ kind: 'source_file', value: stringValue(factIdentity.identity.source.filePath.value) }),
    start: numberValue(factIdentity.identity.source.span.start.value),
    end: numberValue(factIdentity.identity.source.span.end.value),
  });
  return Object.freeze({
    kind: 'semantic_dataflow_identity',
    source,
    role: factIdentity.identity.role,
    slot: stringValue(factIdentity.identity.slot.value),
  });
};

const guard = (fact: SemanticDataFlowFact): SemanticDataflowGuard | undefined =>
  relationVariantFold(fact.guard, 'present', () => undefined, value => Object.freeze({ predicate: identity(value.value.predicate), polarity: value.value.polarity }));

const canonicalFactKind = (kind: SemanticDataFlowFact['kind']): 'dependency' | 'value_flow' =>
  relationResolve(relationEqual(kind, 'dependency'), () => 'dependency', () => 'value_flow');

export const createSemanticDataflowInput = (
  node: SemanticDataflowIdentity,
  source: SourceSpan,
  knowledge: SemanticKnowledgeDataFlow,
  producer: 'route' | 'controller',
): SemanticDataflowInput => {
  const evidence: SemanticDataflowEvidence = Object.freeze({
    node,
    source,
    facts: Object.freeze(knowledge.dataFlow.map(fact => ({
      kind: canonicalFactKind(fact.kind),
      source: identity(fact.source),
      target: identity(fact.target),
      role: fact.role.code,
      guard: guard(fact),
    }))),
    producer,
  });
  return semanticDataflowInputProducer.create(evidence);
};
