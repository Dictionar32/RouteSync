/**
 * contractExtraction.ts
 *
 * Granular extraction pipelines for request contracts and response schemas.
 *
 * @module compiler/passes/contract-domain/contractExtraction
 */

import type { FormAction, RequestField, RequestType, ResponseData } from '../../types/domain/request';
import type { ResponseContractField, ResponseValueContract } from '../../types/domain/responseContracts';
import type { RequestTypesArtifact } from '../../artifacts/RequestTypesArtifact';
import type { GeneratedContractAction } from '../../generators/contract-generation/ContractActionGenerator';
import type { ActionResponseSchema } from '../../generators/contract-generation/ResponseActionBuilder';
import type { ParsedResponseField } from '../../generators/contract-generation/ResponseFieldParser';
import { partitionResults } from '../../domain/common/ResponseFieldLowering';
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
        name: field.sourceName,
        type: field.meaning,
        fileConstraints: field.fileConstraints,
        required: field.presence.accept({ required: () => true, optional: () => false, unspecified: () => { throw new Error(`Request field '${field.sourceName.value}' has unspecified presence`); } }),
        nullable: field.presence.accept({ required: p => p.nullable, optional: p => p.nullable, unspecified: () => { throw new Error(`Request field '${field.sourceName.value}' has unspecified nullability`); } })
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

function responseValueToType(value: ResponseValueContract): string {
    switch (value.kind) {
        case 'null': return 'null';
        case 'union': return value.members.map(responseValueToType).join(' | ');
        case 'scalar':
            switch (value.value.kind) {
                case 'textual': return 'string';
                case 'whole_number':
                case 'decimal_number': return 'number';
                case 'boolean_flag': return 'boolean';
            }
        case 'named_type':
            return value.name.value;
        case 'object':
            return 'object';
        case 'model_reference':
            return value.model.value;
        case 'collection':
            return 'array';
        case 'unresolved_declaration':
            return 'unknown';
    }
}

function responseContractFieldToParsed(field: ResponseContractField): ParsedResponseField {
    const type = responseValueToType(field.value);
    return {
        name: field.name.value,
        kind: field.value.kind === 'collection' ? 'array' : 'primitive',
        type,
        nullable: field.nullability.kind === 'nullable',
        optional: false
    };
}

function lowerResponseContractFields(
    fields: readonly ResponseContractField[]
): readonly ParsedResponseField[] {
    return fields.map(responseContractFieldToParsed);
}

/** Extracts response schemas for a single ResponseData (0% array spread [...schemas]) */
export function extractSingleResourceResponseSchemas(
    responseData: ResponseData,
    responseActionBuilder: ResponseActionBuilderLike
): ResourceResponseSchemasResult {
    const fields = lowerResponseContractFields(responseData.contract.fields);
    const schemas = buildResourceResponseSchemas(
        responseData.contract.name.value,
        fields,
        responseActionBuilder
    );

    return {
        fields: schemas,
        warnings: []
    };
}

/** Pure ResponseData Schema Extractor via Switch (0% !==, 0% if, 0% ? :) */
export function extractResponseDataSchemas(
    response: RequestType['response'],
    responseActionBuilder: ResponseActionBuilderLike
): ConversionResult<ActionResponseSchema> {
    switch (response.kind) {
        case 'none':
            return { fields: EMPTY_FIELDS, warnings: EMPTY_WARNINGS };
        case 'data': {
            const result = extractSingleResourceResponseSchemas(
                response.value,
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
    return extractResponseDataSchemas(requestType.response, responseActionBuilder);
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
