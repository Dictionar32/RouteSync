import type { ResolutionContext } from '../../types';
import type { ResolutionScope } from '../../resolutionScope';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import { indeterminateResolution, resolutionLabel } from '../../semanticResolutionSupport';
import type { VariableResolutionResult } from './variableResolutionResult';
import { resolveInScope } from '../../kernel/resolveInScope';
import { matchLookup } from '../../../types/upstream/collections';
import { relationEqual, relationGate } from '../../kernel/semanticRelations';

export function resolveAssignmentVariable(
  name: string,
  context: ResolutionContext,
  scope: ResolutionScope,
): VariableResolutionResult {
  const variable = SemanticValueFactory.variableName(name);
  return relationGate(
    relationEqual(scope.kind, 'global'),
    () => ({ kind: 'not_found', reason: 'no_context_model' }),
    () => matchLookup(scope.model.assignmentIndex.lookupBinding(variable), {
      missing: () => ({ kind: 'not_found', reason: 'no_assignment' }),
      found: ({ value: binding }) => resolveBinding(binding, name, context, scope),
    }),
  );
}

function resolveBinding(
  binding: import('../../modelNodes').ModelAssignmentBinding,
  name: string,
  context: ResolutionContext,
  scope: ResolutionScope,
): VariableResolutionResult {
  return relationGate(
    relationEqual(binding.value.semantic.status, 'resolved'),
    () => {
      const resolved = binding.value.semantic;
      return { kind: 'resolved', value: { ...resolved, trace: [
        { source: 'VariableResolver', rule: 'Variable lookup from semantic assignment environment', input: name, output: resolutionLabel(resolved) },
        ...resolved.trace,
      ] } };
    },
    () => resolveDeferredBinding(binding, name, context, scope),
  );
}

function resolveDeferredBinding(
  binding: import('../../modelNodes').ModelAssignmentBinding,
  name: string,
  context: ResolutionContext,
  scope: ResolutionScope,
): VariableResolutionResult {
  const nodeId = `var:${relationGate(context.fileName.length > 0, () => context.fileName, () => 'global')}:${name}`;
  return relationGate(
    context.cycleDetector.enter(nodeId),
    () => ({ kind: 'resolved', value: resolveInScope(context.kernel, binding.value.syntax, scope) }),
    () => ({ kind: 'resolved', value: indeterminateResolution('VariableResolver', `Cycle detected at variable ${nodeId}`, name, 'invalid_boundary_input') }),
  );
}
