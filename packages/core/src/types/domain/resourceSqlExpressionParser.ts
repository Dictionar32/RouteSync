import type { ResourceSqlNumericExpression, ResourceSqlExpression } from './resourceSqlExpression';
import { SemanticValueFactory } from './semanticValues';

export type SqlExpressionParseResult =
  | { readonly kind: 'parsed'; readonly expression: ResourceSqlExpression }
  | { readonly kind: 'rejected'; readonly source: string };

const OPERATORS = Object.freeze(['+', '-', '*', '/'] as const);
type SqlOperator = typeof OPERATORS[number];

function column(value: string): ResourceSqlNumericExpression {
  return Object.freeze({ kind: 'column', name: SemanticValueFactory.columnName(value) });
}

function tokenize(source: string): readonly string[] {
  return source.replace(/([+\-*/()])/g, ' $1 ').trim().split(/\s+/).filter(Boolean);
}

function parseAtom(tokens: readonly string[], index: number): { expression: ResourceSqlNumericExpression; next: number } | null {
  const token = tokens[index];
  if (!token) return null;
  if (/^\d+(?:\.\d+)?$/.test(token)) return { expression: Object.freeze({ kind: 'literal', value: Number(token) }), next: index + 1 };
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(token)) return { expression: column(token), next: index + 1 };
  if (token === '(') {
    const inner = parseBinary(tokens, index + 1, 0);
    if (!inner || tokens[inner.next] !== ')') return null;
    return { expression: inner.expression, next: inner.next + 1 };
  }
  return null;
}

function precedence(operator: SqlOperator): number { return operator === '*' || operator === '/' ? 2 : 1; }

function parseBinary(tokens: readonly string[], start: number, minimum: number): { expression: ResourceSqlNumericExpression; next: number } | null {
  const left = parseAtom(tokens, start);
  if (!left) return null;
  let expression = left.expression;
  let index = left.next;
  while (index < tokens.length && OPERATORS.includes(tokens[index] as SqlOperator)) {
    const operator = tokens[index] as SqlOperator;
    if (precedence(operator) < minimum) break;
    const right = parseBinary(tokens, index + 1, precedence(operator) + 1);
    if (!right) return null;
    expression = Object.freeze({ kind: 'binary', operator: operator === '*' ? 'multiply' : operator === '/' ? 'divide' : operator === '+' ? 'add' : 'subtract', left: expression, right: right.expression });
    index = right.next;
  }
  return { expression, next: index };
}

export function parseResourceSqlExpression(source: string): SqlExpressionParseResult {
  const tokens = tokenize(source);
  if (tokens.length === 0) return Object.freeze({ kind: 'rejected', source });
  const parsed = parseBinary(tokens, 0, 0);
  if (!parsed || parsed.next !== tokens.length) return Object.freeze({ kind: 'rejected', source });
  return Object.freeze({ kind: 'parsed', expression: Object.freeze({ kind: 'numeric', expression: parsed.expression, result: { kind: 'numeric' as const } }) });
}
