import { describe, expect, it } from 'vitest';
import { controllerStaticCallOriginAuthority } from '../controllerStaticCallOriginAuthority';
import type { ControllerStaticCallModelClassIdentity, ControllerStaticCallOriginInput } from '../controllerStaticCallOriginInterface';
import { createClassName, createMethodName, createModelName } from '../names';
import { phpQualifiedClassNameFactory } from '../phpClassNameResolutionInterface';
import type { PhpClassNameResolutionContext } from '../phpClassNameResolutionInterface';

const model = (shortName: string, qualifiedName: string): ControllerStaticCallModelClassIdentity => Object.freeze({
  kind: 'controller_static_call_model_class_identity',
  className: createClassName(shortName),
  modelName: createModelName(qualifiedName),
  qualifiedName: phpQualifiedClassNameFactory.create(qualifiedName),
});

const input = (
  sourceName: string,
  context: PhpClassNameResolutionContext,
  models: readonly ControllerStaticCallModelClassIdentity[],
): ControllerStaticCallOriginInput => Object.freeze({
  kind: 'controller_static_call_origin_input',
  classReference: sourceName.startsWith('\\')
    ? { kind: 'qualified_name', sourceName: createClassName(sourceName), form: 'fully_qualified' }
    : sourceName.startsWith('namespace\\')
      ? { kind: 'qualified_name', sourceName: createClassName(sourceName), form: 'namespace_relative' }
      : sourceName.includes('\\')
        ? { kind: 'qualified_name', sourceName: createClassName(sourceName), form: 'import_or_namespace_dependent' }
        : { kind: 'simple_name', name: createClassName(sourceName) },
  classNameResolutionContext: { kind: 'available', context },
  methodName: createMethodName('query'),
  tableArgument: { kind: 'unsupported_argument_shape' },
  modelClasses: models,
});

const context = (
  namespace: string,
  classImports: PhpClassNameResolutionContext['classImports'] = Object.freeze([]),
  importInventory: PhpClassNameResolutionContext['importInventory'] = 'complete',
): PhpClassNameResolutionContext => Object.freeze({
  kind: 'php_class_name_resolution_context',
  namespaceName: phpQualifiedClassNameFactory.create(namespace),
  classImports,
  importInventory,
});

describe('controller static-call class reference context phase 2061', () => {
  it('resolves a simple class name through an explicit import alias', () => {
    const identity = model('User', 'App\\Models\\User');
    const judgment = controllerStaticCallOriginAuthority.judge(input('Member', context('App\\Http\\Controllers', [
      { kind: 'php_class_import_binding', alias: createClassName('Member'), target: phpQualifiedClassNameFactory.create('App\\Models\\User') },
    ]), [identity]));
    expect(judgment).toMatchObject({ kind: 'resolved', origin: { kind: 'model_class', name: createModelName('App\\Models\\User') } });
  });

  it('resolves a fully qualified class name independently of controller namespace and imports', () => {
    const identity = model('User', 'App\\Models\\User');
    expect(controllerStaticCallOriginAuthority.judge(input('\\App\\Models\\User', context('App\\Http\\Controllers'), [identity]))).toMatchObject({
      kind: 'resolved', rule: 'static_class_model_origin', origin: { kind: 'model_class', name: createModelName('App\\Models\\User') },
    });
  });

  it('uses the current namespace only when the class import inventory is complete', () => {
    const identity = model('User', 'App\\Http\\Controllers\\User');
    expect(controllerStaticCallOriginAuthority.judge(input('User', context('App\\Http\\Controllers'), [identity]))).toMatchObject({ kind: 'resolved' });
    expect(controllerStaticCallOriginAuthority.judge(input('User', context('App\\Http\\Controllers', [], 'incomplete'), [identity]))).toMatchObject({
      kind: 'unresolved', reason: 'static_call_qualified_model_identity_unavailable',
    });
  });

  it('applies namespace-relative class references against the active namespace', () => {
    const identity = model('User', 'App\\Http\\Controllers\\Models\\User');
    expect(controllerStaticCallOriginAuthority.judge(input('namespace\\Models\\User', context('App\\Http\\Controllers'), [identity]))).toMatchObject({ kind: 'resolved' });
  });
});
