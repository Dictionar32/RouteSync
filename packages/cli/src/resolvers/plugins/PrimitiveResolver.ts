import { SemanticResolution } from '@routesync/core';
import { ResolverPlugin, ResolutionContext } from '../types';

export class PrimitiveResolver implements ResolverPlugin {
  canResolve(meta: any): boolean {
    return meta && meta.kind === 'primitive';
  }

  resolve(meta: any, context: ResolutionContext): SemanticResolution {
    let typeStr = meta.type;
    if (meta.confidence !== undefined && meta.confidence < 80) typeStr = 'unknown';
    
    const resType = typeStr === 'number' || typeStr === 'string' || typeStr === 'boolean' || typeStr === 'null' ? typeStr : 'unknown';
    const isNull = resType === 'null';
    
    return {
      status: resType === 'unknown' || isNull ? 'unknown' : 'resolved',
      type: isNull ? 'unknown' : resType,
      nullable: isNull ? true : undefined,
      confidence: meta.confidence || 50,
      trace: [{
        source: 'PrimitiveResolver',
        rule: 'Primitive type mapping',
        input: meta.type,
        output: isNull ? 'null' : resType
      }]
    };
  }
}
