import { SemanticResolution, TraceNode } from '../../types/contract';
import { ResolverPlugin, ResolutionContext, ResolverMeta, ModelNode } from '../types';

function isModelNode(obj: unknown): obj is ModelNode {
  return typeof obj === 'object' && obj !== null && 'name' in obj;
}

export class MethodReturnResolver implements ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean {
    return meta && (
      meta.kind === 'resolved_method' || 
      meta.kind === 'method_call' || 
      meta.kind === 'static_method_call'
    );
  }

  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution {
    if (meta.kind === 'resolved_method') {
      const isModel = context.models.some(m => m.name === meta.type);
      return {
        status: 'resolved',
        type: isModel ? 'model' : (meta.type || 'unknown'),
        model: isModel ? meta.type : undefined,
        confidence: meta.confidence || 0,
        trace: [{
          source: 'MethodReturnResolver',
          rule: 'Resolved method type',
          input: meta.source,
          output: meta.type
        }]
      };
    }

    const fallbackRes: SemanticResolution = { status: 'unknown', type: 'unknown', confidence: 0, trace: [] };

    if (meta.kind === 'static_method_call') {
      const targetRes = meta.target ? context.kernel.resolve(meta.target, context.contextModel) : fallbackRes;
      const methodName = meta.name || '';
      if (targetRes.status === 'resolved' && targetRes.type === 'model' && targetRes.model) {
        const isCollection = ['all', 'get', 'paginate', 'cursorPaginate'].includes(methodName);
        const isPaginated = ['paginate', 'cursorPaginate'].includes(methodName);
        const trace = [
          ...(targetRes.trace || []),
          {
            source: 'MethodReturnResolver',
            input: methodName,
            output: `model ${targetRes.model}`,
            rule: `Static method call ${targetRes.model}::${methodName}`
          }
        ];
        return {
          status: 'resolved',
          type: 'model',
          model: targetRes.model,
          collection: isCollection || undefined,
          paginated: isPaginated || undefined,
          confidence: 90,
          trace
        };
      }

      // If target is not model, fallback
      return {
        status: 'unknown',
        type: 'unknown',
        confidence: 0,
        trace: [{
          source: 'MethodReturnResolver',
          rule: `Static method call target not resolved as model`,
          input: methodName
        }]
      };
    }

    if (meta.kind === 'method_call') {
      const v = meta.variable || meta.target;
      const m = meta.method || meta.name;

      if (!m) {
        return {
          status: 'unknown',
          type: 'unknown',
          confidence: 0,
          trace: [{ source: 'MethodReturnResolver', rule: 'Method name missing' }]
        };
      }

      let targetModelName: string | undefined = undefined;
      let varStr = typeof v === 'string' ? v : JSON.stringify(v);
      const trace: TraceNode[] = [];

      // Try resolving target/variable first
      let resolvedTarget: SemanticResolution = fallbackRes;
      if (v) {
        if (typeof v === 'string') {
          if (v === 'request' && m === 'user') {
            return {
              status: 'resolved',
              type: 'model',
              model: 'User',
              confidence: 90,
              trace: [{
                source: 'MethodReturnResolver',
                rule: 'Request user helper method',
                input: 'request->user()',
                output: 'model: User'
              }]
            };
          }
          if (v === 'pdf' && m === 'download') {
            return {
              status: 'resolved',
              type: 'BinaryFile',
              confidence: 80,
              trace: [{
                source: 'MethodReturnResolver',
                rule: 'PDF download helper method',
                input: 'pdf->download()',
                output: 'BinaryFile'
              }]
            };
          }
          if (v === 'this' && context.contextModel && isModelNode(context.contextModel)) {
            targetModelName = context.contextModel.name;
          } else {
            const found = context.models.find(model => model.name.toLowerCase() === v.toLowerCase());
            if (found) {
              targetModelName = found.name;
            }
          }
        } else if (typeof v === 'object') {
          resolvedTarget = context.kernel.resolve(v, context.contextModel);
          if (resolvedTarget.status === 'resolved') {
            if (resolvedTarget.type === 'model' && resolvedTarget.model) {
              targetModelName = resolvedTarget.model;
            } else if (resolvedTarget.type && resolvedTarget.type !== 'unknown') {
              targetModelName = resolvedTarget.type;
            }
            if (v.kind === 'property_access') {
              varStr = `$this->${v.property || ''}`;
            }
          }
        }
      }

      // Eloquent method return logic
      if (targetModelName) {
        const modelReturnMethods = ['first', 'find', 'findOrFail', 'create', 'update', 'firstOrCreate'];
        const collectionReturnMethods = ['get', 'all'];
        const paginatedReturnMethods = ['paginate', 'simplePaginate', 'cursorPaginate'];

        if (modelReturnMethods.includes(m)) {
          return {
            status: 'resolved',
            type: 'model',
            model: targetModelName,
            collection: false,
            confidence: 90,
            trace: [
              ...(resolvedTarget.trace || []),
              {
                source: 'MethodReturnResolver',
                rule: 'Query returns model instance',
                input: `${varStr}->${m}()`,
                output: `model: ${targetModelName}`
              }
            ]
          };
        }
        
        if (collectionReturnMethods.includes(m)) {
          return {
            status: 'resolved',
            type: 'model',
            model: targetModelName,
            collection: true,
            confidence: 90,
            trace: [
              ...(resolvedTarget.trace || []),
              {
                source: 'MethodReturnResolver',
                rule: 'Query returns collection of model',
                input: `${varStr}->${m}()`,
                output: `Collection of model: ${targetModelName}`
              }
            ]
          };
        }

        if (paginatedReturnMethods.includes(m)) {
          return {
            status: 'resolved',
            type: 'model',
            model: targetModelName,
            collection: true,
            paginated: true,
            confidence: 90,
            trace: [
              ...(resolvedTarget.trace || []),
              {
                source: 'MethodReturnResolver',
                rule: 'Query returns paginated collection of model',
                input: `${varStr}->${m}()`,
                output: `Paginated Collection of model: ${targetModelName}`
              }
            ]
          };
        }

        const builderMethods = [
          'where', 'whereIn', 'whereNotIn', 'whereNull', 'whereNotNull',
          'whereBetween', 'whereNotBetween', 'whereDate', 'whereMonth', 'whereDay',
          'whereYear', 'whereTime', 'whereColumn', 'orWhere', 'orWhereIn',
          'orderBy', 'orderByDesc', 'latest', 'oldest', 'inRandomOrder',
          'select', 'addSelect', 'distinct', 'join', 'leftJoin', 'rightJoin',
          'crossJoin', 'groupBy', 'having', 'havingRaw', 'skip', 'offset',
          'limit', 'take', 'with', 'withCount', 'load', 'loadCount', 'has', 'whereHas',
          'query'
        ];
        if (builderMethods.includes(m)) {
          return {
            status: 'resolved',
            type: 'model',
            model: targetModelName,
            collection: resolvedTarget.collection || undefined,
            paginated: resolvedTarget.paginated || undefined,
            confidence: resolvedTarget.confidence || 90,
            trace: [
              ...(resolvedTarget.trace || []),
              {
                source: 'MethodReturnResolver',
                rule: 'Eloquent query builder method pass-through',
                input: `${varStr}->${m}()`,
                output: `model: ${targetModelName}`
              }
            ]
          };
        }

        if (['count', 'sum', 'avg', 'min', 'max'].includes(m)) {
          return {
            status: 'resolved',
            type: 'number',
            confidence: Math.min(resolvedTarget.confidence || 100, 100),
            trace: [
              ...(resolvedTarget.trace || []),
              { source: 'MethodReturnResolver', input: `${varStr}->${m}()`, output: 'number', rule: 'Aggregate query method' }
            ]
          };
        }

        if (['exists', 'doesntExist'].includes(m)) {
          return {
            status: 'resolved',
            type: 'boolean',
            confidence: Math.min(resolvedTarget.confidence || 100, 100),
            trace: [
              ...(resolvedTarget.trace || []),
              { source: 'MethodReturnResolver', input: `${varStr}->${m}()`, output: 'boolean', rule: 'Boolean query method' }
            ]
          };
        }

        if (['pluck', 'toArray', 'jsonSerialize'].includes(m)) {
          return {
            status: 'resolved',
            type: 'array',
            confidence: Math.min(resolvedTarget.confidence || 90, 90),
            trace: [
              ...(resolvedTarget.trace || []),
              { source: 'MethodReturnResolver', input: `${varStr}->${m}()`, output: 'array', rule: 'Conversion query method' }
            ]
          };
        }
      }

      if (m === 'createToken') {
        return {
          status: 'resolved',
          type: 'NewAccessToken',
          confidence: 80,
          trace: [{
            source: 'MethodReturnResolver',
            rule: 'Laravel Sanctum createToken helper',
            input: `${varStr}->createToken()`,
            output: 'NewAccessToken'
          }]
        };
      }

      return {
        status: 'unknown',
        type: 'unknown',
        confidence: meta.confidence || 0,
        trace: [{
          source: 'MethodReturnResolver',
          rule: 'Method return fallback',
          input: `${v ? varStr : ''}->${m}()`,
          output: 'unknown'
        }]
      };
    }

    return {
      status: 'unknown',
      type: 'unknown',
      confidence: 0,
      trace: [{
        source: 'MethodReturnResolver',
        rule: 'Unsupported method kind'
      }]
    };
  }
}
