import { adaptPhpAstBoundary } from '../boundaryAdapter';
import { matchPhpGrammar } from '../ast/grammarCatamorphism';
import type { PhpGrammarVisitor } from '../ast/grammarCatamorphism';

describe('Phase 87.4 ecommerce_shop AST grammar boundary', () => {
    test('does not silently classify grammar-only identifier nodes as expression AST', () => {
        const visitor: PhpGrammarVisitor<string> = {
            propertylookup: () => 'property',
            nullsafepropertylookup: () => 'nullsafe',
            offsetlookup: () => 'offset',
            staticlookup: () => 'static',
            call: () => 'call',
            new: () => 'new',
            closure: () => 'closure',
            arrowfunc: () => 'arrow',
            bin: () => 'bin',
            unary: () => 'unary',
            cast: () => 'cast',
            retif: () => 'ternary',
            array: () => 'array',
            string: () => 'string',
            number: () => 'number',
            boolean: () => 'boolean',
            nullkeyword: () => 'null',
            encapsed: () => 'encapsed',
            variable: () => 'variable',
            unknown: () => 'unknown'
        };

        expect(() => matchPhpGrammar({ kind: 'identifier', name: 'noop' }, visitor)).toThrow();
    });

    test('keeps ecommerce static method structure', () => {
        const node = adaptPhpAstBoundary({
            kind: 'call',
            what: {
                kind: 'staticlookup',
                what: { kind: 'name', name: 'ProductReview' },
                offset: { kind: 'identifier', name: 'updateOrCreate' }
            },
            arguments: []
        }, 'ProductReview::updateOrCreate()');

        expect(node.kind).toBe('static_method_call');
        if (node.kind === 'static_method_call') {
            expect(node.className.value).toBe('ProductReview');
            expect(node.name.value).toBe('updateOrCreate');
        }
    });
});
