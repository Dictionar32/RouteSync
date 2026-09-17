/** Strict binary-expression semantic producer. No raw type strings or fallbacks. */
import type { SemanticResolution } from '../../../types/domain/semanticResolution';
import type { ResolutionContext, ResolverMeta, ModelNode } from '../../types';
import { BoundSemanticFactory } from '../../../types/domain/boundAst';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import { PrimitiveKind, PrimitiveType } from '../../../compiler/types/SemanticType';

export function resolveBinaryExpression(meta: ResolverMeta, context: ResolutionContext, currentModel?: ModelNode): SemanticResolution {
  if (meta.kind !== 'binary_expression') return unknown('Invalid binary-expression metadata');
  const left = context.kernel.resolve(meta.left, currentModel);
  const right = context.kernel.resolve(meta.right, currentModel);
  const operator = meta.operator.kind;
  const trace = [...left.trace, ...right.trace, {
    source: 'ExpressionResolver', rule: `Binary operation: ${operator}`,
    input: operator, output: 'resolved binary expression',
  }];
  if (operator === 'null_coalesce') return resolveNullCoalesce(left, right, trace);
  const semanticType = arithmeticType(operator);
  if (semanticType === null) return unknown(`Unsupported binary operator: ${operator}`);
  if (left.kind === 'unknown' || right.kind === 'unknown') return unknown(`Binary operand unresolved: ${operator}`);
  const boundAst = BoundSemanticFactory.binary({
    operator: SemanticValueFactory.semanticOperator(mapOperator(operator)),
    left: left.boundAst, right: right.boundAst, resultingType: semanticType,
  });
  return {
    kind: 'scalar', status: 'resolved', confidence: Math.min(left.confidence, right.confidence),
    trace, boundAst, semanticType, nullability: { kind: 'non_nullable' },
  };
}

function resolveNullCoalesce(left: SemanticResolution, right: SemanticResolution, trace: SemanticResolution['trace']): SemanticResolution {
  if (left.kind === 'unknown' && right.kind === 'unknown') return unknown('Both null-coalesce operands are unresolved');
  const source = left.kind === 'scalar' ? left : right.kind === 'scalar' ? right : null;
  if (source === null) return unknown('Null-coalesce requires scalar semantic operands');
  const boundAst = BoundSemanticFactory.binary({
    operator: SemanticValueFactory.semanticOperator('null_coalesce'),
    left: left.boundAst, right: right.boundAst, resultingType: source.semanticType,
  });
  return { kind: 'scalar', status: 'resolved', confidence: source.confidence, trace, boundAst, semanticType: source.semanticType, nullability: { kind: 'non_nullable' } };
}

function arithmeticType(operator: string): PrimitiveType | null {
  switch (operator) {
    case 'addition': case 'subtraction': case 'multiplication': case 'division': case 'modulo': return new PrimitiveType(PrimitiveKind.NUMBER);
    case 'concat': return new PrimitiveType(PrimitiveKind.STRING);
    default: return null;
  }
}

function mapOperator(operator: string): Parameters<typeof SemanticValueFactory.semanticOperator>[0] {
  switch (operator) {
    case 'addition': return 'add';
    case 'subtraction': return 'subtract';
    case 'multiplication': return 'multiply';
    case 'division': return 'divide';
    case 'modulo': return 'modulo';
    case 'concat': return 'concat';
    default: throw new Error(`Unsupported binary operator: ${operator}`);
  }
}

function unknown(rule: string): SemanticResolution {
  return {
    kind: 'unknown', status: 'unknown', confidence: 0,
    trace: [{ source: 'ExpressionResolver', rule, input: 'binary_expression', output: 'unknown' }],
    boundAst: BoundSemanticFactory.unsupported('unsupported_syntax'),
  };
}
