import { describe, expect, it } from 'vitest';
import { controllerStaticCallOriginAuthority } from '../controllerStaticCallOriginAuthority';
import { createClassName, createMethodName } from '../names';
import { createPhpQualifiedClassName } from '../phpClassNameResolutionInterface';
import { stringValue } from '../valueObjects';
import type { ControllerStaticCallOriginInput } from '../controllerStaticCallOriginInterface';
import type { PhpClassNameResolutionContext } from '../phpClassNameResolutionInterface';

const databaseImport = (alias: string) => Object.freeze({
  kind: 'php_class_import_binding' as const,
  alias: createClassName(alias),
  target: createPhpQualifiedClassName('Illuminate\\Support\\Facades\\DB'),
});

const input = (className: string, classImports: PhpClassNameResolutionContext['classImports'], sourceName = className): ControllerStaticCallOriginInput => Object.freeze({
  kind: 'controller_static_call_origin_input',
  classReference: sourceName.startsWith('\\')
    ? { kind: 'qualified_name' as const, sourceName: createClassName(sourceName), form: 'fully_qualified' as const }
    : sourceName.includes('\\')
      ? { kind: 'qualified_name' as const, sourceName: createClassName(sourceName), form: 'import_or_namespace_dependent' as const }
      : { kind: 'simple_name' as const, name: createClassName(sourceName) },
  classNameResolutionContext: Object.freeze({
    kind: 'available',
    context: Object.freeze({
    kind: 'php_class_name_resolution_context',
    namespaceName: createPhpQualifiedClassName('App\\Http\\Controllers'),
    classImports,
    importInventory: 'complete',
    }),
  }),
  methodName: createMethodName('table'),
  tableArgument: Object.freeze({ kind: 'positional_string_literal', value: stringValue('posts') }),
  modelClasses: Object.freeze([]),
});

describe('Phase 2062 canonical Laravel facade identity', () => {
  it('recognizes a DB facade alias through its canonical imported class identity', () => {
    expect(controllerStaticCallOriginAuthority.judge(input('Database', [databaseImport('Database')]))).toMatchObject({
      kind: 'resolved',
      rule: 'database_facade_table_literal',
      origin: { kind: 'table', name: { value: stringValue('posts') } },
    });
  });

  it('recognizes a fully qualified DB facade without requiring import context', () => {
    const sourceName = '\\Illuminate\\Support\\Facades\\DB';
    expect(controllerStaticCallOriginAuthority.judge(input(sourceName, [], sourceName))).toMatchObject({
      kind: 'resolved',
      rule: 'database_facade_table_literal',
    });
  });

  it('does not treat an unimported short DB name as the Laravel facade', () => {
    expect(controllerStaticCallOriginAuthority.judge(input('DB', []))).toEqual({
      kind: 'not_applicable',
      reason: 'static_call_class_not_in_model_catalog',
    });
  });
});
