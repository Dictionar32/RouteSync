/**
 * Canonical contract and declarative rules for semantic object identity.
 * Scanner modules provide typed data-flow evidence and consume these judgments;
 * they do not own alias inference rules.
 */
import type { KnowledgeId, SemanticKnowledgeDataFlow, SemanticPresence } from './semanticDataflowKnowledge';
import type { SemanticRelationPattern, SemanticRelationRewrite } from '../../semantic/relations/semanticRewriteEngine';
import type {
  SemanticRelationExecutionClosedJudgment,
  SemanticRelationExecutionIncompleteJudgment,
} from './semanticRewriteInterface';

export type SemanticAliasKind = 'must-alias' | 'may-alias' | 'no-alias';
export type SemanticModRefKind = 'mod' | 'ref' | 'mod-ref' | 'no-mod-ref';
export type SemanticIdentityRelation = 'assignment-reference' | 'may-alias' | 'identity-link' | 'alias-answer' | 'same-identity';
export type SemanticIdentityRewriteId =
  | 'assignment-reference:by-reference'
  | 'may-alias:symmetric-left'
  | 'may-alias:symmetric-right'
  | 'same-identity:must-alias'
  | 'identity-link:may-alias';

export interface SemanticAliasRelation {
  readonly left: KnowledgeId;
  readonly right: KnowledgeId;
  readonly kind: SemanticAliasKind;
  readonly evidence: readonly KnowledgeId[];
}

export interface SemanticObjectIdentity {
  readonly object: KnowledgeId;
  readonly aliases: readonly KnowledgeId[];
}

export interface SemanticModRefRelation {
  readonly accessor: KnowledgeId;
  readonly location: KnowledgeId;
  readonly kind: SemanticModRefKind;
  readonly alias: SemanticAliasKind;
}

export type SemanticObjectIdentityAnalysis =
  | Readonly<{
      readonly status: 'closed';
      readonly identities: readonly SemanticObjectIdentity[];
      readonly aliases: readonly SemanticAliasRelation[];
      readonly modRefs: readonly SemanticModRefRelation[];
      readonly proof: SemanticRelationExecutionClosedJudgment<SemanticIdentityRelation>;
    }>
  | Readonly<{
      readonly status: 'incomplete';
      readonly identities: readonly [];
      readonly aliases: readonly [];
      readonly modRefs: readonly [];
      readonly proof: SemanticRelationExecutionIncompleteJudgment<SemanticIdentityRelation>;
    }>;

export type SemanticAliasAssessment =
  | Readonly<{
      readonly status: 'resolved';
      readonly value: SemanticPresence<SemanticAliasKind>;
      readonly proof: SemanticRelationExecutionClosedJudgment<SemanticIdentityRelation>;
    }>
  | Readonly<{
      readonly status: 'incomplete';
      readonly proof: SemanticRelationExecutionIncompleteJudgment<SemanticIdentityRelation>;
    }>;

const identityRewrite = (
  id: SemanticIdentityRewriteId,
  priority: number,
  when: readonly SemanticRelationPattern<SemanticIdentityRelation>[],
  then: readonly SemanticRelationPattern<SemanticIdentityRelation>[],
): SemanticRelationRewrite<SemanticIdentityRelation> => Object.freeze({ id, priority, when: Object.freeze(when), then: Object.freeze(then) });

/** The alias inference policy is data in the upstream contract, not scanner control flow. */
export const SEMANTIC_OBJECT_IDENTITY_RULES: readonly SemanticRelationRewrite<SemanticIdentityRelation>[] = Object.freeze([
  identityRewrite('assignment-reference:by-reference', 0, [
    { relation: 'assignment-reference', arguments: [{ variable: 'target' }, { variable: 'value' }, 'by_reference'] },
  ], [
    { relation: 'may-alias', arguments: [{ variable: 'target' }, { variable: 'value' }] },
  ]),
  identityRewrite('may-alias:symmetric-left', 10, [
    { relation: 'may-alias', arguments: [{ variable: 'left' }, { variable: 'right' }] },
  ], [
    { relation: 'identity-link', arguments: [{ variable: 'left' }, { variable: 'right' }] },
  ]),
  identityRewrite('may-alias:symmetric-right', 10, [
    { relation: 'may-alias', arguments: [{ variable: 'left' }, { variable: 'right' }] },
  ], [
    { relation: 'identity-link', arguments: [{ variable: 'right' }, { variable: 'left' }] },
  ]),
  identityRewrite('same-identity:must-alias', 20, [
    { relation: 'same-identity', arguments: [{ variable: 'left' }, { variable: 'right' }] },
  ], [
    { relation: 'alias-answer', arguments: [{ variable: 'left' }, { variable: 'right' }, 'must-alias'] },
  ]),
  identityRewrite('identity-link:may-alias', 0, [
    { relation: 'identity-link', arguments: [{ variable: 'left' }, { variable: 'right' }] },
  ], [
    { relation: 'alias-answer', arguments: [{ variable: 'left' }, { variable: 'right' }, 'may-alias'] },
  ]),
]);

export interface SemanticObjectIdentityAuthorityInterface {
  readonly kind: 'semantic_object_identity_authority';
  readonly analyze: (model: SemanticKnowledgeDataFlow) => SemanticObjectIdentityAnalysis;
  readonly alias: (analysis: SemanticObjectIdentityAnalysis, left: KnowledgeId, right: KnowledgeId) => SemanticAliasAssessment;
}
