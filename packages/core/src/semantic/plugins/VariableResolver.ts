import { SemanticResolution } from '../../types/contract';
import { ResolverPlugin, ResolutionContext, ResolverMeta, ModelNode } from '../types';

function isModelNode(obj: unknown): obj is ModelNode {
  return typeof obj === 'object' && obj !== null && 'name' in obj;
}

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
    }

    // 2. Check resolvedAssignments in currentModel or context
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
            rule: `Variable lookup from resolved assignments`,
            input: name,
            output: `${resolvedVar.type || 'unknown'} (${resolvedVar.model || resolvedVar.resource || ''})`
          },
          ...(resolvedVar.trace || [])
        ]
      };
    }

    // 3. Check raw assignments in currentModel or context
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
            rule: `Variable lookup from raw assignments`,
            input: name,
            output: `${res.type} (${res.model || res.resource || ''})`
          },
          ...(res.trace || [])
        ]
      };
    }

    // 4. Match against models in manifest/context by name (including plural/singular heuristics)
    const exactMatch = context.symbolTable.getCaseInsensitive(name);
    if (exactMatch) {
      return {
        status: 'resolved',
        type: 'model',
        model: exactMatch.name,
        confidence: 80,
        trace: [{
          source: 'VariableResolver',
          rule: `Variable name exact match to manifest model`,
          input: name,
          output: `model: ${exactMatch.name}`
        }]
      };
    }

    const capName = name.charAt(0).toUpperCase() + name.slice(1);
    const capMatch = context.symbolTable.get(capName);
    if (capMatch) {
      return {
        status: 'resolved',
        type: 'model',
        model: capName,
        confidence: 70,
        trace: [{
          source: 'VariableResolver',
          rule: `Variable name capitalized match to manifest model`,
          input: name,
          output: `model: ${capName}`
        }]
      };
    }

    // Heuristics for plural variable names (e.g. categories -> Category, products -> Product)
    let singularName = '';
    if (name.endsWith('ies')) {
      singularName = name.slice(0, -3) + 'y';
    } else if (name.endsWith('s')) {
      singularName = name.slice(0, -1);
    }

    if (singularName) {
      const singularExactMatch = context.symbolTable.getCaseInsensitive(singularName);
      if (singularExactMatch) {
        return {
          status: 'resolved',
          type: 'model',
          model: singularExactMatch.name,
          collection: true,
          confidence: 80,
          trace: [{
            source: 'VariableResolver',
            rule: `Variable name singularized exact match to manifest model`,
            input: name,
            output: `model: ${singularExactMatch.name} (collection)`
          }]
        };
      }

      const singularCapName = singularName.charAt(0).toUpperCase() + singularName.slice(1);
      const singularCapMatch = context.symbolTable.get(singularCapName);
      if (singularCapMatch) {
        return {
          status: 'resolved',
          type: 'model',
          model: singularCapName,
          collection: true,
          confidence: 70,
          trace: [{
            source: 'VariableResolver',
            rule: `Variable name singularized capitalized match to manifest model`,
            input: name,
            output: `model: ${singularCapName} (collection)`
          }]
        };
      }

      // Compound-name fallback: $reviews → singular 'Review' → find any model ending with 'Review'
      // e.g. ProductReview, OrderReview — picks first match at confidence 60
      const suffixUpper = singularCapName
      const suffixMatch = context.symbolTable.findFirst(
        (entry: { name: string }) => entry.name.endsWith(suffixUpper)
      )
      if (suffixMatch) {
        return {
          status: 'resolved',
          type: 'model',
          model: suffixMatch.name,
          collection: true,
          confidence: 60,
          trace: [{
            source: 'VariableResolver',
            rule: `Variable name compound-suffix match to manifest model`,
            input: name,
            output: `model: ${suffixMatch.name} (collection, suffix=${suffixUpper})`
          }]
        }
      }
    }


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
