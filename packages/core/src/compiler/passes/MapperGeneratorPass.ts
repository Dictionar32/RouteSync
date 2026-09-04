/**
 * MapperGeneratorPass.ts
 *
 * Compiler pass that transforms RequestTypes into mapper functions:
 *   - Read mappers: API response (snake_case, backend shape) -> frontend
 *     Transformed model (camelCase).
 *   - Form mappers: form values -> API payload (snake_case, via ApiApiField
 *     bracket notation).
 *
 * Single code output (1 pass = 1 artifact):
 *   - `code` -> mappers/api-mapper.ts
 *
 * @module compiler/passes
 */

import type { CompilerPass } from './CompilerPass';
import type { PassDescriptor, PassDependency } from './PassDescriptor';
import { ArtifactKeyWitness, type ResolveArtifacts } from './ArtifactKeyWitness';
import type { GeneratedMapperArtifact } from '../artifacts/GeneratedMapperArtifact';
import type { RequestTypesArtifact, RequestType, RequestField } from '../artifacts/RequestTypesArtifact';
import { toPascalCase, toCamelCase } from '../../utils/resource-naming';
import { computeFingerprintHash, type CompilerFingerprint } from '../fingerprint/Fingerprint';
import { ObjectType, ReadonlyCollectionType, MutableCollectionType, ReferenceType, type SemanticType } from '../types/SemanticType';

export class MapperGeneratorPass
    implements CompilerPass<readonly ['RequestTypes'], readonly ['GeneratedMapper']> {

    public readonly name = 'MapperGenerator';

    public readonly inputWitnesses = [
        new ArtifactKeyWitness('RequestTypes')
    ] as const;

    public readonly outputKeys = ['GeneratedMapper'] as const;

    public readonly descriptor: PassDescriptor<
        readonly ['RequestTypes'],
        readonly ['GeneratedMapper']
    > = {
            consumes: ['RequestTypes'],
            produces: ['GeneratedMapper']
        };

    public readonly requires: readonly PassDependency<'RequestTypes'>[] = [
        {
            artifact: 'RequestTypes',
            producer: undefined
        }
    ];

    public readonly producesPass: readonly string[] = [];
    private static readonly defaultPass = new MapperGeneratorPass();

    public static run(
        artifact: RequestTypesArtifact
    ): ResolveArtifacts<readonly ['GeneratedMapper']> {
        return MapperGeneratorPass.defaultPass.run([artifact]);
    }

    public run(
        inputs: ResolveArtifacts<readonly ['RequestTypes']>
    ): ResolveArtifacts<readonly ['GeneratedMapper']> {
        const [requestTypesArtifact] = inputs;
        const requestTypes = requestTypesArtifact.requestTypes;

        if (requestTypes.length === 0) {
            return this.buildEmptyArtifact();
        }

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

            readMapperBlocks.push(this.buildReadMapperFromFields(resource, fields, isEloquentResource, apiResponseType));

            // Scan child fields recursively for embedded child resources
            for (const [, fieldType] of Object.entries(fields)) {
                let targetType: SemanticType | undefined = fieldType;
                if (fieldType instanceof ReadonlyCollectionType || fieldType instanceof MutableCollectionType) {
                    targetType = fieldType.elementType;
                }
                if (targetType instanceof ObjectType) {
                    const childName = targetType.annotations?.get('name') ?? (targetType as any).metadata?.get('name');
                    if (childName && childName.endsWith('Resource')) {
                        const childFields = Object.fromEntries(targetType.properties.entries());
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

                formMapperBlocks.push(this.buildFormMapper(requestType, action, contractTypeName));
            }
        }

        const imports: string[] = [];

        if (hasApiField) {
            imports.push(`import { ApiApiField } from '../contracts/api-field';`);
        }

        if (contractImports.size > 0) {
            const sortedContractImports = Array.from(contractImports).sort();
            imports.push(
                `import type {\n  ${sortedContractImports.join(',\n  ')}\n} from '../contracts/api-contract';`
            );
        }

        if (formTypeImports.size > 0) {
            const sortedFormTypeImports = Array.from(formTypeImports).sort();
            imports.push(
                `import type {\n  ${sortedFormTypeImports.join(',\n  ')}\n} from '../forms/api-form';`
            );
        }

        if (readTypeImports.size > 0) {
            const sortedReadTypeImports = Array.from(readTypeImports).sort();
            imports.push(
                `import type {\n  ${sortedReadTypeImports.join(',\n  ')}\n} from '../types/api-read';`
            );
        }

        const sections: string[] = [];

        if (readMapperBlocks.length > 0) {
            sections.push('// ========== READ MAPPERS ==========\n' + readMapperBlocks.join('\n\n'));
        }

        if (formMapperBlocks.length > 0) {
            sections.push('// ========== FORM MAPPERS ==========\n' + formMapperBlocks.join('\n\n'));
        }

        const header = imports.length > 0 ? imports.join('\n\n') + '\n\n' : '';
        const code = header + sections.join('\n\n') + (sections.length > 0 ? '\n' : '');

        return this.buildArtifact(code);
    }

    // ------------------------------------------------------------------
    // Read mapper (responseData -> toXRead / toXReadList)
    // ------------------------------------------------------------------

    private buildReadMapperFromFields(resourceName: string, fields: Record<string, SemanticType>, isEloquentResource: boolean, paramType?: string): string {
        const resource = toPascalCase(resourceName);
        const returnType = `${resource}Transformed`;
        const apiType = paramType ?? `${resource}ApiResponse`;

        const fieldLines = Object.entries(fields)
            .map(([key, type]) => this.buildFieldMappingLine(key, type, `api.${key}`, isEloquentResource))
            .join('\n');

        const readFn =
            `export const to${resource}Read = (api: ${apiType}): ${returnType} => ({\n` +
            `${fieldLines}\n` +
            `})`;

        const readListFn =
            `export const to${resource}ReadList = (api: ${apiType}[]): ${returnType}[] => api.map(to${resource}Read)`;

        return `${readFn}\n\n${readListFn}`;
    }

    private buildReadMapper(requestType: RequestType, isEloquentResource: boolean): string {
        return this.buildReadMapperFromFields(requestType.responseData!.resourceName, requestType.responseData!.fields, isEloquentResource);
    }

    /**
     * Build a single `key: api.path` (or nested object literal) mapping
     * line for a response field. Recurses into ObjectType fields so nested
     * objects stay nested.
     */
    private buildFieldMappingLine(
        targetPropKey: string,
        type: SemanticType,
        jsonPath: string,
        isEloquentResource: boolean
    ): string {
        const camelProp = toCamelCase(targetPropKey);

        if (type instanceof ObjectType) {
            if (type.annotations?.get('kind') === 'nullable_wrapper') {
                const innerVal = type.properties.get('__value');
                if (innerVal) {
                    return this.buildFieldMappingLine(targetPropKey, innerVal, jsonPath, isEloquentResource);
                }
            }
            return type.properties
                .entries()
                .filter(([nestedKey]) => !nestedKey.startsWith('__'))
                .map(([nestedKey, nestedType]) => {
                    const camelChild = toCamelCase(nestedKey);
                    const childTargetPropKey = targetPropKey
                        ? `${targetPropKey}_${nestedKey}`
                        : nestedKey;
                    const childJsonPath = `${jsonPath}.${nestedKey}`;
                    return this.buildFieldMappingLine(childTargetPropKey, nestedType, childJsonPath, isEloquentResource);
                })
                .join('\n');
        }

        if (type instanceof ReadonlyCollectionType || type instanceof MutableCollectionType) {
            const elem = type.elementType;
            let elemResourceName: string | null = null;
            if (elem instanceof ReferenceType && elem.name.includes('Resource')) {
                const baseName = elem.name.replace(/Transformed$/, '');
                elemResourceName = toPascalCase(baseName);
            } else if (elem instanceof ObjectType) {
                const metaName = elem.annotations?.get('name') ?? (elem as any).metadata?.get('name');
                if (metaName && metaName.includes('Resource')) {
                    const baseName = metaName.replace(/Transformed$/, '');
                    elemResourceName = toPascalCase(baseName);
                }
            }

            if (elemResourceName) {
                return `  ${camelProp}: ${jsonPath}?.map(to${elemResourceName}Read),`;
            }

            if (elem instanceof ObjectType && elem.properties.entries().length > 0) {
                const itemFieldLines = elem.properties
                    .entries()
                    .filter(([nestedKey]) => !nestedKey.startsWith('__'))
                    .map(([nestedKey, nestedType]) =>
                        this.buildFieldMappingLine(nestedKey, nestedType, `item.${nestedKey}`, isEloquentResource)
                    )
                    .join('\n');
                return `  ${camelProp}: ${jsonPath}?.map(item => ({\n${this.indent(itemFieldLines)}\n  })),`;
            }
        }

        return `  ${camelProp}: ${jsonPath},`;
    }

    private indent(block: string): string {
        return block
            .split('\n')
            .map(line => `  ${line}`)
            .join('\n');
    }

    // ------------------------------------------------------------------
    // Form mapper (actions -> toApiXCreate / toApiXUpdate)
    // ------------------------------------------------------------------

    private buildFormMapper(
        requestType: RequestType,
        action: RequestType['actions'][number],
        contractTypeName: string
    ): string {
        const resource = toPascalCase(requestType.resourceName);
        const actionName = toPascalCase(action.name);
        const formTypeName = requestType.formTypeName && requestType.formTypeName.endsWith('Form')
            ? requestType.formTypeName
            : resource + 'Form';

        const fieldLines = action.fields
            .map(field => this.buildFormFieldLine(field))
            .join('\n');

        return (
            `export const toApi${resource}${actionName} = (form: ${formTypeName}['${actionName}']): ${contractTypeName}['${actionName}'] => ({\n` +
            `${fieldLines}\n` +
            `})`
        );
    }

    private buildFormFieldLine(field: RequestField): string {
        const key = this.toApiFieldKey(field.originalName);
        const propName = toCamelCase(field.originalName);

        const isCollection =
            field.type instanceof ReadonlyCollectionType ||
            field.type instanceof MutableCollectionType ||
            (field.type as any)?.kind === 'readonly_collection' ||
            (field.type as any)?.kind === 'mutable_collection';

        if (isCollection) {
            const elem = (field.type as any).elementType;
            const isObject = elem instanceof ObjectType || elem?.kind === 'object';
            if (isObject && elem?.properties) {
                let propNames: string[] = [];
                if (Array.isArray(elem.properties)) {
                    propNames = elem.properties.map((p: any) => p.name);
                } else if (typeof elem.properties.entries === 'function') {
                    propNames = Array.from(elem.properties.entries()).map(([k]: any) => k);
                }

                const cleanProps = propNames.filter(k => typeof k === 'string' && !k.startsWith('__'));
                if (cleanProps.length > 0) {
                    const innerLines = cleanProps
                        .map(k => `  [ApiApiField.${this.toApiFieldKey(k)}]: item.${toCamelCase(k)}`)
                        .join(',\n');
                    return `  [ApiApiField.${key}]: form.${propName}?.map(item => ({\n${this.indent(innerLines)}\n  })),`;
                }
            }
        }

        const isObject = field.type instanceof ObjectType || (field.type as any)?.kind === 'object';
        if (isObject && (field.type as any)?.properties) {
            const elem = field.type as any;
            let propNames: string[] = [];
            if (Array.isArray(elem.properties)) {
                propNames = elem.properties.map((p: any) => p.name);
            } else if (typeof elem.properties.entries === 'function') {
                propNames = Array.from(elem.properties.entries()).map(([k]: any) => k);
            }

            const cleanProps = propNames.filter(k => typeof k === 'string' && !k.startsWith('__'));
            if (cleanProps.length > 0) {
                const innerLines = cleanProps
                    .map(k => `  [ApiApiField.${this.toApiFieldKey(k)}]: form.${propName}?.${toCamelCase(k)}`)
                    .join(',\n');
                return `  [ApiApiField.${key}]: form.${propName} ? {\n${this.indent(innerLines)}\n  } : undefined,`;
            }
        }

        return `  [ApiApiField.${key}]: form.${propName},`;
    }

    private toApiFieldKey(originalName: string): string {
        return originalName.toUpperCase().replace(/[^A-Z0-9]/g, '');
    }

    // ------------------------------------------------------------------
    // Artifact construction
    // ------------------------------------------------------------------

    private buildArtifact(code: string): ResolveArtifacts<readonly ['GeneratedMapper']> {
        const fingerprint: CompilerFingerprint = {
            compilerVersion: '1.0.0',
            parserVersion: '1.0.0',
            phpVersion: '8.2.0',
            frameworkVersion: '10.0.0',
            targetBackend: 'typescript',
            strictMode: false,
            featureFlags: new Map()
        };

        const artifact: GeneratedMapperArtifact = {
            typeId: 'GeneratedMapper',
            metadata: {
                hash: computeFingerprintHash(fingerprint),
                producer: this.name,
                dependencies: ['RequestTypes'],
                timestamp: Date.now(),
                revision: '1.0.0'
            },
            code
        };

        return [artifact];
    }

    private buildEmptyArtifact(): ResolveArtifacts<readonly ['GeneratedMapper']> {
        return this.buildArtifact('');
    }
}
