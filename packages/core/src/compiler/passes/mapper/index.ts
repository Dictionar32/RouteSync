/**
 * mapper/index.ts
 *
 * Explicit Sub-Domain Exports for API Read/Form Mapper Generation.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module compiler/passes/mapper
 */

export { buildFieldMappingLine } from './readFieldLineBuilder';

export {
    buildReadMapperFromContract,
    buildReadMapperFromFields,
    indent
} from './readMapperBuilder';

export { buildFormFieldLine } from './formFieldLineBuilder';

export {
    buildFormMapperFromContract,
    buildFormMapper,
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
