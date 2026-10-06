/**
 * Declarative graph-node construction and execution-layer inference.
 *
 * Knowledge is represented as data; selection is performed by the relation
 * algebra rather than host-language collection control flow.
 */
import type {
  ServiceNode,
  ControllerNode,
  ServiceModelNode,
  ExecutionLayer
} from '../../types/semantic';
import type { ModelDefinition } from '../../types/upstream/model';
import type { GraphModelNodeSurface } from '../../types/semantic/modelGraphTypes';
import type { ActionName } from '../../types/upstream/names';
import type { ControllerNodeName, ServiceNodeName } from '../../types/semantic/nominalVocabulary';
import { createConfidenceScore } from '../../types/semantic/nominalVocabulary';
import { EXECUTION_LAYER_KNOWLEDGE } from '../../types/semantic/semanticKnowledge';
import { relationAny, relationAnyMatch, relationFirstOption, relationOptionFold, relationProject } from '../../semantic/foundation/relationalSequence';

export const EXECUTION_LAYER_RULES = EXECUTION_LAYER_KNOWLEDGE;

const ruleMatches = (filePath: string, rule: typeof EXECUTION_LAYER_RULES[number]): boolean =>
  relationAny([
    relationAnyMatch(rule.pathFragments, fragment => filePath.includes(fragment)),
    relationAnyMatch(rule.fileSuffixes, suffix => filePath.endsWith(suffix)),
  ]);

export function detectExecutionLayer(filePath: string, _code: string): ExecutionLayer {
  return relationOptionFold(
    relationFirstOption(EXECUTION_LAYER_RULES, candidate => ruleMatches(filePath, candidate)),
    () => 'repository' as const,
    rule => rule.layer,
  );
}

export function buildServiceNode(
  name: ServiceNodeName,
  methods: ActionName[],
): ServiceNode {
  return {
    kind: 'service_node',
    name,
    methods: relationProject(methods, method => ({ name: method })),
    layer: 'service',
    confidence: createConfidenceScore(1),
  };
}

export function buildControllerNode(name: ControllerNodeName, actions: ActionName[]): ControllerNode {
  return {
    kind: 'controller_node',
    name,
    actions: relationProject(actions, action => ({ name: action })),
    layer: 'controller',
    confidence: createConfidenceScore(1),
  };
}

export function buildModelNode(model: GraphModelNodeSurface): ServiceModelNode {
  return {
    kind: 'model_node',
    model,
    layer: 'model',
  };
}
