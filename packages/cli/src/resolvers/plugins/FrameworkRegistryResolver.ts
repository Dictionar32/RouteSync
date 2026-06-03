import { SemanticResolution, TraceNode } from '@routesync/core';
import { ResolverPlugin, ResolutionContext } from '../types';

const FRAMEWORK_REGISTRY: Record<string, { input: string[], output: string, evidence: string }> = {
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
  canResolve(meta: any): boolean {
    return meta && meta.kind === 'function_call'; // Only functions
  }

  resolve(meta: any, context: ResolutionContext): SemanticResolution {
    const funcDef = FRAMEWORK_REGISTRY[meta.function];
    if (funcDef) {
      const trace: TraceNode[] = [{
        source: 'FrameworkRegistryResolver',
        rule: `Framework helper function lookup: ${meta.function}`,
        input: meta.function,
        output: funcDef.output
      }];
      if (meta.arguments && meta.arguments.length > 0) {
          const argRes = context.kernel.resolve(meta.arguments[0], context.contextModel);
          trace.push(...argRes.trace);
      }
      return {
        status: 'resolved',
        type: funcDef.output,
        confidence: 100,
        trace
      };
    }
    return {
      status: 'unknown',
      type: 'unknown',
      confidence: 0,
      trace: [{
        source: 'FrameworkRegistryResolver',
        rule: `Missing FrameworkResolver for ${meta.function}`,
        input: meta.function
      }]
    };
  }
}
