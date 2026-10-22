import { createPhpQualifiedClassName } from '../phpClassNameResolutionInterface';
import { describe, expect, it } from 'vitest';
import { controllerResourceBindingAuthority } from '../controllerResourceBindingAuthority';
import { controllerStaticCallOriginAuthority } from '../controllerStaticCallOriginAuthority';
import type { ControllerResourceModelOriginEvidence } from '../controllerResourceBindingInterface';
import { createClassName, createMethodName } from '../names';
import { stringValue } from '../valueObjects';

describe('controller model-origin closed judgment phase 2056', () => {
  it('distinguishes absent variable semantics from unsupported evidence', () => {
    expect(controllerResourceBindingAuthority.judgeModelOrigin({ kind: 'variable_semantic_missing' })).toEqual({
      kind: 'missing',
      closed: true,
    });
    expect(controllerResourceBindingAuthority.judgeModelOrigin({ kind: 'unsupported_expression' })).toEqual({
      kind: 'unresolved',
      closed: true,
    });
  });

  it('composes static-call origin judgment upstream from typed input evidence', () => {
    const evidence: ControllerResourceModelOriginEvidence = {
      kind: 'static_call_origin_input',
      input: {
        kind: 'controller_static_call_origin_input',
      classReference: { kind: 'simple_name', name: createClassName('DB') },
      classNameResolutionContext: { kind: 'available', context: { kind: 'php_class_name_resolution_context', namespaceName: createPhpQualifiedClassName('App\\Http\\Controllers'), classImports: [{ kind: 'php_class_import_binding', alias: createClassName('DB'), target: createPhpQualifiedClassName('Illuminate\\Support\\Facades\\DB') }], importInventory: 'complete' } },
        methodName: createMethodName('table'),
        tableArgument: { kind: 'positional_string_literal', value: stringValue('posts') },
        modelClasses: [],
      },
    };

    expect(controllerResourceBindingAuthority.judgeModelOrigin(evidence)).toEqual({
      kind: 'resolved',
      origin: { kind: 'table', name: { kind: 'table_name', value: stringValue('posts') } },
      closed: true,
    });
  });

  it('judges a non-table database facade call as not applicable instead of a model origin', () => {
    expect(controllerStaticCallOriginAuthority.judge({
      kind: 'controller_static_call_origin_input',
      classReference: { kind: 'simple_name', name: createClassName('DB') },
      classNameResolutionContext: { kind: 'available', context: { kind: 'php_class_name_resolution_context', namespaceName: createPhpQualifiedClassName('App\\Http\\Controllers'), classImports: [{ kind: 'php_class_import_binding', alias: createClassName('DB'), target: createPhpQualifiedClassName('Illuminate\\Support\\Facades\\DB') }], importInventory: 'complete' } },
      methodName: createMethodName('select'),
      tableArgument: { kind: 'unsupported_argument_shape' },
      modelClasses: [],
    })).toEqual({ kind: 'not_applicable', reason: 'database_facade_call_without_table_origin' });
    expect(controllerResourceBindingAuthority.judgeModelOrigin({
      kind: 'static_call_origin_input',
      input: {
        kind: 'controller_static_call_origin_input',
      classReference: { kind: 'simple_name', name: createClassName('DB') },
      classNameResolutionContext: { kind: 'available', context: { kind: 'php_class_name_resolution_context', namespaceName: createPhpQualifiedClassName('App\\Http\\Controllers'), classImports: [{ kind: 'php_class_import_binding', alias: createClassName('DB'), target: createPhpQualifiedClassName('Illuminate\\Support\\Facades\\DB') }], importInventory: 'complete' } },
        methodName: createMethodName('select'),
        tableArgument: { kind: 'unsupported_argument_shape' },
        modelClasses: [],
      },
    })).toEqual({ kind: 'unresolved', closed: true });
  });

  it('publishes ordered typed origin rules instead of embedding rule selection in relation helpers', () => {
    expect(controllerStaticCallOriginAuthority.contractVersion).toBe(11);
    expect(controllerStaticCallOriginAuthority.rules.map(rule => rule.rule)).toEqual([
      'database_facade_table_literal',
      'database_facade_non_table_call',
      'static_class_model_origin',
    ]);
    expect(controllerStaticCallOriginAuthority.rules.map(rule => rule.pattern.kind)).toEqual([
      'qualified_class_method',
      'qualified_class',
      'fallback',
    ]);
    expect(controllerStaticCallOriginAuthority.rules[0]?.argumentRules.map(rule => rule.rule)).toEqual([
      'table_literal',
      'table_argument_absent',
      'table_argument_unsupported',
    ]);
  });

  it('closes unresolved DB table evidence without leaking the nested authority judgment', () => {
    expect(controllerResourceBindingAuthority.judgeModelOrigin({
      kind: 'static_call_origin_input',
      input: {
        kind: 'controller_static_call_origin_input',
      classReference: { kind: 'simple_name', name: createClassName('DB') },
      classNameResolutionContext: { kind: 'available', context: { kind: 'php_class_name_resolution_context', namespaceName: createPhpQualifiedClassName('App\\Http\\Controllers'), classImports: [{ kind: 'php_class_import_binding', alias: createClassName('DB'), target: createPhpQualifiedClassName('Illuminate\\Support\\Facades\\DB') }], importInventory: 'complete' } },
        methodName: createMethodName('table'),
        tableArgument: { kind: 'absent' },
        modelClasses: [],
      },
    })).toEqual({ kind: 'unresolved', closed: true });
  });
});
