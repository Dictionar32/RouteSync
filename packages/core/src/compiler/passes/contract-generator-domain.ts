/**
 * contract-generator-domain.ts
 *
 * Active Consumer Orchestrator for ContractGeneratorPass domain operations.
 * Coordinates capability interfaces, dependency boundary, request contracts, response schemas, and artifact assembly.
 *
 * @module compiler/passes
 */

import {
    type ContractField,
    type ContractActionGeneratorLike,
    type ContractCodeBuilderLike,
    type ResponseActionBuilderLike,
    type ContractGeneratorDependencies,
    type ResourceContract,
    type ResourceContractCollection,
    type ActionResponseSchemaCollection,
    type GeneratedContractCode,
    ConversionResult,
    EMPTY_WARNINGS,
    EMPTY_FIELDS,
    type StageResult,
    type NullableWrapperResult,
    type ResponseFieldConversionResult,
    type ResourceResponseSchemasResult,
    type ExtractedResponseSchemaResult,
    createContractGeneratorDependencies,
    mapContractField,
    generateContractAction,
    extractResourceContract,
    extractRequestContracts,
    buildResourceResponseSchemas,
    extractSingleResourceResponseSchemas,
    extractResponseDataSchemas,
    extractRequestTypeResponseSchemas,
    extractResponseSchemas,
    formatContractFile,
    buildContractArtifact
} from './contract-domain';

// Explicit named re-exports (Rule 14: 0 wildcard re-exports)
export type {
    ContractField,
    ContractActionGeneratorLike,
    ContractCodeBuilderLike,
    ResponseActionBuilderLike,
    ContractGeneratorDependencies,
    ResourceContract,
    ResourceContractCollection,
    ActionResponseSchemaCollection,
    GeneratedContractCode,
    StageResult,
    NullableWrapperResult,
    ResponseFieldConversionResult,
    ResourceResponseSchemasResult,
    ExtractedResponseSchemaResult
};

export {
    ConversionResult,
    EMPTY_WARNINGS,
    EMPTY_FIELDS,
    createContractGeneratorDependencies,
    mapContractField,
    generateContractAction,
    extractResourceContract,
    extractRequestContracts,
    buildResourceResponseSchemas,
    extractSingleResourceResponseSchemas,
    extractResponseDataSchemas,
    extractRequestTypeResponseSchemas,
    extractResponseSchemas,
    formatContractFile,
    buildContractArtifact
};

export {
    convertObjectType,
    convertSingleResponseField,
    convertResponseFields,
    resolveNullableWrapper,
    partitionResults
} from '../domain/common/ResponseFieldLowering';
