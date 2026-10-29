/** Concrete effect operations and explicit unresolved callable-effect evidence. */
import type { KnowledgeId, SemanticAssignment, SemanticModRefFact, SemanticModRefRelation, SemanticSource } from './semanticDataflowKnowledge';

export type SemanticModRefBlocker = SemanticModRefFact;

export interface SemanticModRefEffectFactoryInterface {
  readonly assignmentEffects: (assignment: SemanticAssignment) => readonly SemanticModRefRelation[];
  readonly invocationBlocker: (fact: KnowledgeId, source: SemanticSource) => SemanticModRefBlocker;
  readonly accessRead: (fact: KnowledgeId, location: KnowledgeId, source: SemanticSource) => SemanticModRefRelation;
  readonly unsetWrite: (fact: KnowledgeId, location: KnowledgeId, source: SemanticSource) => SemanticModRefRelation;
}

export interface SemanticModRefFactOperationsInterface {
  readonly blockers: (facts: readonly SemanticModRefFact[]) => readonly SemanticModRefBlocker[];
}

export const semanticModRefEffectFactory: SemanticModRefEffectFactoryInterface = Object.freeze({
  assignmentEffects: (assignment: SemanticAssignment): readonly SemanticModRefRelation[] => assignment.operator.effect.projection.project(assignment),
  invocationBlocker: (fact: KnowledgeId, source: SemanticSource): SemanticModRefBlocker => Object.freeze({ kind: 'invocation_effect_summary_unmodeled', fact, source }),
  accessRead: (fact: KnowledgeId, location: KnowledgeId, source: SemanticSource): SemanticModRefRelation => Object.freeze({ accessor: fact, location, kind: 'ref', alias: 'must-alias', source }),
  unsetWrite: (fact: KnowledgeId, location: KnowledgeId, source: SemanticSource): SemanticModRefRelation => Object.freeze({ accessor: fact, location, kind: 'mod', alias: 'must-alias', source }),
});

const blockers: SemanticModRefFactOperationsInterface['blockers'] = (facts) => Object.freeze([...facts]);

export const semanticModRefFactOperations: SemanticModRefFactOperationsInterface = Object.freeze({ blockers });
