import { describe, expect, test } from 'vitest';
import { LaravelSourceLexer } from '../LaravelSourceLexer';

describe('ecommerce_shop PHP AST boundary Phase 87.2', () => {
    test('preserves closure parameters, captures, block, and return syntax', () => {
        const ast = LaravelSourceLexer.classifyAstValue(
            "function ($query) use ($request) { $query->where('user_id', $request->user()->id); }"
        );

        expect(ast.kind).toBe('closure');
        if (ast.kind !== 'closure') return;
        expect(ast.parameters[0]?.variable).toBe('query');
        expect(ast.captures[0]).toEqual({ kind: 'by_value', variable: 'request' });
        expect(ast.body.kind).toBe('block');
        expect(ast.body.statements).toHaveLength(1);
    });

    test('preserves arrow-function expression body', () => {
        const ast = LaravelSourceLexer.classifyAstValue(
            "fn($q) => $q->where('user_id', $request->user()->id)"
        );

        expect(ast.kind).toBe('arrow_function');
        if (ast.kind !== 'arrow_function') return;
        expect(ast.parameters[0]?.variable).toBe('q');
        expect(ast.body.kind).toBe('method_chain');
    });

    test('preserves nested member receiver instead of flattening request->user()->id', () => {
        const ast = LaravelSourceLexer.classifyAstValue('$request->user()->id');

        expect(ast.kind).toBe('property_access');
        if (ast.kind !== 'property_access') return;
        expect(ast.property).toBe('id');
        expect(ast.receiver.kind).toBe('method_chain');
    });

    test('preserves associative array keys and argument roles in updateOrCreate shape', () => {
        const ast = LaravelSourceLexer.classifyAstValue(
            "ProductReview::updateOrCreate(['produk_item_id' => $produk->id], ['rating' => $request->integer('rating')])"
        );

        expect(ast.kind).toBe('static_call');
        if (ast.kind !== 'static_call') return;
        expect(ast.arguments).toHaveLength(2);
        expect(ast.arguments[0]?.kind).toBe('positional');
        expect(ast.arguments[0]?.kind).toBe('nested_array');
        if (ast.arguments[0]?.kind !== 'nested_array') return;
        const entry = ast.arguments[0].entries[0];
        expect(entry?.kind).toBe('keyed');
        if (entry?.kind !== 'keyed') return;
        expect(entry.key).toEqual({ kind: 'string', value: 'produk_item_id' });
    });
});
