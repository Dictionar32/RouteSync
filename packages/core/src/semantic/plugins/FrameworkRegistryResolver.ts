import { SemanticResolution, SemanticType, TraceNode } from '../../types/contract';
import { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';

const FRAMEWORK_REGISTRY: Record<string, { input: string[], output: SemanticType, evidence: string }> = {
  strtoupper: { input: ['string'], output: 'string', evidence: 'framework:string_function' },
  strtolower: { input: ['string'], output: 'string', evidence: 'framework:string_function' },
  ucfirst: { input: ['string'], output: 'string', evidence: 'framework:string_function' },
  ucwords: { input: ['string'], output: 'string', evidence: 'framework:string_function' },
  intval: { input: ['any'], output: 'number', evidence: 'framework:number_cast' },
  floatval: { input: ['any'], output: 'number', evidence: 'framework:number_cast' },
  boolval: { input: ['any'], output: 'boolean', evidence: 'framework:boolean_cast' },
  now: { input: [], output: 'string', evidence: 'framework:date_helper' },
}

export class FrameworkRegistryResolver implements ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean {
    if (!meta) return false;

    // 1. Function call
    if (meta.kind === 'function_call') return true;

    // 2. Targetless method calls (global helpers)
    if (meta.kind === 'method_call' && !meta.target) return true;

    // 3. validated / safe / createToken / format / diffForHumans etc.
    if (meta.kind === 'method_call' && ['validated', 'safe', 'createToken', 'toDateTimeString', 'toISOString', 'toIso8601String', 'format', 'diffForHumans', 'toDateString', 'toDateTime'].includes(meta.name || meta.method || '')) return true;

    return false;
  }

  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution {
    const methodName = meta.method || meta.name || meta.function || '';

    // 1. Check direct function / targetless method mapping in registry
    if (methodName && FRAMEWORK_REGISTRY[methodName]) {
      const funcDef = FRAMEWORK_REGISTRY[methodName];
      const trace: TraceNode[] = [{
        source: 'FrameworkRegistryResolver',
        rule: `Framework helper function lookup: ${methodName}`,
        input: methodName,
        output: funcDef.output
      }];
      const args = meta.arguments || meta.args;
      if (args && args.length > 0) {
          const argRes = context.kernel.resolve(args[0], context.contextModel);
          if (argRes.trace) trace.push(...argRes.trace);
      }
      return {
        status: 'resolved',
        type: funcDef.output,
        confidence: 100,
        trace
      };
    }

    // 2. Global targetless helpers
    if (meta.kind === 'method_call' && !meta.target) {
      if (['asset', 'url', 'route', 'ltrim', 'trim', 'strval', 'strtoupper', 'strtolower'].includes(methodName)) {
        return {
          status: 'resolved',
          type: 'string',
          confidence: 100,
          trace: [{ source: 'FrameworkRegistryResolver', rule: 'Global string helper', input: methodName, output: 'string' }]
        };
      }
      if (['intval', 'floatval', 'doubleval', 'count'].includes(methodName)) {
        return {
          status: 'resolved',
          type: 'number',
          confidence: 100,
          trace: [{ source: 'FrameworkRegistryResolver', rule: 'Global number helper', input: methodName, output: 'number' }]
        };
      }
      if (['boolval'].includes(methodName)) {
        return {
          status: 'resolved',
          type: 'boolean',
          confidence: 100,
          trace: [{ source: 'FrameworkRegistryResolver', rule: 'Global boolean helper', input: methodName, output: 'boolean' }]
        };
      }
    }

    // 3. Validated and safe request methods
    if (['validated', 'safe'].includes(methodName)) {
      return {
        status: 'resolved',
        type: 'object',
        confidence: 100,
        trace: [{ source: 'FrameworkRegistryResolver', rule: 'Request validation method', input: methodName, output: 'object' }]
      };
    }

    // 4. Carbon date format/helper methods
    if (['toDateTimeString', 'toISOString', 'toIso8601String', 'format', 'diffForHumans', 'toDateString', 'toDateTime'].includes(methodName)) {
      const trace: TraceNode[] = [{
        source: 'FrameworkRegistryResolver',
        rule: 'Carbon date method call',
        input: methodName,
        output: 'string'
      }];
      if (meta.target) {
        const targetRes = context.kernel.resolve(meta.target, context.contextModel);
        if (targetRes.trace) trace.push(...targetRes.trace);
      }
      return {
        status: 'resolved',
        type: 'string',
        confidence: 100,
        trace
      };
    }

    if (methodName === 'createToken') {
      return {
        status: 'resolved',
        type: 'object',
        fields: {
           plainTextToken: 'string'
        },
        confidence: 100,
        trace: [{ source: 'FrameworkRegistryResolver', rule: 'Sanctum createToken method call', input: 'createToken', output: 'object' }]
      };
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
