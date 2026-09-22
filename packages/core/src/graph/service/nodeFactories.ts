/**
 * nodeFactories.ts
 *
 * Factories for building ServiceNode, ControllerNode, and service-graph model nodes,
 * and layer detection heuristics.
 *
 * @module core/graph/service
 */

import type {
  ServiceNode,
  ControllerNode,
  ServiceModelNode,
  ExecutionLayer
} from '../../types/semantic';
import type { ModelSemanticDefinition } from '../../types/upstream/model';
import type { ActionName } from '../../types/upstream/names';
import type { ServiceMethod, ServiceDependencyFacts, ResolvedServiceDependencies } from '../../types/upstream/service';
import type { ControllerNodeName, ServiceNodeName } from '../../types/semantic/nominalVocabulary';
import { createConfidenceScore } from '../../types/semantic/nominalVocabulary';

/**
 * Detects the execution layer based on file path and code heuristics.
 */
export function detectExecutionLayer(filePath: string, code: string): ExecutionLayer {
  if (filePath.includes('Controller.php') || filePath.match(/Controller\.php$/)) {
    return 'controller';
  }
  if (filePath.includes('Service.php') || filePath.match(/Service\.php$/)) {
    return 'service';
  }
  if (filePath.includes('Models/') || filePath.match(/Model\.php$/)) {
    return 'model';
  }
  return 'repository';
}

export function buildServiceNode(name: ServiceNodeName, methods: ServiceMethod[], dependencies: ServiceDependency[] = [], dependencyFacts: ServiceDependencyFacts, resolvedDependencies: ResolvedServiceDependencies): ServiceNode {
  return {
    kind: 'service_node',
    name,
    methods,
    layer: 'service',
    dependencies,
    dependencyFacts,
    resolvedDependencies,
    confidence: createConfidenceScore(1)
  };
}

export function buildControllerNode(name: ControllerNodeName, routes: string[], actions: ActionName[]): ControllerNode {
  return {
    kind: 'controller_node',
    name,
    routes,
    actions: actions.map(a => ({ name: a })),
    layer: 'controller',
    calls: [],
    confidence: createConfidenceScore(1)
  };
}

export function buildModelNode(model: ModelSemanticDefinition): ServiceModelNode {
  return {
    kind: 'model_node',
    model,
    layer: 'model'
  };
}
