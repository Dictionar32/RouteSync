import { adaptPhpAstBoundary } from '../boundaryAdapter';

function loc(start: number, end: number) {
    return { start: { line: 1, column: start, offset: start }, end: { line: 1, column: end, offset: end }, source: null };
}

describe('Phase 87.10 ecommerce_shop PHP AST source contract', () => {
    test('nested property access preserves each node source expression', () => {
        const code = '$review->created_at';
        const node = adaptPhpAstBoundary({
            kind: 'propertylookup', loc: loc(0, 19),
            what: { kind: 'variable', name: 'review', loc: loc(0, 7) },
            offset: { kind: 'identifier', name: 'created_at', loc: loc(9, 19) }
        }, code);
        expect(node.originalCode).toBe(code);
        if (node.kind !== 'property_lookup') throw new Error('expected property lookup');
        expect(node.target.originalCode).toBe('$review');
    });

    test('nested method call preserves call source and target source separately', () => {
        const code = '$request->user()->id';
        const node = adaptPhpAstBoundary({
            kind: 'propertylookup', loc: loc(0, 20),
            what: { kind: 'call', loc: loc(0, 16),
                what: { kind: 'propertylookup', loc: loc(0, 14),
                    what: { kind: 'variable', name: 'request', loc: loc(0, 8) },
                    offset: { kind: 'identifier', name: 'user', loc: loc(10, 14) }
                }, arguments: []
            },
            offset: { kind: 'identifier', name: 'id', loc: loc(18, 20) }
        }, code);
        if (node.kind !== 'property_lookup') throw new Error('expected property lookup');
        expect(node.target.originalCode).toBe('$request->user()');
        if (node.target.kind !== 'method_call') throw new Error('expected method call');
        expect(node.target.target.originalCode).toBe('$request');
    });
});
