/**
 * resourceRegistry.ts
 *
 * Traverses request types and recursively registers Eloquent resources and child resources,
 * collecting read mappers, form mappers, and required imports.
 *
 * @module compiler/passes/mapper/resourceRegistry
 */

import { toPascalCase } from '../../../utils/resource-naming';
import {
    ObjectType,
    ReadonlyCollectionType,
    MutableCollectionType,
    type SemanticType,
    type ObjectProperty
} from '../../types/SemanticType';
import type { RequestType } from '../../artifacts/RequestTypesArtifact';
import { buildReadMapperFromFields } from './readMapperBuilder';
import { buildFormMapper } from './formMapperBuilder';

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
        if (requestType.responseData) {
            const resName = toPascalCase(requestType.responseData.resourceName);
            availableContractTypes.add(`${resName}ApiResponse`);
        }
    }

    // Helper to register an Eloquent Resource mapper (top-level or child)
    const registerResource = (resourceName: string, fields: Record<string, SemanticType>) => {
        const resource = toPascalCase(resourceName);
        if (processedResources.has(resource)) return;
        processedResources.add(resource);

        const isEloquentResource = resource.endsWith('Resource');
        const apiResponseType = `${resource}ApiResponse`;
        const hasContractType = availableContractTypes.has(apiResponseType);

        if (!hasContractType) {
            throw new Error(`[MapperGeneratorPass] Missing contract type "${apiResponseType}" for resource "${resource}"`);
        }

        contractImports.add(apiResponseType);
        readTypeImports.add(`${resource}Transformed`);

        readMapperBlocks.push(buildReadMapperFromFields(resource, fields, isEloquentResource, apiResponseType));

        // Scan child fields recursively for embedded child resources
        for (const [, fieldType] of Object.entries(fields)) {
            let targetType: SemanticType | undefined = fieldType;
            if (fieldType instanceof ReadonlyCollectionType || fieldType instanceof MutableCollectionType) {
                targetType = fieldType.elementType;
            }
            if (targetType instanceof ObjectType) {
                const childName = targetType.annotations?.get('name') ?? (targetType as any).metadata?.get('name');
                if (childName && childName.endsWith('Resource')) {
                    const childFields = Object.fromEntries(
                        (targetType.properties as readonly ObjectProperty[]).map(p => [p.name, p.type])
                    );
                    registerResource(childName, childFields);
                }
            }
        }
    };

    for (const requestType of requestTypes) {
        if (requestType.responseData) {
            registerResource(requestType.responseData.resourceName, requestType.responseData.fields);
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
