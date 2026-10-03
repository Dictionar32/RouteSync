import { describe, expect, it } from 'vitest';
import {
    resolvePrimitiveProjection,
    resolveTypeExpressionProjection,
} from './typeExpressionSemanticRelations';

const TYPE_EXPRESSION_KINDS = [
    'primitive', 'reference', 'array', 'array_map', 'mixed', 'union', 'intersection',
    'nullable', 'optional', 'uninhabited', 'error', 'object', 'generic', 'callable',
] as const;

const PRIMITIVE_KINDS = [
    'string', 'number', 'boolean', 'date_time', 'file', 'json', 'unspecified',
] as const;

describe('Phase 258 declarative type-expression semantic relations', () => {
    it('derives every TypeExpression projection through relation rewrites', () => {
        for (const kind of TYPE_EXPRESSION_KINDS) {
            const type = kind === 'primitive'
                ? { kind, value: { kind: 'string' as const } }
                : { kind } as never;
            expect(resolveTypeExpressionProjection(type)).toBe(kind);
        }
    });

    it('derives every primitive projection through relation rewrites', () => {
        for (const kind of PRIMITIVE_KINDS) {
            expect(resolvePrimitiveProjection({ kind })).toBe(kind);
        }
    });
});
