import { adaptPhpAstBoundary } from '../boundaryAdapter';

/**
 * Phase 87 contract fixtures derived from ecommerce_shop evidence:
 * - whereHas('order', function ($query) use ($request) { ... })
 * - Payment::where(...)->whereHas('order', fn($q) => ...)
 * - updateOrCreate([...], [...]) associative entries
 */

describe('Phase 87 ecommerce_shop PHP AST boundary', () => {
    test('preserves closure parameters, captures, block statements and argument roles', () => {
        const closure = adaptPhpAstBoundary({
            kind: 'closure',
            arguments: [{ kind: 'parameter', name: 'query' }],
            uses: [{ kind: 'useitem', variable: { kind: 'variable', name: 'request' }, byref: false }],
            body: {
                kind: 'block',
                children: [{
                    kind: 'expressionstatement',
                    expression: {
                        kind: 'call',
                        what: { kind: 'identifier', name: 'noop' },
                        arguments: [{ kind: 'variable', name: 'query' }]
                    }
                }]
            }
        }, 'function ($query) use ($request) { $query; }');

        if (closure.kind !== 'closure') throw new Error('expected closure');
        expect(closure.parameters[0].variable.value).toBe('query');
        expect(closure.captures[0].variable.value).toBe('request');
        expect(closure.body.statements).toHaveLength(1);
    });

    test('preserves associative array key structure instead of flattening key to string', () => {
        const node = adaptPhpAstBoundary({
            kind: 'array',
            items: [{
                kind: 'entry',
                key: { kind: 'string', value: 'produk_item_id' },
                value: { kind: 'propertylookup', what: { kind: 'variable', name: 'produk' }, offset: { kind: 'identifier', name: 'id' } }
            }]
        }, "['produk_item_id' => $produk->id]");

        if (node.kind !== 'array') throw new Error('expected array');
        expect(node.items[0].key.kind).toBe('explicit');
        if (node.items[0].key.kind === 'explicit') {
            expect(node.items[0].key.expression.kind).toBe('literal');
        }
    });

    test('preserves arrow-function body as expression and parameters', () => {
        const node = adaptPhpAstBoundary({
            kind: 'arrowfunc',
            arguments: [{ kind: 'parameter', name: 'q' }],
            body: {
                kind: 'call',
                what: { kind: 'propertylookup', what: { kind: 'variable', name: 'q' }, offset: { kind: 'identifier', name: 'where' } },
                arguments: [{ kind: 'string', value: 'user_id' }, { kind: 'propertylookup', what: { kind: 'variable', name: 'request' }, offset: { kind: 'identifier', name: 'id' } }]
            }
        }, "fn($q) => $q->where('user_id', $request->id)");

        if (node.kind !== 'arrow_func') throw new Error('expected arrow function');
        expect(node.parameters[0].variable.value).toBe('q');
        expect(node.body.kind).toBe('method_call');
        if (node.body.kind === 'method_call') expect(node.body.args).toHaveLength(2);
    });
});

describe('Phase 87.3 boundary rejection', () => {
    test('rejects missing property member instead of creating an empty property name', () => {
        expect(() => adaptPhpAstBoundary({
            kind: 'propertylookup',
            what: { kind: 'variable', name: 'request' }
        }, '$request->?')).toThrow(/missing|invalid/i);
    });

    test('rejects invalid method member instead of creating an empty method name', () => {
        expect(() => adaptPhpAstBoundary({
            kind: 'call',
            what: {
                kind: 'propertylookup',
                what: { kind: 'variable', name: 'request' },
                offset: { kind: 'number', value: 1 }
            },
            arguments: []
        }, '$request->1()')).toThrow(/invalid method/i);
    });
});
