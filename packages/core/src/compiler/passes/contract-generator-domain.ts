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

/** Shared frozen immutable empty arrays (0% redundant [] allocations) */
export const EMPTY_WARNINGS: readonly string[] = Object.freeze([]);
export const EMPTY_FIELDS: readonly never[] = Object.freeze([]);

/** Unified Cross-Domain Generic Observable Result Container Vocabulary (aligned with FieldCollection<T> SSOT) */
export interface ConversionResult<T> {
    readonly fields: readonly T[];
    readonly warnings: readonly string[];
}

/** Discriminated union result type for nullable wrapper resolution */
export type NullableWrapperResult =
    | { readonly isNullableWrapper: true; readonly field: ParsedResponseField; readonly warnings: readonly string[] }
    | { readonly isNullableWrapper: false };

/** Type alias for field conversion stage result */
export type ResponseFieldConversionResult = ConversionResult<ParsedResponseField>;

/** Type alias for resource response schemas stage result */
export type ResourceResponseSchemasResult = ConversionResult<ActionResponseSchema>;

/** Observable result container for response schema extraction stage */
export interface ExtractedResponseSchemaResult {
    readonly fields: ActionResponseSchemaCollection;
    readonly warnings: readonly string[];
}

// ============================================================================
// 3. PURE STAGE OPERATIONS (PURE FLOW PIPELINE)
// ============================================================================

/** Pure Granular Contract Field Mapper (0% fallback, 0% ternary ?) */
export function mapContractField(field: RequestField): ContractField {
    return {
        name: field.originalName,
        type: field.type,
        fileConstraints: field.fileConstraints,
        required: field.required,
        nullable: field.nullable
    };
}

/** Pure Granular FormAction Mapper (0% fallback, 0% ternary ?) */
export function generateContractAction(
    action: FormAction,
    actionGenerator: ContractActionGeneratorLike
): GeneratedContractAction {
    const fields = action.fields.map(mapContractField);
    return actionGenerator.generateAction(action.name, fields);
}

/** Pure Granular RequestType Contract Extractor (0% fallback, 0% ternary ?) */
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

/** Stage 1 Pure Pipeline Entry (0% if, 0% for-loop, 0% continue) */
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

/** Extracts response schemas for a single ResponseData (0% array spread [...schemas]) */
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
        fields: schemas,
        warnings: conversionResult.warnings
    };
}

/** Pure ResponseData Schema Extractor via Switch (0% !==, 0% if, 0% ? :) */
export function extractResponseDataSchemas(
    responseData: ResponseData | undefined,
    responseActionBuilder: ResponseActionBuilderLike
): ConversionResult<ActionResponseSchema> {
    switch (responseData) {
        case undefined:
            return { fields: EMPTY_FIELDS, warnings: EMPTY_WARNINGS };
        default: {
            const result = extractSingleResourceResponseSchemas(
                responseData,
                responseActionBuilder
            );
            return {
                fields: result.fields,
                warnings: result.warnings
            };
        }
    }
}

/** Stage 2 Granular Extractor 1-Line Delegate */
export function extractRequestTypeResponseSchemas(
    requestType: RequestType,
    responseActionBuilder: ResponseActionBuilderLike
): ConversionResult<ActionResponseSchema> {
    return extractResponseDataSchemas(requestType.responseData, responseActionBuilder);
}

/** Single Cross-Domain Generic Partitioner Operation via 1-line flatMap (0% helper, 0% switch, 0% if, 0% for-loop, 0% push) */
export function partitionResults<T>(
    results: readonly ConversionResult<T>[]
): ConversionResult<T> {
    return {
        fields: results.flatMap(r => r.fields),
        warnings: results.flatMap(r => r.warnings)
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
    const partitioned = partitionResults(results);

    return {
        fields: { fields: partitioned.fields },
        warnings: partitioned.warnings
    };
}

/** Observable convertResponseFields via Pure Map + flatMap Partition Pipeline */
export function convertResponseFields(
    fields: Record<string, SemanticType>
): ResponseFieldConversionResult {
    const results = Object.entries(fields).map(([name, type]) =>
        convertSingleResponseField(name, type)
    );

    return partitionResults(results);
}

/** Helper to resolve nullable wrapper object annotation via pure switch (0% ternary ?, 0% if, 0% ||) */
export function resolveNullableWrapper(
    fieldName: string,
    objectType: ObjectType
): NullableWrapperResult {
    switch (objectType.annotations.get('kind')) {
        case 'nullable_wrapper': {
            const innerType = objectType.properties.get('__value');
            switch (innerType) {
                case undefined:
                    return { isNullableWrapper: false };
                default: {
                    const innerResult = convertSingleResponseField(fieldName, innerType);
                    const itemType = innerResult.fields[0];
                    switch (itemType) {
                        case undefined:
                            return { isNullableWrapper: false };
                        default:
                            return {
                                isNullableWrapper: true,
                                field: {
                                    name: itemType.name,
                                    kind: itemType.kind,
                                    type: itemType.type,
                                    nullable: true,
                                    optional: itemType.optional,
                                    fields: itemType.fields,
                                    itemType: itemType.itemType
                                },
                                warnings: innerResult.warnings
                            };
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
): ConversionResult<ParsedResponseField> {
    const wrapperResult = resolveNullableWrapper(fieldName, objectType);
    switch (wrapperResult.isNullableWrapper) {
        case true:
            return {
                fields: [wrapperResult.field],
                warnings: wrapperResult.warnings
            };

        case false: {
            const conversionResults = Array.from(objectType.properties.entries()).map(
                ([propName, propType]) => convertSingleResponseField(propName, propType)
            );
            const { fields: nestedFields, warnings: nestedWarnings } = partitionResults(conversionResults);

            return {
                fields: [{
                    name: fieldName,
                    kind: 'object',
                    type: 'object',
                    nullable: false,
                    optional: false,
                    fields: nestedFields
                }],
                warnings: nestedWarnings
            };
        }
    }
}

/** Pattern matching on SemanticType.kind (0% if statements, 0% for loops, 0% ternary ?, 0% ?. optional chaining, 0% type casting) */
export function convertSingleResponseField(
    fieldName: string,
    semanticType: SemanticType
): ConversionResult<ParsedResponseField> {
    const kind = semanticType.kind;

    switch (kind) {
        case 'primitive':
            return {
                fields: [{
                    name: fieldName,
                    kind: 'primitive',
                    type: semanticType.type,
                    nullable: false,
                    optional: false
                }],
                warnings: EMPTY_WARNINGS
            };

        case 'object':
            return convertObjectType(fieldName, semanticType);

        case 'readonly_collection':
        case 'mutable_collection': {
            const innerResult = convertSingleResponseField('item', semanticType.elementType);

            return {
                fields: [{
                    name: fieldName,
                    kind: 'array',
                    type: 'array',
                    nullable: false,
                    optional: false,
                    itemType: innerResult.fields[0]
                }],
                warnings: innerResult.warnings
            };
        }

        case 'reference':
            return {
                fields: [{
                    name: fieldName,
                    kind: 'primitive',
                    type: semanticType.name,
                    nullable: false,
                    optional: false
                }],
                warnings: EMPTY_WARNINGS
            };

        default:
            return {
                fields: EMPTY_FIELDS,
                warnings: [`Skipped field '${fieldName}': unsupported SemanticType kind '${kind}'`]
            };
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
        actions: c.actions
    }));
    const rawSchemas = responseSchemas.fields;

    return codeBuilder.buildContractFile(rawContracts, rawSchemas);
}

/** Stage 4: Build artifact with metadata */
export function buildContractArtifact(
    builtCode: GeneratedContractCode,
    contracts: ResourceContractCollection,
    responseSchemas: ActionResponseSchemaCollection,
    producerName: string,
    warnings: readonly string[] = EMPTY_WARNINGS
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
