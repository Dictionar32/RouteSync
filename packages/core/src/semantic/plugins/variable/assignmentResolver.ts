import type { ResolutionContext } from '../../types';
import type { ResolutionScope } from '../../resolutionScope';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import { unknownResolution, resolutionLabel } from '../../semanticResolutionSupport';
import type { VariableResolutionResult } from './variableResolutionResult';
import { resolveInScope } from '../../kernel/resolveInScope';

export function resolveAssignmentVariable(
  name: string,
  context: ResolutionContext,
  scope: ResolutionScope,
): VariableResolutionResult {
  const variable = SemanticValueFactory.variableName(name);
  if (scope.kind === 'global') return { kind: 'not_found', reason: 'no_context_model' };
  const binding = scope.model.assignmentIndex.get(variable);

  if (binding === undefined) return { kind: 'not_found', reason: 'no_assignment' };

  const resolved = binding.value.semantic;
  if (resolved.status === 'resolved') {
    return { kind: 'resolved', value: { ...resolved, trace: [
      { source: 'VariableResolver', rule: 'Variable lookup from semantic assignment environment', input: name, output: resolutionLabel(resolved) },
      ...resolved.trace,
    ] } };
  }

  const nodeId = `var:${context.fileName || 'global'}:${name}`;
  if (!context.cycleDetector.enter(nodeId)) {
    return { kind: 'resolved', value: unknownResolution('VariableResolver', `Cycle detected at variable ${nodeId}`, name, 'invalid_boundary_input') };
  }

  try {
    return { kind: 'resolved', value: resolveInScope(context.kernel, binding.value.syntax, scope) };
  } finally {
    context.cycleDetector.leave(nodeId);
  }
}
