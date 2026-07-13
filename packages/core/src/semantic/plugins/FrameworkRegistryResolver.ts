import { SemanticResolution, TraceNode } from '../../types/contract';
import { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';
import { lookupGlobalFunction, lookupMethod, lookupVariableMethod, FrameworkMethodRule } from '../FrameworkRegistry';

function ruleToResolution(rule: FrameworkMethodRule, trace: TraceNode[]): SemanticResolution {
  return {
    status: 'resolved',
    type: rule.returns,
    model: rule.model,
    collection: rule.collection,
    paginated: rule.paginated,
    fields: rule.fields,
    confidence: rule.confidence ?? 100,
    trace
  };
}

export class FrameworkRegistryResolver implements ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean {
    if (!meta || (meta.kind !== 'method_call' && meta.kind !== 'static_method_call')) return false;

    if (meta.kind === 'method_call' && !meta.target && lookupGlobalFunction(meta.name)) return true;
    if (lookupMethod(meta.name)) return true;
    if (meta.kind === 'method_call' && meta.target?.kind === 'variable' && lookupVariableMethod(meta.target.name, meta.name)) return true;

    return false;
  }

  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution {
    if (meta.kind !== 'method_call' && meta.kind !== 'static_method_call') {
      return { status: 'unknown', type: 'unknown', confidence: 0, trace: [] };
    }
    const methodName = meta.name;

    // 1. Variable-keyed helpers (request->user(), pdf->download()) — checked
    // first since these are the most specific match.
    if (meta.kind === 'method_call' && meta.target?.kind === 'variable') {
      const varRule = lookupVariableMethod(meta.target.name, methodName);
      if (varRule) {
        return ruleToResolution(varRule, [{
          source: 'FrameworkRegistryResolver',
          rule: `Variable-keyed helper: ${meta.target.name}->${methodName}()`,
          input: `${meta.target.name}->${methodName}()`,
          output: varRule.returns
        }]);
      }
    }

    // 2. Global targetless helpers — `strtoupper($x)`, bare `now()`. The
    // parser has no separate function_call kind: both a global helper and
    // `strtoupper($x)` come through as method_call with target: null.
    if (meta.kind === 'method_call' && !meta.target) {
      const globalRule = lookupGlobalFunction(methodName);
      if (globalRule) {
        const trace: TraceNode[] = [{
          source: 'FrameworkRegistryResolver',
          rule: `Global function lookup: ${methodName}`,
          input: methodName,
          output: globalRule.returns
        }];
        if (meta.args.length > 0) {
          const argRes = context.kernel.resolve(meta.args[0], context.contextModel);
          if (argRes.trace) trace.push(...argRes.trace);
        }
        return ruleToResolution(globalRule, trace);
      }
    }

    // 3. Method-name-only registry (Carbon date methods, validated/safe,
    // createToken) — see FrameworkRegistry.ts's header for why there's no
    // `owner` scoping yet.
    const methodRule = lookupMethod(methodName);
    if (methodRule) {
      const trace: TraceNode[] = [{
        source: 'FrameworkRegistryResolver',
        rule: `Framework method lookup: ${methodName}`,
        input: methodName,
        output: methodRule.returns
      }];
      if (meta.kind === 'method_call' && meta.target) {
        const targetRes = context.kernel.resolve(meta.target, context.contextModel);
        if (targetRes.trace) trace.push(...targetRes.trace);
      }
      return ruleToResolution(methodRule, trace);
    }

    return {
      status: 'unknown',
      type: 'unknown',
      confidence: 0,
      trace: [{
        source: 'FrameworkRegistryResolver',
        rule: `Missing FrameworkResolver for ${methodName}`,
        input: methodName
      }]
    };
  }
}
