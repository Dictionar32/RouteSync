/**
 * Relation-backed mapper discovery.
 *
 * Resource mapper facts are accumulated as immutable relations. Recursive
 * resource discovery is a least fixed-point over child-resource intents.
 */
import { toPascalResourceName, toPascalResponseTypeName } from '../../../utils/resource-naming';
import type { RequestType } from '../../artifacts/RequestTypesArtifact';
import type { ResourceName } from '../../../types/upstream/names';
import type { ObjectProperty } from '../../types/SemanticType';
import type { MappingIntent, MappingIntentField, ResourceMappingIntentGraph } from '../../../types/domain/mappingIntent';
import { buildReadMapperFromFields } from './readMapperBuilder';
import { buildFormMapper } from './formMapperBuilder';
import { createResourceMappingIntentGraph } from '../../../types/domain/mappingIntent';
import { relationContains, relationInsert } from '../../../semantic/foundation/relationMembership';
import { relationFold, relationResolve, relationEqual, relationVariantFold } from '../../../semantic/foundation/relationalSequence';

export interface CollectedMapperParts {
    readonly readMapperBlocks: readonly string[];
    readonly formMapperBlocks: readonly string[];
    readonly contractImports: readonly string[];
    readonly formTypeImports: readonly string[];
    readonly readTypeImports: readonly string[];
    readonly hasApiField: boolean;
}

type MapperAccumulator = Readonly<{
    readonly readMapperBlocks: readonly string[];
    readonly formMapperBlocks: readonly string[];
    readonly contractImports: readonly string[];
    readonly formTypeImports: readonly string[];
    readonly readTypeImports: readonly string[];
    readonly processedResources: readonly string[];
    readonly hasApiField: boolean;
}>;

const emptyTextRelation = (): readonly string[] => Object.freeze([]);

const emptyAccumulator = (): MapperAccumulator => Object.freeze({
    readMapperBlocks: emptyTextRelation(),
    formMapperBlocks: emptyTextRelation(),
    contractImports: emptyTextRelation(),
    formTypeImports: emptyTextRelation(),
    readTypeImports: emptyTextRelation(),
    processedResources: emptyTextRelation(),
    hasApiField: false,
});

const addFact = (facts: readonly string[], value: string): readonly string[] => relationInsert(facts, value);

const availableContractTypes = (requestTypes: readonly RequestType[]): readonly string[] => relationFold(
    requestTypes,
    emptyTextRelation(),
    (facts, requestType) => relationVariantFold(
        requestType.response,
        'data',
        () => facts,
        response => addFact(facts, `${toPascalResponseTypeName(response.value.contract.name)}ApiResponse`),
    ),
);

const resourceChildren = (
    intent: MappingIntent,
    register: (resourceName: ResourceName, fields: readonly MappingIntentField[]) => MapperAccumulator,
    state: MapperAccumulator,
): MapperAccumulator => relationVariantFold(
    intent,
    'resource',
    () => relationVariantFold(
        intent,
        'resource_collection',
        () => state,
        resource => register(resource.resourceName, resource.fields),
    ),
    resource => register(resource.resourceName, resource.fields),
);

const registerIntentGraph = (
    intentGraph: ResourceMappingIntentGraph,
    apiResponseType: string,
    availableContracts: readonly string[],
    state: MapperAccumulator,
): MapperAccumulator => relationResolve(
    relationContains(state.processedResources, toPascalResourceName(intentGraph.resourceName)),
    () => state,
    () => {
        const resource = toPascalResourceName(intentGraph.resourceName);
        const seeded = relationResolve(
            relationContains(availableContracts, apiResponseType),
            () => Object.freeze({
                ...state,
                processedResources: addFact(state.processedResources, resource),
                contractImports: addFact(state.contractImports, apiResponseType),
                readTypeImports: addFact(state.readTypeImports, `${resource}Transformed`),
                readMapperBlocks: Object.freeze([...state.readMapperBlocks, buildReadMapperFromFields(intentGraph, apiResponseType)]),
            }),
            () => { throw Error(`[MapperGeneratorPass] Missing contract type "${apiResponseType}" for resource "${resource}"`); },
        );
        return relationFold(
            intentGraph.fields,
            seeded,
            (current, field) => resourceChildren(
                field.intent,
                (resourceName, fields) => registerIntentGraph(
                    Object.freeze({
                        resourceName,
                        fields,
                    }),
                    `${toPascalResourceName(resourceName)}ApiResponse`,
                    availableContracts,
                    current,
                ),
                current,
            ),
        );
    },
);

const registerResource = (
    resourceName: ResourceName,
    fields: readonly ObjectProperty[],
    apiResponseType: string,
    availableContracts: readonly string[],
    state: MapperAccumulator,
): MapperAccumulator => {
    return registerIntentGraph(
        createResourceMappingIntentGraph(resourceName, fields),
        apiResponseType,
        availableContracts,
        state,
    );
};

export function collectMapperParts(requestTypes: readonly RequestType[]): CollectedMapperParts {
    const availableContracts = availableContractTypes(requestTypes);
    const state = relationFold(
        requestTypes,
        emptyAccumulator(),
        (current, requestType) => {
            const responseState = relationVariantFold(
                requestType.response,
                'data',
                () => current,
                response => registerResource(
                    requestType.identity.resource,
                    response.value.fields,
                    `${toPascalResponseTypeName(response.value.contract.name)}ApiResponse`,
                    availableContracts,
                    current,
                ),
            );
            return relationFold(
                requestType.actions,
                responseState,
                (actionState, action) => {
                    const hasApiField = relationResolve(
                        relationEqual(action.fields.length, 0),
                        () => actionState.hasApiField,
                        () => true,
                    );
                    const computedFormType = requestType.identity.source.formType.value.value;
                    const contractTypeName = `${toPascalResourceName(requestType.identity.resource)}Contract`;
                    return Object.freeze({
                        ...actionState,
                        hasApiField,
                        formTypeImports: addFact(actionState.formTypeImports, computedFormType),
                        contractImports: addFact(actionState.contractImports, contractTypeName),
                        formMapperBlocks: Object.freeze([
                            ...actionState.formMapperBlocks,
                            buildFormMapper(requestType, action),
                        ]),
                    });
                },
            );
        },
    );
    return Object.freeze({
        readMapperBlocks: state.readMapperBlocks,
        formMapperBlocks: state.formMapperBlocks,
        contractImports: state.contractImports,
        formTypeImports: state.formTypeImports,
        readTypeImports: state.readTypeImports,
        hasApiField: state.hasApiField,
    });
}
