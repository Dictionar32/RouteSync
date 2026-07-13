import { SemanticResolution } from '../../types/contract';
import { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';

/**
 * Phase 2 of the FieldNode migration (packages/core/src/types/field.ts).
 * This used to have 4 detection cases, 3 of which existed only because the
 * parser sometimes pre-tagged nodes with `kind: 'resource'` / `.resource`
 * itself (PhpCodeParser.ts's old `methodName === 'collection'` hardcode).
 * Now that the parser is framework-agnostic (produces plain
 * `static_method_call` / `new_instance`, nothing pre-tagged), THIS is the
 * one place "is this a Resource" gets decided — two heuristics, matching
 * exactly what the old code covered:
 *   - `X::collection(...)`  -> resource, collection
 *   - `new XResource(...)`  -> resource, not a collection
 * (className-ends-with-'Resource' is not required for the `::collection()`
 * case, matching the old parser hardcode's behavior exactly — it trusted
 * the `collection` method name alone. Required for `new_instance`, also
 * matching the old suffix-heuristic case.)
 */
export class ResourceGraphResolver implements ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean {
    if (!meta) return false;

    if (meta.kind === 'static_method_call' && meta.name === 'collection' && meta.className) return true;
    if (meta.kind === 'new_instance' && typeof meta.className === 'string' && meta.className.endsWith('Resource')) return true;

    return false;
  }

  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution {
    if (meta.kind === 'static_method_call' && meta.name === 'collection' && meta.className) {
      return {
        status: 'resolved',
        type: 'resource',
        resource: meta.className,
        collection: true,
        confidence: 100,
        trace: [{
          source: 'ResourceGraphResolver',
          rule: 'Resource collection static call mapping',
          input: `${meta.className}::collection()`,
          output: `resource: ${meta.className} (collection)`
        }]
      };
    }

    if (meta.kind === 'new_instance' && typeof meta.className === 'string' && meta.className.endsWith('Resource')) {
      return {
        status: 'resolved',
        type: 'resource',
        resource: meta.className,
        collection: false,
        confidence: 100,
        trace: [{
          source: 'ResourceGraphResolver',
          rule: 'New resource instance mapping',
          input: `new ${meta.className}()`,
          output: `resource: ${meta.className}`
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
