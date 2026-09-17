import type { SemanticResolution } from '../../../types/domain/semanticResolution';
import type { ResolutionContext, ModelNode } from '../../types';
import { unknownResolution, resolutionLabel } from '../../semanticResolutionSupport';

export function resolveAssignmentVariable(
  name: string,
  context: ResolutionContext,
  currentModel?: ModelNode,
): SemanticResolution | null {
  const resolved = currentModel === undefined
    ? context.resolvedAssignments[name]
    : currentModel.assignments.find(assignment => assignment.name.value === name)?.resolution;

  if (resolved !== undefined) {
    return { ...resolved, trace: [
      { source: 'VariableResolver', rule: 'Variable lookup from resolved assignments', input: name, output: resolutionLabel(resolved) },
      ...resolved.trace,
    ] };
  }

  const assignment = currentModel === undefined
    ? context.assignments[name]
    : currentModel.assignments.find(candidate => candidate.name.value === name)?.ast;
  if (assignment === undefined) return null;

  const nodeId = `var:${context.fileName || 'global'}:${name}`;
  if (!context.cycleDetector.enter(nodeId)) {
    return unknownResolution('VariableResolver', `Cycle detected at variable ${nodeId}`, name, 'invalid_boundary_input');
  }

  try {
    const resolved = context.kernel.resolve(assignment, currentModel);
    return { ...resolved, trace: [
      { source: 'VariableResolver', rule: 'Variable lookup from raw assignments', input: name, output: resolutionLabel(resolved) },
      ...resolved.trace,
    ] };
  } finally {
    context.cycleDetector.leave(nodeId);
  }
}
