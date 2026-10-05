import { describe, expect, expectTypeOf, test } from 'vitest';
import { LaravelSourceLexer } from '../../../compiler/scanner/LaravelSourceLexer';
import type { EloquentRelationAst } from '../eloquent';
import type { ModelSurfaceMemberFact } from '../modelSourceFacts';

describe('model Eloquent surface ADT', () => {
  test('represents the Category hasMany source as an Eloquent relation member', () => {
    const categorySource = `<?php
final class Category {
    public function produkItems(): HasMany { return $this->hasMany(ProdukItem::class); }
}`;
    expect(categorySource).toContain('return $this->hasMany(ProdukItem::class);');

    const expression = LaravelSourceLexer.classifyAstValue('$this->hasMany(ProdukItem::class)');
    expect(expression.kind).toBe('method_chain');
    if (expression.kind !== 'method_chain') return;
    expect(expression.property).toBe('hasMany');
    expect(expression.arguments[0]?.value.kind).toBe('class_reference');

    expectTypeOf<Extract<ModelSurfaceMemberFact, { readonly kind: 'eloquent_relation_ast' }>>()
      .toEqualTypeOf<EloquentRelationAst>();
  });
});
