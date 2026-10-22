/** Upstream CHR-style constraint reasoning authority. */
import { relationContains, relationUnique } from '../../semantic/relations/relationMembership';
import { expand, project, retain } from '../../semantic/relations/semanticRelationalCollections';
import { relationResolve, relationAt, relationOptionFold, type RelationOption } from '../../semantic/relations/relationalSequence';
import { relationAll, relationAny, relationEqual, relationIsSome, relationNotEqual } from '../../semantic/relations/semanticRelations';
import type { SemanticRelation, SemanticRelationBindings, SemanticRelationPattern } from '../../semantic/relations/semanticRewriteEngine';
import { matchSemanticRelationPattern, instantiateSemanticRelationPattern } from '../../semantic/relations/semanticRewriteEngine';
import type { ConstraintHandlingResult, ConstraintHandlingRule, SemanticConstraintHandlingAuthorityInterface } from './semanticConstraintHandlingInterface';

type Bindings = SemanticRelationBindings;
type Match<R extends string> = Readonly<{
  readonly bindings: Bindings;
  readonly facts: readonly SemanticRelation<R>[];
}>;
type BindingWitness = RelationOption<Bindings>;
type FactWitness<R extends string> = RelationOption<SemanticRelation<R>>;

const matchPattern = <R extends string>(
  fact: SemanticRelation<R>,
  pattern: SemanticRelationPattern<R>,
  bindings: SemanticRelationBindings,
): BindingWitness => matchSemanticRelationPattern(fact, pattern, bindings);

const instantiate = <R extends string>(
  pattern: SemanticRelationPattern<R>,
  bindings: SemanticRelationBindings,
): FactWitness<R> => instantiateSemanticRelationPattern(pattern, bindings);

const matchGroup = <R extends string>(
  facts: readonly SemanticRelation<R>[],
  patterns: readonly SemanticRelationPattern<R>[],
): readonly Match<R>[] => {
  const walk = (
    index: number,
    bindings: Bindings,
    matched: readonly SemanticRelation<R>[],
  ): readonly Match<R>[] => relationResolve(
    index >= patterns.length,
    () => Object.freeze([{ bindings, facts: Object.freeze(matched) }]),
    () => relationOptionFold(
      relationAt(patterns, index),
      () => walk(index + 1, bindings, matched),
      pattern => relationResolve(
        relationEqual(pattern.polarity, 'negative'),
        () => relationResolve(
          facts.some(fact => relationIsSome(matchPattern(fact, pattern, bindings))),
          () => Object.freeze([]),
          () => walk(index + 1, bindings, matched),
        ),
        () => expand(
          retain(facts, fact => relationIsSome(matchPattern(fact, pattern, bindings))),
          fact => relationOptionFold(
            matchPattern(fact, pattern, bindings),
            () => [],
            next => walk(index + 1, next, [...matched, fact]),
          ),
        ),
      ),
    ),
  );
  return walk(0, Object.freeze({}), []);
};

const replacementFacts = <R extends string>(
  rule: ConstraintHandlingRule<R>,
  match: Match<R>,
): readonly SemanticRelation<R>[] =>
  expand(rule.then, pattern => relationOptionFold(instantiate(pattern, match.bindings), () => [], fact => [fact]));

const relationKey = <R extends string>(fact: SemanticRelation<R>): string =>
  `${fact.relation}(${project(fact.arguments, value => JSON.stringify(value)).join(',')})`;

const removeKeys = <R extends string>(
  facts: readonly SemanticRelation<R>[],
  matches: readonly SemanticRelation<R>[],
): readonly SemanticRelation<R>[] => {
  const removed = relationUnique(project(matches, relationKey));
  return retain(facts, fact => relationEqual(relationContains(removed, relationKey(fact)), false));
};

const accumulateMatches = <R extends string>(
  facts: readonly SemanticRelation<R>[],
  rule: ConstraintHandlingRule<R>,
  matches: readonly Match<R>[],
): readonly SemanticRelation<R>[] => {
  const keepCount = rule.keep.length;
  const removeCount = rule.remove.length;
  const additions = expand(matches, match => replacementFacts(rule, match));
  const removals = expand(matches, match => project(retain(match.facts, (_fact, index) => relationAll([index >= keepCount, index < keepCount + removeCount])), fact => fact));
  const base = relationResolve(relationEqual(rule.mode, 'propagation'), () => facts, () => removeKeys(facts, removals));
  const existing = relationUnique(project(base, relationKey));
  return Object.freeze([...base, ...retain(additions, fact => relationEqual(relationContains(existing, relationKey(fact)), false))]);
};

const applyRule = <R extends string>(
  facts: readonly SemanticRelation<R>[],
  rule: ConstraintHandlingRule<R>,
): readonly SemanticRelation<R>[] => accumulateMatches(facts, rule, matchGroup(facts, [...rule.keep, ...rule.remove]));

const normalizeRule = <R extends string>(rule: ConstraintHandlingRule<R>): ConstraintHandlingRule<R> =>
  relationResolve(
    relationEqual(rule.mode, 'propagation'),
    () => Object.freeze({ ...rule, remove: Object.freeze([]) }),
    () => relationResolve(relationEqual(rule.mode, 'simplification'), () => Object.freeze({ ...rule, keep: Object.freeze([]) }), () => rule),
  );

export const solveConstraintHandlingRules = <R extends string>(
  seed: readonly SemanticRelation<R>[],
  rules: readonly ConstraintHandlingRule<R>[],
  maxRounds = 128,
): ConstraintHandlingResult<R> => {
  const ordered = [...project(rules, normalizeRule)].sort((left, right) => right.priority - left.priority);
  if (maxRounds <= 0) return Object.freeze({ status: 'incomplete', facts: Object.freeze([...seed]), appliedRules: Object.freeze([]), rounds: 0, saturated: false, reason: 'max_rounds_exceeded' });
  const settle = (
    facts: readonly SemanticRelation<R>[],
    appliedRules: readonly string[],
    rounds: number,
  ): ConstraintHandlingResult<R> => {
    const applyOrdered = (index: number, current: readonly SemanticRelation<R>[]): readonly SemanticRelation<R>[] => relationResolve(
      index >= ordered.length,
      () => current,
      () => relationOptionFold(relationAt(ordered, index), () => current, rule => applyOrdered(index + 1, applyRule(current, rule))),
    );
    const nextFacts = applyOrdered(0, facts);
    const previousKeys = relationUnique(project(facts, relationKey));
    const nextKeys = project(nextFacts, relationKey);
    const changed = relationAny([relationNotEqual(nextFacts.length, facts.length), relationAny(project(nextKeys, key => relationEqual(relationContains(previousKeys, key), false)))]);
    const nextRules = relationResolve(changed, () => Object.freeze([...appliedRules, ...project(ordered, rule => rule.id)]), () => appliedRules);
    const nextRounds = rounds + 1;
    return relationResolve(
      !changed,
      () => Object.freeze({ status: 'closed', facts: Object.freeze(nextFacts), appliedRules: Object.freeze(nextRules), rounds: nextRounds, saturated: true }),
      () => relationResolve(
        nextRounds >= maxRounds,
        () => Object.freeze({ status: 'incomplete', facts: Object.freeze(nextFacts), appliedRules: Object.freeze(nextRules), rounds: nextRounds, saturated: false, reason: 'max_rounds_exceeded' }),
        () => settle(nextFacts, nextRules, nextRounds),
      ),
    );
  };
  return settle(Object.freeze([...seed]), [], 0);
};

export const semanticConstraintHandlingAuthority: SemanticConstraintHandlingAuthorityInterface = Object.freeze({
  kind: 'semantic_constraint_handling_authority',
  solve: solveConstraintHandlingRules,
});
