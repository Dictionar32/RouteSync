/**
 * Declarative semantic rewrite engine.
 *
 * A rewrite is a relation from a matched semantic witness to a replacement
 * witness. Selection is constraint-driven and reaches a fixed point without
 * making source-language control flow the semantic authority.
 */
import { relationEqual, relationGate, relationSome, relationNone } from './semanticRelations';
import { relationFixedPoint, relationFirstOption, relationOptionFold, type RelationOption } from './relationalSequence';

export type RewriteRule<T> = Readonly<{
  readonly id: string;
  readonly pattern: (value: T) => boolean;
  readonly rewrite: (value: T) => T;
}>;

export type RewriteWitness<T> = Readonly<{
  readonly rule: string;
  readonly before: T;
  readonly after: T;
}>;

export type RewriteResult<T> = Readonly<{
  readonly value: T;
  readonly witnesses: readonly RewriteWitness<T>[];
  readonly converged: boolean;
  readonly rounds: number;
}>;

export const rewriteOnce = <T>(value: T, rules: readonly RewriteRule<T>[]): RelationOption<RewriteWitness<T>> =>
  relationOptionFold(
    relationFirstOption(rules, rule => rule.pattern(value)),
    () => relationNone(),
    rule => relationSome(rewriteWitness(value, rule)),
  );

export const rewriteWitness = <T>(value: T, rule: RewriteRule<T>): RewriteWitness<T> =>
  Object.freeze({ rule: rule.id, before: value, after: rule.rewrite(value) });

export const applyRewrite = <T>(value: T, rules: readonly RewriteRule<T>[]): T =>
  relationOptionFold(
    relationFirstOption(rules, rule => rule.pattern(value)),
    () => value,
    rule => rule.rewrite(value),
  );

export const saturateRewrite = <T>(
  seed: T,
  rules: readonly RewriteRule<T>[],
  equal: (left: T, right: T) => boolean = relationEqual,
  maxRounds = 128,
): RewriteResult<T> => {
  const step = (value: T): T => applyRewrite(value, rules);
  const fixed = relationFixedPoint(seed, step, equal, maxRounds);
  const collect = (value: T, rounds: number, output: readonly RewriteWitness<T>[]): readonly RewriteWitness<T>[] =>
    relationGate(
      rounds <= 0,
      () => output,
      () => relationOptionFold(
        relationFirstOption(rules, rule => rule.pattern(value)),
        () => output,
        rule => collect(rule.rewrite(value), rounds - 1, [...output, rewriteWitness(value, rule)]),
      ),
    );
  return Object.freeze({
    value: fixed.value,
    witnesses: collect(seed, fixed.rounds, []),
    converged: fixed.converged,
    rounds: fixed.rounds,
  });
};
