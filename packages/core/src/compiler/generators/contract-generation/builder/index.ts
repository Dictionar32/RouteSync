/**
 * index.ts
 *
 * Sub-domain exports for contract code builders.
 *
 * @module compiler/generators/contract-generation/builder
 */

export {
    type GeneratedContract,
    type ResponseSchema,
    type BuiltContractCode,
    type SectionInfo,
    capitalize
} from './contractBuilderTypes';

export {
    buildResponseSchemasSection,
    buildResponseTypesSection,
    buildResponseValidatorsSection
} from './responseSectionBuilder';

export {
    buildSchemaSection,
    buildTypeSection,
    buildValidatorSection
} from './requestSectionBuilder';

export { buildExportsSection } from './exportsSectionBuilder';
export { buildErrorSection } from './errorSectionBuilder';
