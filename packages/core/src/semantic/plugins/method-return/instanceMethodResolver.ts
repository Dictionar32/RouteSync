/**
 * instanceMethodResolver.ts
 *
 * Resolves instance method call semantics using Eloquent registry.
 *
 * @module core/semantic/plugins/method-return
 */

import type { SemanticResolution, TraceNode } from '../../../types/contract';
import type { ResolutionContext, ResolverMeta } from '../../types';
import { lookupEloquentMethod } from '../../EloquentRegistry';

export function resolveInstanceMethodCall(
  meta: ResolverMeta,
  context: ResolutionContext,
  sourceName = 'MethodReturnResolver'
): SemanticResolution {
  const fallbackRes: SemanticResolution = { status: 'unknown', type: 'unknown', confidence: 0, trace: [] };
  const v = meta.target;
  const m = meta.name;

  if (!m) {
    return {
      status: 'unknown',
      type: 'unknown',
      confidence: 0,
      trace: [{ source: sourceName, rule: 'Method name missing' }]
    };
  }

  let targetModelName: string | undefined = undefined;
  let varStr = v ? (v.kind === 'variable' ? `$${v.name}` : v.kind) : '';

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

  if (targetModelName) {
    const rule = lookupEloquentMethod(m);
    if (rule) {
      const baseTrace: TraceNode[] = [
        ...(resolvedTarget.trace || []),
        {
          source: sourceName,
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
      source: sourceName,
      rule: 'Method return fallback',
      input: `${v ? varStr : ''}->${m}()`,
      output: 'unknown'
    }]
  };
}
