import { SemanticResolution } from '../../types/contract';
import { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';

interface ManifestModel {
  name: string;
  relations?: Record<string, { model: string; type: string }>;
}

export class ConditionalWrapperResolver implements ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean {
    if (!meta || meta.kind !== 'method_call') return false;
    const name = meta.method || meta.name;
    return !!(name && ['whenLoaded', 'when', 'mergeWhen'].includes(name));
  }

  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution {
    const name = meta.method || meta.name || '';
    const args = meta.arguments || meta.args || [];

    if (name === 'whenLoaded') {
      if (args.length >= 2) {
        return context.kernel.resolve(args[1], context.contextModel);
      } else if (args.length === 1 && (args[0].kind === 'primitive' || args[0].kind === 'literal')) {
        const relationName = args[0].value || args[0].type;
        if (relationName && typeof relationName === 'string') {
          // Resolve 'this' to get model name
          const resolvedThis = context.kernel.resolve({ kind: 'variable', name: 'this' }, context.contextModel);
          if (resolvedThis.status === 'resolved' && resolvedThis.type === 'model' && resolvedThis.model) {
            // Find model in manifest
            const model = context.models.find(m => m.name === resolvedThis.model);
            if (model && model.relations && model.relations[relationName]) {
              const relation = model.relations[relationName];
              if (relation.model) {
                const isCollection = ['hasMany', 'belongsToMany', 'morphMany', 'morphToMany', 'morphedByMany'].includes(relation.type);
                return {
                  status: 'resolved',
                  type: 'model',
                  model: relation.model,
                  collection: isCollection || undefined,
                  confidence: 100,
                  trace: [{
                    source: 'ConditionalWrapperResolver',
                    rule: `whenLoaded relation shorthand lookup`,
                    input: `whenLoaded('${relationName}')`,
                    output: `model: ${relation.model} (collection: ${isCollection})`
                  }]
                };
              }
            }
          }
        }
      }
    } else { // when or mergeWhen
      if (args.length >= 2) {
        return context.kernel.resolve(args[1], context.contextModel);
      }
    }

    return {
      status: 'unknown',
      type: 'unknown',
      confidence: 0,
      trace: [{
        source: 'ConditionalWrapperResolver',
        rule: `Conditional wrapper ${name} could not resolve value`,
        input: name
      }]
    };
  }
}
