/**
 * semanticTypeConverter.ts
 *
 * Converts semantic type models to TypeIR trees.
 *
 * @module core/ir/domain/field-type
 */

import type {
    TypeIR,
    ResolvedSemanticType
} from '../../../types/ir';
import { matchResolvedSemanticType } from '../../../types/ir';
import type { DiagnosticCollector } from '../irTypes';
import { SemanticTypeResolvers } from '../SemanticTypeResolvers';

export function convertSemanticToTypeIR(
    semanticType: ResolvedSemanticType,
    diagnostics: DiagnosticCollector
): TypeIR {
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
