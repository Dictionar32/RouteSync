import { describe, expect, it } from 'vitest';
import { controllerStaticCallOriginAuthority } from '../controllerStaticCallOriginAuthority';
import { createPhpQualifiedClassName } from '../phpClassNameResolutionInterface';
import { createClassName, createMethodName, createModelName } from '../names';
import type { ControllerStaticCallOriginInput } from '../controllerStaticCallOriginInterface';

const input: ControllerStaticCallOriginInput = Object.freeze({
  kind: 'controller_static_call_origin_input',
  classReference: { kind: 'simple_name', name: createClassName('User') },
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
  tableArgument: { kind: 'unsupported_argument_shape' },
  modelClasses: Object.freeze([Object.freeze({
    kind: 'controller_static_call_model_class_identity',
    className: createClassName('User'),
    modelName: createModelName('App\\Models\\User'),
    qualifiedName: createPhpQualifiedClassName('App\\Models\\User'),
  })]),
});

describe('single canonical class-name judgment phase 2065', () => {
  it('model identity consumes the supplied judgment instead of resolving the source name again', () => {
    const suppliedJudgment = Object.freeze({
      kind: 'php_class_name_resolved' as const,
      sourceName: createClassName('User'),
      qualifiedName: createPhpQualifiedClassName('App\\Models\\Ghost'),
      rule: 'class_import' as const,
    });

    expect(controllerStaticCallOriginAuthority.modelClassIdentityRule.judge(input, suppliedJudgment)).toEqual({ kind: 'not_found' });
  });

  it('preserves the supplied blocked judgment instead of replacing it with a fresh resolution', () => {
    const suppliedJudgment = Object.freeze({
      kind: 'php_class_name_resolution_blocked' as const,
      sourceName: createClassName('User'),
      reason: 'class_import_inventory_incomplete' as const,
    });

    expect(controllerStaticCallOriginAuthority.modelClassIdentityRule.judge(input, suppliedJudgment)).toEqual({
      kind: 'blocked',
      reason: 'canonical_qualified_model_identity_unavailable',
    });
  });

  it('retains canonical facade and model matching through the single judgment pipeline', () => {
    expect(controllerStaticCallOriginAuthority.judge(input)).toMatchObject({
      kind: 'resolved',
      rule: 'static_class_model_origin',
      origin: { kind: 'model_class', name: createModelName('App\\Models\\User') },
    });
  });
});


describe('explicit class-name context evidence phase 2066', () => {
  it('blocks missing lexical context instead of fabricating an empty namespace context', () => {
    expect(controllerStaticCallOriginAuthority.judge(Object.freeze({
      ...input,
      classNameResolutionContext: Object.freeze({
        kind: 'unavailable' as const,
        reason: 'controller_method_lexical_context_missing' as const,
      }),
    }))).toEqual({
      kind: 'unresolved',
      reason: 'static_call_qualified_model_identity_unavailable',
    });
  });
});
