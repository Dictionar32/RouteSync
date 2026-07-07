import { SemanticResolution, SemanticType } from '../../types/contract';
import { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';

export class PrimitiveResolver implements ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean {
    return !!(meta && (meta.kind === 'primitive' || meta.kind === 'type_cast' || meta.kind === 'literal'));
  }

  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution {
    if (meta.kind === 'primitive') {
      let typeStr = meta.type || 'unknown';
      if (meta.confidence !== undefined && meta.confidence < 80) typeStr = 'unknown';
      
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
        confidence: meta.confidence || 100,
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

      const trace = [{
        source: 'PrimitiveResolver',
        rule: `Type cast to ${meta.castType || 'unknown'}`,
        input: meta.castType,
        output: castedType
      }];
      if (meta.expression) {
        const exprRes = context.kernel.resolve(meta.expression, context.contextModel);
        trace.push(...exprRes.trace);
      } else if (meta.argument) {
        const exprRes = context.kernel.resolve(meta.argument, context.contextModel);
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
      const t: SemanticType = meta.type === 'number' ? 'number' : meta.type === 'boolean' ? 'boolean' : 'string';
      return {
        status: 'resolved',
        type: t,
        confidence: 100,
        trace: [{
          source: 'PrimitiveResolver',
          rule: 'Literal type mapping',
          input: String(meta.value),
          output: t
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
