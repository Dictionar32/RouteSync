import { SemanticResolution } from '../../types/contract';
import { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';

export class ResourceGraphResolver implements ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean {
    if (!meta) return false;

    // 1. Direct kind === 'resource'
    if (meta.kind === 'resource') return true;

    // 2. Resource::collection() or new Resource() where target is resource
    if (meta.kind === 'method_call' && meta.target && meta.target.kind === 'resource') return true;
    if (meta.kind === 'new_instance' && meta.target && meta.target.kind === 'resource') return true;

    // 3. Simple resource helper: method_call on property_access 'collection' (OrderResource::collection)
    if (meta.kind === 'method_call' && meta.target && meta.target.kind === 'property_access' && meta.target.property === 'collection' && meta.resource) return true;

    // 4. new_instance where property ends in Resource
    if (meta.kind === 'new_instance') {
      if (meta.target && meta.target.kind === 'property_access') {
         const resourceName = meta.target.property;
         if (resourceName && resourceName.endsWith('Resource')) return true;
      }
    }

    return false;
  }

  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution {
    const resourceVal = meta.resource || '';
    if (meta.kind === 'resource') {
      return {
        status: 'resolved',
        type: 'resource',
        resource: resourceVal,
        collection: meta.collection || undefined,
        confidence: 100,
        trace: [{
          source: 'ResourceGraphResolver',
          rule: 'Resource graph mapping',
          input: resourceVal,
          output: `resource: ${resourceVal}`
        }]
      };
    }

    if (meta.kind === 'method_call' && meta.target && meta.target.kind === 'resource') {
      const targetResource = meta.target.resource || '';
      return {
        status: 'resolved',
        type: 'resource',
        resource: targetResource,
        collection: !!meta.target.collection || !!meta.collection,
        confidence: 100,
        trace: [{
          source: 'ResourceGraphResolver',
          rule: 'Resource collection method call mapping',
          input: `${targetResource}::collection()`,
          output: `resource: ${targetResource} (collection)`
        }]
      };
    }

    if (meta.kind === 'new_instance' && meta.target && meta.target.kind === 'resource') {
      const targetResource = meta.target.resource || '';
      return {
        status: 'resolved',
        type: 'resource',
        resource: targetResource,
        collection: false,
        confidence: 100,
        trace: [{
          source: 'ResourceGraphResolver',
          rule: 'Resource new instance mapping',
          input: `new ${targetResource}()`,
          output: `resource: ${targetResource}`
        }]
      };
    }

    if (meta.kind === 'method_call' && meta.target && meta.target.kind === 'property_access' && meta.target.property === 'collection') {
      if (meta.resource) {
        return {
           status: 'resolved',
           type: 'resource',
           resource: resourceVal,
           collection: meta.collection !== undefined ? meta.collection : true,
           confidence: 100,
           trace: [{
             source: 'ResourceGraphResolver',
             rule: 'Simple resource collection mapping',
             input: `${resourceVal}::collection`,
             output: `resource: ${resourceVal} (collection)`
           }]
        };
      }
    }

    if (meta.kind === 'new_instance') {
      if (meta.target && meta.target.kind === 'property_access') {
         const resourceName = meta.target.property;
         if (resourceName && resourceName.endsWith('Resource')) {
            return {
               status: 'resolved',
               type: 'resource',
               resource: resourceName,
               collection: false,
               confidence: 90,
               trace: [{
                 source: 'ResourceGraphResolver',
                 rule: 'New resource heuristic suffix mapping',
                 input: `new ${resourceName}()`,
                 output: `resource: ${resourceName}`
               }]
            };
         }
      }
    }

    return {
      status: 'unknown',
      type: 'unknown',
      confidence: 0,
      trace: []
    };
  }
}
