import { describe, expect, test } from 'vitest';
import { LaravelSourceLexer } from '../LaravelSourceLexer';
import { parseModelDeclaration } from '../lexer';
import { parseModelRelations } from '../subscanners/model/memberRelationsParser';
import { createModelName } from '../../../../types/upstream/names';

const sourceSpan = {
  kind: 'source_span' as const,
  file: { kind: 'source_file' as const, value: { kind: 'string_value' as const, value: '<phase999>' } },
  start: { kind: 'number_value' as const, value: 0 },
  end: { kind: 'number_value' as const, value: 400 },
};

describe('Eloquent explicit relation key closure', () => {
  test('preserves belongsTo foreign/owner keys as an upstream RelationKey', () => {
    const source = `<?php final class OrderDetail extends Model { public function order() { return $this->belongsTo(Order::class, 'order_uuid', 'uuid'); } }`;
    const declaration = parseModelDeclaration(LaravelSourceLexer.tokenize(source));
    const relations = parseModelRelations(declaration, createModelName('OrderDetail'), sourceSpan);
    expect(relations).toHaveLength(1);
    expect(relations[0]?.key).toEqual({
      kind: 'explicit',
      foreign: { kind: 'column_name', value: { kind: 'string_value', value: 'order_uuid' } },
      local: { kind: 'column_name', value: { kind: 'string_value', value: 'uuid' } },
    });
  });

  test('does not invent id when only a foreign key is explicit', () => {
    const source = `<?php final class Order { public function details() { return $this->hasMany(OrderDetail::class, 'order_uuid'); } }`;
    const declaration = parseModelDeclaration(LaravelSourceLexer.tokenize(source));
    const relations = parseModelRelations(declaration, createModelName('Order'), sourceSpan);
    expect(relations[0]?.key).toEqual({
      kind: 'explicit_foreign',
      foreign: { kind: 'column_name', value: { kind: 'string_value', value: 'order_uuid' } },
    });
  });

  test('preserves hasMany foreign/local keys as an upstream RelationKey', () => {
    const source = `<?php final class Order { public function details() { return $this->hasMany(OrderDetail::class, 'order_uuid', 'uuid'); } }`;
    const declaration = parseModelDeclaration(LaravelSourceLexer.tokenize(source));
    const relations = parseModelRelations(declaration, createModelName('Order'), sourceSpan);
    expect(relations[0]?.key.kind).toBe('explicit');
    if (relations[0]?.key.kind !== 'explicit') return;
    expect(relations[0].key.foreign.value.value).toBe('order_uuid');
    expect(relations[0].key.local.value.value).toBe('uuid');
  });

  test('marks non-direct relation families as not_applicable FK evidence', () => {
    const source = `<?php final class Order { public function users() { return $this->belongsToMany(User::class); } }`;
    const declaration = parseModelDeclaration(LaravelSourceLexer.tokenize(source));
    const relations = parseModelRelations(declaration, createModelName('Order'), sourceSpan);
    expect(relations[0]?.key).toEqual({ kind: 'not_applicable' });
  });

  test('leaves non-literal or absent direct keys as convention evidence', () => {
    const source = `<?php final class Order { public function details() { return $this->hasMany(OrderDetail::class); } }`;
    const declaration = parseModelDeclaration(LaravelSourceLexer.tokenize(source));
    const relations = parseModelRelations(declaration, createModelName('Order'), sourceSpan);
    expect(relations[0]?.key).toEqual({ kind: 'convention' });
  });
});
