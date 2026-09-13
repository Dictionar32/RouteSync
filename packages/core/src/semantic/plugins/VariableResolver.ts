/**
 * VariableResolver.ts
 *
 * Semantic resolution plugin for variable lookups ($this, assignments, model names).
 * Active Consumer orchestrating variable resolution sub-domains.
 *
 * @module semantic/plugins/VariableResolver
 */

import type { SemanticResolution } from '../../types/contract';
import type { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';
import {
  resolveThisVariable,
  resolveAssignmentVariable,
  resolveModelByName
} from './variable';

export {
  resolveThisVariable,
  resolveAssignmentVariable,
  resolveModelByName
};

export class VariableResolver implements ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean {
    return !!(meta && meta.kind === 'variable');
  }

  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution {
    if (meta.kind !== 'variable') {
      return { status: 'unknown', type: 'unknown', confidence: 0, trace: [] };
    }
    const name = meta.name || '';
    const currentModel = context.contextModel;

    // 1. Resolve 'this'
    if (name === 'this') {
      const thisRes = resolveThisVariable(context, currentModel);
      if (thisRes) return thisRes;
    }

    // 2 & 3. Check assignments (resolved and raw)
    const assignmentRes = resolveAssignmentVariable(name, context, currentModel);
    if (assignmentRes) return assignmentRes;

    // 4. Match against models by name (including plural/singular heuristics)
    const modelRes = resolveModelByName(name, context.symbolTable);
    if (modelRes) return modelRes;

    return {
      status: 'unknown',
      type: 'unknown',
      confidence: 0,
      trace: [{
        source: 'VariableResolver',
        rule: 'Unknown variable',
        input: name
      }]
    };
  }
}
