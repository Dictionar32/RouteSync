/**
 * mapper/index.ts
 *
 * Explicit Sub-Domain Exports for API Read/Form Mapper Generation.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module compiler/passes/mapper
 */

export {
    buildReadMapperFromFields,
    buildFieldMappingLine,
    indent
} from './readMapperBuilder';

export {
    buildFormMapper,
    buildFormFieldLine,
    toApiFieldKey
} from './formMapperBuilder';

export {
    collectMapperParts,
    type CollectedMapperParts
} from './resourceRegistry';

export {
    assembleMapperCode,
    buildMapperArtifact,
    buildEmptyMapperArtifact
} from './mapperAssembler';
