import { describe, expect, it } from 'vitest';
import {
    ContractInputBoundary,
    ContractInputBoundaryError,
    type LegacyContractValue,
} from '../ContractInputBoundary';

describe('ContractInputBoundary', () => {
    const boundary = new ContractInputBoundary();

    it('maps a fully structured primitive without inventing information', () => {
        const value: LegacyContractValue = {
            kind: 'primitive',
            type: 'number',
        };

        expect(boundary.resolve(value)).toEqual({
            kind: 'primitive',
            type: 'number',
            format: undefined,
        });
    });

    it('preserves required resource facts', () => {
        const value: LegacyContractValue = {
            kind: 'resource',
            resource: 'OrderResource',
            collection: true,
        };

        expect(boundary.resolve(value)).toEqual({
            kind: 'resource',
            resource: 'OrderResource',
            collection: true,
        });
    });

    it('recursively converts nested objects and arrays', () => {
        const value: LegacyContractValue = {
            kind: 'object',
            properties: {
                totalHarga: {
                    kind: 'primitive',
                    type: 'number',
                },
                items: {
                    kind: 'array',
                    items: {
                        kind: 'resource',
                        resource: 'OrderItemResource',
                        collection: false,
                    },
                },
            },
        };

        expect(boundary.resolve(value)).toEqual({
            kind: 'object',
            properties: {
                totalHarga: {
                    kind: 'primitive',
                    type: 'number',
                    format: undefined,
                },
                items: {
                    kind: 'array',
                    items: {
                        kind: 'resource',
                        resource: 'OrderItemResource',
                        collection: false,
                    },
                },
            },
        });
    });

    it('requires at least two union members instead of manufacturing a type', () => {
        expect(() =>
            boundary.resolve({
                kind: 'union',
                types: [],
            }),
        ).toThrow(ContractInputBoundaryError);

        expect(() =>
            boundary.resolve({
                kind: 'union',
                types: [
                    { kind: 'primitive', type: 'string' },
                ],
            }),
        ).toThrow(ContractInputBoundaryError);
    });

    it('preserves a valid union through the structured contract', () => {
        const value: LegacyContractValue = {
            kind: 'union',
            types: [
                { kind: 'primitive', type: 'string' },
                { kind: 'primitive', type: 'number' },
            ],
        };

        expect(boundary.resolve(value)).toEqual({
            kind: 'union',
            types: [
                {
                    kind: 'primitive',
                    type: 'string',
                    format: undefined,
                },
                {
                    kind: 'primitive',
                    type: 'number',
                    format: undefined,
                },
            ],
        });
    });
});