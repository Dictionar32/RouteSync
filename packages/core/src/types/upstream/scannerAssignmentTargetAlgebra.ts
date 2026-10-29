/**
 * Language-neutral assignment-target grammar algebra.
 *
 * The canonical resolver consumes the index-free upstream interface contract.
 * A compatibility facade adapts the former cursor-oriented contract for legacy
 * callers; it contains no independent target-recognition algorithm.
 */
import {
  scannerTokenStructureInterface,
  type DelimitedTokenJudgment,
  type TokenEvidenceLocation,
  type TokenOccurrenceJudgment,
} from './scannerTokenStructureAlgebra';
import type {
  AssignmentTargetArrayAccessEvidence as InterfaceArrayAccessEvidence,
  AssignmentTargetMemberEvidence as InterfaceMemberEvidence,
  AssignmentTargetQuery,
  AssignmentTargetJudgment,
  AssignmentTargetEvidenceJudgment,
  ScannerAssignmentTargetInterface,
} from './scannerAssignmentTargetInterface';
import type { TokenStructureResolution } from './scannerTokenStructureAlgebra';

export type AssignmentTargetMemberEvidence<Expression, Identifier> = InterfaceMemberEvidence<Expression, Identifier>;
export type AssignmentTargetArrayAccessEvidence<Expression> = InterfaceArrayAccessEvidence<Expression>;

/** @deprecated Use AssignmentTargetQuery with ScannerAssignmentTargetInterface. */
export type AssignmentTargetContract<Token, Expression, Identifier, Target, Entry, Pattern> = Readonly<{
  readonly tokens: readonly Token[];
  readonly tokenValue: (token: Token | undefined) => string;
  readonly isVariableToken: (token: Token | undefined) => boolean;
  readonly variableIdentifier: (token: Token) => Identifier;
  readonly slice: (tokens: readonly Token[], start: number, end?: number) => readonly Token[];
  readonly splitTopLevel: (tokens: readonly Token[], separator: string) => readonly (readonly Token[])[];
  readonly findTopLevelOperator: (tokens: readonly Token[], operator: string) => TokenStructureResolution;
  readonly classifyExpression: (tokens: readonly Token[]) => Expression;
  readonly classifyArrayAccess: (tokens: readonly Token[]) => RelationOption<AssignmentTargetArrayAccessEvidence<Expression>>;
  readonly classifyMember: (tokens: readonly Token[]) => RelationOption<AssignmentTargetMemberEvidence<Expression, Identifier>>;
  readonly classifyStaticProperty: (tokens: readonly Token[]) => RelationOption<Target>;
  readonly variableTarget: (identifier: Identifier) => Target;
  readonly appendTarget: (receiver: Expression) => Target;
  readonly arrayElementTarget: (evidence: AssignmentTargetArrayAccessEvidence<Expression>) => Target;
  readonly propertyTarget: (evidence: AssignmentTargetMemberEvidence<Expression, Identifier>) => Target;
  readonly destructuringTarget: (pattern: Pattern) => Target;
  readonly listPattern: (entries: readonly Entry[]) => Pattern;
  readonly skippedEntry: () => Entry;
  readonly keyedEntry: (key: Expression, target: Entry) => Entry;
  readonly nestedEntry: (pattern: Pattern) => Entry;
  readonly referenceVariableEntry: (identifier: Identifier) => Entry;
  readonly variableEntry: (identifier: Identifier) => Entry;
  readonly patternOfTarget: (target: Target) => RelationOption<Pattern>;
}>;

/** @deprecated Use AssignmentTargetJudgment from scannerAssignmentTargetInterface. */
export type AssignmentTargetResolution<Target> =
  | Readonly<{ readonly kind: 'resolved'; readonly target: Target }>
  | Readonly<{ readonly kind: 'unresolved'; readonly reason: 'empty_target' | 'invalid_destructuring' | 'invalid_target' }>
  | Readonly<{ readonly kind: 'malformed'; readonly index: number; readonly expected?: string; readonly actual: string }>;

/** @deprecated Use ScannerAssignmentTargetInterface. */
export interface ScannerAssignmentTargetAlgebra {
  readonly resolve: <Token, Expression, Identifier, Target, Entry, Pattern>(
    contract: AssignmentTargetContract<Token, Expression, Identifier, Target, Entry, Pattern>,
  ) => AssignmentTargetResolution<Target>;
}

const locationFor = <Token>(tokens: readonly Token[], location: TokenEvidenceLocation<Token>): number => {
  if (location.kind === 'end_of_source') return tokens.length;
  const index = tokens.indexOf(location.evidence);
  return index < 0 ? tokens.length : index;
};

const matchLeadingDelimiter = <Token>(tokens: readonly Token[], tokenValue: (token: Token | undefined) => string): DelimitedTokenJudgment<Token> =>
  scannerTokenStructureInterface.matchLeadingDelimiter({ tokens, tokenValue: token => tokenValue(token) });

const isVariableToken = <Token, Expression, Identifier, Target, Entry, Pattern>(
  token: Token | undefined,
  query: AssignmentTargetQuery<Token, Expression, Identifier, Target, Entry, Pattern>,
): boolean => query.isVariableToken(token);

const resolveEntry = <Token, Expression, Identifier, Target, Entry, Pattern>(
  query: AssignmentTargetQuery<Token, Expression, Identifier, Target, Entry, Pattern>,
  tokens: readonly Token[],
): AssignmentTargetJudgment<Token, Entry> => {
  if (tokens.length === 0) return { kind: 'resolved', target: query.skippedEntry() };
  const arrow = query.locateTopLevel(tokens, '=>');
  if (arrow.kind === 'malformed') return { kind: 'malformed', location: arrow.location, expected: arrow.expected, actual: arrow.actual };
  if (arrow.kind === 'found' && arrow.occurrence.before.length > 0 && arrow.occurrence.after.length > 0) {
    const key = query.classifyExpression(arrow.occurrence.before);
    const nested = resolveEntry(query, arrow.occurrence.after);
    return nested.kind === 'malformed' || nested.kind === 'contract_violation'
      ? nested
      : nested.kind === 'resolved'
        ? { kind: 'resolved', target: query.keyedEntry(key, nested.target) }
        : { kind: 'resolved', target: query.skippedEntry() };
  }
  const delimiter = query.matchLeadingDelimiter(tokens);
  if (delimiter.kind === 'malformed') return { kind: 'malformed', location: delimiter.location, expected: delimiter.expected, actual: delimiter.actual };
  if (delimiter.kind === 'matched' && delimiter.evidence.suffix.length === 0 && query.tokenValue(delimiter.evidence.opening) === '[' && query.tokenValue(delimiter.evidence.closing) === ']') {
    const nested = resolveTarget({ ...query, tokens: delimiter.evidence.contents });
    if (nested.kind === 'malformed' || nested.kind === 'contract_violation') return nested;
    if (nested.kind === 'resolved') {
      const pattern = query.patternOfTarget(nested.target);
      if (pattern.kind === 'resolved') return { kind: 'resolved', target: query.nestedEntry(pattern.evidence) };
    }
    return { kind: 'resolved', target: query.skippedEntry() };
  }
  if (tokens.length === 2 && query.tokenValue(tokens[0]) === '&' && isVariableToken(tokens[1], query)) {
    return { kind: 'resolved', target: query.referenceVariableEntry(query.variableIdentifier(tokens[1])) };
  }
  if (tokens.length === 1 && isVariableToken(tokens[0], query)) {
    return { kind: 'resolved', target: query.variableEntry(query.variableIdentifier(tokens[0])) };
  }
  return { kind: 'resolved', target: query.skippedEntry() };
};

const resolveTarget = <Token, Expression, Identifier, Target, Entry, Pattern>(
  query: AssignmentTargetQuery<Token, Expression, Identifier, Target, Entry, Pattern>,
): AssignmentTargetJudgment<Token, Target> => {
  const tokens = query.tokens;
  if (tokens.length === 0) return { kind: 'unresolved', reason: 'empty_target' };

  const delimiter = query.matchLeadingDelimiter(tokens);
  if (delimiter.kind === 'malformed') return { kind: 'malformed', location: delimiter.location, expected: delimiter.expected, actual: delimiter.actual };
  if (delimiter.kind === 'matched' && delimiter.evidence.suffix.length === 0 && query.tokenValue(delimiter.evidence.opening) === '[' && query.tokenValue(delimiter.evidence.closing) === ']') {
    const partition = scannerTokenStructureInterface.partitionTopLevel({
      tokens: delimiter.evidence.contents,
      separator: ',',
      tokenValue: token => query.tokenValue(token),
    });
    if (partition.kind === 'malformed') return { kind: 'malformed', location: partition.location, expected: partition.expected, actual: partition.actual };
    const resolutions = partition.parts.map(entry => resolveEntry(query, entry));
    const malformed = resolutions.find(entry => entry.kind === 'malformed' || entry.kind === 'contract_violation');
    if (malformed?.kind === 'malformed' || malformed?.kind === 'contract_violation') return malformed;
    const entries: Entry[] = [];
    for (const entry of resolutions) if (entry.kind === 'resolved') entries.push(entry.target);
    return entries.length === 0
      ? { kind: 'unresolved', reason: 'invalid_destructuring' }
      : { kind: 'resolved', target: query.destructuringTarget(query.listPattern(Object.freeze(entries))) };
  }

  if (tokens.length === 1 && isVariableToken(tokens[0], query)) {
    return { kind: 'resolved', target: query.variableTarget(query.variableIdentifier(tokens[0])) };
  }
  if (tokens.length >= 2 && query.tokenValue(tokens[tokens.length - 2]) === '[' && query.tokenValue(tokens[tokens.length - 1]) === ']') {
    const receiverTokens = tokens.slice(0, -2);
    if (receiverTokens.length > 0) return { kind: 'resolved', target: query.appendTarget(query.classifyExpression(receiverTokens)) };
  }
  const arrayAccess = query.classifyArrayAccess(tokens);
  if (arrayAccess.kind === 'malformed') return arrayAccess;
  if (arrayAccess.kind === 'resolved') return { kind: 'resolved', target: query.arrayElementTarget(arrayAccess.evidence) };
  const member = query.classifyMember(tokens);
  if (member.kind === 'malformed') return member;
  if (member.kind === 'resolved') return { kind: 'resolved', target: query.propertyTarget(member.evidence) };
  const staticProperty = query.classifyStaticProperty(tokens);
  if (staticProperty.kind === 'malformed') return staticProperty;
  if (staticProperty.kind === 'resolved') return { kind: 'resolved', target: staticProperty.evidence };
  return { kind: 'unresolved', reason: 'invalid_target' };
};

/** Canonical assignment-target algebra; this is the implementation of the upstream interface contract. */
export const scannerAssignmentTargetContractAlgebra: ScannerAssignmentTargetInterface = Object.freeze({
  resolve: <Token, Expression, Identifier, Target, Entry, Pattern>(
    query: AssignmentTargetQuery<Token, Expression, Identifier, Target, Entry, Pattern>,
  ): AssignmentTargetJudgment<Token, Target> => resolveTarget(query),
});

const legacyOptionJudgment = <Value>(option: RelationOption<Value>): AssignmentTargetEvidenceJudgment<Value> =>
  option.kind === 'some' ? { kind: 'resolved', evidence: option.value } : { kind: 'unresolved' };

/**
 * Compatibility facade for existing callers. All recognition delegates to the
 * canonical interface algebra; cursor-based fields are translated at this edge only.
 */
/** @deprecated Runtime wiring and new consumers must use scannerAssignmentTargetContractAlgebra. */
export const scannerAssignmentTargetAlgebra: ScannerAssignmentTargetAlgebra = Object.freeze({
  resolve: <Token, Expression, Identifier, Target, Entry, Pattern>(
    contract: AssignmentTargetContract<Token, Expression, Identifier, Target, Entry, Pattern>,
  ): AssignmentTargetResolution<Target> => {
    const query: AssignmentTargetQuery<Token, Expression, Identifier, Target, Entry, Pattern> = {
      tokens: contract.tokens,
      tokenValue: contract.tokenValue,
      isVariableToken: contract.isVariableToken,
      variableIdentifier: contract.variableIdentifier,
      locateTopLevel: (tokens, target) => {
        const resolution = contract.findTopLevelOperator(tokens, target);
        if (resolution.kind === 'not_found') return { kind: 'not_found' };
        if (resolution.kind === 'malformed') {
          const evidence = resolution.index < 0 ? undefined : tokens[resolution.index];
          return {
            kind: 'malformed',
            location: evidence === undefined ? { kind: 'end_of_source' } : { kind: 'token', evidence },
            expected: resolution.expected,
            actual: resolution.actual,
          };
        }
        const token = tokens[resolution.index];
        return token === undefined
          ? { kind: 'malformed', location: { kind: 'end_of_source' }, expected: target, actual: '<end-of-source>' }
          : { kind: 'found', occurrence: { before: tokens.slice(0, resolution.index), token, after: tokens.slice(resolution.index + 1) } };
      },
      matchLeadingDelimiter: tokens => matchLeadingDelimiter(tokens, contract.tokenValue),
      classifyExpression: contract.classifyExpression,
      classifyArrayAccess: tokens => legacyOptionJudgment(contract.classifyArrayAccess(tokens)),
      classifyMember: tokens => legacyOptionJudgment(contract.classifyMember(tokens)),
      classifyStaticProperty: tokens => legacyOptionJudgment(contract.classifyStaticProperty(tokens)),
      variableTarget: contract.variableTarget,
      appendTarget: contract.appendTarget,
      arrayElementTarget: contract.arrayElementTarget,
      propertyTarget: contract.propertyTarget,
      destructuringTarget: contract.destructuringTarget,
      listPattern: contract.listPattern,
      skippedEntry: contract.skippedEntry,
      keyedEntry: contract.keyedEntry,
      nestedEntry: contract.nestedEntry,
      referenceVariableEntry: contract.referenceVariableEntry,
      variableEntry: contract.variableEntry,
      patternOfTarget: target => legacyOptionJudgment(contract.patternOfTarget(target)),
    };
    const result = scannerAssignmentTargetContractAlgebra.resolve(query);
    switch (result.kind) {
      case 'resolved': return { kind: 'resolved', target: result.target };
      case 'unresolved': return result;
      case 'malformed': return { kind: 'malformed', index: locationFor(contract.tokens, result.location), expected: result.expected, actual: result.actual };
      case 'contract_violation': return { kind: 'malformed', index: contract.tokens.length, expected: result.reason, actual: '<contract-violation>' };
    }
  },
});
