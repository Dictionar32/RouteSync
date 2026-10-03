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
import type { ResponseFieldProjection } from '../../generators/contract-generation/response-field';
import { partitionResults } from '../../domain/common/ResponseFieldLowering';
import { relationProject, relationResolve, relationEqual } from '../../../semantic/kernel/relationalSequence';
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
import { resolveRequestResponseProjection, resolveResponseValueType } from './responseContractSemanticRelations';

/** Pure Granular Contract Field Mapper (0% fallback, 0% ternary ?) */
export function mapContractField(field: RequestField): ContractField {
    return {
        name: field.sourceName,
        type: field.meaning,
        fileConstraints: field.fileConstraints,
        required: field.presence.accept({ required: () => true, optional: () => false, unspecified: () => { throw Error(`Request field '${field.sourceName.value}' has unspecified presence`); } }),
        nullable: field.presence.accept({ required: p => p.nullable, optional: p => p.nullable, unspecified: () => { throw Error(`Request field '${field.sourceName.value}' has unspecified nullability`); } })
    };
}

/** Pure Granular FormAction Mapper (0% fallback, 0% ternary ?) */
export function generateContractAction(
    action: FormAction,
    actionGenerator: ContractActionGeneratorLike
): GeneratedContractAction {
    const fields = relationProject(action.fields, mapContractField);
    return actionGenerator.generateAction(action.name, fields);
}

/** Pure Granular RequestType Contract Extractor (0% fallback, 0% ternary ?) */
export function extractResourceContract(
    requestType: RequestType,
    actionGenerator: ContractActionGeneratorLike
): ResourceContract {
    const actions = relationProject(requestType.actions, action => generateContractAction(action, actionGenerator));

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
    const resourceContracts = relationProject(artifact.requestTypes, requestType => extractResourceContract(requestType, actionGenerator));

    return { fields: resourceContracts };
}

/** Pure deterministic schema builder for a single resource (Tuple [show, index]) */
export function buildResourceResponseSchemas(
    resourceName: string,
    fields: readonly ResponseFieldProjection[],
    responseActionBuilder: ResponseActionBuilderLike
): readonly [ActionResponseSchema, ActionResponseSchema] {
    const showSchema = responseActionBuilder.buildShowSchema(resourceName, fields);
    const indexSchema = responseActionBuilder.buildIndexSchema(resourceName, showSchema.schemaName);
    return [showSchema, indexSchema];
}

function responseValueToType(value: ResponseValueContract): string {
    const semanticKind = relationResolve(relationEqual(value.kind, 'scalar'), () => value.value.kind, () => value.kind);
    const semanticType = resolveResponseValueType(semanticKind);
    return RESPONSE_VALUE_TYPE_HANDLERS[semanticType](value);
}

const RESPONSE_VALUE_TYPE_HANDLERS: Readonly<Record<string, (value: ResponseValueContract) => string>> = Object.freeze({
    union: value => relationProject((value as Extract<ResponseValueContract, { kind: 'union' }>).members, responseValueToType).join(' | '),
    null: () => 'null',
    string: () => 'string',
    number: () => 'number',
    boolean: () => 'boolean',
    object: () => 'object',
    array: () => 'array',
    unknown: () => 'unknown',
    named_type: value => (value as Extract<ResponseValueContract, { kind: 'named_type' }>).name.value,
    model_reference: value => (value as Extract<ResponseValueContract, { kind: 'model_reference' }>).model.value,
});

function responseContractFieldToParsed(field: ResponseContractField): ResponseFieldProjection {
    const type = responseValueToType(field.value);
    return {
        name: field.name.value,
        kind: relationResolve(relationEqual(field.value.kind, 'collection'), () => 'array', () => 'primitive'),
        type,
        nullable: relationEqual(field.nullability.kind, 'nullable'),
        optional: false
    };
}

function lowerResponseContractFields(
    fields: readonly ResponseContractField[]
): readonly ResponseFieldProjection[] {
    return relationProject(fields, responseContractFieldToParsed);
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
    const projection = resolveRequestResponseProjection(response.kind);
    return REQUEST_RESPONSE_PROJECTION_HANDLERS[projection](response, responseActionBuilder);
}

const REQUEST_RESPONSE_PROJECTION_HANDLERS: Readonly<Record<'empty' | 'resource', (
    response: RequestType['response'],
    responseActionBuilder: ResponseActionBuilderLike
) => ConversionResult<ActionResponseSchema>>> = Object.freeze({
    empty: () => ({ fields: EMPTY_FIELDS, warnings: EMPTY_WARNINGS }),
    resource: (response, responseActionBuilder) => {
        const data = (response as Extract<RequestType['response'], { kind: 'data' }>).value;
        const result = extractSingleResourceResponseSchemas(data, responseActionBuilder);
        return { fields: result.fields, warnings: result.warnings };
    },
});


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
    const results = relationProject(artifact.requestTypes, requestType => extractRequestTypeResponseSchemas(requestType, responseActionBuilder));
    const partitioned = partitionResults(results);

    return {
        fields: { fields: partitioned.fields },
        warnings: partitioned.warnings
    };
}
