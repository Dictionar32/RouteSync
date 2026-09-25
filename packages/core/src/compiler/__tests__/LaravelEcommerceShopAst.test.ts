import { describe, expect, it } from 'vitest';
import { classifyAstValue } from '../scanner/lexer/astClassifier';

/** Regression vocabulary copied from the Library ecommerce_shop Laravel source. */
describe('ecommerce_shop source AST vocabulary', () => {
    it('preserves null-coalesce over array access', () => {
        const ast = classifyAstValue("$payload['transaction_id'] ?? $payment->provider_txn_id");
        expect(ast.kind).toBe('null_coalesce');
        if (ast.kind !== 'null_coalesce') return;
        expect(ast.left.kind).toBe('array_access');
        expect(ast.right.kind).toBe('property_access');
    });

    it('preserves nullsafe property access', () => {
        const ast = classifyAstValue('$this->order?->order_number');
        expect(ast.kind).toBe('property_access');
        if (ast.kind !== 'property_access') return;
        expect(ast.access.kind).toBe('nullsafe');
    });

    it('preserves short ternary', () => {
        const ast = classifyAstValue("$request->input('redirect_to') ?: config('services.oauth.frontend_redirect_default')");
        expect(ast.kind).toBe('short_ternary');
    });

    it('preserves explicit casts', () => {
        const ast = classifyAstValue('(int) ($promo->discount_value ?? 0)');
        expect(ast.kind).toBe('cast_expression');
    });

    it('preserves function calls as syntax nodes', () => {
        const ast = classifyAstValue("is_array($gateway)");
        expect(ast.kind).toBe('function_call');
    });

    it('preserves match as a syntax node', () => {
        const ast = classifyAstValue("match ($provider) { 'google' => ['openid', 'email'], default => ['email'] }");
        expect(ast.kind).toBe('match_expression');
    });

    it('preserves anonymous migration class and its extends datum', () => {
        const ast = classifyAstValue('new class extends Migration { public function up(): void { Schema::create(\'x\', function () {}); } }');
        expect(ast.kind).toBe('anonymous_class_construct');
        if (ast.kind !== 'anonymous_class_construct') return;
        expect(ast.class.extendsClass).toBe('Migration');
        expect(ast.class.members.length).toBe(1);
    });

    it('preserves array access and cast nodes', () => {
        const access = classifyAstValue("$payload['transaction_id']");
        expect(access.kind).toBe('array_access');
        const cast = classifyAstValue('(int) ($promo->discount_value ?? 0)');
        expect(cast.kind).toBe('cast_expression');
    });

    it('preserves structured access mode and operators', () => {
        const property = classifyAstValue('$this->order?->order_number');
        expect(property.kind).toBe('property_access');
        if (property.kind === 'property_access') expect(property.access.kind).toBe('nullsafe');
        const binary = classifyAstValue('$amount + 10');
        expect(binary.kind).toBe('binary_expression');
        if (binary.kind === 'binary_expression') expect(binary.operator.kind).toBe('addition');
    });
});
