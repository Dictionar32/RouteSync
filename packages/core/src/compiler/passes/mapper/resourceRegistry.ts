/**
 * Mapper contract consumer.
 *
 * No resource/type/mapping classification happens here. The upstream semantic
 * mapping contract is already closed; this module only assembles projection
 * fragments and validates that referenced contracts are present.
 */
import type { SemanticMappingContract } from '../../../types/upstream/semanticMapping';
import { buildReadMapperFromContract } from './readMapperBuilder';
import { buildFormMapperFromContract } from './formMapperBuilder';

export interface CollectedMapperParts {
    readonly readMapperBlocks: readonly string[];
    readonly formMapperBlocks: readonly string[];
    readonly contractImports: readonly string[];
    readonly formTypeImports: readonly string[];
    readonly readTypeImports: readonly string[];
    readonly hasApiField: boolean;
}

export function collectMapperParts(mapping: SemanticMappingContract): CollectedMapperParts {
    const readMapperBlocks = mapping.read.map(buildReadMapperFromContract);
    const formMapperBlocks = mapping.write.map(buildFormMapperFromContract);

    return Object.freeze({
        readMapperBlocks: Object.freeze(readMapperBlocks),
        formMapperBlocks: Object.freeze(formMapperBlocks),
        contractImports: Object.freeze([
            ...mapping.write.map(item => item.contractTypeName),
            ...mapping.read.map(item => `${item.apiResponseType}`),
        ]),
        formTypeImports: Object.freeze(mapping.write.map(item => item.formTypeName)),
        readTypeImports: Object.freeze(mapping.read.map(item => item.transformedType)),
        hasApiField: mapping.write.some(item => item.fields.length > 0),
    });
}
