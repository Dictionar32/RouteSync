/** Upstream implementation of the semantic object-identity authority. */
import { relationAll, relationEqual, relationFirstOption, relationOptionFold, relationResolve } from '../../compiler/relational/sequence';
import type { SemanticRelation, SemanticRelationAtom } from '../../semantic/relations/semanticRewriteEngine';
import { semanticRewriteAuthority } from './semanticRewriteAuthority';
import type {
  KnowledgeId,
  SemanticAssignment,
  SemanticKnowledgeDataFlow,
  SemanticPresence,
} from './semanticDataflowKnowledge';
import {
  knowledgeIdKey,
  semanticAbsent,
  semanticPresent,
} from './semanticDataflowKnowledge';
import type {
  SemanticAliasAssessment,
  SemanticAliasKind,
  SemanticAliasRelation,
  SemanticIdentityRelation,
  SemanticObjectIdentity,
  SemanticObjectIdentityAnalysis,
  SemanticObjectIdentityAuthorityInterface,
} from './semanticObjectIdentityInterface';
import { SEMANTIC_OBJECT_IDENTITY_RULES } from './semanticObjectIdentityInterface';
import { typedDistinct, typedExpand, typedProject, typedRelation, typedSelect } from './semanticTypedRelation';

type AssignmentFact = Extract<SemanticKnowledgeDataFlow['facts'][number], { readonly kind: 'assignment' }>;
type PresentKnowledgeId = Extract<SemanticPresence<KnowledgeId>, { readonly kind: 'present' }>;

const isAssignmentFact = (fact: SemanticKnowledgeDataFlow['facts'][number]): fact is AssignmentFact => relationEqual(fact.kind, 'assignment');
const isPresentKnowledgeId = (value: SemanticPresence<KnowledgeId>): value is PresentKnowledgeId => relationEqual(value.kind, 'present');
const pair = <A, B>(left: A, right: B): readonly [A, B] => [left, right];

const pairKey = (left: KnowledgeId, right: KnowledgeId): string => {
  const leftKey = knowledgeIdKey(left);
  const rightKey = knowledgeIdKey(right);
  return relationResolve(leftKey <= rightKey, () => `${leftKey}::${rightKey}`, () => `${rightKey}::${leftKey}`);
};

const identityRelation = (
  relation: SemanticIdentityRelation,
  arguments_: readonly SemanticRelationAtom[],
): SemanticRelation<SemanticIdentityRelation> => Object.freeze({ relation, arguments: Object.freeze(arguments_) });

const emptyTuple: readonly [] = [];

const assignmentFacts = (model: SemanticKnowledgeDataFlow): readonly AssignmentFact[] =>
  typedSelect(typedRelation(model.facts), isAssignmentFact).tuples;

const assignmentRelations = (assignments: readonly SemanticAssignment[]): readonly SemanticRelation<SemanticIdentityRelation>[] =>
  typedProject(
    typedRelation(assignments),
    assignment => identityRelation(
      'assignment-reference',
      [knowledgeIdKey(assignment.target), knowledgeIdKey(assignment.value), assignment.reference.code],
    ),
  ).tuples;

const solvedIdentityRelations = (seeds: readonly SemanticRelation<SemanticIdentityRelation>[]) =>
  semanticRewriteAuthority.resolveRelations({
    kind: 'semantic_relation_execution_request',
    seeds,
    rules: SEMANTIC_OBJECT_IDENTITY_RULES,
    maxRounds: 1024,
  });

const objectForKey = (objects: readonly KnowledgeId[], key: string): SemanticPresence<KnowledgeId> => {
  const candidates = typedSelect(typedRelation(objects), object => relationEqual(knowledgeIdKey(object), key)).tuples;
  return relationOptionFold(relationFirstOption(candidates, () => true), () => semanticAbsent('not_provided'), candidate => semanticPresent(candidate));
};

export const analyzeSemanticObjectIdentity = (model: SemanticKnowledgeDataFlow): SemanticObjectIdentityAnalysis => {
  const assignments = typedProject(typedRelation(assignmentFacts(model)), fact => fact.value).tuples;
  const initial = solvedIdentityRelations(assignmentRelations(assignments));
  if (initial.status === 'incomplete') {
    return Object.freeze({ status: 'incomplete', identities: emptyTuple, aliases: emptyTuple, modRefs: emptyTuple, proof: initial });
  }

  const aliasPairs = typedProject(
    typedSelect(typedRelation(initial.facts), fact => relationAll([
      relationEqual(fact.relation, 'may-alias'),
      relationEqual(fact.arguments.length, 2),
    ])),
    fact => `${String(fact.arguments[0])}::${String(fact.arguments[1])}`,
  ).tuples;
  const aliasAssignments = typedSelect(
    typedRelation(assignments),
    assignment => aliasPairs.includes(`${knowledgeIdKey(assignment.target)}::${knowledgeIdKey(assignment.value)}`),
  ).tuples;
  const objects = typedExpand(
    typedRelation(aliasAssignments),
    assignment => typedRelation([assignment.target, assignment.value]),
  ).tuples;
  const links = typedSelect(
    typedRelation(initial.facts),
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
    (entry): entry is { readonly fact: SemanticRelation<SemanticIdentityRelation>; readonly left: PresentKnowledgeId; readonly right: PresentKnowledgeId } =>
      relationAll([isPresentKnowledgeId(entry.left), isPresentKnowledgeId(entry.right)]),
  );
  const aliasEntries: readonly (readonly [string, SemanticAliasRelation])[] = typedProject(
    presentLinks,
    entry => {
      const left = entry.left.value;
      const right = entry.right.value;
      const evidence = Object.freeze(typedProject(
        typedSelect(typedRelation(aliasAssignments), assignment => relationEqual(pairKey(assignment.target, assignment.value), pairKey(left, right))),
        assignment => assignment.id,
      ).tuples);
      return pair(pairKey(left, right), { left, right, kind: 'may-alias', evidence } satisfies SemanticAliasRelation);
    },
  ).tuples;
  const aliases = typedProject(typedDistinct(typedRelation(aliasEntries), entry => entry[0]), entry => entry[1]).tuples;
  const identities = typedProject(
    typedRelation(objects),
    object => Object.freeze({
      object,
      aliases: Object.freeze(typedProject(
        typedSelect(
          typedProject(
            typedSelect(typedRelation(links), fact => relationEqual(fact.arguments[0], knowledgeIdKey(object))),
            fact => objectForKey(objects, String(fact.arguments[1])),
          ),
          isPresentKnowledgeId,
        ),
        entry => entry.value,
      ).tuples),
    } satisfies SemanticObjectIdentity),
  ).tuples;

  return Object.freeze({
    status: 'closed',
    identities: Object.freeze(identities),
    aliases: Object.freeze(typedProject(typedRelation(aliases), relation => Object.freeze(relation)).tuples),
    modRefs: Object.freeze([]),
    proof: initial,
  });
};

export const semanticAlias = (
  analysis: SemanticObjectIdentityAnalysis,
  left: KnowledgeId,
  right: KnowledgeId,
): SemanticAliasAssessment => {
  if (analysis.status === 'incomplete') return Object.freeze({ status: 'incomplete', proof: analysis.proof });
  const leftKey = knowledgeIdKey(left);
  const rightKey = knowledgeIdKey(right);
  const sameIdentitySeed = relationResolve(
    relationEqual(leftKey, rightKey),
    () => [identityRelation('same-identity', [leftKey, rightKey])],
    () => [],
  );
  const querySeeds: readonly SemanticRelation<SemanticIdentityRelation>[] = [
    ...sameIdentitySeed,
    ...typedProject(typedRelation(analysis.aliases), relation => identityRelation('may-alias', [knowledgeIdKey(relation.left), knowledgeIdKey(relation.right)])).tuples,
  ];
  const solved = solvedIdentityRelations(querySeeds);
  if (solved.status === 'incomplete') return Object.freeze({ status: 'incomplete', proof: solved });
  const answers = typedSelect(
    typedRelation(solved.facts),
    fact => relationAll([
      relationEqual(fact.relation, 'alias-answer'),
      relationEqual(fact.arguments[0], knowledgeIdKey(left)),
      relationEqual(fact.arguments[1], knowledgeIdKey(right)),
    ]),
  ).tuples;
  const answer = answers[0];
  const answerKind = answer?.arguments[2];
  const value = relationResolve(
    answerKind !== undefined,
    () => relationResolve(
      relationEqual(answerKind, 'must-alias'),
      () => semanticPresent<SemanticAliasKind>('must-alias'),
      () => semanticPresent<SemanticAliasKind>('may-alias'),
    ),
    () => semanticAbsent<SemanticAliasKind>('not_provided'),
  );
  return Object.freeze({ status: 'resolved', value, proof: solved });
};

export const semanticObjectIdentityAuthority: SemanticObjectIdentityAuthorityInterface = Object.freeze({
  kind: 'semantic_object_identity_authority',
  analyze: analyzeSemanticObjectIdentity,
  alias: semanticAlias,
});
