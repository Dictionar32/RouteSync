import { phpTypeAtomAlgebra } from './phpTypeAtomAlgebra';
import { scannerTokenStructureInterface } from './scannerTokenStructureAlgebra';
import { stringValue } from './valueObjects';
import type { TypeExpression, TypeExpressions } from './typeVocabulary';
import type { PhpTypeExpressionEvidence, PhpTypeExpressionInterface, PhpTypeExpressionJudgment } from './phpTypeExpressionInterface';
export type { PhpTypeExpressionEvidence, PhpTypeExpressionInterface, PhpTypeExpressionJudgment } from './phpTypeExpressionInterface';

type ParseResult = Readonly<{ readonly kind: 'resolved'; readonly expression: TypeExpression }> | Readonly<{ readonly kind: 'unsupported'; readonly source: string; readonly reason: 'context_required' | 'missing_vocabulary'; readonly diagnostic: string }> | Readonly<{ readonly kind: 'malformed'; readonly diagnostic: string }>;
const sequence = <T>(items: readonly T[]): readonly T[] => relationGate(
  items.length === 0,
  () => ({ kind: 'empty' as const }),
  () => ({ kind: 'cons' as const, head: items[0], tail: sequence(items.slice(1)) }),
);
const typeExpressions = (items: readonly TypeExpression[]): TypeExpressions => ({ kind: 'type_expressions', items: sequence(items) });
const error = (diagnostic: string): ParseResult => ({ kind: 'malformed', diagnostic });
const resolved = (expression: TypeExpression): ParseResult => ({ kind: 'resolved', expression });
const primitive = (kind: 'string' | 'number' | 'boolean' | 'json'): TypeExpression => ({ kind: 'primitive', value: { kind } });

const split = (source: string, separator: string): readonly string[] | undefined => {
  const judgment = scannerTokenStructureInterface.partitionTopLevel({
    tokens: Array.from(source),
    tokenValue: character => character,
    separator,
  });
  return judgment.kind === 'malformed' ? undefined : judgment.parts.map(part => part.join(''));
};

const outerParenthesesEncloseWholeSource = (source: string): boolean => {
  if (!source.startsWith('(') || !source.endsWith(')')) return false;
  const close = scannerTokenStructureInterface.matchLeadingDelimiter({ tokens: Array.from(source), tokenValue: character => character });
  return close.kind === 'matched' && close.evidence.prefix.length === 0 && close.evidence.suffix.length === 0;
};

const resolveAtom = (source: string, classContext?: import('./phpTypeAtomInterface').PhpTypeClassContext): ParseResult => {
  const judgment = phpTypeAtomAlgebra.resolve({ source, classContext });
  if (judgment.kind === 'resolved') return resolved(judgment.expression);
  if (judgment.kind === 'unsupported') return judgment;
  return error(judgment.diagnostic);
};


const parse = (source: string, classContext?: import('./phpTypeAtomInterface').PhpTypeClassContext): ParseResult => {
  const normalized = source.trim();
  if (normalized.length === 0) return error('PHP type expression must not be empty');
  if (/[\r\n]/.test(normalized)) return error('PHP type expression must not contain line breaks');

  const union = split(normalized, '|');
  if (union === undefined) return error(`Malformed PHP type delimiter structure: ${normalized}`);
  if (union.length > 1) {
    if (union.some(part => part.trim().length === 0)) return error(`Malformed PHP union type: ${normalized}`);
    // PHP requires intersection members in a union to be parenthesized (DNF).
    // Do not silently reinterpret `A|B&C` as `(A)|(B&C)`.
    for (const part of union) {
      const intersection = split(part.trim(), '&');
      if (intersection === undefined) return error(`Malformed PHP type delimiter structure: ${normalized}`);
      if (intersection.length > 1 && !outerParenthesesEncloseWholeSource(part.trim())) {
        return error(`PHP intersection members of a union must be parenthesized as DNF: ${normalized}`);
      }
      if (part.trim().startsWith('?')) return error(`Nullable prefix cannot be combined directly with a PHP union: ${normalized}`);
    }
    const members = union.map(member => parse(member, classContext));
    const rejected = members.find(member => member.kind !== 'resolved');
    return rejected === undefined
      ? resolved({ kind: 'union', members: typeExpressions(members.map(member => member.kind === 'resolved' ? member.expression : { kind: 'error', diagnostic: stringValue.create('unreachable') })) })
      : rejected;
  }

  const intersection = split(normalized, '&');
  if (intersection === undefined) return error(`Malformed PHP type delimiter structure: ${normalized}`);
  if (intersection.length > 1) {
    if (intersection.some(part => part.trim().length === 0)) return error(`Malformed PHP intersection type: ${normalized}`);
    if (intersection.some(part => part.trim().startsWith('?'))) return error(`Nullable prefix cannot be combined directly with a PHP intersection: ${normalized}`);
    const members = intersection.map(member => parse(member, classContext));
    const rejected = members.find(member => member.kind !== 'resolved');
    if (rejected !== undefined) return rejected;
    const expressions = members.map(member => member.kind === 'resolved' ? member.expression : { kind: 'error' as const, diagnostic: stringValue.create('unreachable') });
    if (expressions.some(expression => expression.kind === 'union')) return error(`PHP intersection containing a union must be rewritten as DNF: ${normalized}`);
    return resolved({ kind: 'intersection', members: typeExpressions(expressions) });
  }

  if (normalized.startsWith('?')) {
    const innerSource = normalized.slice(1).trim();
    if (innerSource.length === 0 || innerSource.startsWith('?')) return error(`Malformed PHP nullable type: ${normalized}`);
    const inner = parse(innerSource, classContext);
    if (inner.kind === 'resolved' && (inner.expression.kind === 'union' || inner.expression.kind === 'intersection' || inner.expression.kind === 'nullable')) {
      return error(`PHP nullable prefix requires one atomic type: ${normalized}`);
    }
    return inner.kind === 'resolved' ? resolved({ kind: 'nullable', value: inner.expression }) : inner;
  }
  if (outerParenthesesEncloseWholeSource(normalized)) return parse(normalized.slice(1, -1), classContext);
  if (normalized.endsWith('[]')) {
    const inner = parse(normalized.slice(0, -2), classContext);
    return inner.kind === 'resolved' ? resolved({ kind: 'array', element: inner.expression }) : inner;
  }
  if (/^[|&]|[|&]$|\|\||&&/.test(normalized)) return error(`Malformed PHP type operator sequence: ${normalized}`);
  return resolveAtom(normalized, classContext);
};

export const phpTypeExpressionAlgebra: PhpTypeExpressionInterface = Object.freeze({
  resolve: (evidence: PhpTypeExpressionEvidence): PhpTypeExpressionJudgment => {
    const judgment = parse(evidence.source, evidence.classContext);
    if (judgment.kind === 'resolved') return { kind: 'resolved', expression: judgment.expression };
    if (judgment.kind === 'unsupported') return judgment;
    return { kind: 'malformed', source: evidence.source, diagnostic: judgment.diagnostic };
  },
});
