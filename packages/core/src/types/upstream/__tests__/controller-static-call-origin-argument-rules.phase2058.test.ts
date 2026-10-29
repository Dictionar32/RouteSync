import { phpQualifiedClassNameFactory } from '../phpClassNameResolutionInterface';
import { describe, expect, it } from 'vitest';
import { controllerStaticCallOriginAuthority } from '../controllerStaticCallOriginAuthority';
import { createClassName, createMethodName } from '../names';
import { stringValue } from '../valueObjects';

describe('controller static-call origin argument rules phase 2058', () => {
  const input = (tableArgument: import('../controllerStaticCallOriginInterface').ControllerStaticCallTableArgumentEvidence) => ({
    kind: 'controller_static_call_origin_input' as const,
    classReference: { kind: 'simple_name' as const, name: createClassName('DB') },
    classNameResolutionContext: { kind: 'available', context: { kind: 'php_class_name_resolution_context', namespaceName: phpQualifiedClassNameFactory.create('App\\Http\\Controllers'), classImports: [{ kind: 'php_class_import_binding', alias: createClassName('DB'), target: phpQualifiedClassNameFactory.create('Illuminate\\Support\\Facades\\DB') }], importInventory: 'complete' } },
    methodName: createMethodName('table'),
    tableArgument,
    modelClasses: [],
  });

  it('publishes the table argument subrules on the existing table-call rule', () => {
    const tableRule = controllerStaticCallOriginAuthority.rules[0];
    expect(tableRule?.argumentRules.map(rule => rule.rule)).toEqual([
      'table_literal',
      'table_argument_absent',
      'table_argument_unsupported',
    ]);
    expect(controllerStaticCallOriginAuthority.contractVersion).toBe(11);
  });

  it('resolves a string literal through the declared argument rule', () => {
    expect(controllerStaticCallOriginAuthority.judge(input({
      kind: 'positional_string_literal',
      value: stringValue.create('posts'),
    }))).toEqual({
      kind: 'resolved',
      rule: 'database_facade_table_literal',
      origin: { kind: 'table', name: { kind: 'table_name', value: stringValue.create('posts') } },
    });
  });

  it('preserves distinct absent and unsupported argument judgments', () => {
    expect(controllerStaticCallOriginAuthority.judge(input({ kind: 'absent' }))).toEqual({
      kind: 'unresolved',
      reason: 'database_table_argument_absent',
    });
    expect(controllerStaticCallOriginAuthority.judge(input({ kind: 'unsupported_argument_shape' }))).toEqual({
      kind: 'unresolved',
      reason: 'database_table_argument_not_static_string',
    });
  });
});
