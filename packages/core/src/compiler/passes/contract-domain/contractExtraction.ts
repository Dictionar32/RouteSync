/**
 * contractExtraction.ts
 *
 * Granular extraction pipelines for request contracts and response schemas.
 *
 * @module compiler/passes/contract-domain/contractExtraction
 */

import type { FormAction, RequestField, RequestType, RequestTypesArtifact, ResponseData } from '../../artifacts/RequestTypesArtifact';
import type { GeneratedContractAction } from '../../generators/contract-generation/ContractActionGenerator';
import type { ActionResponseSchema } from '../../generators/contract-generation/ResponseActionBuilder';
import type { ParsedResponseField } from '../../generators/contract-generation/ResponseFieldParser';
import { partitionResults, convertResponseFields } from '../../domain/common/ResponseFieldLowering';
import type {
    ContractField,
    ContractActionGeneratorLike,
    ResponseActionBuilderLike,
    ResourceContract,
    ResourceContractCollection,
    ResourceResponseSchemasResult,
    ExtractedResponseSchemaResult
} from './contractTypes';
import { EMPTY_FIELDS, EMPTY_WARNINGS, type ConversionResult } from './contractTypes';

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
