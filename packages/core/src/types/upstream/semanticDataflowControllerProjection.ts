/**
 * Projects proven controller/model/resource/response bindings into the canonical
 * semantic dataflow seed algebra.
 *
 * This module is intentionally a seed projection only. It does not solve,
 * close, or derive dataflow. The sole authority remains
 * createSemanticDataflowJudgment() in semanticDataflowAuthority.ts.
 */
import type { ControllerActionFlowContract } from './highLevelContracts';
import type { ControllerParameter, ControllerResourceBinding } from './controller';
import { semanticDataflowFactWithLineage, type SemanticDataflowInputFact, type SemanticDataflowIdentity } from './semanticDataflow';
import { stringValue } from './valueObjects';
import { relationVariantFold, relationExpand, type Sequence } from '../../semantic/foundation/relationalSequence';

const controllerName = (controller: ControllerActionFlowContract): string => controller.controller.value.value;
const actionName = (controller: ControllerActionFlowContract): string => controller.action.value.value;

const identity = (
  source: import('./provenance').SourceSpan,
  role: SemanticDataflowIdentity['role'],
  slot: string,
): SemanticDataflowIdentity => Object.freeze({
  kind: 'semantic_dataflow_identity',
  source,
  role,
  slot: stringValue(slot),
});

const parameters = (controller: ControllerActionFlowContract): readonly ControllerParameter[] => {
  const values: ControllerParameter[] = [];
  let current = controller.parameters;
  while (current.kind !== 'empty') {
    values.push(current.head);
    current = current.tail;
  }
  return Object.freeze(values);
};

const modelName = (parameter: ControllerParameter): string | undefined =>
  parameter.kind.kind === 'model' ? parameter.kind.model.value.value : undefined;

const bindingModelName = (binding: ControllerResourceBinding): string | undefined =>
  relationVariantFold(
    binding.model,
    'model_class',
    () => undefined,
    model => model.name.value.value,
  );

const modelParameter = (
  controller: ControllerActionFlowContract,
  binding: ControllerResourceBinding,
): ControllerParameter | undefined => {
  const expected = bindingModelName(binding);
  if (!expected) return undefined;
  return parameters(controller).find(parameter => modelName(parameter) === expected);
};

const modelIdentity = (
  controller: ControllerActionFlowContract,
  parameter: ControllerParameter,
): SemanticDataflowIdentity => identity(
  parameter.source,
  'binding',
  `controller:${controllerName(controller)}.${actionName(controller)}:model:${parameter.variable.value.value}`,
);

const resourceIdentity = (
  controller: ControllerActionFlowContract,
  binding: ControllerResourceBinding,
): SemanticDataflowIdentity => identity(
  binding.source,
  'resource-access',
  `controller:${controllerName(controller)}.${actionName(controller)}:resource:${binding.resource.name.value.value}:model`,
);

const parametersSequence = (bindings: Sequence<ControllerResourceBinding>): readonly ControllerResourceBinding[] => {
  const values: ControllerResourceBinding[] = [];
  let current = bindings;
  while (current.kind !== 'empty') {
    values.push(current.head);
    current = current.tail;
  }
  return Object.freeze(values);
};

const responseIdentity = (
  controller: ControllerActionFlowContract,
  binding: ControllerResourceBinding,
): SemanticDataflowIdentity => identity(
  binding.source,
  'emission',
  `controller:${controllerName(controller)}.${actionName(controller)}:response:${binding.response.name.value.value}`,
);

/**
 * Produces only source-proven controller semantic value-flow seeds:
 * controller model parameter -> resource model -> response resource.
 *
 * Scalar route/request parameters are deliberately not guessed here. Their
 * actual expression-level use is already supplied by scanner dataflow facts;
 * route-to-controller binding is supplied by semanticDataflowRouteProjection.
 */
export const semanticDataflowControllerFacts = (
  controller: ControllerActionFlowContract,
): readonly SemanticDataflowInputFact[] => Object.freeze(
  relationExpand(parametersSequence(controller.semantic.resources), binding => {
    const parameter = modelParameter(controller, binding);
    if (!parameter) return [];
    const model = modelIdentity(controller, parameter);
    const resource = resourceIdentity(controller, binding);
    const response = responseIdentity(controller, binding);
    return Object.freeze([
      semanticDataflowFactWithLineage(
        Object.freeze({ kind: 'value_flow' as const, source: model, target: resource, role: 'binding' as const }),
        'resource',
        resource,
      ),
      semanticDataflowFactWithLineage(
        Object.freeze({ kind: 'value_flow' as const, source: resource, target: response, role: 'emitted_value' as const }),
        'resource',
        resource,
      ),
    ]);
  }),
);
