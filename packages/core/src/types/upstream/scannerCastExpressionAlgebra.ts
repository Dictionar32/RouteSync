/** Canonical grammar-evidence algebra for PHP cast expressions. */
import type {
  ScannerCastExpressionEvidence,
  ScannerCastExpressionInterface,
  ScannerCastExpressionJudgment,
  ScannerCastExpressionQuery,
  ScannerCastType,
} from './scannerCastExpressionInterface';

const castTypes: readonly ScannerCastType[] = Object.freeze(['int', 'float', 'string', 'bool', 'array', 'object']);

const isScannerCastType = (value: string): value is ScannerCastType => castTypes.some(castType => castType === value);

const resolveCast = <Token>(query: ScannerCastExpressionQuery<Token>): ScannerCastExpressionJudgment<Token> => {
  const opening = query.tokens[0];
  const typeToken = query.tokens[1];
  if (opening === undefined || query.tokenValue(opening) !== '(' || typeToken === undefined) {
    return { kind: 'not_applicable' };
  }

  const rawType = query.tokenValue(typeToken);
  if (query.tokenKind(typeToken) !== 'IDENTIFIER' || !isScannerCastType(rawType)) {
    return { kind: 'not_applicable' };
  }

  const castType = rawType;
  const closing = query.tokens[2];
  if (closing === undefined || query.tokenValue(closing) !== ')') {
    const location = closing === undefined ? { kind: 'end_of_source' as const } : { kind: 'token' as const, evidence: closing };
    return {
      kind: 'malformed',
      location,
      expected: ')',
      actual: closing === undefined ? '<end-of-source>' : query.tokenValue(closing),
      reason: 'missing_closing_delimiter',
    };
  }

  const operand = query.tokens.slice(3);
  if (operand.length === 0) {
    return {
      kind: 'malformed',
      location: { kind: 'end_of_source' },
      expected: 'cast operand',
      actual: '<end-of-source>',
      reason: 'missing_operand',
    };
  }

  const evidence: ScannerCastExpressionEvidence<Token> = {
    opening,
    typeToken,
    closing,
    castType,
    operand,
  };
  return { kind: 'resolved', evidence };
};

export const scannerCastExpressionContractAlgebra: ScannerCastExpressionInterface = Object.freeze({
  resolve: <Token>(query: ScannerCastExpressionQuery<Token>): ScannerCastExpressionJudgment<Token> => resolveCast(query),
});
