import { describe, expect, it } from 'vitest';
import type { ResponseContract } from '../responseContracts';
import { createResponseFieldName, createResponseTypeName } from '../semanticValueFactories';

/** Regression: Laravel `mixed` is unresolved, never an invented empty payload. */
describe('ResponseContract upstream invariant', () => {
    it('preserves RegisterResponse declaration meaning at the boundary', () => {
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

        expect(contract.shape).toBe('single');
        expect(contract.fields[2].value.kind).toBe('unresolved_declaration');
    });

    it('does not model an individual field as a response-level empty payload', () => {
        const field = {
            name: createResponseFieldName('data'),
            value: { kind: 'unresolved_declaration', reason: 'mixed_declaration' as const },
            nullability: { kind: 'nullable' as const },
        };

        expect(field.value.kind).not.toBe('empty_value');
    });
});
