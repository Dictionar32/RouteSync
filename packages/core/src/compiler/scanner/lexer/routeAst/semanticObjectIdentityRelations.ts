import { relationAll, relationEqual, relationResolve } from '../../../relational/sequence';
import type {
  KnowledgeId,
  SemanticAssignment,
  SemanticKnowledgeDataFlow,
  SemanticPresence,
} from './semanticKnowledgeDataFlowRelations';
import {
  knowledgeIdKey,
  semanticAbsent,
  semanticPresent,
} from './semanticKnowledgeDataFlowRelations';
import { solveSemanticRelations, type SemanticRelationRewrite } from './semanticRelationSolver';
import { typedDistinct, typedExpand, typedProject, typedRelation, typedSelect } from './semanticTypedRelation';

/** Phase 361 — object identity is a relational derivation, not an imperative index. */
export type SemanticAliasKind = 'must-alias' | 'may-alias' | 'no-alias';
export type SemanticModRefKind = 'mod' | 'ref' | 'mod-ref' | 'no-mod-ref';

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

export interface SemanticObjectIdentityAnalysis {
  readonly identities: readonly SemanticObjectIdentity[];
  readonly aliases: readonly SemanticAliasRelation[];
  readonly modRefs: readonly SemanticModRefRelation[];
}

type IdentityRelation = 'assignment-reference' | 'may-alias' | 'identity-link' | 'alias-answer' | 'same-identity';

type AssignmentFact = Extract<SemanticKnowledgeDataFlow['facts'][number], { readonly kind: 'assignment' }>;

const isAssignmentFact = (
  fact: SemanticKnowledgeDataFlow['facts'][number],
): fact is AssignmentFact => relationEqual(fact.kind, 'assignment');

const pairKey = (left: KnowledgeId, right: KnowledgeId): string => {
  const leftKey = knowledgeIdKey(left);
  const rightKey = knowledgeIdKey(right);
  return relationResolve(
    leftKey <= rightKey,
    () => `${leftKey}::${rightKey}`,
    () => `${rightKey}::${leftKey}`,
  );
};

const IDENTITY_REWRITES: readonly SemanticRelationRewrite<IdentityRelation>[] = Object.freeze([
  Object.freeze({
    id: 'assignment-reference:by-reference',
    priority: 0,
    when: Object.freeze([{ relation: 'assignment-reference', arguments: [{ variable: 'target' }, { variable: 'value' }, 'by_reference'] }]),
    then: Object.freeze([{ relation: 'may-alias', arguments: [{ variable: 'target' }, { variable: 'value' }] }]),
  }),
  Object.freeze({
    id: 'may-alias:symmetric-left',
    priority: 10,
    when: Object.freeze([{ relation: 'may-alias', arguments: [{ variable: 'left' }, { variable: 'right' }] }]),
    then: Object.freeze([{ relation: 'identity-link', arguments: [{ variable: 'left' }, { variable: 'right' }] }]),
  }),
  Object.freeze({
    id: 'may-alias:symmetric-right',
    priority: 10,
    when: Object.freeze([{ relation: 'may-alias', arguments: [{ variable: 'left' }, { variable: 'right' }] }]),
    then: Object.freeze([{ relation: 'identity-link', arguments: [{ variable: 'right' }, { variable: 'left' }] }]),
  }),
  Object.freeze({
    id: 'same-identity:must-alias',
    priority: 20,
    when: Object.freeze([{ relation: 'same-identity', arguments: [{ variable: 'left' }, { variable: 'right' }] }]),
    then: Object.freeze([{ relation: 'alias-answer', arguments: [{ variable: 'left' }, { variable: 'right' }, 'must-alias'] }]),
  }),
  Object.freeze({
    id: 'identity-link:may-alias',
    priority: 0,
    when: Object.freeze([{ relation: 'identity-link', arguments: [{ variable: 'left' }, { variable: 'right' }] }]),
    then: Object.freeze([{ relation: 'alias-answer', arguments: [{ variable: 'left' }, { variable: 'right' }, 'may-alias'] }]),
  }),
]);

const assignmentFacts = (model: SemanticKnowledgeDataFlow): readonly AssignmentFact[] =>
  typedSelect(typedRelation(model.facts), isAssignmentFact).tuples;

const assignmentRelations = (assignments: readonly SemanticAssignment[]) =>
  typedProject(
    typedRelation(assignments),
    assignment => ({
      relation: 'assignment-reference',
      arguments: [knowledgeIdKey(assignment.target), knowledgeIdKey(assignment.value), assignment.reference.code],
    }),
  ).tuples;

const solvedIdentityRelations = (assignments: readonly SemanticAssignment[]) =>
  solveSemanticRelations<IdentityRelation>(
    assignmentRelations(assignments),
    IDENTITY_REWRITES,
  );

const aliasAssignments = (model: SemanticKnowledgeDataFlow): readonly SemanticAssignment[] => {
  const assignments = typedProject(typedRelation(assignmentFacts(model)), fact => fact.value).tuples;
  const solved = solvedIdentityRelations(assignments);
  const aliases = typedProject(
    typedSelect(
      typedRelation(solved),
      fact => relationAll([relationEqual(fact.relation, 'may-alias'), relationEqual(fact.arguments.length, 2)]),
    ),
    fact => `${fact.arguments[0]}::${fact.arguments[1]}`,
  ).tuples;
  return typedSelect(
    typedRelation(assignments),
    assignment => aliases.includes(`${knowledgeIdKey(assignment.target)}::${knowledgeIdKey(assignment.value)}`),
  ).tuples;
};

type PresentKnowledgeId = Extract<SemanticPresence<KnowledgeId>, { readonly kind: 'present' }>;

const objectForKey = (
  objects: readonly KnowledgeId[],
  key: string,
): SemanticPresence<KnowledgeId> => {
  const candidates = typedSelect(
    typedRelation(objects),
    object => relationEqual(knowledgeIdKey(object), key),
  ).tuples;
  return relationResolve(
    candidates.length > 0,
    () => semanticPresent(candidates[0]),
    () => semanticAbsent('not_provided'),
  );
};

const isPresentKnowledgeId = (
  value: SemanticPresence<KnowledgeId>,
): value is PresentKnowledgeId => relationEqual(value.kind, 'present');

export const analyzeSemanticObjectIdentity = (
  model: SemanticKnowledgeDataFlow,
): SemanticObjectIdentityAnalysis => {
  const assignments = aliasAssignments(model);
  const objects = typedExpand(
    typedRelation(assignments),
    assignment => typedRelation([assignment.target, assignment.value]),
  ).tuples;
  const solved = solveSemanticRelations<IdentityRelation>(
    typedProject(
      typedRelation(assignments),
      assignment => ({
        relation: 'may-alias',
        arguments: [knowledgeIdKey(assignment.target), knowledgeIdKey(assignment.value)],
      }),
    ).tuples,
    IDENTITY_REWRITES,
  );
  const links = typedSelect(
    typedRelation(solved),
    fact => relationAll([relationEqual(fact.relation, 'identity-link'), relationEqual(fact.arguments.length, 2)]),
  ).tuples;
  const resolvedLinks = typedProject(
    typedRelation(links),
    fact => ({
      fact,
      left: objectForKey(objects, String(fact.arguments[0])),
      right: objectForKey(objects, String(fact.arguments[1])),
    }),
  );
  const presentLinks = typedSelect(
    resolvedLinks,
    entry => relationAll([isPresentKnowledgeId(entry.left), isPresentKnowledgeId(entry.right)]),
  );
  const aliasEntries = typedProject(
    presentLinks,
    entry => {
      const left = entry.left.value;
      const right = entry.right.value;
      return [
        pairKey(left, right),
        {
          left,
          right,
          kind: 'may-alias',
          evidence: Object.freeze(
            typedProject(
              typedSelect(
                typedRelation(assignments),
                assignment => relationEqual(pairKey(assignment.target, assignment.value), pairKey(left, right)),
              ),
              assignment => assignment.id,
            ).tuples,
          ),
        },
      ];
    },
  ).tuples;
  const aliases = typedProject(
    typedDistinct(typedRelation(aliasEntries), entry => entry[0]),
    entry => entry[1],
  ).tuples;
  const identities = typedProject(
    typedRelation(objects),
    object => Object.freeze({
      object,
      aliases: Object.freeze(
        typedProject(
          typedSelect(
            typedProject(
              typedSelect(
                typedRelation(links),
                fact => relationEqual(fact.arguments[0], knowledgeIdKey(object)),
              ),
              fact => objectForKey(objects, String(fact.arguments[1])),
            ),
            isPresentKnowledgeId,
          ),
          entry => entry.value,
        ).tuples,
      ),
    } satisfies SemanticObjectIdentity),
  ).tuples;
  return Object.freeze({
    identities: Object.freeze(identities),
    aliases: Object.freeze(typedProject(typedRelation(aliases), relation => Object.freeze(relation)).tuples),
    modRefs: Object.freeze([]),
  });
};

export const semanticAlias = (
  analysis: SemanticObjectIdentityAnalysis,
  left: KnowledgeId,
  right: KnowledgeId,
): SemanticPresence<SemanticAliasKind> => {
  const solved = solveSemanticRelations<IdentityRelation>([
    { relation: 'same-identity', arguments: [knowledgeIdKey(left), knowledgeIdKey(right)] },
    ...typedProject(
      typedRelation(analysis.aliases),
      relation => ({
        relation: 'may-alias',
        arguments: [knowledgeIdKey(relation.left), knowledgeIdKey(relation.right)],
      }),
    ).tuples,
  ], IDENTITY_REWRITES);
  const answers = typedSelect(
    typedRelation(solved),
    fact => relationAll([relationEqual(fact.relation, 'alias-answer'),
        relationEqual(fact.arguments[0], knowledgeIdKey(left)),
        relationEqual(fact.arguments[1], knowledgeIdKey(right)),
      ]),
  ).tuples;
  return relationResolve(
    answers.length > 0,
    () => relationResolve(
      relationEqual(answers[0].arguments[2], 'must-alias'),
      () => semanticPresent('must-alias'),
      () => semanticPresent('may-alias'),
    ),
    () => semanticAbsent('not_provided'),
  );
};
