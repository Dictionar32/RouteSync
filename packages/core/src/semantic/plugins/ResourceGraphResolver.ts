import type { SemanticResolution } from '../../types/domain/semanticResolution';
import type { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';
import { SemanticResolutionFactory } from '../../types/domain/semanticResolutionFactory';
import { SemanticValueFactory } from '../../types/domain/semanticValues';
import { BoundSemanticFactory } from '../../types/domain/boundAst';
import { ReferenceType } from '../../compiler/types/SemanticType';

/** Resolves Laravel Resource expressions at the semantic boundary. */
export class ResourceGraphResolver implements ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean {
    return (meta.kind === 'static_method_call' && meta.name.value === 'collection')
      || (meta.kind === 'new_instance' && meta.className.value.endsWith('Resource'));
  }

  resolve(meta: ResolverMeta, _context: ResolutionContext): SemanticResolution {
    if (meta.kind === 'static_method_call' && meta.name.value === 'collection') {
      return resource(meta.className.value, { kind: 'collection' }, 'Resource collection static call mapping');
    }

    if (meta.kind === 'new_instance' && meta.className.value.endsWith('Resource')) {
      return resource(meta.className.value, { kind: 'single' }, 'Resource instance mapping');
    }

    return SemanticResolutionFactory.unknown({
      status: 'unknown',
      confidence: 0,
      trace: [],
      boundAst: BoundSemanticFactory.unsupported('unsupported_syntax'),
    });
  }
}

function resource(
  name: string,
  cardinality: { readonly kind: 'single' | 'collection' },
  rule: string,
): SemanticResolution {
  const resource = SemanticValueFactory.resourceName(name);
  return SemanticResolutionFactory.resource({
    status: 'resolved',
    confidence: 100,
    trace: [{
      source: 'ResourceGraphResolver',
      rule,
      input: name,
      output: `resource: ${name}`,
    }],
    boundAst: BoundSemanticFactory.resourceReference(resource),
    resource,
    cardinality,
  });
}
