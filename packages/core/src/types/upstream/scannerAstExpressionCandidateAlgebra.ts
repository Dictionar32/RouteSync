/** Candidate discovery is source-evidence reasoning; AST construction stays downstream. */
import { scannerTokenStructureInterface, type TokenOccurrenceEvidence } from './scannerTokenStructureAlgebra';
import { scannerAstOperatorEvidenceAlgebra } from './scannerAstOperatorEvidenceAlgebra';
import { SCANNER_AST_OPERATOR, SCANNER_AST_OPERATOR_EVIDENCE_FOUND } from './scannerAstOperatorEvidenceInterface';
import {
  SCANNER_EXPRESSION_CANDIDATE as CANDIDATE,
  type ScannerExpressionCandidateContinuation,
  type ScannerExpressionCandidateEvidence,
  type ScannerExpressionCandidateInterface,
  type ScannerExpressionCandidateJudgment,
  type ScannerExpressionCandidateQuery,
} from './scannerAstExpressionCandidateInterface';

const castTypes = Object.freeze(['int', 'float', 'string', 'bool', 'array', 'object']);
const assignmentOperators = Object.freeze(['??=', '<<=', '>>=', '**=', '+=', '-=', '*=', '/=', '%=', '.=', '&=', '|=', '^=', '=']);
const includes = (tokens: readonly string[], value: string): boolean => tokens.includes(value);

const notApplicableJudgment = <Token>(): ScannerExpressionCandidateJudgment<Token> => Object.freeze({
  kind: 'not_applicable' as const,
  continueForAstClassification: <Output>(continuation: ScannerExpressionCandidateContinuation<Token, Output>): Output => continuation.notApplicable(),
});

const resolvedJudgment = <Token>(candidates: readonly ScannerExpressionCandidateEvidence<Token>[]): ScannerExpressionCandidateJudgment<Token> => Object.freeze({
  kind: 'resolved' as const,
  candidates,
  continueForAstClassification: <Output>(continuation: ScannerExpressionCandidateContinuation<Token, Output>): Output => continuation.resolved(candidates),
});

const resolveCandidates = <Token>(query: ScannerExpressionCandidateQuery<Token>): ScannerExpressionCandidateJudgment<Token> => {
  if (query.tokens.length === 0) return notApplicableJudgment();

  const values = query.tokens.map(query.tokenValue);
  const candidates: ScannerExpressionCandidateEvidence<Token>[] = [];
  const add = (
    id: ScannerExpressionCandidateEvidence<Token>['id'],
    evidence: readonly Token[],
    operatorEvidence?: readonly TokenOccurrenceEvidence<Token>[],
  ): void => {
    candidates.push(Object.freeze({
      id,
      evidence: Object.freeze([...evidence]),
      ...(operatorEvidence === undefined ? {} : { operatorEvidence: Object.freeze([...operatorEvidence]) }),
    }));
  };
  const addFirst = (id: ScannerExpressionCandidateEvidence<Token>['id']): void => add(id, query.tokens.slice(0, 1));

  if (values[0] === 'match') addFirst(CANDIDATE.match);
  if (values[0] === 'function') addFirst(CANDIDATE.closure);
  if (includes(values, 'fn') && query.tokens.some((token, index) => query.tokenValue(token) === 'fn' || (query.tokenKind(token) === 'ARROW' && index > 0))) {
    add(CANDIDATE.arrow, query.tokens.filter((token, index) => query.tokenValue(token) === 'fn' || (query.tokenKind(token) === 'ARROW' && index > 0)));
  }

  const instanceofJudgment = scannerAstOperatorEvidenceAlgebra.resolve({
    tokens: query.tokens,
    operator: SCANNER_AST_OPERATOR.instanceof,
    tokenValue: query.tokenValue,
  });
  if (instanceofJudgment.kind === SCANNER_AST_OPERATOR_EVIDENCE_FOUND) add(CANDIDATE.instanceof, [instanceofJudgment.occurrence.token], [instanceofJudgment.occurrence]);

  const castTypeToken = query.tokens[1];
  if (values[0] === '(' && castTypeToken !== undefined && castTypes.includes(values[1] ?? '') && query.tokenKind(castTypeToken) === 'IDENTIFIER') {
    add(CANDIDATE.cast, query.tokens.slice(0, Math.min(3, query.tokens.length)));
  }
  const firstToken = query.tokens[0];
  const lastToken = query.tokens[values.length - 1];
  if (values[0] === '(' && values[values.length - 1] === ')' && firstToken !== undefined && lastToken !== undefined) add(CANDIDATE.parenthesized, [firstToken, lastToken]);

  const assignmentJudgment = scannerTokenStructureInterface.locateTopLevelCandidates({
    tokens: query.tokens,
    targets: assignmentOperators,
    tokenValue: query.tokenValue,
  });
  if (assignmentJudgment.kind === 'complete' && assignmentJudgment.occurrences.length > 0) {
    add(CANDIDATE.assignment, assignmentJudgment.occurrences.map(occurrence => occurrence.token), assignmentJudgment.occurrences);
  }

  if (query.tokens.length === 1) add(CANDIDATE.single, query.tokens);
  if (values[0] === '[' && values[values.length - 1] === ']' && firstToken !== undefined && lastToken !== undefined) add(CANDIDATE.inlineArray, [firstToken, lastToken]);
  if (values.length === 3 && values[1] === '::' && values[2] !== 'class') add(CANDIDATE.classConstant, query.tokens.slice(0, 3));
  if (values.length === 3 && firstToken !== undefined && query.tokenKind(firstToken) === 'IDENTIFIER' && values[1] === '::' && values[2] === 'class') add(CANDIDATE.classReference, query.tokens);
  if (values[0] === 'new') addFirst(CANDIDATE.construct);
  const staticSeparatorIndex = values.indexOf('::');
  if (staticSeparatorIndex > 0 && values[staticSeparatorIndex + 2] === '(') {
    add(CANDIDATE.staticCall, query.tokens.slice(0, staticSeparatorIndex + 3));
  }
  if (includes(values, '->') || includes(values, '?->')) {
    add(CANDIDATE.member, query.tokens.filter(token => query.tokenValue(token) === '->' || query.tokenValue(token) === '?->'));
  }

  // Explicit structural fallback; it is not a competing syntax-specific guess.
  add(CANDIDATE.compound, query.tokens);
  return resolvedJudgment(Object.freeze(candidates));
};

export const scannerAstExpressionCandidateContractAlgebra: ScannerExpressionCandidateInterface = Object.freeze({
  resolve: <Token>(query: ScannerExpressionCandidateQuery<Token>) => resolveCandidates(query),
});
