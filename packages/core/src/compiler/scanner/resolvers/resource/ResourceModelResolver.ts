/**
 * Declarative Resource -> Model semantic resolver.
 *
 * Resolution is a prioritized relation fold: controller evidence, propagated
 * knowledge, convention evidence, structural evidence, then an explicit DTO
 * terminal. Host-language absence is normalized into Presence/Lookup witnesses.
 */

import type { ResourceName } from "../../../../types/upstream/names";
import type { ModelSymbolTable } from "../../symbols/ModelSymbolTable";
import {
    type ResourceModelBinding,
    ResourceModelBindingFactory
} from "../../symbols/resource/resourceBindingTypes";
import { matchStructuralFields } from "./structuralFieldMatcher";
import { findControllerResourceBinding } from "../../subscanners/controller/resourceDataflowAggregator";
import { matchLookup, type Lookup } from "../../../../types/upstream/collections";
import { fromOptional, type Presence, presenceFold } from "../../../../types/upstream/presence";
import type { OriginModelSymbol } from "../../symbols/model/originModelSymbol";
import type { ResourceModelKnowledgeDataFlow } from "../../subscanners/resource/resourceModelKnowledgeDataFlow";
import { relationAll, relationEqual, relationGate } from "../../../../semantic/kernel/semanticRelations";
import { relationFirst, relationOptionFold } from "../../../../semantic/kernel/relationalSequence";

export interface ResourceModelResolutionInput {
    readonly resourceName: ResourceName;
    readonly fieldNames: readonly string[];
    readonly modelSymbolTable: ModelSymbolTable;
    readonly controllerDataflowMap?: import("../../subscanners/controller/resourceDataflowAggregator").ControllerResourceDataflow;
    readonly knowledgeDataFlow?: ResourceModelKnowledgeDataFlow;
}


const bind = (
        lookup: Lookup<OriginModelSymbol>,
        source: Parameters<typeof ResourceModelBindingFactory.mono>[1]
    ): Presence<ResourceModelBinding> => {
        return matchLookup(lookup, {
            missing: () => ({ kind: 'absent' }),
            found: ({ value }) => ({ kind: 'present', value: ResourceModelBindingFactory.mono(value, source) })
        });
    };

const controllerCandidate = (input: ResourceModelResolutionInput): Presence<ResourceModelBinding> => {
        const dataflow = fromOptional(input.controllerDataflowMap);
        return presenceFold(
            dataflow,
            () => ({ kind: 'absent' }),
            value => relationOptionFold(
                findControllerResourceBinding(value, input.resourceName),
                () => ({ kind: 'absent' }),
                binding => bind(
                    relationGate(
                        relationEqual(binding.model.kind, 'table'),
                        () => input.modelSymbolTable.findByTableName(binding.model.name),
                        () => input.modelSymbolTable.get(binding.model.name)
                    ),
                    'controller_dataflow'
                )
            )
        );
    };

const propagatedCandidate = (input: ResourceModelResolutionInput): Presence<ResourceModelBinding> => {
        const knowledge = fromOptional(input.knowledgeDataFlow);
        return presenceFold(
            knowledge,
            () => ({ kind: 'absent' }),
            value => {
                const fact = relationFirst(
                    value.resolutions,
                    candidate => relationAll([
                        relationEqual(candidate.resource.value.value, input.resourceName.value.value),
                        relationEqual(candidate.origin, 'relation_propagation')
                    ])
                );
                return relationOptionFold(
                    fact,
                    () => ({ kind: 'absent' }),
                    candidate => bind(
                        input.modelSymbolTable.get(candidate.model),
                        'relation_propagation'
                    )
                );
            }
        );
    };

const conventionCandidate = (input: ResourceModelResolutionInput): Presence<ResourceModelBinding> => {
        return bind(
            input.modelSymbolTable.findForResource(input.resourceName),
            'convention'
        );
    };

const structuralCandidate = (input: ResourceModelResolutionInput): Presence<ResourceModelBinding> => {
        const candidate = relationOptionFold(
            relationFirst([input.fieldNames], fields => fields.length > 0),
            () => ({ kind: 'absent' }),
            fields => matchStructuralFields(fields, input.modelSymbolTable)
        );
        return presenceFold(
            candidate,
            () => ({ kind: 'absent' }),
            value => ({ kind: 'present', value: ResourceModelBindingFactory.mono(value, 'structural') })
        );
    };

/** Resolves the backing Eloquent Model through a declarative priority relation. */
const resolveResourceModel = (input: ResourceModelResolutionInput): ResourceModelBinding => {
        const candidates = [
            controllerCandidate(input),
            propagatedCandidate(input),
            conventionCandidate(input),
            structuralCandidate(input),
        ];

        const first = relationOptionFold(
            relationFirst(candidates, candidate => relationEqual(candidate.kind, 'present')),
            () => ResourceModelBindingFactory.unbackedDto(
                `Resource '${input.resourceName}' is a DTO without a matching Eloquent model.`
            ),
            candidate => candidate.value
        );
        return first;
}

export const ResourceModelResolver = Object.freeze({ resolve: resolveResourceModel });

