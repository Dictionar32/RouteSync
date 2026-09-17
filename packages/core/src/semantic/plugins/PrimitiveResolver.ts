import type { SemanticResolution } from '../../types/domain/semanticResolution';
import type { SemanticTraceNode } from '../../types/domain/semanticResolution';
import { SemanticResolutionFactory } from '../../types/domain/semanticResolutionFactory';
import { BoundSemanticFactory } from '../../types/domain/boundAst';
import { PrimitiveKind, PrimitiveType, type SemanticType } from '../../compiler/types/SemanticType';
import { SemanticValueFactory } from '../../types/domain/semanticValues';
import type { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';
import { unknownResolution } from '../semanticResolutionSupport';

function primitiveType(value: string): SemanticType {
  switch (value) {
    case 'number':
    case 'int':
    case 'integer':
    case 'float':
    case 'double': return new PrimitiveType(PrimitiveKind.NUMBER);
    case 'string': return new PrimitiveType(PrimitiveKind.STRING);
    case 'boolean':
    case 'bool': return new PrimitiveType(PrimitiveKind.BOOLEAN);
    case 'datetime': return new PrimitiveType(PrimitiveKind.DATETIME);
    case 'file': return new PrimitiveType(PrimitiveKind.FILE);
    default: return new PrimitiveType(PrimitiveKind.UNKNOWN);
  }
}

function scalar(
  type: SemanticType,
  value: string | number | boolean | null,
  trace: readonly SemanticTraceNode[],
  nullable: boolean,
): SemanticResolution {
  return SemanticResolutionFactory.scalar({
    status: type.kind === 'primitive' && type.type !== PrimitiveKind.UNKNOWN ? 'resolved' : 'unknown',
    confidence: 100, trace, nullability: nullable ? { kind: 'nullable' } : { kind: 'non_nullable' }, semanticType: type,
    boundAst: BoundSemanticFactory.primitive(type, value === null
      ? SemanticValueFactory.literalValue({ kind: 'null' })
      : typeof value === 'number'
        ? SemanticValueFactory.literalValue({ kind: 'number', value })
        : typeof value === 'boolean'
          ? SemanticValueFactory.literalValue({ kind: 'boolean', value })
          : SemanticValueFactory.literalValue({ kind: 'string', value })),
  });
}

export class PrimitiveResolver implements ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean {
    return meta.kind === 'literal' || meta.kind === 'type_cast';
  }

  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution {
    if (meta.kind === 'literal') {
      const value = meta.value;
      const type = value === null ? new PrimitiveType(PrimitiveKind.UNKNOWN) : primitiveType(typeof value);
      return scalar(type, value, [{
        source: 'PrimitiveResolver', rule: 'Literal type mapping', input: String(value), output: type.kind,
      }], value === null);
    }

    if (meta.kind === 'type_cast') {
      const castType = meta.castType.kind;
      const casted = castType === 'int' || castType === 'float'
        ? new PrimitiveType(PrimitiveKind.NUMBER)
        : castType === 'string'
          ? new PrimitiveType(PrimitiveKind.STRING)
          : new PrimitiveType(PrimitiveKind.BOOLEAN);
      const trace: SemanticTraceNode[] = [{
        source: 'PrimitiveResolver', rule: `Type cast to ${castType}`, input: castType, output: casted.kind,
      }];
      const expression = context.kernel.resolve(meta.expression, context.contextModel);
      trace.push(...expression.trace);
      return SemanticResolutionFactory.scalar({
        status: 'resolved', confidence: 100, trace, nullability: { kind: 'non_nullable' }, semanticType: casted,
        boundAst: expression.boundAst,
      });
    }

    return unknownResolution('PrimitiveResolver', 'Unsupported primitive metadata', meta.kind, 'invalid_boundary_input');
  }
}
