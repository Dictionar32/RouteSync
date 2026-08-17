import { describe, expect, it } from 'vitest';
import { primitiveType } from '../../types/TypeIR';
import {
    collectionShape,
    createEmptyResponse,
    createPrimitiveResponse,
    paginatedShape,
    singleShape,
} from '../ResponseIR';
import { StructuredResponseIRBuilder } from '../StructuredResponseIRBuilder';

describe('Phase 4C — Structured Response IR', () => {
    const builder = new StructuredResponseIRBuilder();

    it('represents a single resource response structurally', () => {
        const response = builder.build({
            id: 'orders.show',
            analysis: {
                kind: 'resource',
                resource: 'OrderResource',
                model: 'Order',
                shape: singleShape(),
            },
            status: 200,
            contentType: 'application/json',
        });

        expect(response.payload).toEqual({
            kind: 'resource',
            resource: 'OrderResource',
            model: 'Order',
            shape: { kind: 'single' },
        });
        expect(response.transport.kind).toBe('http');
    });

    it('makes collection shape part of the resource payload', () => {
        const response = builder.build({
            id: 'orders.index',
            analysis: {
                kind: 'resource',
                resource: 'OrderResource',
                shape: collectionShape(),
            },
        });

        expect(response.payload.kind).toBe('resource');
        if (response.payload.kind === 'resource') {
            expect(response.payload.shape.kind).toBe('collection');
        }
    });

    it('preserves nested TypeIR without re-discriminating the response', () => {
        const response = builder.build({
            id: 'orders.show',
            analysis: {
                kind: 'object',
                schema: {
                    kind: 'inline_object',
                    properties: {
                        totalHarga: primitiveType('number'),
                    },
                    additionalProperties: false,
                },
                shape: paginatedShape(),
            },
        });

        expect(response.payload).toEqual({
            kind: 'object',
            shape: { kind: 'paginated' },
            schema: {
                kind: 'inline_object',
                properties: {
                    totalHarga: {
                        kind: 'primitive',
                        type: 'number',
                    },
                },
                additionalProperties: false,
            },
        });
    });

    it('supports explicit empty response without transport/body guessing', () => {
        expect(createEmptyResponse()).toEqual({ kind: 'empty' });
        expect(createPrimitiveResponse('string')).toEqual({
            kind: 'primitive',
            primitiveType: 'string',
        });
    });
});
