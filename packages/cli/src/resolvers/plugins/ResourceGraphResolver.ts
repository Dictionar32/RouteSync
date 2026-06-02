import { ResolverPlugin, ResolutionContext, ResolutionResult } from '../types';

export class ResourceGraphResolver implements ResolverPlugin {
  canResolve(meta: any): boolean {
    return meta && meta.kind === 'resource';
  }

  resolve(meta: any, context: ResolutionContext): ResolutionResult {
    // We are no longer resolving directly to a schema!
    // We keep it as a Transformed class but we could potentially link to the Resource directly.
    return {
      status: 'resolved',
      type: `${meta.resource}Transformed`,
      confidence: 100,
      evidence: [{ kind: 'resource_mapping', name: meta.resource }]
    };
  }
}
