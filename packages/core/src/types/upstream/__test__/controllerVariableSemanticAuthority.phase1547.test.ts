import { describe, expect, it } from 'vitest';
import { controllerVariableSemanticAuthority } from '../controllerVariableSemanticAuthority';
import type { ControllerVariableSemanticResolutionRequest } from '../controllerVariableSemanticInterface';
import { numberValue, stringValue } from '../valueObjects';
import type { Expression } from '../expression';

const noBindings = Object.freeze([]);
const unsupportedExpressionReason: Extract<Expression, { readonly kind: 'unsupported_expression' }>['reason'] = { kind: 'unsupported_syntax' };
const sourceExpression: Expression = Object.freeze({ kind: 'unsupported_expression', reason: unsupportedExpressionReason, source: Object.freeze({ kind: 'source_span', file: Object.freeze({ kind: 'source_file', value: stringValue.create('Controller.php') }), start: numberValue(0), end: numberValue(1) }) });
const request = (evidence: ControllerVariableSemanticResolutionRequest['evidence']): ControllerVariableSemanticResolutionRequest => ({ sourceExpression, evidence, parameterBindings: noBindings });

describe('controller variable semantic interface-first authority', () => {
  it('derives a database-table origin through the upstream authority', () => {
    expect(controllerVariableSemanticAuthority.resolve(request({
      kind: 'static_call', className: 'DB', methodName: 'table', arguments: [{ kind: 'positional_string_literal', value: 'users' }],
    }))).toMatchObject({
      kind: 'resolved', rule: 'database-table-call', semantic: { kind: 'model_origin', origin: { kind: 'table', name: { kind: 'table_name', value: { kind: 'string_value', value: 'users' } } } }, expressionValue: { kind: 'reference', name: { kind: 'domain_type_name', value: { kind: 'string_value', value: 'users' } }, cardinality: { kind: 'one' }, nullability: { kind: 'non_nullable' } }, closed: true,
    });
  });

  it('preserves a parameter semantic binding and its selected rule', () => {
    const semantic = { kind: 'request_origin', name: { kind: 'request_name', value: { kind: 'string_value', value: 'request' } } } as const;
    const result = controllerVariableSemanticAuthority.resolve({
      sourceExpression,
      evidence: { kind: 'variable_reference', variable: { kind: 'variable_name', value: { kind: 'string_value', value: 'request' } } },
      parameterBindings: [{ variable: { kind: 'variable_name', value: { kind: 'string_value', value: 'request' } }, semantic }],
    });
    expect(result).toMatchObject({ kind: 'resolved', rule: 'parameter-binding', semantic, expressionValue: { kind: 'reference', name: { kind: 'domain_type_name' }, cardinality: { kind: 'one' }, nullability: { kind: 'non_nullable' } }, closed: true });
  });

  it('publishes reasoning rules as declarative interface data rather than executable callbacks', () => {
    expect(controllerVariableSemanticAuthority.reasoning).toMatchObject({
      kind: 'controller_variable_semantic_reasoning_contract',
      revision: 2,
      precedence: ['parameter-binding', 'database-table-call', 'external-fallback'],
      parameterBindingAmbiguity: 'multiple-matching-bindings-produce-ambiguous-judgment;never-select-first',
    });
    expect(controllerVariableSemanticAuthority.reasoning.rules.every(rule => !('applies' in rule) && !('derive' in rule))).toBe(true);
  });

  it('returns an explicit ambiguous judgment instead of choosing the first duplicate parameter binding', () => {
    const variable = { kind: 'variable_name', value: { kind: 'string_value', value: 'request' } } as const;
    const semantic = { kind: 'request_origin', name: { kind: 'request_name', value: { kind: 'string_value', value: 'request' } } } as const;
    const result = controllerVariableSemanticAuthority.resolve({
      sourceExpression,
      evidence: { kind: 'variable_reference', variable },
      parameterBindings: [
        { variable, semantic },
        { variable, semantic },
      ],
    });
    expect(result).toMatchObject({
      kind: 'ambiguous',
      reason: 'parameter_binding',
      expressionValue: { kind: 'unresolved', reason: 'ambiguous' },
      closed: true,
    });
  });

  it('returns expression vocabulary as part of the same closed model judgment', () => {
    const result = controllerVariableSemanticAuthority.resolve(request({
      kind: 'static_call', className: 'DB', methodName: 'table', arguments: [{ kind: 'positional_string_literal', value: 'orders' }],
    }));
    expect(result).toMatchObject({
      kind: 'resolved',
      rule: 'database-table-call',
      expressionValue: {
        kind: 'reference',
        name: { kind: 'domain_type_name', value: { kind: 'string_value', value: 'orders' } },
        cardinality: { kind: 'one' },
        nullability: { kind: 'non_nullable' },
      },
      closed: true,
    });
  });

  it('returns an explicit external fallback for unsupported evidence', () => {
    expect(controllerVariableSemanticAuthority.resolve(request({ kind: 'other_expression' }))).toMatchObject({
      kind: 'resolved', rule: 'external-fallback', semantic: { kind: 'external' }, expressionValue: { kind: 'unresolved', reason: 'external' }, closed: true,
    });
  });


});
