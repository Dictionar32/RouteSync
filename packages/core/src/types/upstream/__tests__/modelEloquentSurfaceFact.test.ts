import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, expectTypeOf, test } from 'vitest';
import { LaravelSourceLexer } from '../../../compiler/scanner/LaravelSourceLexer';
import type { EloquentRelationAst } from '../eloquent';
import type { ModelSurfaceMemberFact } from '../modelSourceFacts';

describe('model Eloquent surface ADT', () => {
  test('represents the Category hasMany source as an Eloquent relation member', () => {
    const categorySource = readFileSync(
      path.resolve(process.cwd(), 'examples/ecommerce-shop-source/app/Models/Category.php'),
      'utf8'
    );
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
