/** Closed semantic rewrite interface over tagged semantic terms. */
import {
  solveSemanticRelationsDetailed,
  type SemanticRelation,
  type SemanticRelationRewrite,
} from './semanticRewriteEngine';
import { relationEqual, relationOptionFold, relationGate } from '../../../../semantic/foundation/semanticRelations';
import { relationProject, relationVariant, relationVariantValue } from '../../../../semantic/foundation/relationalSequence';

export type SemanticRewriteTerm =
  | Readonly<{ readonly kind: 'text_term'; readonly value: string }>
  | Readonly<{ readonly kind: 'ordinal_term'; readonly value: number }>
  | Readonly<{ readonly kind: 'truth_term'; readonly value: 'true' | 'false' }>
  | Readonly<{ readonly kind: 'absence_term' }>;

export type SemanticRewritePatternTerm = SemanticRewriteTerm | Readonly<{ readonly kind: 'variable_term'; readonly name: string }>;

export type SemanticRewritePattern<R extends string = string> = Readonly<{
  readonly relation: R;
  readonly arguments: readonly SemanticRewritePatternTerm[];
  readonly polarity: 'positive' | 'negative';
}>;

export type SemanticRewriteFact<R extends string = string> = Readonly<{
  readonly relation: R;
  readonly arguments: readonly SemanticRewriteTerm[];
}>;

export type SemanticRewriteRule<R extends string = string> = Readonly<{
  readonly id: string;
  readonly priority: number;
  readonly when: readonly SemanticRewritePattern<R>[];
  readonly then: readonly SemanticRewritePattern<R>[];
}>;

export type SemanticRewriteDerivation<R extends string = string> = Readonly<{
  readonly kind: 'semantic_rewrite_derivation';
  readonly ruleId: string;
  readonly fact: SemanticRewriteFact<R>;
}>;

export type SemanticRewriteJudgment<R extends string = string> = Readonly<{
  readonly kind: 'semantic_rewrite_judgment';
  readonly facts: readonly SemanticRewriteFact<R>[];
  readonly derivations: readonly SemanticRewriteDerivation<R>[];
  readonly rounds: number;
  readonly saturated: boolean;
  readonly closure: 'least_fixed_point';
  readonly reasoning: 'declarative_relation_rewrite_fixed_point';
  readonly authority: 'closed_semantic_rewrite_interface';
  readonly closed: true;
}>;

export const semanticTextTerm = (value: string): SemanticRewriteTerm => Object.freeze({ kind: 'text_term', value });
export const semanticOrdinalTerm = (value: number): SemanticRewriteTerm => Object.freeze({ kind: 'ordinal_term', value });
export const semanticTruthTerm = (value: 'true' | 'false'): SemanticRewriteTerm => Object.freeze({ kind: 'truth_term', value });
export const semanticAbsenceTerm = (): SemanticRewriteTerm => Object.freeze({ kind: 'absence_term' });
export const semanticVariableTerm = (name: string): SemanticRewritePatternTerm => Object.freeze({ kind: 'variable_term', name });

const toAtom = (term: SemanticRewriteTerm) => relationOptionFold(
  relationVariant(term, 'text_term'),
  () => relationOptionFold(
    relationVariant(term, 'ordinal_term'),
    () => relationOptionFold(
      relationVariant(term, 'truth_term'),
      () => ({ kind: 'semantic_null' as const }),
      value => relationEqual(value.value, 'true'),
    ),
    value => value.value,
  ),
  value => value.value,
);

const toPatternAtom = (term: SemanticRewritePatternTerm) => relationOptionFold(
  relationVariant(term, 'variable_term'),
  () => relationOptionFold(
    relationVariant(term, 'text_term'),
    () => relationOptionFold(
      relationVariant(term, 'ordinal_term'),
      () => relationOptionFold(
        relationVariant(term, 'truth_term'),
        () => ({ kind: 'semantic_null' as const }),
        value => relationEqual(value.value, 'true'),
      ),
      value => value.value,
    ),
    value => value.value,
  ),
  value => ({ variable: value.name }),
);

const fromAtom = <R extends string>(fact: SemanticRelation<R>): SemanticRewriteFact<R> => Object.freeze({
  relation: fact.relation,
  arguments: Object.freeze(relationProject(fact.arguments, value => relationGate(
    Object.is(typeof value, 'string'),
    () => semanticTextTerm(String(value)),
    () => relationGate(
      Object.is(typeof value, 'number'),
      () => semanticOrdinalTerm(Number(value)),
      () => relationGate(
        Object.is(typeof value, 'boolean'),
        () => semanticTruthTerm(relationGate(relationEqual(value, true), () => 'true', () => 'false')),
        () => semanticAbsenceTerm(),
      ),
    ),
  ))),
});

export const solveClosedSemanticRelations = <R extends string>(
  seeds: readonly SemanticRewriteFact<R>[],
  rules: readonly SemanticRewriteRule<R>[],
  maxRounds = 1024,
): SemanticRewriteJudgment<R> => {
  const seedAtoms = relationProject(seeds, fact => ({ relation: fact.relation, arguments: relationProject(fact.arguments, toAtom) }));
  const rewriteRules: readonly SemanticRelationRewrite<R>[] = relationProject(rules, rule => Object.freeze({
    id: rule.id,
    priority: rule.priority,
    when: relationProject(rule.when, pattern => ({ relation: pattern.relation, polarity: pattern.polarity, arguments: relationProject(pattern.arguments, toPatternAtom) })),
    then: relationProject(rule.then, pattern => ({ relation: pattern.relation, polarity: pattern.polarity, arguments: relationProject(pattern.arguments, toPatternAtom) })),
  }));
  const solved = solveSemanticRelationsDetailed(seedAtoms, rewriteRules, maxRounds);
  return Object.freeze({
    kind: 'semantic_rewrite_judgment',
    facts: Object.freeze(relationProject(solved.facts, fromAtom)),
    derivations: Object.freeze(relationProject(solved.derivations, derivation => Object.freeze({ kind: 'semantic_rewrite_derivation', ruleId: derivation.ruleId, fact: fromAtom({ relation: derivation.fact.relation, arguments: derivation.fact.arguments }) }))),
    rounds: solved.rounds,
    saturated: solved.saturated,
    closure: 'least_fixed_point',
    reasoning: 'declarative_relation_rewrite_fixed_point',
    authority: 'closed_semantic_rewrite_interface',
    closed: true,
  });
};
