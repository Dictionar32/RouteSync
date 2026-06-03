import { SemanticResolution } from '@routesync/core';
import { ResolverPlugin, ResolutionContext } from '../types';

export class ResourceGraphResolver implements ResolverPlugin {
  canResolve(meta: any): boolean {
    return meta && meta.kind === 'resource';
  }

  resolve(meta: any, context: ResolutionContext): SemanticResolution {
    return {
      status: 'resolved',
      type: 'resource',
      resource: meta.resource,
      collection: meta.collection || undefined,
      confidence: 100,
      trace: [{
        source: 'ResourceGraphResolver',
        rule: 'Resource graph mapping',
        input: meta.resource,
        output: `resource: ${meta.resource}`
      }]
    };
  }
}
