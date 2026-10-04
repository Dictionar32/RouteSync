import { relationAll, relationEqual, relationResolve } from '../../../relational/sequence';
import type { SemanticRelation } from './semanticRewriteEngine';
import type { SemanticRelationAtom } from './semanticRelationalAlgebra';
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
  semanticPresenceFold,
} from './semanticKnowledgeDataFlowRelations';
import { solveSemanticRelations, type SemanticRelationPattern, type SemanticRelationRewrite } from './semanticRewriteEngine';
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
type IdentityRewriteId =
  | 'assignment-reference:by-reference'
  | 'may-alias:symmetric-left'
  | 'may-alias:symmetric-right'
  | 'same-identity:must-alias'
  | 'identity-link:may-alias';

type AssignmentFact = Extract<SemanticKnowledgeDataFlow['facts'][number], { readonly kind: 'assignment' }>;

const isAssignmentFact = (
  fact: SemanticKnowledgeDataFlow['facts'][number],
): fact is AssignmentFact => relationEqual(fact.kind, 'assignment');

const pair = <A, B>(left: A, right: B): readonly [A, B] => [left, right];

const pairKey = (left: KnowledgeId, right: KnowledgeId): string => {
  const leftKey = knowledgeIdKey(left);
  const rightKey = knowledgeIdKey(right);
  return relationResolve(
    leftKey <= rightKey,
    () => `${leftKey}::${rightKey}`,
    () => `${rightKey}::${leftKey}`,
  );
};

const identityRewrite = (
  id: IdentityRewriteId,
  priority: number,
  when: readonly SemanticRelationPattern<IdentityRelation>[],
  then: readonly SemanticRelationPattern<IdentityRelation>[],
): SemanticRelationRewrite<IdentityRelation> => Object.freeze({ id, priority, when: Object.freeze(when), then: Object.freeze(then) });

const identityRelation = (
  relation: IdentityRelation,
  arguments_: readonly SemanticRelationAtom[],
): SemanticRelation<IdentityRelation> => Object.freeze({ relation, arguments: Object.freeze(arguments_) });

const IDENTITY_REWRITES: readonly SemanticRelationRewrite<IdentityRelation>[] = Object.freeze([
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

const assignmentFacts = (model: SemanticKnowledgeDataFlow): readonly AssignmentFact[] =>
  typedSelect(typedRelation(model.facts), isAssignmentFact).tuples;

const assignmentRelations = (assignments: readonly SemanticAssignment[]): readonly SemanticRelation<IdentityRelation>[] =>
  typedProject(
    typedRelation(assignments),
    assignment => identityRelation(
      'assignment-reference',
      [knowledgeIdKey(assignment.target), knowledgeIdKey(assignment.value), assignment.reference.code],
    ),
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
      assignment => ({ relation: 'may-alias', arguments: [knowledgeIdKey(assignment.target), knowledgeIdKey(assignment.value)] } satisfies SemanticRelation<'may-alias'>),
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
    (entry): entry is { readonly fact: SemanticRelation<IdentityRelation>; readonly left: PresentKnowledgeId; readonly right: PresentKnowledgeId } => relationAll([isPresentKnowledgeId(entry.left), isPresentKnowledgeId(entry.right)]),
  );
  const aliasEntries: readonly (readonly [string, SemanticAliasRelation])[] = typedProject(
    presentLinks,
    entry => {
      const left = entry.left.value;
      const right = entry.right.value;
      const evidence = Object.freeze(typedProject(typedSelect(typedRelation(assignments), assignment => relationEqual(pairKey(assignment.target, assignment.value), pairKey(left, right))), assignment => assignment.id).tuples);
      return pair(pairKey(left, right), { left, right, kind: 'may-alias', evidence } satisfies SemanticAliasRelation);
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
    { relation: 'same-identity', arguments: [knowledgeIdKey(left), knowledgeIdKey(right)] } satisfies SemanticRelation<'same-identity'>,
    ...typedProject(typedRelation(analysis.aliases), relation => ({ relation: 'may-alias', arguments: [knowledgeIdKey(relation.left), knowledgeIdKey(relation.right)] } satisfies SemanticRelation<'may-alias'>)).tuples,
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
