import { describe, expect, it } from 'vitest';
import type { ResolvedSemanticType } from '../../types/ResolvedSemanticType';
import { ContractIRTypeBuilder } from '../ContractIRTypeBuilder';

describe('ContractIRTypeBuilder — structured semantic union', () => {
    const builder = new ContractIRTypeBuilder();

    it('builds primitive types without a runtime type guard', () => {
        const input: ResolvedSemanticType = {
            kind: 'primitive',
            type: 'number',
        };

        expect(builder.buildType(input)).toEqual({
            kind: 'primitive',
            type: 'number',
        });
    });

    it('builds resources structurally', () => {
        const input: ResolvedSemanticType = {
            kind: 'resource',
            resource: 'OrderResource',
            collection: true,
        };

        expect(builder.buildType(input)).toEqual({
            kind: 'array',
            items: {
                kind: 'reference',
                target: 'OrderResource',
            },
        });
    });

    it('recursively builds object properties', () => {
        const input: ResolvedSemanticType = {
            kind: 'object',
            properties: {
                totalHarga: {
                    kind: 'primitive',
                    type: 'number',
                },
                gateway: {
                    kind: 'object',
                    properties: {
                        token: {
                            kind: 'primitive',
                            type: 'string',
                        },
                    },
                },
            },
        };

        expect(builder.buildType(input)).toEqual({
            kind: 'inline_object',
            properties: {
                totalHarga: {
                    kind: 'primitive',
                    type: 'number',
                },
                gateway: {
                    kind: 'inline_object',
                    properties: {
                        token: {
                            kind: 'primitive',
                            type: 'string',
                        },
                    },
                    additionalProperties: false,
                },
            },
            additionalProperties: false,
        });
    });

    it('builds unions without a union guard', () => {
        const input: ResolvedSemanticType = {
            kind: 'union',
            types: [
                { kind: 'primitive', type: 'string' },
                { kind: 'primitive', type: 'number' },
            ],
        };

        expect(builder.buildType(input)).toEqual({
            kind: 'union',
            types: [
                { kind: 'primitive', type: 'string' },
                { kind: 'primitive', type: 'number' },
            ],
        });
    });
});
