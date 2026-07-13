import { SemanticResolution, TraceNode } from '../../types/contract';
import { ResolverPlugin, ResolutionContext, ResolverMeta, ModelNode } from '../types';
import { lookupEloquentMethod } from '../EloquentRegistry';

function isModelNode(obj: unknown): obj is ModelNode {
  return typeof obj === 'object' && obj !== null && 'name' in obj;
}

export class MethodReturnResolver implements ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean {
    return !!meta && (meta.kind === 'method_call' || meta.kind === 'static_method_call');
  }

  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution {
    const fallbackRes: SemanticResolution = { status: 'unknown', type: 'unknown', confidence: 0, trace: [] };

    if (meta.kind === 'static_method_call') {
      const className = meta.className;
      const methodName = meta.name || '';
      // Confirm className is a real, known Eloquent model before treating
      // this as a model query — this is stricter (and more correct) than
      // the old behavior, which trusted a parser-level assumption that
      // EVERY `X::y()` had X as a model (see PhpCodeParser.ts's header
      // comment — that assumption is what made Carbon::now() look like a
      // model call too).
      const isKnownModel = !!className && context.symbolTable.has(className);

      if (isKnownModel) {
        const isCollection = ['all', 'get', 'paginate', 'cursorPaginate'].includes(methodName);
        const isPaginated = ['paginate', 'cursorPaginate'].includes(methodName);
        const trace = [{
          source: 'MethodReturnResolver',
          input: methodName,
          output: `model ${className}`,
          rule: `Static method call ${className}::${methodName}`
        }];
        return {
          status: 'resolved',
          type: 'model',
          model: className,
          collection: isCollection || undefined,
          paginated: isPaginated || undefined,
          confidence: 90,
          trace
        };
      }

      // Target is not a known model — e.g. Carbon::now(), Str::slug(),
      // Route::get(). FrameworkRegistryResolver handles the specific
      // helper methods it knows about; this just reports "not a model".
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

    if (meta.kind !== 'method_call') {
      return { status: 'unknown', type: 'unknown', confidence: 0, trace: [] };
    }

    const v = meta.target;
    const m = meta.name;

    if (!m) {
      return {
        status: 'unknown',
        type: 'unknown',
        confidence: 0,
        trace: [{ source: 'MethodReturnResolver', rule: 'Method name missing' }]
      };
    }

    let targetModelName: string | undefined = undefined;
    let varStr = v ? (v.kind === 'variable' ? `$${v.name}` : v.kind) : '';
    const trace: TraceNode[] = [];

    // Try resolving target first
    let resolvedTarget: SemanticResolution = fallbackRes;
    if (v) {
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

    // Eloquent method return logic
      if (targetModelName) {
        const rule = lookupEloquentMethod(m);
        if (rule) {
          const baseTrace = [
            ...(resolvedTarget.trace || []),
            {
              source: 'MethodReturnResolver',
              rule: `Eloquent method registry: ${m} -> ${rule.returns}`,
              input: `${varStr}->${m}()`,
              output: rule.returns
            }
          ];

          switch (rule.returns) {
            case 'model':
              return {
                status: 'resolved',
                type: 'model',
                model: targetModelName,
                collection: rule.collection,
                paginated: rule.paginated,
                confidence: 90,
                trace: baseTrace
              };
            case 'builder':
              // pass-through — same model, inherits whatever collection/
              // paginated-ness the target already had, not fixed by this rule
              return {
                status: 'resolved',
                type: 'model',
                model: targetModelName,
                collection: resolvedTarget.collection || undefined,
                paginated: resolvedTarget.paginated || undefined,
                confidence: resolvedTarget.confidence || 90,
                trace: baseTrace
              };
            case 'number':
              return {
                status: 'resolved',
                type: 'number',
                confidence: Math.min(resolvedTarget.confidence || 100, 100),
                trace: baseTrace
              };
            case 'boolean':
              return {
                status: 'resolved',
                type: 'boolean',
                confidence: Math.min(resolvedTarget.confidence || 100, 100),
                trace: baseTrace
              };
            case 'array':
              return {
                status: 'resolved',
                type: 'array',
                confidence: Math.min(resolvedTarget.confidence || 90, 90),
                trace: baseTrace
              };
          }
        }
      }

      return {
        status: 'unknown',
        type: 'unknown',
        confidence: 0,
        trace: [{
          source: 'MethodReturnResolver',
          rule: 'Method return fallback',
          input: `${v ? varStr : ''}->${m}()`,
          output: 'unknown'
        }]
      };
  }
}
