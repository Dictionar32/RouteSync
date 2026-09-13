/**
 * thisResolver.ts
 *
 * Resolves '$this' pseudo-variable in model or resource contexts.
 *
 * @module semantic/plugins/variable
 */

import type { SemanticResolution } from '../../../types/contract';
import type { ResolutionContext, ModelNode } from '../../types';

function isModelNode(obj: unknown): obj is ModelNode {
  return typeof obj === 'object' && obj !== null && 'name' in obj;
}

export function resolveThisVariable(
  context: ResolutionContext,
  currentModel?: ModelNode | unknown
): SemanticResolution | null {
  let contextModelName = '';
  if (currentModel && isModelNode(currentModel)) {
    if (currentModel.name) {
      contextModelName = currentModel.name;
    } else if (currentModel.layer === 'resource') {
      contextModelName = currentModel.name?.replace(/Resource$/, '') || '';
    } else if (currentModel.layer === 'model') {
      contextModelName = currentModel.name || '';
    }
  }

  // Also check context.fileName / context.layer if currentModel is not a model object directly
  if (!contextModelName && context.fileName) {
    contextModelName = context.fileName.replace(/Resource$/, '') || '';
  }

  if (contextModelName) {
    return {
      status: 'resolved',
      type: 'model',
      model: contextModelName,
      confidence: 100,
      trace: [{
        source: 'VariableResolver',
        rule: 'this variable mapping to context model',
        input: 'this',
        output: `model: ${contextModelName}`
      }]
    };
  }

  return null;
}
