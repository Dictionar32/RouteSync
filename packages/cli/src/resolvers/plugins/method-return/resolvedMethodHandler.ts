/**
 * resolvedMethodHandler.ts
 *
 * Handles resolution for pre-resolved method metadata.
 *
 * @module cli/resolvers/plugins/method-return
 */

import type { SemanticResolution } from '@routesync/core';
import type { ResolutionContext } from '../types';

export function resolveResolvedMethod(meta: any, context: ResolutionContext): SemanticResolution {
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
