import { parsePhpExpression, PhpExpressionParseError } from '../expressionParser';
import { matchOffset } from '../ast/offsetCatamorphism';

describe('Phase 87.5 ecommerce_shop parser boundary', () => {
    test('parses real ecommerce property chains through the AST boundary', () => {
        const node = parsePhpExpression('$request->user()->id');
        expect(node.kind).toBe('property_access');
    });

    test('parse failure is a boundary error, not semantic unknown', () => {
        expect(() => parsePhpExpression('$request->?')).toThrow(PhpExpressionParseError);
    });

    test('missing offset cannot become an empty string', () => {
        expect(() => matchOffset({ kind: 'nullkeyword' }, {
            identifier: node => node.name,
            string: node => node.value,
            number: node => String(node.value),
            variable: node => node.name
        })).toThrow(/invalid offset/i);
    });
});
