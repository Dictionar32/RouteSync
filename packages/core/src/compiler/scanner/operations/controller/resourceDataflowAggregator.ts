/** Aggregates explicit controller resource bindings as relation evidence. */
import type { ControllerActionInfo } from '../domain-model/requestDescriptors';
import type { ControllerResourceBinding } from '../../../semantic/controllerDataflowContract';
import type { ResourceName } from '../../../../types/domain/semanticValues';
import { relationEqual } from '../../../../semantic/relations/semanticRelations';
import { relationFirst, relationExpand, relationProject } from '../../../../semantic/relations/relationalSequence';
import type { RelationOption } from '../../../../semantic/relations/relationalSequence';
import type { RelationIndex } from '../../../../semantic/relations/relationMembership';

export interface ControllerResourceDataflow {
    readonly bindings: readonly ControllerResourceBinding[];
}

function findControllerResourceBindingImplementation(
    dataflow: ControllerResourceDataflow,
    resourceName: ResourceName
): RelationOption<ControllerResourceBinding> {
    return relationFirst(
        dataflow.bindings,
        binding => relationEqual(binding.resourceName.value.value, resourceName.value.value),
    );
}

function extractResourceDataflowImplementation(
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


export interface ResourceDataflowAggregatorOperationsInterface {
  readonly findControllerResourceBinding: typeof findControllerResourceBindingImplementation;
  readonly extractResourceDataflow: typeof extractResourceDataflowImplementation;
}

export const resourceDataflowAggregatorOperations: ResourceDataflowAggregatorOperationsInterface = Object.freeze({
    findControllerResourceBinding: findControllerResourceBindingImplementation,
    extractResourceDataflow: extractResourceDataflowImplementation,
});
