/**
 * Declarative Resource -> Model knowledge closure.
 *
 * Relations are facts; propagation is a monotone transfer over those facts.
 * The fixed-point driver owns iteration, while semantic meaning remains in
 * relation predicates and derived resolution facts.
 */

import type { ModelSymbolTable } from "../../symbols/ModelSymbolTable";
import { findControllerResourceBinding } from "../controller/resourceDataflowAggregator";
import { matchLookup } from "../../../../types/upstream/collections";
import type { ResourceName } from "../../../../types/upstream/names";
import { type Presence, fromOptional, presenceFold } from "../../../../types/upstream/presence";
import {
    createResourceModelResolutionFact,
    createResourceRelationFact,
    resourceModelResolutionFor,
    type ResourceModelKnowledgeDataFlow,
    type ResourceModelResolutionFact,
    type ResourceRelationKnowledgeFact,
} from "./resourceModelKnowledgeDataFlow";
import { relationEqual } from "../../../../semantic/kernel/semanticRelations";
import { relationFirst, relationOptionFold, relationProject, relationFold, relationLatticeFixedPoint } from "../../../../semantic/kernel/relationalSequence";

export type ResourceRelationEdge = ResourceRelationKnowledgeFact;

function modelForResolution(
    fact: ResourceModelResolutionFact,
    modelSymbolTable: ModelSymbolTable,
): Presence<ReturnType<ModelSymbolTable['get']>> {
    return matchLookup(modelSymbolTable.get(fact.model), {
        missing: () => ({ kind: 'absent' }),
        found: ({ value }) => ({ kind: 'present', value }),
    });
}

export function resolveInitialModel(
    resourceName: ResourceName,
    modelSymbolTable: ModelSymbolTable,
    controllerDataflowMap?: import("../controller/resourceDataflowAggregator").ControllerResourceDataflow,
): Presence<ResourceModelResolutionFact> {
    return presenceFold(
        fromOptional(controllerDataflowMap),
        () => presenceFold(
            matchLookup(modelSymbolTable.findForResource(resourceName), {
                missing: () => ({ kind: 'absent' }),
                found: ({ value }) => ({ kind: 'present', value }),
            }),
            () => ({ kind: 'absent' }),
            value => ({ kind: 'present', value: createResourceModelResolutionFact(resourceName, value.identity.name, 'convention') })
        ),
        dataflow => relationOptionFold(
            findControllerResourceBinding(dataflow, resourceName),
            () => presenceFold(
                matchLookup(modelSymbolTable.findForResource(resourceName), {
                    missing: () => ({ kind: 'absent' }),
                    found: ({ value }) => ({ kind: 'present', value }),
                }),
                () => ({ kind: 'absent' }),
                value => ({ kind: 'present', value: createResourceModelResolutionFact(resourceName, value.identity.name, 'convention') })
            ),
            binding => presenceFold(
                matchLookup(
                    relationGate(
                        relationEqual(binding.model.kind, 'table'),
                        () => modelSymbolTable.findByTableName(binding.model.name),
                        () => modelSymbolTable.get(binding.model.name),
                    ),
                    {
                        missing: () => ({ kind: 'absent' }),
                        found: ({ value }) => ({ kind: 'present', value }),
                    },
                ),
                () => ({ kind: 'absent' }),
                value => ({ kind: 'present', value: createResourceModelResolutionFact(resourceName, value.identity.name, 'controller_dataflow') }),
            ),
        ),
    );
}

export function propagateRelationEdges(
    relationEdges: readonly ResourceRelationEdge[],
    initialResolutions: readonly ResourceModelResolutionFact[],
    modelSymbolTable: ModelSymbolTable,
    maxIterations = 5,
): ResourceModelKnowledgeDataFlow {
    const relations = Object.freeze(relationProject(
        relationEdges,
        edge => createResourceRelationFact(edge.parentResource, edge.childResource, edge.relationKey),
    ));
    type State = Readonly<{ readonly resolutions: readonly ResourceModelResolutionFact[] }>;
    const seed: State = Object.freeze({ resolutions: Object.freeze([...initialResolutions]) });
    const transfer = (state: State): State => Object.freeze({
        resolutions: relationFold(
            relationEdges,
            state.resolutions,
            (accumulator, edge) => {
                const dataflow: ResourceModelKnowledgeDataFlow = { kind: 'resource_model_knowledge_data_flow', relations, resolutions: accumulator };
                const parent = resourceModelResolutionFor(dataflow, edge.parentResource);
                const child = resourceModelResolutionFor(dataflow, edge.childResource);
                return presenceFold(parent, () => accumulator, parentResolution =>
                    presenceFold(child, () => accumulator, () => {
                        const parentSymbol = modelForResolution(parentResolution, modelSymbolTable);
                        return presenceFold(parentSymbol, () => accumulator, symbol => {
                            const relation = matchLookup(symbol.relation(edge.relationKey), {
                                missing: () => ({ kind: 'absent' }),
                                found: ({ value }) => ({ kind: 'present', value }),
                            });
                            return presenceFold(relation, () => accumulator, rel => {
                                const childSymbol = matchLookup(modelSymbolTable.get(rel.targetModel), {
                                    missing: () => ({ kind: 'absent' }),
                                    found: ({ value }) => ({ kind: 'present', value }),
                                });
                                return presenceFold(childSymbol, () => accumulator, () => [
                                    ...accumulator,
                                    createResourceModelResolutionFact(edge.childResource, rel.targetModel, 'relation_propagation', edge.relationKey),
                                ]);
                            });
                        });
                    }),
                );
            },
        ),
    });
    const lattice = {
        bottom: seed,
        join: (left: State, right: State): State => Object.freeze({ resolutions: relationGate(right.resolutions.length >= left.resolutions.length, () => right.resolutions, () => left.resolutions) }),
        equal: (left: State, right: State): boolean => relationEqual(left.resolutions.length, right.resolutions.length),
    };
    const closure = relationLatticeFixedPoint(lattice, seed, transfer, maxIterations);
    return Object.freeze({ kind: 'resource_model_knowledge_data_flow', relations, resolutions: Object.freeze(closure.value.resolutions) });
}
