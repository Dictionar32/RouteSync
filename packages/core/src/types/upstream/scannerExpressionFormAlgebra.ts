/**
 * Language-neutral algebra for prefix and conditional expression judgments.
 * Syntax providers supply token observations and a closed occurrence judgment;
 * this algebra owns branch pairing and rejects incomplete evidence.
 */
import type { TokenEvidenceLocation, TokenOccurrenceEvidence, TokenOccurrencesJudgment } from './scannerTokenStructureAlgebra';

export type ExpressionFormResolution<Operator> =
  | Readonly<{ readonly kind: 'resolved'; readonly operator: Operator; readonly index: number }>
  | Readonly<{ readonly kind: 'not_found' }>
  | Readonly<{ readonly kind: 'malformed'; readonly index: number; readonly expected?: string; readonly actual: string }>
  | Readonly<{ readonly kind: 'contract_violation'; readonly reason: 'empty_operator_token' | 'duplicate_operator_token' | 'missing_operand' }>;

export type PrefixExpressionRule<Operator> = Readonly<{ readonly token: string; readonly operator: Operator }>;
export type PrefixExpressionContract<Token, Operator> = Readonly<{
  readonly tokens: readonly Token[];
  readonly rules: readonly PrefixExpressionRule<Operator>[];
  readonly tokenValue: (token: Token | undefined) => string;
}>;

export type ConditionalExpressionContract<Token> = Readonly<{
  readonly tokens: readonly Token[];
  readonly tokenValue: (token: Token | undefined) => string;
  readonly collectTopLevelCandidates: (tokens: readonly Token[], targets: readonly string[]) => TokenOccurrencesJudgment<Token>;
}>;

export type ConditionalExpressionResolution<Token> =
  | Readonly<{ readonly kind: 'resolved'; readonly condition: readonly Token[]; readonly consequent: readonly Token[]; readonly alternative: readonly Token[]; readonly question: TokenOccurrenceEvidence<Token>; readonly colon: TokenOccurrenceEvidence<Token> }>
  | Readonly<{ readonly kind: 'not_found' }>
  | Readonly<{ readonly kind: 'malformed'; readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string }>;

export interface ScannerExpressionFormInterface {
  readonly resolveConditional: <Token>(contract: ConditionalExpressionContract<Token>) => ConditionalExpressionResolution<Token>;
}
export interface ScannerExpressionFormAlgebra extends ScannerExpressionFormInterface {
  readonly resolvePrefix: <Token, Operator>(contract: PrefixExpressionContract<Token, Operator>) => ExpressionFormResolution<Operator>;
}

const resolvePrefix = <Token, Operator>(contract: PrefixExpressionContract<Token, Operator>): ExpressionFormResolution<Operator> => {
  const seen: string[] = [];
  for (const rule of contract.rules) {
    if (rule.token.length === 0) return { kind: 'contract_violation', reason: 'empty_operator_token' };
    if (seen.includes(rule.token)) return { kind: 'contract_violation', reason: 'duplicate_operator_token' };
    seen.push(rule.token);
  }
  if (contract.tokens.length < 2) {
    return contract.rules.some(rule => rule.token === contract.tokenValue(contract.tokens[0]))
      ? { kind: 'contract_violation', reason: 'missing_operand' }
      : { kind: 'not_found' };
  }
  const token = contract.tokenValue(contract.tokens[0]);
  const rule = contract.rules.find(candidate => candidate.token === token);
  return rule === undefined ? { kind: 'not_found' } : { kind: 'resolved', operator: rule.operator, index: 0 };
};

const resolveConditional = <Token>(contract: ConditionalExpressionContract<Token>): ConditionalExpressionResolution<Token> => {
  const candidates = contract.collectTopLevelCandidates(contract.tokens, ['?', ':']);
  if (candidates.kind === 'malformed') return candidates;
  let question: TokenOccurrenceEvidence<Token> | undefined;
  let nestedQuestions = 0;
  for (const occurrence of candidates.occurrences) {
    const value = contract.tokenValue(occurrence.token);
    if (question === undefined) {
      if (value === '?') question = occurrence;
      continue;
    }
    if (value === '?') {
      nestedQuestions += 1;
      continue;
    }
    if (value === ':') {
      if (nestedQuestions > 0) {
        nestedQuestions -= 1;
        continue;
      }
      if (question.before.length === 0 || occurrence.after.length === 0 || question.after.length <= occurrence.after.length + 1) {
        return { kind: 'malformed', location: { kind: 'token', evidence: occurrence.token }, expected: 'conditional expression branches', actual: value };
      }
      return {
        kind: 'resolved',
        condition: question.before,
        consequent: question.after.slice(0, question.after.length - occurrence.after.length - 1),
        alternative: occurrence.after,
        question,
        colon: occurrence,
      };
    }
  }
  if (question !== undefined) {
    return { kind: 'malformed', location: { kind: 'token', evidence: question.token }, expected: ':', actual: '<end-of-expression>' };
  }
  return { kind: 'not_found' };
};

export const scannerExpressionFormInterface: ScannerExpressionFormInterface = Object.freeze({ resolveConditional });
export const scannerExpressionFormAlgebra: ScannerExpressionFormAlgebra = Object.freeze({ resolvePrefix, ...scannerExpressionFormInterface });
