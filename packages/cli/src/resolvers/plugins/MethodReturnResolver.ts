import { SemanticResolution } from '@routesync/core';
import { ResolverPlugin, ResolutionContext } from '../types';

export class MethodReturnResolver implements ResolverPlugin {
  canResolve(meta: any): boolean {
    return meta && (meta.kind === 'resolved_method' || meta.kind === 'method_call');
  }

  resolve(meta: any, context: ResolutionContext): SemanticResolution {
    if (meta.kind === 'resolved_method') {
      const isModel = context.models.some((m: any) => m.name === meta.type);
      return {
        status: 'resolved',
        type: isModel ? 'model' : meta.type,
        model: isModel ? meta.type : undefined,
        confidence: meta.confidence,
        trace: [{
          source: 'MethodReturnResolver',
          rule: 'Resolved method type',
          input: meta.source,
          output: meta.type
        }]
      };
    }

    if (meta.kind === 'method_call') {
      const v = meta.variable;
      const m = meta.method;
      
      let targetModelName: string | undefined = undefined;
      let varStr = typeof v === 'string' ? v : JSON.stringify(v);

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
          if (v === 'this' && context.contextModel) {
            targetModelName = context.contextModel.name;
          } else {
            const found = context.models.find((model: any) => model.name.toLowerCase() === v.toLowerCase());
            if (found) {
                targetModelName = found.name;
            }
          }
      } else if (typeof v === 'object' && v !== null) {
          const varRes = context.kernel.resolve(v, context.contextModel);
          if (varRes.status === 'resolved') {
              if (varRes.type === 'model' && varRes.model) {
                  targetModelName = varRes.model;
              } else if (varRes.type && varRes.type !== 'unknown') {
                  targetModelName = varRes.type;
              }
              if (v.kind === 'property_access') {
                  varStr = `$this->${v.property}`;
              }
          }
      }

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
            trace: [{
              source: 'MethodReturnResolver',
              rule: 'Query returns model instance',
              input: `${varStr}->${m}()`,
              output: `model: ${targetModelName}`
            }]
          };
        }
        
        if (collectionReturnMethods.includes(m)) {
          return {
            status: 'resolved',
            type: 'model',
            model: targetModelName,
            collection: true,
            confidence: 90,
            trace: [{
              source: 'MethodReturnResolver',
              rule: 'Query returns collection of model',
              input: `${varStr}->${m}()`,
              output: `Collection of model: ${targetModelName}`
            }]
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
            trace: [{
              source: 'MethodReturnResolver',
              rule: 'Query returns paginated collection of model',
              input: `${varStr}->${m}()`,
              output: `Paginated Collection of model: ${targetModelName}`
            }]
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
          input: `${meta.variable}->${meta.method}()`,
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
