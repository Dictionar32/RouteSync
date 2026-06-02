import { ResolverPlugin, ResolutionContext, ResolutionResult } from '../types';

export class PrimitiveResolver implements ResolverPlugin {
  canResolve(meta: any): boolean {
    return meta && meta.kind === 'primitive';
  }

  resolve(meta: any, context: ResolutionContext): ResolutionResult {
    let typeStr = meta.type;
    if (meta.confidence !== undefined && meta.confidence < 80) typeStr = 'unknown';
    
    const resType = typeStr === 'number' || typeStr === 'string' || typeStr === 'boolean' || typeStr === 'null' ? typeStr : 'unknown';
    return {
      status: resType === 'unknown' ? 'unresolved' : 'resolved',
      type: resType,
      confidence: meta.confidence || 50,
      evidence: [{ kind: 'primitive', name: meta.type }],
      unresolvedReason: resType === 'unknown' ? 'Low confidence primitive' : undefined,
    };
  }
}
