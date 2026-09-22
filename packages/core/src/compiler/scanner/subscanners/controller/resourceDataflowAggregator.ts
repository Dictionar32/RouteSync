/** Aggregates explicit controller resource bindings without collapsing them to strings. */
import type { ControllerActionInfo } from '../../descriptors/requestDescriptors';
import type { ControllerResourceBinding } from './controllerDataflowContract';
import type { ResourceName } from '../../../../types/domain/semanticValues';

export interface ControllerResourceDataflow {
    readonly bindings: readonly ControllerResourceBinding[];
}

export function findControllerResourceBinding(
    dataflow: ControllerResourceDataflow,
    resourceName: ResourceName
): ControllerResourceBinding | undefined {
    return dataflow.bindings.find(binding => binding.resourceName.value.value === resourceName.value.value);
}

export function extractResourceDataflow(
    controllerMap: ReadonlyMap<string, ReadonlyMap<string, ControllerActionInfo>>
): ControllerResourceDataflow {
    const bindings: ControllerResourceBinding[] = [];
    for (const actionMap of controllerMap.values()) {
        for (const action of actionMap.values()) {
            bindings.push(...action.dataflow.resourceBindings);
        }
    }
    return Object.freeze({ bindings: Object.freeze(bindings) });
}
