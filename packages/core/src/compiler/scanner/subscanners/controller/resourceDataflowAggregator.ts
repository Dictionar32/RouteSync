/** Aggregates explicit controller resource bindings as relation evidence. */
import type { ControllerActionInfo } from '../../descriptors/requestDescriptors';
import type { ControllerResourceBinding } from './controllerDataflowContract';
import type { ResourceName } from '../../../../types/domain/semanticValues';
import { relationEqual } from '../../../../semantic/kernel/semanticRelations';
import { relationFirst, relationExpand, relationProject } from '../../../../semantic/kernel/relationalSequence';
import type { RelationOption } from '../../../../semantic/kernel/relationalSequence';
import type { RelationIndex } from '../../../../semantic/kernel/relationMembership';

export interface ControllerResourceDataflow {
    readonly bindings: readonly ControllerResourceBinding[];
}

export function findControllerResourceBinding(
    dataflow: ControllerResourceDataflow,
    resourceName: ResourceName
): RelationOption<ControllerResourceBinding> {
    return relationFirst(
        dataflow.bindings,
        binding => relationEqual(binding.resourceName.value.value, resourceName.value.value),
    );
}

export function extractResourceDataflow(
    controllerIndex: RelationIndex<string, RelationIndex<string, ControllerActionInfo>>
): ControllerResourceDataflow {
    const bindings = relationExpand(
        relationProject(controllerIndex, ([, actions]) => actions),
        actionIndex => relationExpand(
            relationProject(actionIndex, ([, action]) => action),
            action => action.dataflow.resourceBindings,
        ),
    );
    return Object.freeze({ bindings: Object.freeze(bindings) });
}
