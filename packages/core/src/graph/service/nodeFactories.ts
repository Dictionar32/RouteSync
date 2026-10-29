/** Graph-domain node construction and execution-layer interpretation. */
import type {
  ServiceNode,
  ControllerNode,
  ServiceModelNode,
  ExecutionLayer,
} from '../../types/semantic';
import type { ModelDefinition } from '../../types/upstream/model';
import type { GraphModelNodeSurface } from '../../types/semantic/modelGraphTypes';
import type { ActionName } from '../../types/upstream/names';
import type { ControllerNodeName, ServiceNodeName } from '../../types/semantic/nominalVocabulary';
import { createConfidenceScore } from '../../types/semantic/nominalVocabulary';
import { EXECUTION_LAYER_KNOWLEDGE } from '../../types/semantic/semanticKnowledge';

export interface GraphNodeFactoryOperationsInterface {
  readonly detectExecutionLayer: (filePath: string, sourceText: string) => ExecutionLayer;
  readonly buildServiceNode: (name: ServiceNodeName, methods: readonly ActionName[]) => ServiceNode;
  readonly buildControllerNode: (name: ControllerNodeName, actions: readonly ActionName[]) => ControllerNode;
  readonly buildModelNode: (model: GraphModelNodeSurface) => ServiceModelNode;
}

const detectExecutionLayerValue = (filePath: string, _sourceText: string): ExecutionLayer =>
  EXECUTION_LAYER_KNOWLEDGE.find(rule =>
    rule.pathFragments.some(fragment => filePath.includes(fragment)) ||
    rule.fileSuffixes.some(suffix => filePath.endsWith(suffix)),
  )?.layer ?? 'repository';

const buildServiceNodeValue = (name: ServiceNodeName, methods: readonly ActionName[]): ServiceNode => ({
  kind: 'service_node',
  name,
  methods: methods.map(method => ({ name: method })),
  layer: 'service',
  confidence: createConfidenceScore(1),
});

const buildControllerNodeValue = (name: ControllerNodeName, actions: readonly ActionName[]): ControllerNode => ({
  kind: 'controller_node',
  name,
  actions: actions.map(action => ({ name: action })),
  layer: 'controller',
  confidence: createConfidenceScore(1),
});

const buildModelNodeValue = (model: GraphModelNodeSurface): ServiceModelNode => ({
  kind: 'model_node',
  model,
  layer: 'model',
});

/** Single runtime authority for graph-node construction; consumers use its interface. */
export const graphNodeFactoryOperations: GraphNodeFactoryOperationsInterface = Object.freeze({
  detectExecutionLayer: detectExecutionLayerValue,
  buildServiceNode: buildServiceNodeValue,
  buildControllerNode: buildControllerNodeValue,
  buildModelNode: buildModelNodeValue,
});
