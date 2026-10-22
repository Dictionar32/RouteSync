import {
  SCANNER_MATCH_ARM_CONDITIONAL,
  SCANNER_MATCH_ARM_DEFAULT,
  SCANNER_MATCH_CONTRACT_VIOLATION,
  SCANNER_MATCH_DEFAULT_WITH_CONDITIONS,
  SCANNER_MATCH_DUPLICATE_DEFAULT,
  SCANNER_MATCH_EMPTY_BODY,
  SCANNER_MATCH_EMPTY_CONDITION,
  SCANNER_MATCH_EXPECTED_ARM,
  SCANNER_MATCH_EXPECTED_ARM_VALUE,
  SCANNER_MATCH_EXPECTED_BODY,
  SCANNER_MATCH_EXPECTED_FAT_ARROW,
  SCANNER_MATCH_EXPECTED_SUBJECT,
  SCANNER_MATCH_INCOMPLETE_RESOLVED_EVIDENCE,
  SCANNER_MATCH_INCONSISTENT_PARTITION,
  SCANNER_MATCH_LOCATION_END,
  SCANNER_MATCH_LOCATION_TOKEN,
  SCANNER_MATCH_MALFORMED,
  SCANNER_MATCH_MALFORMED_DELIMITER,
  SCANNER_MATCH_MULTIPLE_FAT_ARROWS,
  SCANNER_MATCH_NOT_APPLICABLE,
  SCANNER_MATCH_RESOLVED,
  type ScannerMatchArmEvidence,
  type ScannerMatchExpressionEvidence,
  type ScannerMatchExpressionInterface,
  type ScannerMatchExpressionJudgment,
  type ScannerMatchExpressionQuery,
  type ScannerMatchMalformedReason,
} from './scannerMatchExpressionInterface';
import type { ScannerTokenStructureInterface } from './scannerTokenStructureInterface';

/** Semantic parser for match expressions. All delimiter and top-level operator
 * decisions are delegated to the shared token-structure interface. */
export interface ScannerMatchExpressionAlgebra {
  readonly resolve: ScannerMatchExpressionInterface['resolve'];
}

type SplitResult<Token> = Readonly<{ readonly parts: readonly (readonly Token[])[]; readonly separators: readonly Token[] }>;
type Failure<Token> = Readonly<{ readonly kind: 'malformed'; readonly location: Readonly<{ readonly kind: typeof SCANNER_MATCH_LOCATION_TOKEN; readonly evidence: Token } | { readonly kind: typeof SCANNER_MATCH_LOCATION_END }>; readonly reason: ScannerMatchMalformedReason; readonly expected: string; readonly actual: string }>;

const sameSequence = <Token>(left: readonly Token[], right: readonly Token[], sameToken: (left: Token, right: Token) => boolean): boolean =>
  left.length === right.length && left.every((token, index) => {
    const other = right[index];
    return other !== undefined && sameToken(token, other);
  });

const splitTopLevel = <Token>(
  tokens: readonly Token[], separator: string, structure: ScannerTokenStructureInterface,
  tokenValue: (token: Token) => string,
): SplitResult<Token> | Readonly<{ readonly kind: 'malformed'; readonly index: number; readonly expected?: string; readonly actual: string }> => {
  const found = structure.locateTopLevelCandidates({ tokens, targets: [separator], tokenValue });
  if (found.kind === 'malformed') return { kind: 'malformed', index: found.location.kind === 'token' ? tokens.indexOf(found.location.evidence) : tokens.length, expected: found.expected, actual: found.actual };
  const parts: (readonly Token[])[] = [];
  const separators: Token[] = [];
  let cursor = 0;
  for (const occurrence of found.occurrences) {
    const index = occurrence.before.length;
    parts.push(tokens.slice(cursor, index));
    separators.push(occurrence.token);
    cursor = index + 1;
  }
  parts.push(tokens.slice(cursor));
  return { parts, separators };
};

const reconstruct = <Token>(parts: readonly (readonly Token[])[], separators: readonly Token[]): readonly Token[] => {
  const output: Token[] = [];
  parts.forEach((part, index) => {
    output.push(...part);
    const separator = separators[index];
    if (separator !== undefined) output.push(separator);
  });
  return output;
};

const malformed = <Token>(
  tokens: readonly Token[], index: number, reason: ScannerMatchMalformedReason, expected: string, actual: string,
): ScannerMatchExpressionJudgment<Token> => {
  const evidence = tokens[index];
  return { kind: SCANNER_MATCH_MALFORMED, location: evidence === undefined ? { kind: SCANNER_MATCH_LOCATION_END } : { kind: SCANNER_MATCH_LOCATION_TOKEN, evidence }, reason, expected, actual };
};

const splitFailure = <Token>(tokens: readonly Token[], failure: Readonly<{ readonly index: number; readonly expected?: string; readonly actual: string }>, expected: string): ScannerMatchExpressionJudgment<Token> =>
  malformed(tokens, failure.index, SCANNER_MATCH_MALFORMED_DELIMITER, failure.expected ?? expected, failure.actual);

const parseArm = <Token>(
  arm: readonly Token[], trailingComma: Token | undefined, query: ScannerMatchExpressionQuery<Token>,
): ScannerMatchArmEvidence<Token> | Failure<Token> => {
  const { tokenValue, structure, sameToken } = query;
  if (arm.length === 0) return { kind: 'malformed', location: { kind: SCANNER_MATCH_LOCATION_END }, reason: SCANNER_MATCH_EXPECTED_ARM, expected: 'match arm', actual: '<empty>' };
  const arrows = structure.locateTopLevelCandidates({ tokens: arm, targets: ['=>'], tokenValue });
  if (arrows.kind === 'malformed') return { kind: 'malformed', location: arrows.location.kind === 'token' ? { kind: SCANNER_MATCH_LOCATION_TOKEN, evidence: arrows.location.evidence } : { kind: SCANNER_MATCH_LOCATION_END }, reason: SCANNER_MATCH_MALFORMED_DELIMITER, expected: arrows.expected ?? 'balanced delimiters', actual: arrows.actual };
  if (arrows.occurrences.length === 0) return { kind: 'malformed', location: { kind: SCANNER_MATCH_LOCATION_TOKEN, evidence: arm[0]! }, reason: SCANNER_MATCH_EXPECTED_FAT_ARROW, expected: '=>', actual: tokenValue(arm[0]!) };
  if (arrows.occurrences.length > 1) return { kind: 'malformed', location: { kind: SCANNER_MATCH_LOCATION_TOKEN, evidence: arrows.occurrences[1]!.token }, reason: SCANNER_MATCH_MULTIPLE_FAT_ARROWS, expected: 'exactly one top-level =>', actual: 'multiple => tokens' };
  const arrow = arrows.occurrences[0]!;
  const left = arrow.before;
  const value = arrow.after;
  if (value.length === 0) return { kind: 'malformed', location: { kind: SCANNER_MATCH_LOCATION_END }, reason: SCANNER_MATCH_EXPECTED_ARM_VALUE, expected: 'non-empty arm value', actual: '<empty>' };
  if (!sameSequence(arm, [...left, arrow.token, ...value], sameToken)) return { kind: 'malformed', location: { kind: SCANNER_MATCH_LOCATION_TOKEN, evidence: arrow.token }, reason: SCANNER_MATCH_EXPECTED_FAT_ARROW, expected: 'source-preserving arm partition', actual: 'partition mismatch' };
  if (left.length === 1 && tokenValue(left[0]!) === 'default') {
    return { kind: SCANNER_MATCH_ARM_DEFAULT, source: arm, defaultToken: left[0]!, fatArrow: arrow.token, value, ...(trailingComma === undefined ? {} : { armSeparatorAfter: trailingComma }) };
  }
  if (left.some(token => tokenValue(token) === 'default')) return { kind: 'malformed', location: { kind: SCANNER_MATCH_LOCATION_TOKEN, evidence: left.find(token => tokenValue(token) === 'default')! }, reason: SCANNER_MATCH_DEFAULT_WITH_CONDITIONS, expected: 'default as the only arm label', actual: 'default mixed with conditions' };
  const conditionSplit = splitTopLevel(left, ',', structure, tokenValue);
  if (!('parts' in conditionSplit)) return { kind: 'malformed', location: conditionSplit.index < left.length ? { kind: SCANNER_MATCH_LOCATION_TOKEN, evidence: left[conditionSplit.index]! } : { kind: SCANNER_MATCH_LOCATION_END }, reason: SCANNER_MATCH_MALFORMED_DELIMITER, expected: conditionSplit.expected ?? 'balanced condition delimiters', actual: conditionSplit.actual };
  if (conditionSplit.parts.some(part => part.length === 0)) return { kind: 'malformed', location: { kind: SCANNER_MATCH_LOCATION_TOKEN, evidence: left[0]! }, reason: SCANNER_MATCH_EMPTY_CONDITION, expected: 'non-empty condition', actual: '<empty>' };
  if (!sameSequence(left, reconstruct(conditionSplit.parts, conditionSplit.separators), sameToken)) return { kind: 'malformed', location: { kind: SCANNER_MATCH_LOCATION_TOKEN, evidence: left[0]! }, reason: SCANNER_MATCH_EXPECTED_ARM, expected: 'source-preserving condition partition', actual: 'partition mismatch' };
  return { kind: SCANNER_MATCH_ARM_CONDITIONAL, source: arm, conditions: conditionSplit.parts, conditionSeparators: conditionSplit.separators, fatArrow: arrow.token, value, ...(trailingComma === undefined ? {} : { armSeparatorAfter: trailingComma }) };
};

const resolve = <Token>(query: ScannerMatchExpressionQuery<Token>): ScannerMatchExpressionJudgment<Token> => {
  const { tokens, tokenValue, sameToken, structure } = query;
  if (tokens.length === 0 || tokenValue(tokens[0]!) !== 'match') return { kind: SCANNER_MATCH_NOT_APPLICABLE };
  const subjectInput = tokens.slice(1);
  const subject = structure.matchLeadingDelimiter({ tokens: subjectInput, tokenValue });
  if (subject.kind === 'not_found') return malformed(tokens, 1, SCANNER_MATCH_EXPECTED_SUBJECT, '(', tokenValue(tokens[1]!) ?? '<end-of-source>');
  if (subject.kind === 'malformed') return splitFailure(subjectInput, { index: subject.location.kind === 'token' ? subjectInput.indexOf(subject.location.evidence) : subjectInput.length, expected: subject.expected, actual: subject.actual }, '(');
  if (subject.evidence.contents.length === 0) return malformed(tokens, 1, SCANNER_MATCH_EXPECTED_SUBJECT, 'non-empty match subject', '<empty>');
  const afterSubject = subject.evidence.suffix;
  if (afterSubject.length === 0 || tokenValue(afterSubject[0]!) !== '{') return malformed(tokens, tokens.length - afterSubject.length, SCANNER_MATCH_EXPECTED_BODY, '{', afterSubject[0] === undefined ? '<end-of-source>' : tokenValue(afterSubject[0]));
  const body = structure.matchLeadingDelimiter({ tokens: afterSubject, tokenValue });
  if (body.kind === 'not_found') return malformed(afterSubject, 0, SCANNER_MATCH_EXPECTED_BODY, '{', tokenValue(afterSubject[0]!));
  if (body.kind === 'malformed') return splitFailure(afterSubject, { index: body.location.kind === 'token' ? afterSubject.indexOf(body.location.evidence) : afterSubject.length, expected: body.expected, actual: body.actual }, '{');
  if (body.evidence.contents.length === 0) return malformed(afterSubject, 1, SCANNER_MATCH_EMPTY_BODY, 'at least one match arm', '<empty>');
  const armSplit = splitTopLevel(body.evidence.contents, ',', structure, tokenValue);
  if (!('parts' in armSplit)) return splitFailure(body.evidence.contents, armSplit, ',');
  const arms: ScannerMatchArmEvidence<Token>[] = [];
  let pendingArm: Token[] = [];
  for (let index = 0; index < armSplit.parts.length; index += 1) {
    const part = armSplit.parts[index]!;
    const separatorBefore = index > 0 ? armSplit.separators[index - 1] : undefined;
    if (separatorBefore !== undefined && pendingArm.length > 0) pendingArm.push(separatorBefore);
    pendingArm.push(...part);
    if (pendingArm.length === 0) continue;
    const arrowEvidence = structure.locateTopLevelCandidates({ tokens: pendingArm, targets: ['=>'], tokenValue });
    if (arrowEvidence.kind === 'malformed') return splitFailure(pendingArm, { index: arrowEvidence.location.kind === 'token' ? pendingArm.indexOf(arrowEvidence.location.evidence) : pendingArm.length, expected: arrowEvidence.expected, actual: arrowEvidence.actual }, '=>');
    if (arrowEvidence.occurrences.length === 0) continue;
    const trailingComma = armSplit.separators[index];
    const parsed = parseArm(pendingArm, trailingComma, query);
    if ('kind' in parsed && parsed.kind === 'malformed') return { kind: SCANNER_MATCH_MALFORMED, location: parsed.location, reason: parsed.reason, expected: parsed.expected, actual: parsed.actual };
    arms.push(parsed);
    pendingArm = [];
  }
  if (pendingArm.length > 0) {
    const last = pendingArm[0];
    return malformed(pendingArm, pendingArm.length - 1, SCANNER_MATCH_EXPECTED_FAT_ARROW, '=>', last === undefined ? '<end-of-source>' : tokenValue(last));
  }
  if (arms.length === 0) return malformed(body.evidence.contents, 0, SCANNER_MATCH_EMPTY_BODY, 'at least one match arm', '<empty>');
  const defaults = arms.filter(arm => arm.kind === SCANNER_MATCH_ARM_DEFAULT);
  if (defaults.length > 1) return malformed(body.evidence.contents, 0, SCANNER_MATCH_DUPLICATE_DEFAULT, 'at most one default arm', 'multiple default arms');
  const sourceArms: Token[] = [];
  arms.forEach((arm, index) => {
    sourceArms.push(...arm.source);
    const separator = arm.armSeparatorAfter;
    if (separator !== undefined) sourceArms.push(separator);
    else if (index < arms.length - 1) sourceArms.push(...[]);
  });
  if (!sameSequence(body.evidence.contents, sourceArms, sameToken)) return { kind: SCANNER_MATCH_CONTRACT_VIOLATION, reason: SCANNER_MATCH_INCONSISTENT_PARTITION };
  const evidence: ScannerMatchExpressionEvidence<Token> = Object.freeze({
    keyword: tokens[0]!, openingSubjectDelimiter: subject.evidence.opening, subject: subject.evidence.contents,
    closingSubjectDelimiter: subject.evidence.closing, betweenSubjectAndBody: subject.evidence.suffix.slice(0, 0),
    openingBodyDelimiter: body.evidence.opening, body: body.evidence.contents, arms: Object.freeze(arms),
    closingBodyDelimiter: body.evidence.closing, remaining: body.evidence.suffix,
  });
  const reconstructed = [evidence.keyword, evidence.openingSubjectDelimiter, ...evidence.subject, evidence.closingSubjectDelimiter, ...evidence.betweenSubjectAndBody, evidence.openingBodyDelimiter, ...evidence.body, evidence.closingBodyDelimiter, ...evidence.remaining];
  if (!sameSequence(tokens, reconstructed, sameToken)) return { kind: SCANNER_MATCH_CONTRACT_VIOLATION, reason: SCANNER_MATCH_INCOMPLETE_RESOLVED_EVIDENCE };
  return { kind: SCANNER_MATCH_RESOLVED, evidence };
};

export const scannerMatchExpressionAlgebra: ScannerMatchExpressionAlgebra = Object.freeze({ resolve });
export const scannerMatchExpressionInterface: ScannerMatchExpressionInterface = Object.freeze({ resolve });
