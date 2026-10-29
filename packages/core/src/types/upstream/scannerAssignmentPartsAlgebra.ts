/**
 * Language-neutral assignment decomposition algebra.
 *
 * The index-free ScannerAssignmentPartsInterface is the semantic authority.
 * The legacy overload below is a compatibility adapter for existing scanner
 * wiring; it translates its cursor result into the same occurrence judgment,
 * then projects the canonical judgment back to the legacy result shape.
 */
import type { TokenStructureResolution } from './scannerTokenStructureAlgebra';
import type {
  AssignmentOperatorRule,
  AssignmentPartsComponentJudgment,
  AssignmentPartsJudgment,
  AssignmentPartsQuery,
  AssignmentPartsValue,
  ScannerAssignmentPartsInterface,
} from './scannerAssignmentPartsInterface';
import type { TokenEvidenceLocation, TokenOccurrenceJudgment } from './scannerTokenStructureAlgebra';
export type { AssignmentOperatorRule } from './scannerAssignmentPartsInterface';

/** Legacy scanner boundary retained only until wiring migration is complete. */
export type LegacyAssignmentPartsValue<Target, Value, OperatorKind extends string> = Readonly<{
  readonly target: Target;
  readonly operator: Readonly<{ readonly kind: OperatorKind }>;
  readonly reference: Readonly<{ readonly kind: 'by_reference' | 'by_value' }>;
  readonly value: Value;
}>;

export type LegacyAssignmentPartsResolution<Target, Value, OperatorKind extends string> =
  | Readonly<{ readonly kind: 'resolved'; readonly value: LegacyAssignmentPartsValue<Target, Value, OperatorKind>; readonly tokenIndex: number }>
  | Readonly<{ readonly kind: 'unresolved'; readonly reason: 'no_assignment_operator' | 'invalid_operator_position' | 'invalid_target' | 'empty_value' }>
  | Readonly<{ readonly kind: 'malformed'; readonly index: number; readonly expected?: string; readonly actual: string }>
  | Readonly<{ readonly kind: 'contract_violation'; readonly reason: 'invalid_operator_rule' }>;

export type LegacyAssignmentPartsContract<Token, Target, Value, OperatorKind extends string> = Readonly<{
  readonly tokens: readonly Token[];
  readonly operators: readonly AssignmentOperatorRule<OperatorKind>[];
  readonly tokenValue: (token: Token | undefined) => string;
  readonly findTopLevelOperator: (tokens: readonly Token[], token: string) => TokenStructureResolution;
  readonly classifyTarget: (tokens: readonly Token[]) => RelationOption<Target>;
  readonly classifyValue: (tokens: readonly Token[]) => Value;
  readonly slice: (tokens: readonly Token[], start: number, end?: number) => readonly Token[];
}>;

export interface ScannerAssignmentPartsAlgebra extends ScannerAssignmentPartsInterface {
  /** Compatibility overload removed after scanner wiring migrates. */
  readonly resolve: {
    <Token, Target, Value, OperatorKind extends string>(query: AssignmentPartsQuery<Token, Target, Value, OperatorKind>): AssignmentPartsJudgment<Target, Value, OperatorKind, Token>;
    <Token, Target, Value, OperatorKind extends string>(contract: LegacyAssignmentPartsContract<Token, Target, Value, OperatorKind>): LegacyAssignmentPartsResolution<Target, Value, OperatorKind>;
  };
}

const locationOf = <Token>(tokens: readonly Token[], index: number): TokenEvidenceLocation<Token> => {
  const token = tokens[index];
  return token === undefined ? { kind: 'end_of_source' } : { kind: 'token', evidence: token };
};

const locateFromLegacy = <Token>(
  tokens: readonly Token[],
  token: string,
  findTopLevelOperator: (source: readonly Token[], operator: string) => TokenStructureResolution,
): TokenOccurrenceJudgment<Token> => {
  const resolution = findTopLevelOperator(tokens, token);
  switch (resolution.kind) {
    case 'not_found': return { kind: 'not_found' };
    case 'malformed': return {
      kind: 'malformed',
      location: locationOf(tokens, resolution.index),
      ...(resolution.expected === undefined ? {} : { expected: resolution.expected }),
      actual: resolution.actual,
    };
    case 'found': {
      const evidence = tokens[resolution.index];
      return evidence === undefined
        ? { kind: 'malformed', location: { kind: 'end_of_source' }, expected: token, actual: '<end-of-source>' }
        : {
            kind: 'found',
            occurrence: {
              before: tokens.slice(0, resolution.index),
              token: evidence,
              after: tokens.slice(resolution.index + 1),
            },
          };
    }
  }
};

const resolveJudgment = <Token, Target, Value, OperatorKind extends string>(
  query: AssignmentPartsQuery<Token, Target, Value, OperatorKind>,
  operatorIndex = 0,
  unresolvedReason: 'no_assignment_operator' | 'invalid_operator_position' | 'invalid_target' | 'empty_value' = 'no_assignment_operator',
): AssignmentPartsJudgment<Target, Value, OperatorKind, Token> => {
  if (operatorIndex >= query.operators.length) return { kind: 'unresolved', reason: unresolvedReason };
  const operator = query.operators[operatorIndex];
  if (operator === undefined) return { kind: 'unresolved', reason: unresolvedReason };
  const occurrence: TokenOccurrenceJudgment<Token> = query.operatorEvidence !== undefined && query.tokenValue !== undefined
    ? (() => {
        const evidence = query.operatorEvidence?.find(candidate => query.tokenValue?.(candidate.token) === operator.token);
        return evidence === undefined ? { kind: 'not_found' as const } : { kind: 'found' as const, occurrence: evidence };
      })()
    : query.locateOperator?.(query.tokens, operator.token) ?? { kind: 'malformed' as const, location: { kind: 'end_of_source' as const }, expected: operator.token, actual: '<missing-operator-evidence-provider>' };
  switch (occurrence.kind) {
    case 'malformed':
      return {
        kind: 'malformed',
        location: occurrence.location,
        ...(occurrence.expected === undefined ? {} : { expected: occurrence.expected }),
        actual: occurrence.actual,
      };
    case 'not_found':
      return resolveJudgment(query, operatorIndex + 1, unresolvedReason);
    case 'found': {
      const evidence = occurrence.occurrence;
      if (evidence.before.length === 0 || evidence.after.length === 0) {
        return resolveJudgment(query, operatorIndex + 1, 'invalid_operator_position');
      }
      const targetJudgment: AssignmentPartsComponentJudgment<Target> = query.classifyTarget(evidence.before);
      if (targetJudgment.kind === 'unresolved') return resolveJudgment(query, operatorIndex + 1, 'invalid_target');
      const reference = query.isReferenceMarker(evidence.after[0]) ? 'by_reference' as const : 'by_value' as const;
      const valueTokens = reference === 'by_reference' ? evidence.after.slice(1) : evidence.after;
      if (valueTokens.length === 0) return resolveJudgment(query, operatorIndex + 1, 'empty_value');
      const valueJudgment: AssignmentPartsComponentJudgment<Value> = query.classifyValue(valueTokens);
      if (valueJudgment.kind === 'unresolved') return resolveJudgment(query, operatorIndex + 1, 'empty_value');
      const resolved: AssignmentPartsValue<Target, Value, OperatorKind, Token> = {
        target: targetJudgment.value,
        operator: { kind: operator.kind },
        reference: { kind: reference },
        value: valueJudgment.value,
        evidence,
      };
      return { kind: 'resolved', value: resolved };
    }
  }
};

const resolveQuery = <Token, Target, Value, OperatorKind extends string>(
  query: AssignmentPartsQuery<Token, Target, Value, OperatorKind>,
): AssignmentPartsJudgment<Target, Value, OperatorKind, Token> => {
  const hasInvalidRule = query.operators.some(rule => rule.token.length === 0);
  const duplicateRules = new Set(query.operators.map(rule => rule.token)).size !== query.operators.length;
  const missingEvidenceProvider = (query.operatorEvidence === undefined || query.tokenValue === undefined) && query.locateOperator === undefined;
  return missingEvidenceProvider
    ? { kind: 'contract_violation', reason: 'missing_operator_evidence_provider' }
    : hasInvalidRule || duplicateRules
      ? { kind: 'contract_violation', reason: 'invalid_operator_rule' }
      : resolveJudgment(query);
};

const resolveLegacy = <Token, Target, Value, OperatorKind extends string>(
  contract: LegacyAssignmentPartsContract<Token, Target, Value, OperatorKind>,
): LegacyAssignmentPartsResolution<Target, Value, OperatorKind> => {
  const query: AssignmentPartsQuery<Token, Target, Value, OperatorKind> = {
    tokens: contract.tokens,
    operators: contract.operators,
    locateOperator: (tokens, token) => locateFromLegacy(tokens, token, contract.findTopLevelOperator),
    classifyTarget: tokens => relationOptionFold(contract.classifyTarget(tokens), () => ({ kind: 'unresolved' as const, reason: 'not_recognized' as const }), target => ({ kind: 'resolved' as const, value: target })),
    classifyValue: tokens => ({ kind: 'resolved' as const, value: contract.classifyValue(tokens) }),
    isReferenceMarker: token => relationEqual(contract.tokenValue(token), '&'),
  };
  const judgment = resolveQuery(query);
  switch (judgment.kind) {
    case 'resolved': return {
      kind: 'resolved',
      tokenIndex: judgment.value.evidence.before.length,
      value: {
        target: judgment.value.target,
        operator: judgment.value.operator,
        reference: judgment.value.reference,
        value: judgment.value.value,
      },
    };
    case 'unresolved': return { kind: 'unresolved', reason: judgment.reason };
    case 'malformed': {
      const index = judgment.location.kind === 'end_of_source'
        ? contract.tokens.length
        : contract.tokens.indexOf(judgment.location.evidence);
      return { kind: 'malformed', index, ...(judgment.expected === undefined ? {} : { expected: judgment.expected }), actual: judgment.actual };
    }
    case 'contract_violation': return { kind: 'contract_violation', reason: 'invalid_operator_rule' };
  }
};

export const scannerAssignmentPartsAlgebra: ScannerAssignmentPartsAlgebra = Object.freeze({
  resolve: (<Token, Target, Value, OperatorKind extends string>(
    input: AssignmentPartsQuery<Token, Target, Value, OperatorKind> | LegacyAssignmentPartsContract<Token, Target, Value, OperatorKind>,
  ): AssignmentPartsJudgment<Target, Value, OperatorKind, Token> | LegacyAssignmentPartsResolution<Target, Value, OperatorKind> =>
    'findTopLevelOperator' in input ? resolveLegacy(input) : resolveQuery(input)) as ScannerAssignmentPartsAlgebra['resolve'],
});
