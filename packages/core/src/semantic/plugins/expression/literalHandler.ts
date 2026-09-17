import type { SemanticResolution } from '../../../types/domain/semanticResolution';
import { SemanticResolutionFactory } from '../../../types/domain/semanticResolutionFactory';
import { BoundSemanticFactory } from '../../../types/domain/boundAst';
import { PrimitiveKind, PrimitiveType } from '../../../compiler/types/SemanticType';
import type { BoundLiteralValue } from '../../../types/domain/semanticValues';
import type { ResolverMeta } from '../../types';

export function resolveLiteral(meta: ResolverMeta): SemanticResolution {
  if (meta.kind !== 'literal') {
    return SemanticResolutionFactory.unknown({
      status: 'unknown', confidence: 0, trace: [{
        source: 'ExpressionResolver', rule: 'Invalid literal metadata', input: meta.kind, output: 'unknown',
      }],
      boundAst: BoundSemanticFactory.unsupported('invalid_boundary_input'),
    });
  }

  const value = literalValue(meta.value);
  const semanticType = literalType(value);
  const nullable = value.kind === 'null';
  const status = nullable ? 'resolved' : 'resolved';
  return SemanticResolutionFactory.scalar({
    status, confidence: 100, nullable, semanticType,
    trace: [{
      source: 'ExpressionResolver', rule: 'Literal type mapping',
      input: value.kind, output: semanticType.type,
    }],
    boundAst: BoundSemanticFactory.primitive(semanticType, value),
  });
}

function literalValue(value: unknown): BoundLiteralValue {
  if (typeof value === 'number') return { kind: 'number', value };
  if (typeof value === 'boolean') return { kind: 'boolean', value };
  if (typeof value === 'string') return { kind: 'string', value };
  return { kind: 'null' };
}

function literalType(value: BoundLiteralValue): PrimitiveType {
  switch (value.kind) {
    case 'number': return new PrimitiveType(PrimitiveKind.NUMBER);
    case 'boolean': return new PrimitiveType(PrimitiveKind.BOOLEAN);
    case 'string': return new PrimitiveType(PrimitiveKind.STRING);
    case 'null': return new PrimitiveType(PrimitiveKind.UNKNOWN);
  }
}
