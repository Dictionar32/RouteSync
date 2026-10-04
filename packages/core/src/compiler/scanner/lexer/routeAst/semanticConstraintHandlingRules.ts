/**
 * Declarative constraint-handling relations.
 *
 * CHR-style propagation, simplification and simpagation are represented as
 * relations. Matching and instantiation return witnesses rather than sentinel
 * values; saturation is recursive fixed-point closure.
 */
import { relationContains, relationUnique } from '../../../../semantic/kernel/relationMembership';
import { accumulate, expand, project, retain } from './semanticRelationalCollections';
import { relationResolve, relationFirst, relationOptionFold, type RelationOption } from '../../../../semantic/kernel/relationalSequence';
import { relationAll, relationAny, relationEqual, relationIsSome, relationNone, relationNotEqual, relationSome } from '../../../../semantic/kernel/semanticRelations';
import type {
  SemanticRelation,
  SemanticRelationAtom,
  SemanticRelationPattern,
  SemanticRelationBindings,
} from './semanticRewriteEngine';
import { matchSemanticRelationPattern, instantiateSemanticRelationPattern } from './semanticRewriteEngine';

export type ConstraintHandlingMode = 'propagation' | 'simplification' | 'simpagation';

export interface ConstraintHandlingRule<R extends string = string> {
  readonly id: string;
  readonly priority: number;
  readonly mode: ConstraintHandlingMode;
  readonly keep: readonly SemanticRelationPattern<R>[];
  readonly remove: readonly SemanticRelationPattern<R>[];
  readonly then: readonly SemanticRelationPattern<R>[];
}

export interface ConstraintHandlingResult<R extends string = string> {
  readonly facts: readonly SemanticRelation<R>[];
  readonly appliedRules: readonly string[];
  readonly rounds: number;
  readonly saturated: boolean;
}

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
    () => {
      const pattern = patterns[index];
      return relationResolve(
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
      );
    },
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
  const settle = (
    facts: readonly SemanticRelation<R>[],
    appliedRules: readonly string[],
    rounds: number,
  ): ConstraintHandlingResult<R> => {
    const applyOrdered = (index: number, current: readonly SemanticRelation<R>[]): readonly SemanticRelation<R>[] => relationResolve(
      index >= ordered.length,
      () => current,
      () => applyOrdered(index + 1, applyRule(current, ordered[index])),
    );
    const nextFacts = applyOrdered(0, facts);
    const previousKeys = relationUnique(project(facts, relationKey));
    const nextKeys = project(nextFacts, relationKey);
    const changed = relationAny([relationNotEqual(nextFacts.length, facts.length), relationAny(project(nextKeys, key => relationEqual(relationContains(previousKeys, key), false)))]);
    const nextRules = relationResolve(changed, () => Object.freeze([...appliedRules, ...project(ordered, rule => rule.id)]), () => appliedRules);
    return relationResolve(
      relationAny([!changed, rounds >= maxRounds]),
      () => Object.freeze({ facts: Object.freeze(nextFacts), appliedRules: Object.freeze(nextRules), rounds: rounds + 1, saturated: !changed }),
      () => settle(nextFacts, nextRules, rounds + 1),
    );
  };
  return settle(Object.freeze([...seed]), [], 0);
};
