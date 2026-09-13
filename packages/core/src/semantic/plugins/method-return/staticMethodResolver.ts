/**
 * staticMethodResolver.ts
 *
 * Resolves static method call semantics.
 *
 * @module core/semantic/plugins/method-return
 */

import type { SemanticResolution } from '../../../types/contract';
import type { ResolutionContext, ResolverMeta } from '../../types';

export function resolveStaticMethodCall(
  meta: ResolverMeta,
  context: ResolutionContext,
  sourceName = 'MethodReturnResolver'
): SemanticResolution {
  const className = meta.className;
  const methodName = meta.name || '';
  const isKnownModel = !!className && context.symbolTable.has(className);

  if (isKnownModel) {
    const isCollection = ['all', 'get', 'paginate', 'cursorPaginate'].includes(methodName);
    const isPaginated = ['paginate', 'cursorPaginate'].includes(methodName);
    const trace = [{
      source: sourceName,
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

  return {
    status: 'unknown',
    type: 'unknown',
    confidence: 0,
    trace: [{
      source: sourceName,
      rule: 'Static method call target not resolved as model',
      input: methodName
    }]
  };
}
