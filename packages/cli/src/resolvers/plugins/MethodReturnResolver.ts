import { ResolverPlugin, ResolutionContext, ResolutionResult } from '../types';

export class MethodReturnResolver implements ResolverPlugin {
  canResolve(meta: any): boolean {
    return meta && (meta.kind === 'resolved_method' || meta.kind === 'method_call');
  }

  resolve(meta: any, context: ResolutionContext): ResolutionResult {
    if (meta.kind === 'resolved_method') {
      return {
        status: 'resolved',
        type: meta.type,
        confidence: meta.confidence,
        evidence: [{ kind: 'method_call', name: meta.type, detail: meta.source }]
      };
    }

    if (meta.kind === 'method_call') {
      const v = meta.variable;
      const m = meta.method;
      
      let targetModelName: string | undefined = undefined;
      let varStr = typeof v === 'string' ? v : JSON.stringify(v);

      if (typeof v === 'string') {
          if (v === 'request' && m === 'user') {
            return { status: 'resolved', type: 'User', confidence: 90, evidence: [{ kind: 'method_call', name: 'request->user()', detail: 'Resolves to User model' }] };
          }
          if (v === 'pdf' && m === 'download') {
            return { status: 'resolved', type: 'BinaryFile', confidence: 80, evidence: [{ kind: 'method_call', name: 'pdf->download()', detail: 'Resolves to BinaryFile' }] };
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
          if (varRes.status === 'resolved' && varRes.type && varRes.type !== 'unknown') {
              // The property access resolves to a type (like a relation to 'Order')
              targetModelName = varRes.type;
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
            type: targetModelName,
            collection: false,
            confidence: 90,
            evidence: [{ kind: 'method_call', name: `${varStr}->${m}()`, detail: `Returns Model ${targetModelName}` }]
          };
        }
        
        if (collectionReturnMethods.includes(m)) {
          return {
            status: 'resolved',
            type: targetModelName,
            collection: true,
            confidence: 90,
            evidence: [{ kind: 'method_call', name: `${varStr}->${m}()`, detail: `Returns Collection of ${targetModelName}` }]
          };
        }

        if (paginatedReturnMethods.includes(m)) {
          return {
            status: 'resolved',
            type: targetModelName,
            collection: true,
            paginated: true,
            confidence: 90,
            evidence: [{ kind: 'method_call', name: `${varStr}->${m}()`, detail: `Returns Paginated Collection of ${targetModelName}` }]
          };
        }
      }

      if (m === 'createToken') {
        return { status: 'resolved', type: 'NewAccessToken', confidence: 80, evidence: [{ kind: 'method_call', name: `${varStr}->createToken()`, detail: 'Returns NewAccessToken' }] };
      }

      return {
        status: 'unresolved',
        type: 'unknown',
        confidence: meta.confidence || 0,
        evidence: [{ kind: 'method_call', name: `${meta.variable}->${meta.method}()`, detail: meta.source || 'Unknown source' }],
        unresolvedReason: `Cannot resolve method return for ${meta.variable}->${meta.method}()`
      };
    }

    return { status: 'unresolved', type: 'unknown', confidence: 0, evidence: [], unresolvedReason: 'Unsupported method meta' };
  }
}
