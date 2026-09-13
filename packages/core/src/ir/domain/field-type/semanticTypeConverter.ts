/**
 * semanticTypeConverter.ts
 *
 * Converts semantic type models to TypeIR trees.
 *
 * @module core/ir/domain/field-type
 */

import type {
    TypeIR,
    PrimitiveTypeIR,
    ResolvedSemanticType
} from '../../../types/ir';
import { matchResolvedSemanticType } from '../../../types/ir';
import type { SemanticType } from '../../../types/semantic';
import { PRIMITIVE_RESOLVED_TYPES, type DiagnosticCollector } from '../irTypes';
import { SemanticTypeResolvers } from '../SemanticTypeResolvers';

export function convertSemanticToTypeIR(
    semanticType: SemanticType | ResolvedSemanticType | undefined,
    diagnostics: DiagnosticCollector
): TypeIR {
    if (!semanticType) {
        return { kind: 'primitive', type: 'unknown' };
    }

    if (typeof semanticType === 'string') {
        return { kind: 'primitive', type: semanticType as PrimitiveTypeIR['type'] };
    }

    if (typeof semanticType !== 'object' || !semanticType.kind) {
        diagnostics.warn('Invalid semantic type structure', semanticType);
        return { kind: 'primitive', type: 'unknown' };
    }

    const resolvedSemantic = semanticType;
    if (resolvedSemantic.resolved?.type && PRIMITIVE_RESOLVED_TYPES.has(resolvedSemantic.resolved.type)) {
        diagnostics.info(`Using resolved type: ${resolvedSemantic.resolved.type}`);
        return { kind: 'primitive', type: resolvedSemantic.resolved.type as PrimitiveTypeIR['type'] };
    }

    try {
        return matchResolvedSemanticType(semanticType, {
            primitive: p => SemanticTypeResolvers.resolvePrimitive(p),
            resource: r => SemanticTypeResolvers.resolveResource(r),
            model: m => SemanticTypeResolvers.resolveModel(m),
            object: o => SemanticTypeResolvers.resolveObject(o, (type) => convertSemanticToTypeIR(type, diagnostics)),
            array: a => SemanticTypeResolvers.resolveArray(a, (type) => convertSemanticToTypeIR(type, diagnostics)),
            union: u => SemanticTypeResolvers.resolveUnion(u, (type) => convertSemanticToTypeIR(type, diagnostics)),
            literal: l => SemanticTypeResolvers.resolveLiteral(l)
        });
    } catch (error) {
        diagnostics.error(`Error resolving semantic type: ${error}`, { semanticType, error });
        return { kind: 'primitive', type: 'unknown' };
    }
}
