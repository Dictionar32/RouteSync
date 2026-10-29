/**
 * PHP-specific lexical evidence and operator vocabulary. Semantic precedence is
 * supplied as a typed order relation; no numeric priority controls AST selection.
 */
import { PHP_SYNTAX_OPERATOR_SPELLINGS } from './routeAst/phpAstExpressionSyntaxEvidenceRegistry';
import type { PhpBinaryOperator, TokenDescriptor } from './PhpAst';
import {
  scannerExpressionOperatorAlgebra,
  EXPRESSION_ASSOCIATIVITY_LEFT,
  EXPRESSION_ASSOCIATIVITY_NON_ASSOCIATIVE,
  EXPRESSION_ASSOCIATIVITY_RIGHT,
  EXPRESSION_OPERATOR_CONTRACT_VIOLATION,
  EXPRESSION_OPERATOR_MALFORMED,
  EXPRESSION_OPERATOR_NOT_FOUND,
  EXPRESSION_OPERATOR_RESOLVED,
  type ExpressionOperatorRule,
  type ExpressionPrecedenceRelation,
} from '../../../types/upstream/scannerExpressionOperatorAlgebra';
import { scannerTokenStructureInterface } from '../../../types/upstream/scannerTokenStructureAlgebra';
import type { RelationOption } from '../../../semantic/relations/relationalSequence';

type PhpExpressionRootOperator = PhpBinaryOperator | Readonly<{ readonly kind: 'null_coalesce' }>;
type PhpExpressionRoot = Readonly<{ readonly operator: PhpExpressionRootOperator; readonly before: readonly TokenDescriptor[]; readonly after: readonly TokenDescriptor[] }>;

const PHP_PRECEDENCE_NULL_COALESCE: unique symbol = Symbol('php.expression.precedence.null-coalesce');
const PHP_PRECEDENCE_LOGICAL_OR: unique symbol = Symbol('php.expression.precedence.logical-or');
const PHP_PRECEDENCE_LOGICAL_AND: unique symbol = Symbol('php.expression.precedence.logical-and');
const PHP_PRECEDENCE_EQUALITY: unique symbol = Symbol('php.expression.precedence.equality');
const PHP_PRECEDENCE_COMPARISON: unique symbol = Symbol('php.expression.precedence.comparison');
const PHP_PRECEDENCE_CONCATENATION: unique symbol = Symbol('php.expression.precedence.concatenation');
const PHP_PRECEDENCE_ADDITION: unique symbol = Symbol('php.expression.precedence.addition');
const PHP_PRECEDENCE_MULTIPLICATION: unique symbol = Symbol('php.expression.precedence.multiplication');
type PhpPrecedenceTier =
  | typeof PHP_PRECEDENCE_NULL_COALESCE
  | typeof PHP_PRECEDENCE_LOGICAL_OR
  | typeof PHP_PRECEDENCE_LOGICAL_AND
  | typeof PHP_PRECEDENCE_EQUALITY
  | typeof PHP_PRECEDENCE_COMPARISON
  | typeof PHP_PRECEDENCE_CONCATENATION
  | typeof PHP_PRECEDENCE_ADDITION
  | typeof PHP_PRECEDENCE_MULTIPLICATION;

const PHP_EXPRESSION_PRECEDENCE: readonly ExpressionPrecedenceRelation<PhpPrecedenceTier>[] = Object.freeze([
  { weaker: PHP_PRECEDENCE_NULL_COALESCE, stronger: PHP_PRECEDENCE_LOGICAL_OR },
  { weaker: PHP_PRECEDENCE_LOGICAL_OR, stronger: PHP_PRECEDENCE_LOGICAL_AND },
  { weaker: PHP_PRECEDENCE_LOGICAL_AND, stronger: PHP_PRECEDENCE_EQUALITY },
  { weaker: PHP_PRECEDENCE_EQUALITY, stronger: PHP_PRECEDENCE_COMPARISON },
  { weaker: PHP_PRECEDENCE_COMPARISON, stronger: PHP_PRECEDENCE_CONCATENATION },
  { weaker: PHP_PRECEDENCE_CONCATENATION, stronger: PHP_PRECEDENCE_ADDITION },
  { weaker: PHP_PRECEDENCE_ADDITION, stronger: PHP_PRECEDENCE_MULTIPLICATION },
]);

const PHP_EXPRESSION_OPERATOR_RULES: readonly ExpressionOperatorRule<PhpExpressionRootOperator, PhpPrecedenceTier>[] = Object.freeze([
  { token: PHP_SYNTAX_OPERATOR_SPELLINGS.nullCoalesce, operator: { kind: 'null_coalesce' }, tier: PHP_PRECEDENCE_NULL_COALESCE, associativity: EXPRESSION_ASSOCIATIVITY_RIGHT },
  { token: PHP_SYNTAX_OPERATOR_SPELLINGS.identical, operator: { kind: 'identical' }, tier: PHP_PRECEDENCE_EQUALITY, associativity: EXPRESSION_ASSOCIATIVITY_NON_ASSOCIATIVE },
  { token: PHP_SYNTAX_OPERATOR_SPELLINGS.notIdentical, operator: { kind: 'not_identical' }, tier: PHP_PRECEDENCE_EQUALITY, associativity: EXPRESSION_ASSOCIATIVITY_NON_ASSOCIATIVE },
  { token: '>=', operator: { kind: 'greater_or_equal' }, tier: PHP_PRECEDENCE_COMPARISON, associativity: EXPRESSION_ASSOCIATIVITY_NON_ASSOCIATIVE },
  { token: '<=', operator: { kind: 'less_or_equal' }, tier: PHP_PRECEDENCE_COMPARISON, associativity: EXPRESSION_ASSOCIATIVITY_NON_ASSOCIATIVE },
  { token: '==', operator: { kind: 'equal' }, tier: PHP_PRECEDENCE_EQUALITY, associativity: EXPRESSION_ASSOCIATIVITY_NON_ASSOCIATIVE },
  { token: '!=', operator: { kind: 'not_equal' }, tier: PHP_PRECEDENCE_EQUALITY, associativity: EXPRESSION_ASSOCIATIVITY_NON_ASSOCIATIVE },
  { token: '>', operator: { kind: 'greater_than' }, tier: PHP_PRECEDENCE_COMPARISON, associativity: EXPRESSION_ASSOCIATIVITY_NON_ASSOCIATIVE },
  { token: '<', operator: { kind: 'less_than' }, tier: PHP_PRECEDENCE_COMPARISON, associativity: EXPRESSION_ASSOCIATIVITY_NON_ASSOCIATIVE },
  { token: '+', operator: { kind: 'addition' }, tier: PHP_PRECEDENCE_ADDITION, associativity: EXPRESSION_ASSOCIATIVITY_LEFT },
  { token: '-', operator: { kind: 'subtraction' }, tier: PHP_PRECEDENCE_ADDITION, associativity: EXPRESSION_ASSOCIATIVITY_LEFT },
  { token: '*', operator: { kind: 'multiplication' }, tier: PHP_PRECEDENCE_MULTIPLICATION, associativity: EXPRESSION_ASSOCIATIVITY_LEFT },
  { token: '/', operator: { kind: 'division' }, tier: PHP_PRECEDENCE_MULTIPLICATION, associativity: EXPRESSION_ASSOCIATIVITY_LEFT },
  { token: '%', operator: { kind: 'modulo' }, tier: PHP_PRECEDENCE_MULTIPLICATION, associativity: EXPRESSION_ASSOCIATIVITY_LEFT },
  { token: '&&', operator: { kind: 'logical_and' }, tier: PHP_PRECEDENCE_LOGICAL_AND, associativity: EXPRESSION_ASSOCIATIVITY_LEFT },
  { token: '||', operator: { kind: 'logical_or' }, tier: PHP_PRECEDENCE_LOGICAL_OR, associativity: EXPRESSION_ASSOCIATIVITY_LEFT },
  { token: '.', operator: { kind: 'concat' }, tier: PHP_PRECEDENCE_CONCATENATION, associativity: EXPRESSION_ASSOCIATIVITY_LEFT },
]);

export interface PhpExpressionRootOperatorResolverInterface {
  readonly resolve: (tokens: readonly TokenDescriptor[]) => RelationOption<PhpExpressionRoot>;
}

const resolve = (tokens: readonly TokenDescriptor[]): RelationOption<PhpExpressionRoot> => {
  const resolution = scannerExpressionOperatorAlgebra.resolve({
    tokens,
    rules: PHP_EXPRESSION_OPERATOR_RULES,
    precedence: PHP_EXPRESSION_PRECEDENCE,
    tokenValue: token => token.value,
    collectTopLevelCandidates: (source, targets) => scannerTokenStructureInterface.locateTopLevelCandidates({
      tokens: source,
      targets,
      tokenValue: token => token.value,
    }),
  });
  switch (resolution.kind) {
    case EXPRESSION_OPERATOR_RESOLVED: return { kind: 'some', value: { operator: resolution.operator, before: resolution.before, after: resolution.after } };
    case EXPRESSION_OPERATOR_NOT_FOUND: return { kind: 'none' };
    case EXPRESSION_OPERATOR_MALFORMED: throw new Error(`Malformed PHP expression at ${resolution.location.kind === 'token' ? resolution.location.evidence.value : '<end-of-source>'}: expected ${resolution.expected ?? '<none>'}, received ${resolution.actual}`);
    case EXPRESSION_OPERATOR_CONTRACT_VIOLATION: throw new Error('PHP expression operator precedence contract violation');
  }
};

export const phpExpressionRootOperatorResolver: PhpExpressionRootOperatorResolverInterface = Object.freeze({ resolve });
