/** Canonical grammar-evidence algebra for conditional statement chains. */
import type {
  DelimitedTokenJudgment,
  TokenEvidenceLocation,
} from './scannerTokenStructureAlgebra';
import { scannerTokenStructureInterface } from './scannerTokenStructureAlgebra';
import type {
  ScannerConditionalElseBranch,
  ScannerConditionalStatementEvidence,
  ScannerConditionalStatementInterface,
  ScannerConditionalStatementJudgment,
  ScannerConditionalStatementQuery,
} from './scannerConditionalStatementInterface';

const locationAt = <Token>(tokens: readonly Token[], index: number): TokenEvidenceLocation<Token> => {
  const evidence = tokens[index];
  return evidence === undefined ? { kind: 'end_of_source' } : { kind: 'token', evidence };
};

const malformedDelimiter = <Token>(
  tokens: readonly Token[],
  judgment: DelimitedTokenJudgment<Token>,
  expected: string,
  reason: 'expected_condition' | 'expected_then_body' | 'expected_else_body' | 'malformed_delimiter',
  tokenValue: (token: Token) => string,
): ScannerConditionalStatementJudgment<Token> => {
  switch (judgment.kind) {
    case 'matched':
      return { kind: 'malformed', location: { kind: 'token', evidence: judgment.evidence.opening }, expected, actual: tokenValue(judgment.evidence.opening), reason };
    case 'not_found':
      return { kind: 'malformed', location: locationAt(tokens, 0), expected, actual: tokens[0] === undefined ? '<end-of-source>' : '<unexpected-token>', reason };
    case 'malformed':
      return { kind: 'malformed', location: judgment.location, expected: judgment.expected ?? expected, actual: judgment.actual, reason: 'malformed_delimiter' };
  }
};

const resolveConditional = <Token>(query: ScannerConditionalStatementQuery<Token>): ScannerConditionalStatementJudgment<Token> => {
  const keyword = query.tokens[0];
  if (keyword === undefined || query.tokenValue(keyword) !== 'if') return { kind: 'not_applicable' };

  const conditionSource = query.tokens.slice(1);
  const condition = scannerTokenStructureInterface.matchLeadingDelimiter({
    tokens: conditionSource,
    tokenValue: query.tokenValue,
  });
  if (condition.kind !== 'matched' || query.tokenValue(condition.evidence.opening) !== '(') {
    return malformedDelimiter(conditionSource, condition, '(', 'expected_condition', query.tokenValue);
  }

  const bodySource = condition.evidence.suffix;
  const body = scannerTokenStructureInterface.matchLeadingDelimiter({
    tokens: bodySource,
    tokenValue: query.tokenValue,
  });
  if (body.kind !== 'matched' || query.tokenValue(body.evidence.opening) !== '{') {
    return malformedDelimiter(bodySource, body, '{', 'expected_then_body', query.tokenValue);
  }

  const afterThen = body.evidence.suffix;
  const elseKeyword = afterThen[0];
  if (elseKeyword === undefined || query.tokenValue(elseKeyword) !== 'else') {
    return {
      kind: 'resolved',
      evidence: {
        keyword,
        condition: condition.evidence.contents,
        thenBody: body.evidence.contents,
        elseBranch: { kind: 'none' },
        remaining: afterThen,
      },
    };
  }

  const elseTail = afterThen.slice(1);
  const elseHead = elseTail[0];
  if (elseHead !== undefined && query.tokenValue(elseHead) === 'if') {
    const nested = resolveConditional({ tokens: elseTail, tokenValue: query.tokenValue });
    switch (nested.kind) {
      case 'not_applicable':
        return { kind: 'malformed', location: locationAt(elseTail, 0), expected: 'if', actual: query.tokenValue(elseHead), reason: 'expected_else_body' };
      case 'malformed':
        return nested;
      case 'resolved':
        return {
          kind: 'resolved',
          evidence: {
            keyword,
            condition: condition.evidence.contents,
            thenBody: body.evidence.contents,
            elseBranch: { kind: 'else_if', statement: nested.evidence },
            remaining: nested.evidence.remaining,
          },
        };
    }
  }

  const elseBody = scannerTokenStructureInterface.matchLeadingDelimiter({
    tokens: elseTail,
    tokenValue: query.tokenValue,
  });
  if (elseBody.kind !== 'matched' || query.tokenValue(elseBody.evidence.opening) !== '{') {
    return malformedDelimiter(elseTail, elseBody, '{', 'expected_else_body', query.tokenValue);
  }
  const elseBranch: ScannerConditionalElseBranch<Token> = {
    kind: 'else_block',
    keyword: elseKeyword,
    body: elseBody.evidence.contents,
  };
  return {
    kind: 'resolved',
    evidence: {
      keyword,
      condition: condition.evidence.contents,
      thenBody: body.evidence.contents,
      elseBranch,
      remaining: elseBody.evidence.suffix,
    },
  };
};

export const scannerConditionalStatementContractAlgebra: ScannerConditionalStatementInterface = Object.freeze({
  resolve: <Token>(query: ScannerConditionalStatementQuery<Token>): ScannerConditionalStatementJudgment<Token> =>
    resolveConditional(query),
});
