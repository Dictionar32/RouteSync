/**
 * fieldConverter.ts
 *
 * Convert Target-Agnostic ResolvedSemanticType to ResponseFieldProjection ConversionResult.
 *
 * @module compiler/domain/common/response-lowering/mapper
 */

import type { ResponseFieldProjection } from '../../../../generators/contract-generation/response-field';
import { ConversionResult, createConversionResult } from '../../ConversionResult';
import type { SemanticTypeResolverLike } from '../../semantic-resolver';
import type {
    ResolvedSemanticType
} from '../../ResolvedSemanticType';
import {
    type StageResult,
    partitionResults
} from '../loweringContracts';
import { resolveResponseFieldOperation, type ResponseFieldOperation } from './responseFieldSemanticRelations';
import { relationFold, relationOptionFold, relationFirst, relationResolve, relationProject } from '../../../../../semantic/foundation/relationalSequence';
import { relationEqual } from '../../../../../semantic/foundation/semanticRelations';

export function convertResolvedTypeToResponseField(
    fieldName: string,
    resolved: ResolvedSemanticType,
    resolver: SemanticTypeResolverLike
): StageResult<ResponseFieldProjection> {
    const operation = resolveResponseFieldOperation(resolved.kind);
    return RESPONSE_FIELD_CONVERTERS[operation](fieldName, resolved, resolver);
}

type ResponseFieldConverterRegistry = {
    readonly [K in ResponseFieldOperation]: (
        fieldName: string,
        resolved: ResolvedSemanticType,
        resolver: SemanticTypeResolverLike,
    ) => StageResult<ResponseFieldProjection>;
};

const RESPONSE_FIELD_CONVERTERS: ResponseFieldConverterRegistry = Object.freeze({
    primitive: (fieldName, resolved) => createConversionResult({
        fields: [{ name: fieldName, kind: 'primitive', type: (resolved as Extract<ResolvedSemanticType, { kind: 'primitive' }>).primitiveKind, nullable: false, optional: false, fields: Object.freeze([]),  }],
    }),
    reference: (fieldName, resolved) => createConversionResult({
        fields: [{ name: fieldName, kind: 'primitive', type: (resolved as Extract<ResolvedSemanticType, { kind: 'reference' }>).name, nullable: false, optional: false, fields: Object.freeze([]),  }],
    }),
    nullable: (fieldName, resolved, resolver) => {
        const innerResult = convertResolvedTypeToResponseField(fieldName, (resolved as Extract<ResolvedSemanticType, { kind: 'nullable' | 'optional' }>).innerType, resolver);
        return relationOptionFold(
            relationFirst(innerResult.fields, () => true),
            () => createConversionResult(),
            itemType => createConversionResult({ fields: [{ ...itemType, nullable: true }], warnings: innerResult.warnings }),
        );
    },
    optional: (fieldName, resolved, resolver) => {
        const innerResult = convertResolvedTypeToResponseField(fieldName, (resolved as Extract<ResolvedSemanticType, { kind: 'nullable' | 'optional' }>).innerType, resolver);
        return relationOptionFold(
            relationFirst(innerResult.fields, () => true),
            () => createConversionResult(),
            itemType => createConversionResult({ fields: [{ ...itemType, optional: true }], warnings: innerResult.warnings }),
        );
    },
    collection: (fieldName, resolved, resolver) => {
        const innerResult = convertResolvedTypeToResponseField('item', (resolved as Extract<ResolvedSemanticType, { kind: 'collection' }>).elementType, resolver);
        return createConversionResult({
            fields: [{ name: fieldName, kind: 'array', type: 'array', nullable: false, optional: false, fields: Object.freeze([]), ...relationOptionFold(
                relationFirst(innerResult.fields, () => true),
                () => ({}),
                item => ({ itemType: item }),
            ) }],
            warnings: innerResult.warnings,
        });
    },
    object: (fieldName, resolved, resolver) => {
        const conversionResults = relationProject((resolved as Extract<ResolvedSemanticType, { kind: 'object' }>).fields, ({ name: propName, type: propType, presence }) => {
            const fieldResult = convertResolvedTypeToResponseField(propName.value.value, propType, resolver);
            return relationOptionFold(
                relationFirst(fieldResult.fields, () => true),
                () => fieldResult,
                item => relationResolve(
                    relationEqual(presence.kind, 'required'),
                    () => fieldResult,
                    () => createConversionResult({ fields: [{ ...item, optional: true }], warnings: fieldResult.warnings }),
                ),
            );
        });
        const { fields: nestedFields, warnings: nestedWarnings } = partitionResults(conversionResults);
        return createConversionResult({
            fields: [{ name: fieldName, kind: 'object', type: 'object', nullable: false, optional: false, fields: nestedFields,  }],
            warnings: nestedWarnings,
        });
    },
    unknown: (fieldName, resolved) => createConversionResult({
        warnings: [`Skipped field '${fieldName}': ${(resolved as Extract<ResolvedSemanticType, { kind: 'unknown' }>).diagnosticMessage}`],
    }),
    unsupported: (fieldName, resolved) => createConversionResult({
        warnings: [`Skipped field '${fieldName}': unsupported SemanticType kind '${resolved.kind}'`],
    }),

});
