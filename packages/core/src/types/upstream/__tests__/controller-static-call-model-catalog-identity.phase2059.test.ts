import { phpQualifiedClassNameFactory } from '../phpClassNameResolutionInterface';
import { describe, expect, it } from 'vitest';
import { controllerStaticCallOriginAuthority } from '../controllerStaticCallOriginAuthority';
import { createClassName, createMethodName, createModelName } from '../names';
import type { ControllerStaticCallModelClassIdentity, ControllerStaticCallOriginInput } from '../controllerStaticCallOriginInterface';

const modelClass = (className: string, modelName: string): ControllerStaticCallModelClassIdentity => Object.freeze({
  kind: 'controller_static_call_model_class_identity',
  className: createClassName(className),
  modelName: createModelName(modelName),
  qualifiedName: phpQualifiedClassNameFactory.create(`App\\Models\\${className}`),
});

const input = (className: string, modelClasses: readonly ControllerStaticCallModelClassIdentity[]): ControllerStaticCallOriginInput => Object.freeze({
  kind: 'controller_static_call_origin_input',
  classReference: className.includes('\\')
    ? { kind: 'qualified_name' as const, sourceName: createClassName(className), form: 'import_or_namespace_dependent' as const }
    : { kind: 'simple_name' as const, name: createClassName(className) },
  methodName: createMethodName('query'),
  tableArgument: { kind: 'unsupported_argument_shape' },
  classNameResolutionContext: {
    kind: 'available',
    context: {
    kind: 'php_class_name_resolution_context',
    namespaceName: phpQualifiedClassNameFactory.create('App\\Http\\Controllers'),
    classImports: [{ kind: 'php_class_import_binding', alias: createClassName('User'), target: phpQualifiedClassNameFactory.create('App\\Models\\User') }],
    importInventory: 'complete',
    },
  },
  modelClasses,
});

describe('controller static-call model catalog identity phase 2059', () => {
  it('resolves a static model call only against the canonical model catalog', () => {
    const identity = modelClass('User', 'App\\Models\\User');
    expect(controllerStaticCallOriginAuthority.judge(input('User', [identity]))).toEqual({
      kind: 'resolved',
      rule: 'static_class_model_origin',
      origin: { kind: 'model_class', name: createModelName('App\\Models\\User') },
    });
  });

  it('does not infer model identity from an arbitrary static class name', () => {
    expect(controllerStaticCallOriginAuthority.judge(input('Cache', [modelClass('User', 'User')]))).toEqual({
      kind: 'not_applicable',
      reason: 'static_call_class_not_in_model_catalog',
    });
  });


  it('resolves fully qualified references against canonical model identities', () => {
    expect(controllerStaticCallOriginAuthority.judge(input('\\App\\Models\\User', [modelClass('User', 'App\\Models\\User')]))).toEqual({
      kind: 'resolved',
      rule: 'static_class_model_origin',
      origin: { kind: 'model_class', name: createModelName('App\\Models\\User') },
    });
  });

  it('returns an unresolved judgment when short class identity is ambiguous', () => {
    expect(controllerStaticCallOriginAuthority.judge(input('User', [
      modelClass('User', 'App\\Models\\User'),
      modelClass('User', 'App\\Models\\User'),
    ]))).toEqual({ kind: 'unresolved', reason: 'static_call_model_class_ambiguous' });
  });

  it('keeps the database table rule independent from model class membership', () => {
    expect(controllerStaticCallOriginAuthority.judge({
      kind: 'controller_static_call_origin_input',
      classReference: { kind: 'simple_name', name: createClassName('DB') },
      classNameResolutionContext: { kind: 'available', context: { kind: 'php_class_name_resolution_context', namespaceName: phpQualifiedClassNameFactory.create('App\\Http\\Controllers'), classImports: [{ kind: 'php_class_import_binding', alias: createClassName('DB'), target: phpQualifiedClassNameFactory.create('Illuminate\\Support\\Facades\\DB') }], importInventory: 'complete' } },
      methodName: createMethodName('table'),
      tableArgument: { kind: 'positional_string_literal', value: { kind: 'string_value', value: 'posts' } },
      modelClasses: [],
    })).toMatchObject({ kind: 'resolved', rule: 'database_facade_table_literal' });
  });

  it('exposes the existing authority model-class rule and versioned contract', () => {
    expect(controllerStaticCallOriginAuthority.contractVersion).toBe(11);
    expect(controllerStaticCallOriginAuthority.modelClassIdentityRule).toMatchObject({
      kind: 'controller_static_call_model_class_identity_rule',
      contractVersion: 2,
    });
  });
});
