/**
 * contract-domain/index.ts
 *
 * Explicit Sub-Domain Exports for Contract Generator Domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module compiler/passes/contract-domain
 */

export {
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
    type ExtractedResponseSchemaResult
} from './contractTypes';

export {
    createContractGeneratorDependencies
} from './dependencies';

export {
    mapContractField,
    generateContractAction,
    extractResourceContract,
    extractRequestContracts,
    buildResourceResponseSchemas,
    extractSingleResourceResponseSchemas,
    extractResponseDataSchemas,
    extractRequestTypeResponseSchemas,
    extractResponseSchemas
} from './contractExtraction';

export {
    formatContractFile,
    buildContractArtifact
} from './contractArtifactBuilder';
