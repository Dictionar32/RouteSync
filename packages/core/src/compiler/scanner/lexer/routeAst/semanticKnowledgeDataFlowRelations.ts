/**
 * Compatibility facade for the scanner's historical semantic knowledge path.
 * Canonical semantic vocabulary is owned by types/upstream.
 * Scanner-specific closure/relation projections remain wiring compatibility.
 */
export * from '../../../../types/upstream/semanticDataflowKnowledge';

import type { SemanticClosureResult } from './semanticClosureEngine';
import type { SemanticTheoryFact } from './semanticRelationTheory';
import type {
  SemanticKnowledgeDataFlow as CanonicalSemanticKnowledgeDataFlow,
  SemanticDataFlowEdge,
} from '../../../../types/upstream/semanticDataflowKnowledge';
import { relationContains, relationUnique } from '../../../../semantic/foundation/relationMembership';
import { relationAll, relationAny, relationEqual, relationNotEqual, relationResolve } from '../../../relational/sequence';
import { typedDistinct, typedProject, typedRelation, typedSelect } from './semanticTypedRelation';
import { knowledgeIdKey } from '../../../../types/upstream/semanticDataflowKnowledge';

/** Legacy scanner projection; not an upstream semantic authority. */
export interface SemanticKnowledgeDataFlow extends CanonicalSemanticKnowledgeDataFlow {
  readonly semanticRelations?: readonly SemanticTheoryFact[];
  readonly semanticClosure?: SemanticClosureResult;
}

export interface SemanticKnowledgeDataFlowWiringInterface {
  readonly validate: (dataFlow: SemanticKnowledgeDataFlow) => void;
}

const validate = (dataFlow: SemanticKnowledgeDataFlow): void => {
  const fail = (message: string) => { throw Error(message); };
  const facts = typedRelation(dataFlow.facts);
  const factKeys = typedProject(facts, fact => knowledgeIdKey(fact.value.id)).tuples;
  const uniqueFactKeys = relationUnique(typedDistinct(typedRelation(factKeys), key => key).tuples);
  relationResolve(relationNotEqual(factKeys.length, uniqueFactKeys.length), () => fail('Duplicate semantic knowledge identity detected'), () => { });
  const unknownFlowEndpoint = typedSelect(typedRelation(dataFlow.dataFlow), flow => relationAny([relationEqual(relationContains(uniqueFactKeys, knowledgeIdKey(flow.source)), false), relationEqual(relationContains(uniqueFactKeys, knowledgeIdKey(flow.target)), false)])).tuples;
  relationResolve(unknownFlowEndpoint.length > 0, () => fail(`Semantic data-flow fact references unknown knowledge: ${knowledgeIdKey(unknownFlowEndpoint[0].source)} -> ${knowledgeIdKey(unknownFlowEndpoint[0].target)}`), () => { });
  const selfReferences = typedSelect(typedRelation(dataFlow.dataFlow), flow => relationEqual(knowledgeIdKey(flow.source), knowledgeIdKey(flow.target))).tuples;
  relationResolve(selfReferences.length > 0, () => fail(`Semantic data-flow fact cannot self-reference: ${knowledgeIdKey(selfReferences[0].source)}`), () => { });
  const unknownGuards = typedSelect(typedRelation(dataFlow.dataFlow), flow => flow.guard.kind === 'present' && relationEqual(relationContains(uniqueFactKeys, knowledgeIdKey(flow.guard.value.predicate)), false)).tuples;
  relationResolve(unknownGuards.length > 0, () => fail(`Semantic data-flow guard references unknown predicate: ${knowledgeIdKey(unknownGuards[0].guard.kind === 'present' ? unknownGuards[0].guard.value.predicate : unknownGuards[0].source)}`), () => { });
  const unsupportedRelations = typedSelect(typedRelation(dataFlow.relations), edge => relationEqual(typedSelect(typedRelation(dataFlow.dataFlow), flow => relationAll([
    relationEqual(knowledgeIdKey(flow.source), knowledgeIdKey(edge.from)),
    relationEqual(knowledgeIdKey(flow.target), knowledgeIdKey(edge.to)),
    relationEqual(relationResolve(relationEqual(flow.kind, 'dependency'), () => 'depends_on', () => 'flows_to'), edge.relation.code),
    relationEqual(flow.role.code, edge.role.code),
  ])).tuples.length, 0)).tuples;
  relationResolve(unsupportedRelations.length > 0, () => fail(`Derived relation is not backed by canonical data-flow: ${knowledgeIdKey(unsupportedRelations[0].from)} -> ${knowledgeIdKey(unsupportedRelations[0].to)} (${unsupportedRelations[0].role.code})`), () => { });
};

export const semanticKnowledgeDataFlowWiring: SemanticKnowledgeDataFlowWiringInterface = Object.freeze({ validate });
export const validateSemanticKnowledgeDataFlow = semanticKnowledgeDataFlowWiring.validate;
