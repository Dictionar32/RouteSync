import { describe, expect, it } from 'vitest';
import { controllerStaticCallOriginAuthority } from '../controllerStaticCallOriginAuthority';
import type { ControllerStaticCallOriginInput } from '../controllerStaticCallOriginInterface';
import { createClassName, createMethodName, createModelName } from '../names';
import { createPhpQualifiedClassName } from '../phpClassNameResolutionInterface';

const availableInput: ControllerStaticCallOriginInput = Object.freeze({
  kind: 'controller_static_call_origin_input',
  classReference: Object.freeze({ kind: 'simple_name', name: createClassName('User') }),
  classNameResolutionContext: Object.freeze({
    kind: 'available',
    context: Object.freeze({
      kind: 'php_class_name_resolution_context',
      namespaceName: createPhpQualifiedClassName('App\\Http\\Controllers'),
      classImports: Object.freeze([Object.freeze({
        kind: 'php_class_import_binding',
        alias: createClassName('User'),
        target: createPhpQualifiedClassName('App\\Models\\User'),
      })]),
      importInventory: 'complete',
    }),
  }),
  methodName: createMethodName('query'),
  tableArgument: Object.freeze({ kind: 'unsupported_argument_shape' }),
  modelClasses: Object.freeze([Object.freeze({
    kind: 'controller_static_call_model_class_identity',
    className: createClassName('User'),
    modelName: createModelName('App\\Models\\User'),
    qualifiedName: createPhpQualifiedClassName('App\\Models\\User'),
  })]),
});

describe('discriminated static-call class-reference contract phase 2068', () => {
  it('uses the discriminated class reference as the sole source spelling', () => {
    expect('className' in availableInput).toBe(false);
    expect(availableInput.classReference).toEqual({ kind: 'simple_name', name: createClassName('User') });
    expect(controllerStaticCallOriginAuthority.judge(availableInput)).toMatchObject({
      kind: 'resolved',
      rule: 'static_class_model_origin',
      origin: { kind: 'model_class', name: createModelName('App\\Models\\User') },
    });
  });

  it('keeps missing lexical context as an explicit blocked evidence variant', () => {
    expect(controllerStaticCallOriginAuthority.judge(Object.freeze({
      ...availableInput,
      classNameResolutionContext: Object.freeze({
        kind: 'unavailable',
        reason: 'controller_method_lexical_context_missing',
      }),
    }))).toEqual({
      kind: 'unresolved',
      reason: 'static_call_qualified_model_identity_unavailable',
    });
  });
});
