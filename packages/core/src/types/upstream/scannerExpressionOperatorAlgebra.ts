/**
 * Expression-root semantic algebra. Source spelling is evidence only. Operator
 * precedence is a typed partial order that must be complete for the supplied tiers.
 */
import type { TokenEvidenceLocation, TokenOccurrenceEvidence, TokenOccurrencesJudgment } from './scannerTokenStructureAlgebra';
import {
  EXPRESSION_ASSOCIATIVITY_LEFT,
  EXPRESSION_ASSOCIATIVITY_NON_ASSOCIATIVE,
  EXPRESSION_ASSOCIATIVITY_RIGHT,
  EXPRESSION_OPERATOR_CONFLICTING_ASSOCIATIVITY,
  EXPRESSION_OPERATOR_CONTRACT_VIOLATION,
  EXPRESSION_OPERATOR_DUPLICATE_SPELLING,
  EXPRESSION_OPERATOR_EMPTY_SPELLING,
  EXPRESSION_OPERATOR_MALFORMED,
  EXPRESSION_OPERATOR_NOT_FOUND,
  EXPRESSION_OPERATOR_PRECEDENCE_CYCLE,
  EXPRESSION_OPERATOR_PRECEDENCE_INCOMPARABLE,
  EXPRESSION_OPERATOR_RESOLVED,
  EXPRESSION_OPERATOR_UNKNOWN_PRECEDENCE_TIER,
  type ExpressionOperatorContract,
  type ExpressionOperatorContractViolation,
  type ExpressionOperatorResolution,
  type ExpressionOperatorRule,
  type ExpressionPrecedenceRelation,
  type ScannerExpressionOperatorAlgebra,
  type ScannerExpressionOperatorInterface,
} from './scannerExpressionOperatorInterface';

export * from './scannerExpressionOperatorInterface';

type Selected<Token, Operator, Tier extends symbol> = Readonly<{
  readonly rule: ExpressionOperatorRule<Operator, Tier>;
  readonly match: TokenOccurrenceEvidence<Token>;
}>;

const relationHasPath = <Tier extends symbol>(relations: readonly ExpressionPrecedenceRelation<Tier>[], from: Tier, to: Tier): boolean => {
  const visited = new Set<Tier>();
  const visit = (current: Tier): boolean => {
    if (current === to) return true;
    if (visited.has(current)) return false;
    visited.add(current);
    return relations.some(relation => relation.weaker === current && visit(relation.stronger));
  };
  return visit(from);
};

const validateContract = <Operator, Tier extends symbol>(
  rules: readonly ExpressionOperatorRule<Operator, Tier>[],
  precedence: readonly ExpressionPrecedenceRelation<Tier>[],
): ExpressionOperatorContractViolation | undefined => {
  const seenSpellings = new Set<string>();
  const tiers = new Set<Tier>();
  const associativityByTier = new Map<Tier, ExpressionOperatorRule<Operator, Tier>['associativity']>();
  for (const rule of rules) {
    if (rule.token.length === 0) return EXPRESSION_OPERATOR_EMPTY_SPELLING;
    if (seenSpellings.has(rule.token)) return EXPRESSION_OPERATOR_DUPLICATE_SPELLING;
    seenSpellings.add(rule.token);
    tiers.add(rule.tier);
    const existing = associativityByTier.get(rule.tier);
    if (existing !== undefined && existing !== rule.associativity) return EXPRESSION_OPERATOR_CONFLICTING_ASSOCIATIVITY;
    associativityByTier.set(rule.tier, rule.associativity);
  }
  for (const relation of precedence) {
    if (!tiers.has(relation.weaker) || !tiers.has(relation.stronger)) return EXPRESSION_OPERATOR_UNKNOWN_PRECEDENCE_TIER;
    if (relation.weaker === relation.stronger || relationHasPath(precedence, relation.stronger, relation.weaker)) return EXPRESSION_OPERATOR_PRECEDENCE_CYCLE;
  }
  const allTiers = [...tiers];
  for (const tier of allTiers) {
    for (const other of allTiers) {
      if (tier !== other && !relationHasPath(precedence, tier, other) && !relationHasPath(precedence, other, tier)) {
        return EXPRESSION_OPERATOR_PRECEDENCE_INCOMPARABLE;
      }
    }
  }
  return undefined;
};

const resolve = <Token, Operator, Tier extends symbol>(
  contract: ExpressionOperatorContract<Token, Operator, Tier>,
): ExpressionOperatorResolution<Operator, Token, Tier> => {
  const invalid = validateContract(contract.rules, contract.precedence);
  if (invalid !== undefined) return { kind: EXPRESSION_OPERATOR_CONTRACT_VIOLATION, reason: invalid };
  const collected: TokenOccurrencesJudgment<Token> = contract.collectTopLevelCandidates(
    contract.tokens,
    contract.rules.map(rule => rule.token),
  );
  if (collected.kind === 'malformed') return { kind: EXPRESSION_OPERATOR_MALFORMED, location: collected.location, ...(collected.expected === undefined ? {} : { expected: collected.expected }), actual: collected.actual };
  const matches: Selected<Token, Operator, Tier>[] = [];
  for (const occurrence of collected.occurrences) {
    const spelling = contract.tokenValue(occurrence.token);
    const rule = contract.rules.find(candidate => candidate.token === spelling);
    if (rule !== undefined && occurrence.before.length > 0 && occurrence.after.length > 0) matches.push({ rule, match: occurrence });
  }
  if (matches.length === 0) return { kind: EXPRESSION_OPERATOR_NOT_FOUND };

  let weakestTier = matches[0].rule.tier;
  for (const match of matches.slice(1)) {
    if (relationHasPath(contract.precedence, match.rule.tier, weakestTier)) weakestTier = match.rule.tier;
  }
  const sameTier = matches.filter(match => match.rule.tier === weakestTier);
  const associativity = sameTier[0].rule.associativity;
  if (associativity === EXPRESSION_ASSOCIATIVITY_NON_ASSOCIATIVE && sameTier.length > 1) {
    const offending = sameTier[1].match;
    return {
      kind: EXPRESSION_OPERATOR_MALFORMED,
      location: { kind: 'token', evidence: offending.token } as TokenEvidenceLocation<Token>,
      expected: 'parenthesized expression for non-associative operators',
      actual: contract.tokenValue(offending.token),
    };
  }
  const selected = associativity === EXPRESSION_ASSOCIATIVITY_RIGHT ? sameTier[0] : sameTier[sameTier.length - 1];
  return {
    kind: EXPRESSION_OPERATOR_RESOLVED,
    operator: selected.rule.operator,
    token: contract.tokenValue(selected.match.token),
    before: selected.match.before,
    operatorEvidence: selected.match.token,
    after: selected.match.after,
    tier: selected.rule.tier,
    associativity: selected.rule.associativity,
  };
};

export const scannerExpressionOperatorInterface: ScannerExpressionOperatorInterface = Object.freeze({ resolve });
export const scannerExpressionOperatorAlgebra: ScannerExpressionOperatorAlgebra = scannerExpressionOperatorInterface;
