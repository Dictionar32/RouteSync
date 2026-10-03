/**
 * Relation-backed mapper discovery.
 *
 * Resource mapper facts are accumulated as immutable relations. Recursive
 * resource discovery is a least fixed-point over child-resource intents.
 */
import { toPascalCase } from '../../../utils/resource-naming';
import type { RequestType } from '../../artifacts/RequestTypesArtifact';
import type { ObjectProperty } from '../../types/SemanticType';
import type { MappingIntent, MappingIntentField, ResourceMappingIntentGraph } from '../../../types/domain/mappingIntent';
import { buildReadMapperFromFields } from './readMapperBuilder';
import { buildFormMapper } from './formMapperBuilder';
import { createResourceMappingIntentGraph } from '../../../types/domain/mappingIntent';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import { relationContains, relationInsert } from '../../../semantic/kernel/relationMembership';
import { relationFold, relationResolve, relationEqual } from '../../../semantic/kernel/relationalSequence';

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

const emptyAccumulator = (): MapperAccumulator => Object.freeze({
    readMapperBlocks: Object.freeze([]),
    formMapperBlocks: Object.freeze([]),
    contractImports: Object.freeze([]),
    formTypeImports: Object.freeze([]),
    readTypeImports: Object.freeze([]),
    processedResources: Object.freeze([]),
    hasApiField: false,
});

const addFact = (facts: readonly string[], value: string): readonly string[] => relationInsert(facts, value);

const availableContractTypes = (requestTypes: readonly RequestType[]): readonly string[] => relationFold(
    requestTypes,
    Object.freeze([]),
    (facts, requestType) => relationResolve(
        relationEqual(requestType.response.kind, 'data'),
        () => addFact(facts, `${toPascalCase(requestType.response.value.contract.name.value)}ApiResponse`),
        () => facts,
    ),
);

const resourceChildren = (
    intent: MappingIntent,
    register: (resourceName: string, fields: readonly MappingIntentField[]) => MapperAccumulator,
    state: MapperAccumulator,
): MapperAccumulator => relationResolve(
    relationEqual(intent.kind, 'resource'),
    () => register(intent.resourceName.value, intent.fields),
    () => relationResolve(
        relationEqual(intent.kind, 'resource_collection'),
        () => register(intent.resourceName.value, intent.fields),
        () => state,
    ),
);

const registerIntentGraph = (
    intentGraph: ResourceMappingIntentGraph,
    apiResponseType: string,
    availableContracts: readonly string[],
    state: MapperAccumulator,
): MapperAccumulator => relationResolve(
    relationContains(state.processedResources, toPascalCase(intentGraph.resourceName.value)),
    () => state,
    () => {
        const resource = toPascalCase(intentGraph.resourceName.value);
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
                        resourceName: SemanticValueFactory.resourceName(toPascalCase(resourceName)),
                        fields,
                    }),
                    `${toPascalCase(resourceName)}ApiResponse`,
                    availableContracts,
                    current,
                ),
                current,
            ),
        );
    },
);

const registerResource = (
    resourceName: string,
    fields: readonly ObjectProperty[],
    availableContracts: readonly string[],
    state: MapperAccumulator,
): MapperAccumulator => {
    const resource = toPascalCase(resourceName);
    const apiResponseType = `${resource}ApiResponse`;
    return registerIntentGraph(
        createResourceMappingIntentGraph(resource, fields),
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
            const responseState = relationResolve(
                relationEqual(requestType.response.kind, 'data'),
                () => registerResource(
                    requestType.response.value.contract.name.value,
                    requestType.response.value.fields,
                    availableContracts,
                    current,
                ),
                () => current,
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
                    const computedFormType = relationResolve(
                        relationEqual(requestType.formTypeName?.endsWith('Form'), true),
                        () => requestType.formTypeName as string,
                        () => `${toPascalCase(requestType.resourceName)}Form`,
                    );
                    const contractTypeName = `${toPascalCase(requestType.resourceName)}Contract`;
                    return Object.freeze({
                        ...actionState,
                        hasApiField,
                        formTypeImports: addFact(actionState.formTypeImports, computedFormType),
                        contractImports: addFact(actionState.contractImports, contractTypeName),
                        formMapperBlocks: Object.freeze([
                            ...actionState.formMapperBlocks,
                            buildFormMapper(requestType, action, contractTypeName),
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
