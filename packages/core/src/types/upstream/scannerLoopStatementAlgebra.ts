import type { DelimitedTokenJudgment, TokenEvidenceLocation } from './scannerTokenStructureInterface';
import type { ScannerLoopStatementBaseEvidence, ScannerLoopStatementInterface, ScannerLoopStatementJudgment, ScannerLoopStatementQuery, ScannerLoopTarget } from './scannerLoopStatementInterface';

const locationAt = <Token>(tokens: readonly Token[], index: number): TokenEvidenceLocation<Token> => {
  const token = tokens[index];
  return token === undefined ? { kind: 'end_of_source' } : { kind: 'token', evidence: token };
};
const malformedDelimiter = <Token>(tokens: readonly Token[], judgment: DelimitedTokenJudgment<Token>, expected: string): ScannerLoopStatementJudgment<Token> => {
  switch (judgment.kind) {
    case 'matched': return { kind: 'malformed', location: { kind: 'token', evidence: judgment.evidence.opening }, expected, actual: expected, reason: 'malformed_delimiter' };
    case 'not_found': return { kind: 'malformed', location: locationAt(tokens, 0), expected, actual: tokens[0] === undefined ? '<end-of-source>' : '<unexpected-token>', reason: expected === '(' ? 'expected_header' : 'expected_body' };
    case 'malformed': return { kind: 'malformed', location: judgment.location, expected: judgment.expected ?? expected, actual: judgment.actual, reason: 'malformed_delimiter' };
  }
};
const resolveLoop = <Token>(query: ScannerLoopStatementQuery<Token>): ScannerLoopStatementJudgment<Token> => {
  const keyword = query.tokens[0];
  if (keyword === undefined) return { kind: 'not_applicable' };
  const expectedKeyword = query.control === 'collection_iteration' ? 'foreach' : query.control === 'counted_iteration' ? 'for' : 'while';
  if (query.tokenValue(keyword) !== expectedKeyword) return { kind: 'not_applicable' };
  const headerSource = query.tokens.slice(1);
  const header = query.structure.matchLeadingDelimiter({ tokens: headerSource, tokenValue: query.tokenValue });
  if (header.kind !== 'matched' || query.tokenValue(header.evidence.opening) !== '(') return malformedDelimiter(headerSource, header, '(');
  const bodySource = header.evidence.suffix;
  const body = query.structure.matchLeadingDelimiter({ tokens: bodySource, tokenValue: query.tokenValue });
  if (body.kind !== 'matched' || query.tokenValue(body.evidence.opening) !== '{') return malformedDelimiter(bodySource, body, '{');
  const base: ScannerLoopStatementBaseEvidence<Token> = {
    keyword,
    header: header.evidence.contents,
    body: body.evidence.contents,
    remaining: body.evidence.suffix,
  };
  if (query.control === 'pretest_iteration') return { kind: 'resolved', evidence: { ...base, control: 'pretest_iteration' } };
  if (query.control === 'counted_iteration') {
    const partition = query.structure.locateTopLevelCandidates({ tokens: header.evidence.contents, targets: [';'], tokenValue: query.tokenValue });
    if (partition.kind === 'malformed') return { kind: 'malformed', location: partition.location, expected: 'two top-level semicolons', actual: partition.actual, reason: 'invalid_for_clauses' };
    if (partition.occurrences.length !== 2) return { kind: 'malformed', location: locationAt(header.evidence.contents, header.evidence.contents.length), expected: 'exactly three for clauses', actual: String(partition.occurrences.length + 1), reason: 'invalid_for_clauses' };
    const first = partition.occurrences[0];
    const second = partition.occurrences[1];
    if (first === undefined || second === undefined) return { kind: 'malformed', location: locationAt(header.evidence.contents, header.evidence.contents.length), expected: 'three for clauses', actual: 'incomplete partition', reason: 'invalid_for_clauses' };
    return { kind: 'resolved', evidence: { ...base, control: 'counted_iteration', clauses: [first.before, second.before.slice(first.before.length + 1), second.after] } };
  }
  const asEvidence = query.structure.locateTopLevel({ tokens: header.evidence.contents, target: 'as', tokenValue: query.tokenValue });
  if (asEvidence.kind !== 'found') {
    const location = asEvidence.kind === 'malformed' ? asEvidence.location : locationAt(header.evidence.contents, header.evidence.contents.length);
    const actual = asEvidence.kind === 'malformed' ? asEvidence.actual : '<as-not-found>';
    return { kind: 'malformed', location, expected: 'top-level as', actual, reason: 'missing_as' };
  }
  const targetTokens = asEvidence.occurrence.after;
  const arrowIndex = targetTokens.findIndex(token => query.tokenKind(token) === 'ARROW' || query.tokenValue(token) === '=>');
  const variablesBeforeArrow = (arrowIndex >= 0 ? targetTokens.slice(0, arrowIndex) : targetTokens).filter(token => query.tokenKind(token) === 'VARIABLE');
  const variablesAfterArrow = arrowIndex >= 0 ? targetTokens.slice(arrowIndex + 1).filter(token => query.tokenKind(token) === 'VARIABLE') : [];
  const firstVariable = variablesBeforeArrow[0];
  if (firstVariable === undefined) return { kind: 'malformed', location: locationAt(targetTokens, 0), expected: 'iteration variable', actual: '<variable-not-found>', reason: 'invalid_iteration_target' };
  const valueVariable = variablesAfterArrow[0];
  if (arrowIndex >= 0 && valueVariable === undefined) return { kind: 'malformed', location: locationAt(targetTokens, targetTokens.length), expected: 'value variable after =>', actual: '<variable-not-found>', reason: 'invalid_iteration_target' };
  const target: ScannerLoopTarget<Token> = arrowIndex >= 0 && valueVariable !== undefined
    ? { kind: 'key_value', key: firstVariable, value: valueVariable }
    : { kind: 'value', variable: firstVariable };
  return { kind: 'resolved', evidence: { ...base, control: 'collection_iteration', iterable: asEvidence.occurrence.before, target } };
};

export const scannerLoopStatementContractAlgebra: ScannerLoopStatementInterface = Object.freeze({
  resolve: <Token>(query: ScannerLoopStatementQuery<Token>): ScannerLoopStatementJudgment<Token> => resolveLoop(query),
});
