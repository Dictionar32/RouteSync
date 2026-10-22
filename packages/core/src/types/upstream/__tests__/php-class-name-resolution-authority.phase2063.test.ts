import { describe, expect, it } from 'vitest';
import { phpClassNameResolutionAuthority } from '../phpClassNameResolutionAuthority';
import { createClassName } from '../names';
import { createPhpQualifiedClassName } from '../phpClassNameResolutionInterface';
import type { PhpClassNameResolutionContext } from '../phpClassNameResolutionInterface';

const context = (
  namespace: string,
  classImports: PhpClassNameResolutionContext['classImports'] = Object.freeze([]),
  importInventory: PhpClassNameResolutionContext['importInventory'] = 'complete',
): PhpClassNameResolutionContext => Object.freeze({
  kind: 'php_class_name_resolution_context',
  namespaceName: createPhpQualifiedClassName(namespace),
  classImports,
  importInventory,
});

const judge = (sourceName: string, lexical: PhpClassNameResolutionContext) => phpClassNameResolutionAuthority.judge(Object.freeze({
  kind: 'php_class_name_resolution_input',
  sourceName: createClassName(sourceName),
  context: lexical,
}));

describe('shared PHP class-name resolution authority phase 2063', () => {
  it('resolves fully qualified names without lexical import dependence', () => {
    expect(judge('\\Vendor\\BaseController', context('App\\Http\\Controllers', [], 'incomplete'))).toMatchObject({
      kind: 'php_class_name_resolved', qualifiedName: { value: { value: 'Vendor\\BaseController' } }, rule: 'fully_qualified',
    });
  });

  it('resolves aliases for simple and qualified class references', () => {
    const imports = [{ kind: 'php_class_import_binding' as const, alias: createClassName('Parent'), target: createPhpQualifiedClassName('Vendor\\BaseController') }];
    expect(judge('Parent', context('App\\Http\\Controllers', imports))).toMatchObject({ kind: 'php_class_name_resolved', rule: 'class_import', qualifiedName: { value: { value: 'Vendor\\BaseController' } } });
    expect(judge('Parent\\Nested', context('App\\Http\\Controllers', imports))).toMatchObject({ kind: 'php_class_name_resolved', rule: 'class_import', qualifiedName: { value: { value: 'Vendor\\BaseController\\Nested' } } });
  });


  it('closes malformed empty and separator-only references instead of manufacturing class identities', () => {
    expect(judge('', context('App\\Http\\Controllers'))).toMatchObject({
      kind: 'php_class_name_resolution_blocked', reason: 'malformed_class_name',
    });
    expect(judge('\\', context('App\\Http\\Controllers'))).toMatchObject({
      kind: 'php_class_name_resolution_blocked', reason: 'malformed_class_name',
    });
    expect(judge('Vendor\\\\Model', context('App\\Http\\Controllers'))).toMatchObject({
      kind: 'php_class_name_resolution_blocked', reason: 'malformed_class_name',
    });
    expect(judge('namespace\\', context('App\\Http\\Controllers'))).toMatchObject({
      kind: 'php_class_name_resolution_blocked', reason: 'malformed_class_name',
    });
  });

  it('resolves namespace-relative and current-namespace references only with complete import evidence', () => {
    expect(judge('namespace\\Contracts\\Parent', context('App\\Http\\Controllers'))).toMatchObject({ kind: 'php_class_name_resolved', rule: 'namespace_relative', qualifiedName: { value: { value: 'App\\Http\\Controllers\\Contracts\\Parent' } } });
    expect(judge('Parent', context('App\\Http\\Controllers'))).toMatchObject({ kind: 'php_class_name_resolved', rule: 'current_namespace' });
    expect(judge('Parent', context('App\\Http\\Controllers', [], 'incomplete'))).toMatchObject({ kind: 'php_class_name_resolution_blocked', reason: 'class_import_inventory_incomplete' });
  });
  it('preserves missing lexical context as an explicit blocked judgment', () => {
    expect(phpClassNameResolutionAuthority.judge(Object.freeze({
      kind: 'php_class_name_resolution_input',
      sourceName: createClassName('UserDto'),
      context: Object.freeze({ kind: 'php_class_name_resolution_context_unavailable' as const }),
    }))).toMatchObject({
      kind: 'php_class_name_resolution_blocked',
      reason: 'class_name_resolution_context_unavailable',
    });
  });

  it('resolves fully qualified names even when lexical context is unavailable', () => {
    expect(phpClassNameResolutionAuthority.judge(Object.freeze({
      kind: 'php_class_name_resolution_input',
      sourceName: createClassName('\\Vendor\\Contracts\\UserDto'),
      context: Object.freeze({ kind: 'php_class_name_resolution_context_unavailable' as const }),
    }))).toMatchObject({
      kind: 'php_class_name_resolved',
      qualifiedName: { value: { value: 'Vendor\\Contracts\\UserDto' } },
      rule: 'fully_qualified',
    });
  });

});
