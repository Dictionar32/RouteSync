/**
 * Phase 660 — closed syntax-judgment rewrite interface.
 *
 * Syntax diagnostics are a closed semantic judgment domain.  Parser tokens are
 * evidence only; diagnosis is derived by declarative relation rules and a
 * monotone fixed point.  No open primitive atom union or generic semantic
 * relation solver is used at this boundary.
 */
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { StringValue } from '../../../../types/upstream/valueObjects';
import { relationEqual, relationAll, relationFixedPoint, relationGate, relationFirst, relationOptionFold, relationCount } from '../../../../semantic/foundation/relationalSequence';
import { relationUnique } from '../../../../semantic/foundation/relationMembership';
import { relationExpand, relationProject, relationSelect } from '../../../../semantic/foundation/relationalSequence';

export type SyntaxErrorRelation =
  | 'expected'
  | 'observed'
  | 'located'
  | 'severity'
  | 'diagnostic'
  | 'blocks';

export type SyntaxErrorTerm =
  | { readonly kind: 'syntax_position'; readonly value: SourceSpan }
  | { readonly kind: 'syntax_text'; readonly value: StringValue }
  | { readonly kind: 'syntax_code'; readonly value: StringValue }
  | { readonly kind: 'syntax_severity'; readonly value: StringValue };

export type SyntaxErrorFact = Readonly<{
  readonly kind: 'syntax_error_fact';
  readonly relation: SyntaxErrorRelation;
  readonly arguments: readonly SyntaxErrorTerm[];
}>;

export type SyntaxErrorRuleId =
  | 'expected-observed-diagnostic'
  | 'diagnostic-blocks-location';

export type SyntaxErrorDerivation = Readonly<{
  readonly kind: 'syntax_error_derivation';
  readonly rule: SyntaxErrorRuleId;
  readonly premises: readonly SyntaxErrorFact[];
  readonly conclusion: SyntaxErrorFact;
}>;

export type SyntaxErrorSolveResult = Readonly<{
  readonly facts: readonly SyntaxErrorFact[];
  readonly derivations: readonly SyntaxErrorDerivation[];
  readonly rounds: number;
  readonly saturated: boolean;
}>;

const text = (value: string): SyntaxErrorTerm => ({ kind: 'syntax_text', value: { kind: 'string_value', value } });
const code = (value: string): SyntaxErrorTerm => ({ kind: 'syntax_code', value: { kind: 'string_value', value } });
const position = (value: SourceSpan): SyntaxErrorTerm => ({ kind: 'syntax_position', value });

export const syntaxJudgmentFact = (relation: SyntaxErrorRelation, arguments_: readonly SyntaxErrorTerm[]): SyntaxErrorFact => Object.freeze({
  kind: 'syntax_error_fact',
  relation,
  arguments: Object.freeze([...arguments_]),
});

const factKey = (fact: SyntaxErrorFact): string => `${fact.relation}:${JSON.stringify(fact.arguments)}`;
const uniqueFacts = (facts: readonly SyntaxErrorFact[]): readonly SyntaxErrorFact[] => relationProject(relationUnique(relationProject(facts, factKey)), key => relationOptionFold(relationFirst(facts, fact => relationEqual(factKey(fact), key)), () => facts[0], fact => fact));

const expectedFacts = (facts: readonly SyntaxErrorFact[]): readonly SyntaxErrorFact[] => relationSelect(facts, fact => relationEqual(fact.relation, 'expected'));
const observedFacts = (facts: readonly SyntaxErrorFact[]): readonly SyntaxErrorFact[] => relationSelect(facts, fact => relationEqual(fact.relation, 'observed'));
const diagnosticFacts = (facts: readonly SyntaxErrorFact[]): readonly SyntaxErrorFact[] => relationSelect(facts, fact => relationEqual(fact.relation, 'diagnostic'));
const locatedFacts = (facts: readonly SyntaxErrorFact[]): readonly SyntaxErrorFact[] => relationSelect(facts, fact => relationEqual(fact.relation, 'located'));

const deriveDiagnostics = (facts: readonly SyntaxErrorFact[]): readonly SyntaxErrorDerivation[] => relationExpand(expectedFacts(facts), expected =>
  relationExpand(observedFacts(facts), observed => relationGate(relationAll([
    relationEqual(relationCount(expected.arguments), 2),
    relationEqual(relationCount(observed.arguments), 2),
    relationEqual(expected.arguments[0], observed.arguments[0]),
  ]), () => [{
    kind: 'syntax_error_derivation',
    rule: 'expected-observed-diagnostic',
    premises: Object.freeze([expected, observed]),
    conclusion: syntaxJudgmentFact('diagnostic', [expected.arguments[0], code('syntax-unexpected-token'), expected.arguments[1], observed.arguments[1]]),
  }], () => [])));

const deriveBlocks = (facts: readonly SyntaxErrorFact[]): readonly SyntaxErrorDerivation[] => relationExpand(diagnosticFacts(facts), diagnostic =>
  relationExpand(locatedFacts(facts), located => relationGate(relationAll([
    relationEqual(relationCount(diagnostic.arguments), 4),
    relationEqual(relationCount(located.arguments), 2),
    relationEqual(diagnostic.arguments[0], located.arguments[0]),
  ]), () => [{
    kind: 'syntax_error_derivation',
    rule: 'diagnostic-blocks-location',
    premises: Object.freeze([diagnostic, located]),
    conclusion: syntaxJudgmentFact('blocks', [diagnostic.arguments[1], located.arguments[1]]),
  }], () => [])));

const derive = (facts: readonly SyntaxErrorFact[]): readonly SyntaxErrorDerivation[] => Object.freeze([
  ...deriveDiagnostics(facts),
  ...deriveBlocks(facts),
]);

const close = (seed: readonly SyntaxErrorFact[], maxRounds: number): SyntaxErrorSolveResult => {
  const step = (facts: readonly SyntaxErrorFact[]): readonly SyntaxErrorFact[] => uniqueFacts([
    ...facts,
    ...relationProject(derive(facts), derivation => derivation.conclusion),
  ]);
  const fixed = relationFixedPoint(Object.freeze(uniqueFacts(seed)), step, (left, right) => relationEqual(relationProject(left, factKey).join('|'), relationProject(right, factKey).join('|')), maxRounds);
  const facts = Object.freeze(fixed.value);
  const derivations = Object.freeze(derive(facts));
  return Object.freeze({ facts, derivations, rounds: fixed.rounds, saturated: fixed.converged });
};

export const rewriteSyntaxJudgment = (seed: readonly SyntaxErrorFact[], maxRounds = 32): readonly SyntaxErrorFact[] => {
  const result = close(seed, maxRounds);
  return Object.freeze(result.facts);
};

export const syntaxJudgmentDiagnostics = (facts: readonly SyntaxErrorFact[]): readonly SyntaxErrorFact[] => diagnosticFacts(facts);
export const syntaxJudgmentPattern = (relation: SyntaxErrorRelation, ...arguments_: readonly SyntaxErrorTerm[]): SyntaxErrorFact => syntaxJudgmentFact(relation, arguments_);

export const syntaxErrorPosition = position;
export const syntaxErrorText = text;
export const syntaxErrorCode = code;
