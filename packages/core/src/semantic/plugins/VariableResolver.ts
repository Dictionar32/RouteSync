import type { SemanticResolution } from '../../types/domain/semanticResolution';
import { indeterminateResolution } from '../semanticResolutionSupport';
import type { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';
import { resolveThisVariable, resolveAssignmentVariable, resolveModelByName } from './variable';
import type { VariableResolutionResult } from './variable/variableResolutionResult';
import { relationEqual, relationGate } from '../kernel/semanticRelations';
import { relationFirst, relationOptionFold } from '../kernel/relationalSequence';

export { resolveThisVariable, resolveAssignmentVariable, resolveModelByName };

type VariableCandidate = Readonly<{ readonly resolve: () => VariableResolutionResult }>;

const resolveVariable = (meta: Extract<ResolverMeta, { kind: 'variable' }>, context: ResolutionContext): SemanticResolution => {
  const name = meta.name.value;
  const scope = context.scope;
  const candidates: readonly VariableCandidate[] = Object.freeze([
    { resolve: () => relationGate(relationEqual(name, 'this'), () => resolveThisVariable(context, scope), () => ({ kind: 'not_found', reason: 'no_context_model' })) },
    { resolve: () => resolveAssignmentVariable(name, context, scope) },
    { resolve: () => resolveModelByName(name, context.symbolTable) },
  ]);
  return relationOptionFold(
    relationFirst(candidates, candidate => relationEqual(candidate.resolve().kind, 'resolved')),
    () => indeterminateResolution('VariableResolver', 'Unknown variable', name, 'unresolved_symbol'),
    candidate => {
      const result = candidate.resolve();
      return relationGate(
        relationEqual(result.kind, 'resolved'),
        () => result.value,
        () => indeterminateResolution('VariableResolver', 'Unknown variable', name, 'unresolved_symbol'),
      );
    },
  );
};

export const VariableResolver: ResolverPlugin = Object.freeze({
  canResolve: (meta: ResolverMeta): boolean => relationEqual(meta.kind, 'variable'),
  resolve: (meta: ResolverMeta, context: ResolutionContext): SemanticResolution => relationGate(
    relationEqual(meta.kind, 'variable'),
    () => resolveVariable(meta, context),
    () => indeterminateResolution('VariableResolver', 'Unsupported variable metadata', 'variable', 'invalid_boundary_input'),
  ),
});
