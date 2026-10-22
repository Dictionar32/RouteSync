import { describe, expect, it } from 'vitest';
import { classifyAstValue } from './astClassifier';

describe('PHP AST static-call class-reference source evidence phase 2070', () => {
  it('preserves fully-qualified spelling as parser-owned evidence', () => {
    expect(classifyAstValue('\\Vendor\\DB::table("orders")')).toMatchObject({
      kind: 'static_call',
      classReference: { kind: 'qualified_name', sourceName: '\\Vendor\\DB', terminalName: 'DB', form: 'fully_qualified' },
    });
  });

  it('preserves namespace-relative spelling as parser-owned evidence', () => {
    expect(classifyAstValue('namespace\\Models\\Post::query()')).toMatchObject({
      kind: 'static_call',
      classReference: { kind: 'qualified_name', sourceName: 'namespace\\Models\\Post', terminalName: 'Post', form: 'namespace_relative' },
    });
  });

  it('preserves qualified names requiring namespace/import context without resolving them', () => {
    expect(classifyAstValue('Models\\Post::query()')).toMatchObject({
      kind: 'static_call',
      classReference: { kind: 'qualified_name', sourceName: 'Models\\Post', terminalName: 'Post', form: 'import_or_namespace_dependent' },
    });
  });

  it('preserves simple class names without guessing their canonical identity', () => {
    expect(classifyAstValue('DB::table("orders")')).toMatchObject({
      kind: 'static_call',
      classReference: { kind: 'simple_name', sourceName: 'DB', terminalName: 'DB' },
    });
  });

  it('preserves the lexical terminal segment separately from the full class spelling', () => {
    expect(classifyAstValue('\\App\\Http\\Resources\\PostResource::query()')).toMatchObject({
      kind: 'static_call',
      classReference: {
        kind: 'qualified_name',
        sourceName: '\\App\\Http\\Resources\\PostResource',
        terminalName: 'PostResource',
        form: 'fully_qualified',
      },
    });
  });
});
