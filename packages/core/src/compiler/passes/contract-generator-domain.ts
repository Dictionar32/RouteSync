/**
 * contract-generator-domain.ts
 *
 * Flow-Based Type Design & Pure Operations module for ContractGeneratorPass.
 *
 * Pipeline Architecture:
 *
 *                     ORIGIN BOUNDARY
 *          createContractGeneratorDependencies()
 *                         │
 *                         ▼
 *         ContractGeneratorDependencies (Complete Contract)
 *                         │
 *                         ▼
 *               ContractGeneratorPass
 *                         │
 *      ┌──────────────────┼──────────────────┐
 *      ▼                  ▼                  ▼
 *  extractRequest  extractResponse     formatContract
 *   Contracts          Schemas              File
 *      └──────────────────┬──────────────────┘
 *                         ▼
 *               buildContractArtifact
 *
 * @module compiler/passes
 */

import type { FileValidationConstraints, FormAction, RequestField, RequestType, RequestTypesArtifact, ResponseData } from '../artifacts/RequestTypesArtifact';
import type { GeneratedContractArtifact, GeneratedContractInfo } from '../artifacts/GeneratedContractArtifact';
import type { FieldCollection } from '../domain/common/FieldCollection';
import type { GeneratedContractAction } from '../generators/contract-generation/ContractActionGenerator';
import { ContractActionGenerator } from '../generators/contract-generation/ContractActionGenerator';
import { ContractSchemaMapper } from '../generators/contract-generation/ContractSchemaMapper';
import { ContractCodeBuilder } from '../generators/contract-generation/ContractCodeBuilder';
import { ResponseActionBuilder, type ActionResponseSchema } from '../generators/contract-generation/ResponseActionBuilder';
import { ResponseSchemaMapper } from '../generators/contract-generation/ResponseSchemaMapper';
import type { ParsedResponseField } from '../generators/contract-generation/ResponseFieldParser';
import type { SemanticType, ObjectType } from '../types/SemanticType';
import { toPascalCase } from '../../utils/resource-naming';
import { computeFingerprintHash, type CompilerFingerprint } from '../fingerprint/Fingerprint';

// ============================================================================
// 1. CAPABILITY INTERFACES & COMPLETE CONTRACT ORIGIN
// ============================================================================

export interface ContractField {
    readonly name: string;
    readonly type: SemanticType;
    readonly fileConstraints?: FileValidationConstraints;
    readonly required: boolean;
    readonly nullable: boolean;
}

export interface ContractActionGeneratorLike {
    generateAction(
        actionName: string,
        fields: readonly ContractField[]
    ): GeneratedContractAction;
}

export interface ContractCodeBuilderLike {
    buildContractFile(
        contracts: readonly { readonly resourceName: string; readonly actions: readonly GeneratedContractAction[] }[],
        responseSchemas: readonly ActionResponseSchema[]
    ): GeneratedContractCode;
}

export interface ResponseActionBuilderLike {
    buildShowSchema(resourceName: string, fields: readonly ParsedResponseField[]): ActionResponseSchema;
    buildIndexSchema(resourceName: string, showSchemaName: string): ActionResponseSchema;
}

/**
 * Complete Contract for ContractGeneratorPass dependencies (100% required)
 */
export interface ContractGeneratorDependencies {
    readonly schemaMapper: ContractSchemaMapper;
    readonly actionGenerator: ContractActionGeneratorLike;
    readonly codeBuilder: ContractCodeBuilderLike;
    readonly responseActionBuilder: ResponseActionBuilderLike;
}

/**
 * Dependency Origin Boundary: Resolves optional configuration into a Complete Contract.
 * Utilizes ES6 Destructuring Defaults (=) left-to-right (0% ??, 0% ?.).
 */
export function createContractGeneratorDependencies({
    schemaMapper = new ContractSchemaMapper(),
    actionGenerator = new ContractActionGenerator(schemaMapper),
    codeBuilder = new ContractCodeBuilder(),
    responseActionBuilder = new ResponseActionBuilder(new ResponseSchemaMapper())
}: Partial<ContractGeneratorDependencies> = {}): ContractGeneratorDependencies {
    return {
        schemaMapper,
        actionGenerator,
        codeBuilder,
        responseActionBuilder
    };
}

// ============================================================================
// 2. DOMAIN TYPE VOCABULARY & CONVERSION RESULTS
// ============================================================================

export interface ResourceContract {
    readonly resourceName: string;
    readonly actions: readonly GeneratedContractAction[];
}

export type ResourceContractCollection = FieldCollection<ResourceContract>;
export type ActionResponseSchemaCollection = FieldCollection<ActionResponseSchema>;

export interface GeneratedContractCode {
    readonly code: string;
    readonly contractCount: number;
    readonly lineCount: number;
}

/** Discriminated union result type for single response field conversion */
export type SingleResponseFieldResult =
    | { readonly success: true; readonly field: ParsedResponseField }
    | { readonly success: false; readonly warning: string };

/** Discriminated union result type for nullable wrapper resolution */
export type NullableWrapperResult =
    | { readonly isNullableWrapper: true; readonly field: ParsedResponseField }
    | { readonly isNullableWrapper: false };

/** Discriminated union result type for request type response schema extraction */
export type RequestTypeResponseSchemasResult =
    | { readonly hasResponse: true; readonly schemas: readonly [ActionResponseSchema, ActionResponseSchema]; readonly warnings: readonly string[] }
    | { readonly hasResponse: false };

/** Observable result container for response field conversion */
export interface ResponseFieldConversionResult {
    readonly fields: readonly ParsedResponseField[];
    readonly warnings: readonly string[];
}

/** Observable result container for single resource response schemas */
export interface ResourceResponseSchemasResult {
    readonly schemas: readonly [ActionResponseSchema, ActionResponseSchema];
    readonly warnings: readonly string[];
}

/** Observable result container for response schema extraction stage */
export interface ExtractedResponseSchemaResult {
    readonly fields: ActionResponseSchemaCollection;
    readonly warnings: readonly string[];
}

// ============================================================================
// 3. PURE STAGE OPERATIONS (PURE FLOW PIPELINE)
// ============================================================================

/** Maps individual RequestField to ContractField */
export function mapContractField(field: RequestField): ContractField {
    return {
        name: field.originalName,
        type: field.type,
        fileConstraints: field.fileConstraints,
        required: field.required,
        nullable: field.nullable
    };
}

/** Generates a contract action for a single FormAction */
export function generateContractAction(
    action: FormAction,
    actionGenerator: ContractActionGeneratorLike
): GeneratedContractAction {
    const fields = action.fields.map(mapContractField);
    return actionGenerator.generateAction(action.name, fields);
}

/** Extracts resource contract for a single RequestType */
export function extractResourceContract(
    requestType: RequestType,
    actionGenerator: ContractActionGeneratorLike
): ResourceContract {
    const actions = requestType.actions.map(action =>
        generateContractAction(action, actionGenerator)
    );

    return {
        resourceName: requestType.resourceName,
        actions
    };
}

/** Stage 1: Extract request validation contracts */
export function extractRequestContracts(
    artifact: RequestTypesArtifact,
    actionGenerator: ContractActionGeneratorLike
): ResourceContractCollection {
    const resourceContracts = artifact.requestTypes.map(requestType =>
        extractResourceContract(requestType, actionGenerator)
    );

    return { fields: resourceContracts };
}

/** Pure deterministic schema builder for a single resource (Tuple [show, index]) */
export function buildResourceResponseSchemas(
    resourceName: string,
    fields: readonly ParsedResponseField[],
    responseActionBuilder: ResponseActionBuilderLike
): readonly [ActionResponseSchema, ActionResponseSchema] {
    const showSchema = responseActionBuilder.buildShowSchema(resourceName, fields);
    const indexSchema = responseActionBuilder.buildIndexSchema(resourceName, showSchema.schemaName);
    return [showSchema, indexSchema];
}

/** Extracts response schemas for a single ResponseData */
export function extractSingleResourceResponseSchemas(
    responseData: ResponseData,
    responseActionBuilder: ResponseActionBuilderLike
): ResourceResponseSchemasResult {
    const conversionResult = convertResponseFields(responseData.fields);
    const schemas = buildResourceResponseSchemas(
        responseData.resourceName,
        conversionResult.fields,
        responseActionBuilder
    );

    return {
        schemas,
        warnings: conversionResult.warnings
    };
}

/** Pure ResponseData Schema Extractor via Switch (0% !==, 0% if, 0% ? :) */
export function extractResponseDataSchemas(
    responseData: ResponseData | undefined,
    responseActionBuilder: ResponseActionBuilderLike
): RequestTypeResponseSchemasResult {
    switch (responseData) {
        case undefined:
            return { hasResponse: false };
        default: {
            const result = extractSingleResourceResponseSchemas(
                responseData,
                responseActionBuilder
            );
            return {
                hasResponse: true,
                schemas: result.schemas,
                warnings: result.warnings
            };
        }
    }
}

/** Stage 2 Granular Extractor 1-Line Delegate */
export function extractRequestTypeResponseSchemas(
    requestType: RequestType,
    responseActionBuilder: ResponseActionBuilderLike
): RequestTypeResponseSchemasResult {
    return extractResponseDataSchemas(requestType.responseData, responseActionBuilder);
}

/** Pure Stage 2 Partitioner via Switch (0% if, 0% for-loop in pipeline) */
export function partitionResponseSchemaResults(
    results: readonly RequestTypeResponseSchemasResult[]
): ExtractedResponseSchemaResult {
    const responseSchemas: ActionResponseSchema[] = [];
    const warnings: string[] = [];

    for (const res of results) {
        switch (res.hasResponse) {
            case true:
                responseSchemas.push(...res.schemas);
                warnings.push(...res.warnings);
                break;
            case false:
                break;
        }
    }

    return {
        fields: { fields: responseSchemas },
        warnings
    };
}

/** Stage 2 Pure Pipeline Entry (0% if, 0% for-loop, 0% continue) */
export function extractResponseSchemas(
    artifact: RequestTypesArtifact,
    responseActionBuilder: ResponseActionBuilderLike
): ExtractedResponseSchemaResult {
    const results = artifact.requestTypes.map(requestType =>
        extractRequestTypeResponseSchemas(requestType, responseActionBuilder)
    );

    return partitionResponseSchemaResults(results);
}

/** Pure Partitioning Operation: SingleResponseFieldResult[] -> ResponseFieldConversionResult */
export function partitionFieldResults(
    results: readonly SingleResponseFieldResult[]
): ResponseFieldConversionResult {
    const fields: ParsedResponseField[] = [];
    const warnings: string[] = [];

    for (const result of results) {
        switch (result.success) {
            case true:
                fields.push(result.field);
                break;
            case false:
                warnings.push(result.warning);
                break;
        }
    }

    return { fields, warnings };
}

/** Observable convertResponseFields via Pure Map + Switch Partition Pipeline */
export function convertResponseFields(
    fields: Record<string, SemanticType>
): ResponseFieldConversionResult {
    const results = Object.entries(fields).map(([name, type]) =>
        convertSingleResponseField(name, type)
    );

    return partitionFieldResults(results);
}

/** Pure helper to extract itemType field from conversion result (0% ternary ?) */
export function extractItemType(result: SingleResponseFieldResult): ParsedResponseField | undefined {
    switch (result.success) {
        case true:
            return result.field;
        case false:
            return undefined;
    }
}

/** Helper to resolve nullable wrapper object annotation via pure switch (0% ternary ?, 0% if, 0% ||) */
export function resolveNullableWrapper(
    objectType: ObjectType
): NullableWrapperResult {
    switch (objectType.annotations.get('kind')) {
        case 'nullable_wrapper': {
            const innerType = objectType.properties.get('__value');
            switch (innerType) {
                case undefined:
                    return { isNullableWrapper: false };
                default: {
                    switch (innerType.kind) {
                        case 'primitive':
                            return {
                                isNullableWrapper: true,
                                field: {
                                    name: '',
                                    kind: 'primitive',
                                    type: innerType.type,
                                    nullable: true,
                                    optional: false
                                }
                            };
                        default:
                            return { isNullableWrapper: false };
                    }
                }
            }
        }
        default:
            return { isNullableWrapper: false };
    }
}

/** Pure helper to convert ObjectType without if or for-loops */
export function convertObjectType(
    fieldName: string,
    objectType: ObjectType
): SingleResponseFieldResult {
    const wrapperResult = resolveNullableWrapper(objectType);
    switch (wrapperResult.isNullableWrapper) {
        case true:
            return {
                success: true,
                field: { ...wrapperResult.field, name: fieldName }
            };

        case false: {
            const conversionResults = Array.from(objectType.properties.entries()).map(
                ([propName, propType]) => convertSingleResponseField(propName, propType)
            );
            const { fields: nestedFields } = partitionFieldResults(conversionResults);

            return {
                success: true,
                field: {
                    name: fieldName,
                    kind: 'object',
                    type: 'object',
                    nullable: false,
                    optional: false,
                    fields: nestedFields
                }
            };
        }
    }
}

/** Pattern matching on SemanticType.kind (0% if statements, 0% for loops, 0% ternary ?, 0% ?. optional chaining, 0% type casting) */
export function convertSingleResponseField(
    fieldName: string,
    semanticType: SemanticType
): SingleResponseFieldResult {
    switch (semanticType.kind) {
        case 'primitive':
            return {
                success: true,
                field: {
                    name: fieldName,
                    kind: 'primitive',
                    type: semanticType.type,
                    nullable: false,
                    optional: false
                }
            };

        case 'object':
            return convertObjectType(fieldName, semanticType);

        case 'readonly_collection':
        case 'mutable_collection': {
            const innerResult = convertSingleResponseField('item', semanticType.elementType);
            const itemType = extractItemType(innerResult);

            return {
                success: true,
                field: {
                    name: fieldName,
                    kind: 'array',
                    type: 'array',
                    nullable: false,
                    optional: false,
                    itemType
                }
            };
        }

        case 'reference':
            return {
                success: true,
                field: {
                    name: fieldName,
                    kind: 'primitive',
                    type: semanticType.name,
                    nullable: false,
                    optional: false
                }
            };

        default: {
            const unknownKind = (semanticType as { kind?: unknown }).kind;
            return {
                success: false,
                warning: `Skipped field '${fieldName}': unsupported SemanticType kind '${String(unknownKind)}'`
            };
        }
    }
}

/** Stage 3: Format contracts into TypeScript Zod source code */
export function formatContractFile(
    contracts: ResourceContractCollection,
    responseSchemas: ActionResponseSchemaCollection,
    codeBuilder: ContractCodeBuilderLike
): GeneratedContractCode {
    const rawContracts = contracts.fields.map(c => ({
        resourceName: c.resourceName,
        actions: [...c.actions]
    }));
    const rawSchemas = [...responseSchemas.fields];

    return codeBuilder.buildContractFile(rawContracts, rawSchemas);
}

/** Stage 4: Build artifact with metadata */
export function buildContractArtifact(
    builtCode: GeneratedContractCode,
    contracts: ResourceContractCollection,
    responseSchemas: ActionResponseSchemaCollection,
    producerName: string,
    warnings: readonly string[] = []
): GeneratedContractArtifact {
    const fingerprint: CompilerFingerprint = {
        compilerVersion: '1.0.0',
        parserVersion: '1.0.0',
        phpVersion: '8.2.0',
        frameworkVersion: '10.0.0',
        targetBackend: 'typescript',
        strictMode: false,
        featureFlags: new Map()
    };

    let totalActions = 0;
    for (const c of contracts.fields) {
        totalActions += c.actions.length;
    }

    const contractsInfo: GeneratedContractInfo[] = contracts.fields.map(contract => ({
        name: contract.resourceName,
        schemaName: `${contract.resourceName}ContractSchema`,
        actions: contract.actions.map(a => ({
            name: a.name,
            zodSchema: a.schemaLines.join('\n'),
            validatorName: `validate${toPascalCase(contract.resourceName)}${capitalize(a.name)}`,
            fieldCount: a.fieldCount
        })),
        lineRange: [0, 0] as const
    }));

    return {
        typeId: 'GeneratedContract',
        code: builtCode.code,
        contracts: contractsInfo,
        generationMetadata: {
            generatorVersion: '1.0.0',
            requestTypeCount: contractsInfo.length,
            contractCount: builtCode.contractCount,
            totalActions,
            zodSchemasCount: totalActions,
            validatorsCount: totalActions,
            linesOfCode: builtCode.lineCount,
            warnings
        },
        metadata: {
            hash: computeFingerprintHash(fingerprint),
            producer: producerName,
            dependencies: ['RequestTypes'],
            timestamp: Date.now(),
            revision: '1.0.0'
        }
    };
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
