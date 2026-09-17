import { describe, expect, it } from 'vitest';
import type { ResponseContract, ResponseValueContract } from '../responseContracts';
import { createResponseFieldName, createResponseTypeName } from '../semanticValueFactories';

describe('Phase 87.47 upstream response ADT', () => {
    it('keeps value meaning closed and independent from TS primitive names', () => {
        const values: ResponseValueContract[] = [
            { kind: 'scalar', value: { kind: 'textual' } },
            { kind: 'scalar', value: { kind: 'whole_number' } },
            { kind: 'scalar', value: { kind: 'decimal_number' } },
            { kind: 'scalar', value: { kind: 'boolean_flag' } },
            { kind: 'named_type', name: createResponseTypeName('User') },
            { kind: 'unresolved_declaration', reason: 'mixed_declaration' },
        ];
        expect(values).toHaveLength(7);
    });

    it('carries typed names and nullability through the contract boundary', () => {
        const contract: ResponseContract = {
            kind: 'object',
            name: createResponseTypeName('RegisterResponse'),
            shape: 'single',
            fields: [
                {
                    name: createResponseFieldName('success'),
                    value: { kind: 'scalar', value: { kind: 'boolean_flag' } },
                    nullability: { kind: 'required' },
                },
                {
                    name: createResponseFieldName('message'),
                    value: { kind: 'scalar', value: { kind: 'textual' } },
                    nullability: { kind: 'required' },
                },
                {
                    name: createResponseFieldName('data'),
                    value: { kind: 'unresolved_declaration', reason: 'mixed_declaration' },
                    nullability: { kind: 'nullable' },
                },
            ],
        };

        expect(contract.name.value).toBe('RegisterResponse');
        expect(contract.fields[2].value.kind).toBe('unresolved_declaration');
    });
});
