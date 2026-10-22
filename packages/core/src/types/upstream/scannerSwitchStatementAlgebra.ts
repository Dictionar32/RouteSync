import type { ScannerSwitchCaseEvidence, ScannerSwitchStatementInterface, ScannerSwitchStatementJudgment, ScannerSwitchStatementQuery } from './scannerSwitchStatementInterface';
import type { TokenEvidenceLocation } from './scannerTokenStructureInterface';

const locationAt = <Token>(tokens: readonly Token[], index: number): TokenEvidenceLocation<Token> => {
  const token = tokens[index];
  return token === undefined ? { kind: 'end_of_source' } : { kind: 'token', evidence: token };
};
const malformed = <Token>(tokens: readonly Token[], index: number, expected: string, actual: string, reason: Extract<ScannerSwitchStatementJudgment<Token>, { kind: 'malformed' }>['reason']): ScannerSwitchStatementJudgment<Token> => ({ kind: 'malformed', location: locationAt(tokens, index), expected, actual, reason });

const resolveSwitch = <Token>(query: ScannerSwitchStatementQuery<Token>): ScannerSwitchStatementJudgment<Token> => {
  const keyword = query.tokens[0];
  if (keyword === undefined || query.tokenValue(keyword) !== 'switch') return { kind: 'not_applicable' };
  const header = query.structure.matchLeadingDelimiter({ tokens: query.tokens.slice(1), tokenValue: query.tokenValue });
  if (header.kind !== 'matched' || query.tokenValue(header.evidence.opening) !== '(') {
    return malformed(query.tokens, 1, 'switch subject in parentheses', header.kind === 'malformed' ? header.actual : '<subject-not-found>', 'expected_subject');
  }
  if (header.evidence.contents.length === 0) return malformed(query.tokens, 1, 'non-empty switch subject', '<empty-subject>', 'expected_subject');
  const bodySource = header.evidence.suffix;
  const body = query.structure.matchLeadingDelimiter({ tokens: bodySource, tokenValue: query.tokenValue });
  if (body.kind !== 'matched' || query.tokenValue(body.evidence.opening) !== '{') {
    return malformed(bodySource, 0, 'switch body in braces', body.kind === 'malformed' ? body.actual : '<body-not-found>', 'expected_body');
  }
  const bodyTokens = body.evidence.contents;
  const markers = query.structure.locateTopLevelCandidates({ tokens: bodyTokens, targets: ['case', 'default'], tokenValue: query.tokenValue });
  if (markers.kind === 'malformed') return { kind: 'malformed', location: markers.location, expected: markers.expected ?? 'balanced case body', actual: markers.actual, reason: 'malformed_delimiter' };
  const cases: ScannerSwitchCaseEvidence<Token>[] = [];
  let defaultSeen = false;
  for (let markerIndex = 0; markerIndex < markers.occurrences.length; markerIndex += 1) {
    const marker = markers.occurrences[markerIndex];
    if (marker === undefined) continue;
    const markerPosition = marker.before.length;
    const nextMarker = markers.occurrences[markerIndex + 1];
    const nextPosition = nextMarker === undefined ? bodyTokens.length : nextMarker.before.length;
    const section = bodyTokens.slice(markerPosition + 1, nextPosition);
    const colon = query.structure.locateTopLevel({ tokens: section, target: ':', tokenValue: query.tokenValue });
    if (colon.kind !== 'found') return malformed(section, section.length, 'top-level colon after case/default label', colon.kind === 'malformed' ? colon.actual : '<colon-not-found>', 'missing_case_separator');
    const kind = query.tokenValue(marker.token) as 'case' | 'default';
    if (kind === 'default' && defaultSeen) return malformed(bodyTokens, markerPosition, 'at most one default case', 'duplicate default', 'duplicate_default');
    if (kind === 'default') defaultSeen = true;
    const labelTokens = section.slice(0, colon.occurrence.before.length);
    const labels: readonly (readonly Token[])[] = kind === 'default' ? [] : (() => {
      const split = query.structure.locateTopLevelCandidates({ tokens: labelTokens, targets: [','], tokenValue: query.tokenValue });
      if (split.kind === 'malformed') return [labelTokens];
      const parts: Token[][] = [];
      let consumed = 0;
      for (const occurrence of split.occurrences) {
        parts.push([...labelTokens.slice(consumed, occurrence.before.length)]);
        consumed = occurrence.before.length + 1;
      }
      parts.push([...labelTokens.slice(consumed)]);
      return parts;
    })();
    if (kind === 'case' && (labels.length === 0 || labels.some(label => label.length === 0))) return malformed(labelTokens, 0, 'non-empty case label', '<empty-label>', 'missing_case_separator');
    const bodyStart = markerPosition + 1 + colon.occurrence.before.length + 1;
    const caseBody = bodyTokens.slice(bodyStart, nextPosition);
    cases.push({ kind, marker: marker.token, labels, body: caseBody, hasBreak: caseBody.some(token => query.tokenValue(token) === 'break') });
  }
  return { kind: 'resolved', evidence: { keyword, subject: header.evidence.contents, cases, remaining: body.evidence.suffix } };
};

export const scannerSwitchStatementContractAlgebra: ScannerSwitchStatementInterface = Object.freeze({
  resolve: <Token>(query: ScannerSwitchStatementQuery<Token>): ScannerSwitchStatementJudgment<Token> => resolveSwitch(query),
});
