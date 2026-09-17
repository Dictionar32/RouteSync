import { adaptPhpAstBoundary } from '../boundaryAdapter';

describe('Phase 87.6 PHP AST interface contract', () => {
    test('static property lookup preserves static-property semantics', () => {
        const node = adaptPhpAstBoundary({
            kind: 'staticlookup',
            what: { kind: 'name', name: 'App\\Models\\User' },
            offset: { kind: 'variable', name: 'email' }
        }, 'App\\Models\\User::$email');

        expect(node).toMatchObject({
            kind: 'static_property_lookup',
            className: { kind: 'class_name', value: 'App\\Models\\User' },
            property: { kind: 'property_name', value: 'email' }
        });
    });

    test('static constant lookup is not mislabeled as static property access', () => {
        const node = adaptPhpAstBoundary({
            kind: 'staticlookup',
            what: { kind: 'name', name: 'App\\Models\\User' },
            offset: { kind: 'identifier', name: 'STATUS' }
        }, 'App\\Models\\User::STATUS');

        expect(node).toMatchObject({
            kind: 'static_constant',
            className: { kind: 'class_name', value: 'App\\Models\\User' },
            constantName: { kind: 'constant_name', value: 'STATUS' }
        });
    });

    test('qualified class identity is preserved at the AST boundary', () => {
        const node = adaptPhpAstBoundary({
            kind: 'staticlookup',
            what: { kind: 'name', name: 'App\\Domain\\Orders\\Order' },
            offset: { kind: 'identifier', name: 'STATUS' }
        }, 'App\\Domain\\Orders\\Order::STATUS');

        expect(node).toMatchObject({
            kind: 'static_constant',
            className: { value: 'App\\Domain\\Orders\\Order' }
        });
    });
});
