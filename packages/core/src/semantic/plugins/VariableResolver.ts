/**
 * VariableResolver.ts
 *
 * Semantic resolution plugin for variable lookups ($this, assignments, model names).
 * Active Consumer orchestrating variable resolution sub-domains.
 *
 * @module semantic/plugins/VariableResolver
 */

import type { SemanticResolution } from '../../types/domain/semanticResolution';
import { unknownResolution } from '../semanticResolutionSupport';
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
      return unknownResolution('VariableResolver', 'Unsupported variable metadata', 'variable', 'invalid_boundary_input');
    }
    const name = meta.name.value;
    const scope = context.scope;

    // 1. Resolve 'this'
    if (name === 'this') {
      const thisRes = resolveThisVariable(context, scope);
      if (thisRes.kind === 'resolved') return thisRes.value;
    }

    // 2 & 3. Check assignments (resolved and raw)
    const assignmentRes = resolveAssignmentVariable(name, context, scope);
    if (assignmentRes.kind === 'resolved') return assignmentRes.value;

    // 4. Match against models by name (including plural/singular heuristics)
    const modelRes = resolveModelByName(name, context.symbolTable);
    if (modelRes) return modelRes;

    return unknownResolution('VariableResolver', 'Unknown variable', name, 'unresolved_symbol');
  }
}
