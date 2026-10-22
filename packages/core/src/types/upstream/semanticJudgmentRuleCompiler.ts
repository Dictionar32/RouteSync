/**
 * Generic lowering from an interface-owned derivation program to a neutral compiled rule.
 * This module deliberately does not import the legacy relation-engine location. The
 * runtime boundary may adapt this representation to a concrete execution protocol.
 */
import type {
  SemanticJudgmentRelationPattern,
  SemanticJudgmentRuleDefinition,
  SemanticJudgmentRuleTerm,
} from './semanticJudgmentDerivationInterface';
import type { SemanticJudgmentLaw, SemanticJudgmentModel } from './semanticJudgmentDerivationInterface';

export interface CompiledSemanticJudgmentPattern<R extends string = string, TAtom = unknown> {
  readonly relation: R;
  readonly arguments: readonly (TAtom | Readonly<{ readonly variable: string }>)[];
  readonly polarity: 'positive' | 'negative';
}

export interface CompiledSemanticJudgmentRule<R extends string = string, TAtom = unknown> {
  readonly id: string;
  readonly priority: number;
  readonly when: readonly CompiledSemanticJudgmentPattern<R, TAtom>[];
  readonly then: readonly CompiledSemanticJudgmentPattern<R, TAtom>[];
}

const lowerTerm = <TAtom>(term: SemanticJudgmentRuleTerm<TAtom>): TAtom | Readonly<{ readonly variable: string }> =>
  term.kind === 'variable'
    ? Object.freeze({ variable: term.name })
    : term.value;

const lowerPattern = <R extends string, TAtom>(pattern: SemanticJudgmentRelationPattern<R, TAtom>): CompiledSemanticJudgmentPattern<R, TAtom> => Object.freeze({
  relation: pattern.relation,
  arguments: Object.freeze(pattern.arguments.map(lowerTerm)),
  polarity: pattern.polarity,
});

/** Compile any compatible declarative judgment rule without adding domain-specific branches. */
export const compileSemanticJudgmentRule = <R extends string, TAtom = unknown>(
  rule: SemanticJudgmentRuleDefinition<R, TAtom>,
): CompiledSemanticJudgmentRule<R, TAtom> => Object.freeze({
  id: rule.id,
  priority: rule.priority,
  when: Object.freeze(rule.derivation.premises.map(lowerPattern)),
  then: Object.freeze(rule.derivation.conclusions.map(lowerPattern)),
});

const semanticVariable = <TAtom>(name: string): SemanticJudgmentRuleTerm<TAtom> =>
  Object.freeze({ kind: 'variable', name });
const semanticLiteral = <TAtom>(value: TAtom): SemanticJudgmentRuleTerm<TAtom> =>
  Object.freeze({ kind: 'literal', value });
const semanticPattern = <R extends string, TAtom>(
  relation: R,
  args: readonly SemanticJudgmentRuleTerm<TAtom>[],
  polarity: 'positive' | 'negative' = 'positive',
): SemanticJudgmentRelationPattern<R, TAtom> => Object.freeze({
  relation,
  arguments: Object.freeze([...args]),
  polarity,
});
const semanticRule = <R extends string, TAtom>(
  id: string,
  priority: number,
  premises: readonly SemanticJudgmentRelationPattern<R, TAtom>[],
  conclusions: readonly SemanticJudgmentRelationPattern<R, TAtom>[],
): SemanticJudgmentRuleDefinition<R, TAtom> => Object.freeze({
  id,
  priority,
  derivation: Object.freeze({
    kind: 'semantic_judgment_derivation_program',
    premises: Object.freeze([...premises]),
    conclusions: Object.freeze([...conclusions]),
    proof: Object.freeze({ retainPremiseWitnesses: true, retainBindings: true }),
  }),
});

/**
 * Compile a domain-neutral semantic judgment model. The lowering is defined by
 * reusable semantic operators, not by domain names or rule identifiers.
 */
export const compileSemanticJudgmentModel = <R extends string, TAtom = unknown>(
  model: SemanticJudgmentModel<R, TAtom>,
): readonly SemanticJudgmentRuleDefinition<R, TAtom>[] => {
  const v = semanticVariable<TAtom>;
  const l = semanticLiteral<TAtom>;
  const p = semanticPattern<R, TAtom>;
  const registry = createSemanticLawCompilerRegistry<R, TAtom>(p, v, l, semanticRule);
  return Object.freeze(model.laws.flatMap(law => registry[law.kind](law as never)));
};

type SemanticLawKind = SemanticJudgmentLaw['kind'];
type SemanticLawFor<R extends string, TAtom, K extends SemanticLawKind> = Extract<SemanticJudgmentLaw<R, TAtom>, { readonly kind: K }>;
type SemanticLawCompilerRegistry<R extends string, TAtom> = {
  readonly [K in SemanticLawKind]: (
    law: SemanticLawFor<R, TAtom, K>,
  ) => readonly SemanticJudgmentRuleDefinition<R, TAtom>[];
};

const createSemanticLawCompilerRegistry = <R extends string, TAtom>(
  p: typeof semanticPattern<R, TAtom>,
  v: typeof semanticVariable<TAtom>,
  l: typeof semanticLiteral<TAtom>,
  makeRule: typeof semanticRule<R, TAtom>,
): SemanticLawCompilerRegistry<R, TAtom> => ({
  'evidence-presence': law => [makeRule(law.id, law.priority, [
    p(law.requested, [v('subject')]),
    p(law.evidence, [v('subject')], 'negative'),
  ], [p(law.missing, [v('subject')])])],

  'evidence-backed-identity': law => [makeRule(law.id, law.priority, [
    p(law.requested, [v('subject')]),
    p(law.evidence, [v('subject'), v('candidate'), l(law.evidenceRole)]),
    p(law.candidateEvidence, [v('candidate')]),
  ], [
    p(law.resolution, [v('subject'), v('candidate')]),
    p(law.established, [v('subject')]),
  ])],

  uniqueness: law => [makeRule(law.id, law.priority, [
    p(law.candidates, [v('subject'), v('left')]),
    p(law.candidates, [v('subject'), v('right')]),
    p(law.distinctness, [v('left'), v('right')]),
  ], [p(law.ambiguity, [v('subject'), v('left'), v('right')])])],

  'ordered-correspondence': law => [
    makeRule(law.id, law.priority, [
      p(law.owner, [v('subject'), v('owner')]),
      p(law.sourceItems, [v('subject'), v('sourceItem'), v('ordinal')]),
      p(law.targetItems, [v('owner'), v('targetItem'), v('ordinal')]),
    ], [p(law.correspondence, [v('subject'), v('owner'), v('sourceItem'), v('targetItem'), v('ordinal')])]),
    makeRule(law.unresolvedId, law.priority + 1, [
      p(law.owner, [v('subject'), v('owner')]),
      p(law.sourceItems, [v('subject'), v('sourceItem'), v('ordinal')]),
      p(law.targetIndexes, [v('owner'), v('ordinal')], 'negative'),
    ], [p(law.unresolved, [v('subject'), v('owner'), v('sourceItem'), v('ordinal')])]),
  ],

  'effect-projection': law => law.selectedKinds.map((selectedKind, index) => makeRule(
    law.selectedKinds.length === 1 ? law.id : `${law.id}-${String(selectedKind)}`,
    law.priority + index,
    [
      p(law.owner, [v('subject'), v('owner')]),
      p(law.sourceEffects, [v('owner'), v('effect')]),
      p(law.effectKinds, [v('effect'), l(selectedKind)]),
    ],
    [p(law.projection, [v('subject'), v('owner'), v('effect'), l(selectedKind)])],
  )),

  'absence-obligation': law => [makeRule(law.id, law.priority, [
    p(law.requested, [v('subject')]),
    p(law.established, [v('subject')], 'negative'),
    p(law.evidence, [v('subject')]),
  ], [p(law.missing, [v('subject')])])],
});
