import { SemanticResolution } from '../../types/contract';
import { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';

interface ManifestModel {
  name: string;
  relations?: Record<string, { model: string; type: string }>;
}

export class ConditionalWrapperResolver implements ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean {
    if (!meta || meta.kind !== 'method_call') return false;
    return ['whenLoaded', 'when', 'mergeWhen'].includes(meta.name);
  }

  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution {
    if (meta.kind !== 'method_call') {
      return { status: 'unknown', type: 'unknown', confidence: 0, trace: [] };
    }
    const name = meta.name;
    const args = meta.args;

    if (name === 'whenLoaded') {
      if (args.length >= 2) {
        return context.kernel.resolve(args[1], context.contextModel);
      } else if (args.length === 1 && (args[0].kind === 'primitive' || args[0].kind === 'literal')) {
        const first = args[0];
        const relationName = first.kind === 'literal' ? first.value : first.type;
        if (relationName && typeof relationName === 'string') {
          // Resolve 'this' to get model name
          const resolvedThis = context.kernel.resolve({ kind: 'variable', name: 'this', originalCode: '$this' }, context.contextModel);
          if (resolvedThis.status === 'resolved' && resolvedThis.type === 'model' && resolvedThis.model) {
            // Find model in manifest
            const model = context.symbolTable.get(resolvedThis.model);
            if (model && model.relation(relationName)) {
              const relation = model.relation(relationName)!;
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
