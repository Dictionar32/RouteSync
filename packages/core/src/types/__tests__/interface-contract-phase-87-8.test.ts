import { describe, expect, test, expectTypeOf } from 'vitest';
import type {
  ArrayAccessField,
  ArrayField,
  FieldArgument,
  FunctionCallField,
  NullsafeMethodCallField,
  VariableCallField,
  UnaryExpressionField,
  TypeCastField,
  FieldNode
} from '../field';
import type { PhpCastType, PhpBinaryOperator, PhpVariableName, PhpPropertyName } from '../domain/phpAst/astValues';

describe('Phase 87.8 FieldNode semantic preservation', () => {
  test('array access is distinct from property access', () => {
    expectTypeOf<ArrayAccessField['offset']>().toEqualTypeOf<FieldNode>();
    expectTypeOf<ArrayAccessField['target']>().toEqualTypeOf<FieldNode>();
  });

  test('array fields carry typed entries rather than a free object map', () => {
    expectTypeOf<ArrayField['entries'][number]['key']['kind']>().toEqualTypeOf<'implicit' | 'explicit'>();
  });

  test('call variants preserve their original syntactic identity', () => {
    expectTypeOf<FunctionCallField['name']>().toEqualTypeOf<import('../domain/phpAst/astValues').PhpFunctionName>();
    expectTypeOf<NullsafeMethodCallField['target']>().toEqualTypeOf<FieldNode>();
    expectTypeOf<VariableCallField['name']>().toEqualTypeOf<PhpVariableName>();
  });

  test('argument role remains closed and typed', () => {
    expectTypeOf<FieldArgument['kind']>().toEqualTypeOf<'positional' | 'named' | 'unpacked'>();
    expectTypeOf<Extract<FieldArgument, { kind: 'named' }>['name']>().toEqualTypeOf<PhpPropertyName>();
  });

  test('cast and unary semantics are carried as AST ADTs', () => {
    expectTypeOf<TypeCastField['castType']>().toEqualTypeOf<PhpCastType>();
    expectTypeOf<UnaryExpressionField['operator']>().toEqualTypeOf<import('../domain/phpAst/astValues').PhpUnaryOperator>();
  });
});
