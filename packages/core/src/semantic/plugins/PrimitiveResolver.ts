import { SemanticResolution, TraceNode } from '../../types/contract';
import { SemanticType } from '../../types/semantic';
import { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';

export class PrimitiveResolver implements ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean {
    return !!(meta && (meta.kind === 'primitive' || meta.kind === 'type_cast' || meta.kind === 'literal'));
  }

  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution {
    if (meta.kind === 'primitive') {
      const typeStr = meta.type || 'unknown';

      let resType: SemanticType = 'unknown';
      let isNull = false;
      if (typeStr === 'number' || typeStr === 'string' || typeStr === 'boolean') {
        resType = typeStr;
      } else if (typeStr === 'null') {
        isNull = true;
      }

      return {
        status: resType === 'unknown' || isNull ? 'unknown' : 'resolved',
        type: isNull ? 'unknown' : resType,
        nullable: isNull ? true : undefined,
        confidence: 100,
        trace: [{
          source: 'PrimitiveResolver',
          rule: 'Primitive type mapping',
          input: meta.type,
          output: isNull ? 'null' : resType
        }]
      };
    }

    if (meta.kind === 'type_cast') {
      let castedType: SemanticType = 'unknown';
      if (meta.castType === 'int' || meta.castType === 'float') castedType = 'number';
      else if (meta.castType === 'string') castedType = 'string';
      else if (meta.castType === 'bool') castedType = 'boolean';

      const trace: TraceNode[] = [{
        source: 'PrimitiveResolver',
        rule: `Type cast to ${meta.castType || 'unknown'}`,
        input: meta.castType,
        output: castedType
      }];
      if (meta.expression) {
        const exprRes = context.kernel.resolve(meta.expression, context.contextModel);
        trace.push(...exprRes.trace);
      }

      return {
        status: castedType === 'unknown' ? 'unknown' : 'resolved',
        type: castedType,
        confidence: 100,
        trace
      };
    }

    if (meta.kind === 'literal') {
      const v = meta.value;
      let t: SemanticType = 'unknown';
      let isNull = false;
      if (v === null) isNull = true;
      else if (typeof v === 'number') t = 'number';
      else if (typeof v === 'boolean') t = 'boolean';
      else if (typeof v === 'string') t = 'string';

      return {
        status: isNull ? 'unknown' : 'resolved',
        type: isNull ? 'unknown' : t,
        nullable: isNull ? true : undefined,
        confidence: 100,
        trace: [{
          source: 'PrimitiveResolver',
          rule: 'Literal type mapping',
          input: String(v),
          output: isNull ? 'null' : t
        }]
      };
    }

    return {
      status: 'unknown',
      type: 'unknown',
      confidence: 0,
      trace: []
    };
  }
}
