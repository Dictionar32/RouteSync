/**
 * Language-neutral ordered expression-candidate algebra.
 * Candidate providers retain syntax-specific evidence and AST construction;
 * this algebra owns lazy, deterministic candidate arbitration.
 */

/** Canonical precedence policy for structural expression candidates.
 * The scanner supplies candidate evidence and resolvers; it does not own their ordering.
 * Lower values are considered first. Keep this policy in the upstream contract layer.
 */
export const SCANNER_EXPRESSION_STRUCTURE_PRIORITY = Object.freeze({
  'short-ternary': 10,
  ternary: 20,
  'array-access': 30,
  call: 40,
  'root-operator': 50,
  unary: 60,
} as const);

export type ScannerExpressionStructureCandidateId = keyof typeof SCANNER_EXPRESSION_STRUCTURE_PRIORITY;

export const scannerExpressionStructurePriority = (
  candidate: ScannerExpressionStructureCandidateId,
): number => SCANNER_EXPRESSION_STRUCTURE_PRIORITY[candidate];

export type ExpressionCandidate<Id extends string, Value> = Readonly<{
  readonly id: Id;
  /** Semantic precedence is explicit contract data, never inferred from array position. */
  readonly priority: number;
  readonly resolve: () => Value;
}>;

export type ExpressionCandidateContract<Id extends string, Value> = Readonly<{
  readonly candidates: readonly ExpressionCandidate<Id, Value>[];
  readonly isResolved: (value: Value) => boolean;
  /** A terminal evidence failure stops arbitration without masquerading as a selected structure. */
  readonly isTerminal?: (value: Value) => boolean;
}>;

/** Auditable proof trail emitted by the algebra, not reconstructed by runtime consumers. */
export type ExpressionCandidateAttempt<Id extends string> = Readonly<{
  readonly candidate: Id;
  readonly priority: number;
  readonly outcome: 'rejected' | 'selected' | 'terminal';
}>;

export type ExpressionCandidateResolution<Id extends string, Value> =
  | Readonly<{ readonly kind: 'resolved'; readonly candidate: Id; readonly priority: number; readonly value: Value; readonly attempts: readonly ExpressionCandidateAttempt<Id>[] }>
  | Readonly<{ readonly kind: 'not_found'; readonly attempts: readonly ExpressionCandidateAttempt<Id>[] }>
  | Readonly<{ readonly kind: 'terminal'; readonly candidate: Id; readonly priority: number; readonly value: Value; readonly attempts: readonly ExpressionCandidateAttempt<Id>[] }>
  | Readonly<{ readonly kind: 'contract_violation'; readonly reason: 'duplicate_candidate_id' | 'invalid_priority' | 'duplicate_priority' }>;

export interface ScannerExpressionCandidateAlgebra {
  readonly resolveFirst: <Id extends string, Value>(
    contract: ExpressionCandidateContract<Id, Value>,
  ) => ExpressionCandidateResolution<Id, Value>;
}

const resolveFirst = <Id extends string, Value>(
  contract: ExpressionCandidateContract<Id, Value>,
): ExpressionCandidateResolution<Id, Value> => {
  const seenIds = new Set<string>();
  const seenPriorities = new Set<number>();
  for (const candidate of contract.candidates) {
    if (seenIds.has(candidate.id)) {
      return { kind: 'contract_violation', reason: 'duplicate_candidate_id' };
    }
    if (!Number.isSafeInteger(candidate.priority) || candidate.priority < 0) {
      return { kind: 'contract_violation', reason: 'invalid_priority' };
    }
    if (seenPriorities.has(candidate.priority)) {
      return { kind: 'contract_violation', reason: 'duplicate_priority' };
    }
    seenIds.add(candidate.id);
    seenPriorities.add(candidate.priority);
  }
  const orderedCandidates = [...contract.candidates].sort((left, right) => left.priority - right.priority);
  const attempts: ExpressionCandidateAttempt<Id>[] = [];
  for (const candidate of orderedCandidates) {
    const value = candidate.resolve();
    if (contract.isResolved(value)) {
      attempts.push({ candidate: candidate.id, priority: candidate.priority, outcome: 'selected' });
      return { kind: 'resolved', candidate: candidate.id, priority: candidate.priority, value, attempts: Object.freeze(attempts) };
    }
    if (contract.isTerminal?.(value) === true) {
      attempts.push({ candidate: candidate.id, priority: candidate.priority, outcome: 'terminal' });
      return { kind: 'terminal', candidate: candidate.id, priority: candidate.priority, value, attempts: Object.freeze(attempts) };
    }
    attempts.push({ candidate: candidate.id, priority: candidate.priority, outcome: 'rejected' });
  }
  return { kind: 'not_found', attempts: Object.freeze(attempts) };
};

export const scannerExpressionCandidateAlgebra: ScannerExpressionCandidateAlgebra = Object.freeze({ resolveFirst });
