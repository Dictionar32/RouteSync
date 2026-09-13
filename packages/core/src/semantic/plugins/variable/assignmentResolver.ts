/**
 * assignmentResolver.ts
 *
 * Resolves variables from resolvedAssignments and raw assignments with cycle detection.
 *
 * @module semantic/plugins/variable
 */

import type { SemanticResolution } from '../../../types/contract';
import type { ResolutionContext, ModelNode } from '../../types';

function isModelNode(obj: unknown): obj is ModelNode {
  return typeof obj === 'object' && obj !== null && 'name' in obj;
}

export function resolveAssignmentVariable(
  name: string,
  context: ResolutionContext,
  currentModel?: ModelNode | unknown
): SemanticResolution | null {
  // Check resolvedAssignments in currentModel or context
  let resolvedAssignments = context.resolvedAssignments;
  if (isModelNode(currentModel) && currentModel.resolvedAssignments) {
    resolvedAssignments = currentModel.resolvedAssignments;
  }

  if (resolvedAssignments && resolvedAssignments[name]) {
    const resolvedVar = resolvedAssignments[name];
    return {
      ...resolvedVar,
      trace: [
        {
          source: 'VariableResolver',
          rule: 'Variable lookup from resolved assignments',
          input: name,
          output: `${resolvedVar.type || 'unknown'} (${resolvedVar.model || resolvedVar.resource || ''})`
        },
        ...(resolvedVar.trace || [])
      ]
    };
  }

  // Check raw assignments in currentModel or context
  let assignments = context.assignments;
  if (isModelNode(currentModel) && currentModel.assignments) {
    assignments = currentModel.assignments;
  }

  if (assignments && assignments[name]) {
    const assignedExpr = assignments[name];
    const nodeId = `var:${context.fileName || 'global'}:${name}`;
    if (!context.cycleDetector.enter(nodeId)) {
      return {
        status: 'unknown',
        type: 'unknown',
        confidence: 0,
        trace: [{
          source: 'VariableResolver',
          rule: `Cycle detected at variable ${nodeId}`,
          input: name,
          output: 'unknown'
        }]
      };
    }
    const res = context.kernel.resolve(assignedExpr, currentModel);
    context.cycleDetector.leave(nodeId);
    return {
      ...res,
      trace: [
        {
          source: 'VariableResolver',
          rule: 'Variable lookup from raw assignments',
          input: name,
          output: `${res.type} (${res.model || res.resource || ''})`
        },
        ...(res.trace || [])
      ]
    };
  }

  return null;
}
