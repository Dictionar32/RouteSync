/**
 * resourceRegistry.ts
 *
 * Traverses request types and recursively registers Eloquent resources and child resources,
 * collecting read mappers, form mappers, and required imports.
 *
 * @module compiler/passes/mapper/resourceRegistry
 */

import { toPascalCase } from '../../../utils/resource-naming';
import type { RequestType } from '../../artifacts/RequestTypesArtifact';
import type { ObjectProperty } from '../../types/SemanticType';
import type { MappingIntentField, ResourceMappingIntentGraph } from '../../../types/domain/mappingIntent';
import { buildReadMapperFromFields } from './readMapperBuilder';
import { buildFormMapper } from './formMapperBuilder';
import { createResourceMappingIntentGraph } from '../../../types/domain/mappingIntent';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';

export interface CollectedMapperParts {
    readonly readMapperBlocks: readonly string[];
    readonly formMapperBlocks: readonly string[];
    readonly contractImports: ReadonlySet<string>;
    readonly formTypeImports: ReadonlySet<string>;
    readonly readTypeImports: ReadonlySet<string>;
    readonly hasApiField: boolean;
}

/**
 * Traverses request types to collect read mapper blocks, form mapper blocks, and import symbols.
 */

const RESOURCE_CHILDREN: {
    readonly [K in import('../../../types/domain/mappingIntent').MappingIntent['kind']]: (
        intent: Extract<import('../../../types/domain/mappingIntent').MappingIntent, { kind: K }>,
        register: (resourceName: string, fields: readonly MappingIntentField[]) => void
    ) => void;
} = {
    direct: () => undefined,
    object: () => undefined,
    resource: (intent, register) => register(intent.resourceName.value, intent.fields),
    collection: () => undefined,
    resource_collection: (intent, register) => register(intent.resourceName.value, intent.fields)
};

export function collectMapperParts(requestTypes: readonly RequestType[]): CollectedMapperParts {
    const readMapperBlocks: string[] = [];
    const formMapperBlocks: string[] = [];
    const contractImports = new Set<string>();
    const formTypeImports = new Set<string>();
    const readTypeImports = new Set<string>();
    let hasApiField = false;

    const processedResources = new Set<string>();

    // Pre-build set of all available API response type names from requestTypes
    const availableContractTypes = new Set<string>();
    for (const requestType of requestTypes) {
        if (requestType.response.kind === 'data') {
            const resName = toPascalCase(requestType.response.value.contract.name.value);
            availableContractTypes.add(`${resName}ApiResponse`);
        }
    }

    const registerIntentGraph = (intentGraph: ResourceMappingIntentGraph, apiResponseType: string): void => {
        const resource = toPascalCase(intentGraph.resourceName.value);
        if (processedResources.has(resource)) return;
        processedResources.add(resource);

        const hasContractType = availableContractTypes.has(apiResponseType);
        if (!hasContractType) {
            throw new Error(`[MapperGeneratorPass] Missing contract type "${apiResponseType}" for resource "${resource}"`);
        }

        contractImports.add(apiResponseType);
        readTypeImports.add(`${resource}Transformed`);
        readMapperBlocks.push(buildReadMapperFromFields(intentGraph, apiResponseType));

        for (const field of intentGraph.fields) {
            RESOURCE_CHILDREN[field.intent.kind](field.intent, registerIntentGraphByName);
        }
    };

    const registerIntentGraphByName = (resourceName: string, fields: readonly MappingIntentField[]): void => {
        const resource = toPascalCase(resourceName);
        registerIntentGraph(
            Object.freeze({
                resourceName: SemanticValueFactory.resourceName(resource),
                fields
            }),
            `${resource}ApiResponse`
        );
    };

    // Helper to register an Eloquent Resource mapper (top-level or child)
    const registerResource = (resourceName: string, fields: readonly ObjectProperty[]) => {
        const resource = toPascalCase(resourceName);
        if (processedResources.has(resource)) return;
        const apiResponseType = `${resource}ApiResponse`;
        const hasContractType = availableContractTypes.has(apiResponseType);

        if (!hasContractType) {
            throw new Error(`[MapperGeneratorPass] Missing contract type "${apiResponseType}" for resource "${resource}"`);
        }

        contractImports.add(apiResponseType);
        readTypeImports.add(`${resource}Transformed`);

        const intentGraph = createResourceMappingIntentGraph(resource, fields);
        registerIntentGraph(intentGraph, apiResponseType);
    };

    for (const requestType of requestTypes) {
        if (requestType.response.kind === 'data') {
            registerResource(requestType.response.value.contract.name.value, requestType.response.value.fields);
        }

        for (const action of requestType.actions) {
            if (action.fields.length > 0) {
                hasApiField = true;
            }
            const formTypeName = requestType.formTypeName && requestType.formTypeName.endsWith('Form')
                ? requestType.formTypeName
                : toPascalCase(requestType.resourceName) + 'Form';
            formTypeImports.add(formTypeName);

            const contractTypeName = toPascalCase(requestType.resourceName) + 'Contract';
            contractImports.add(contractTypeName);

            formMapperBlocks.push(buildFormMapper(requestType, action, contractTypeName));
        }
    }

    return {
        readMapperBlocks,
        formMapperBlocks,
        contractImports,
        formTypeImports,
        readTypeImports,
        hasApiField
    };
}
