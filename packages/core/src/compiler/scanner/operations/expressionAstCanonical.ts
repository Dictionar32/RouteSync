import { createAstJudgment, type ExpressionAst, type ExpressionSurface } from '../../../types/upstream/ast';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { ExpressionAstFromPhpAstInput, ExpressionAstFromPhpAstOperationInterface } from '../../../types/upstream/expressionProducerInterface';
import type { PhpAstValue, PhpAstValueNode } from '../lexer/phpAstExpressionTypes';
import { stringValue } from '../../../types/upstream/names';
import { matchPhpAccessMode, matchPhpAstValue } from '../lexer/phpAstAlgebra';

type PhpMethodChainValue = Extract<PhpAstValueNode, { readonly kind: 'method_chain' }> & { readonly source: PhpAstValue['source'] };
type PhpPropertyAccessValue = Extract<PhpAstValueNode, { readonly kind: 'property_access' }> & { readonly source: PhpAstValue['source'] };
const isPhpMethodChainValue = (value: PhpAstValue): value is PhpMethodChainValue => value.kind === 'method_chain';
const isPhpPropertyAccessValue = (value: PhpAstValue): value is PhpPropertyAccessValue => value.kind === 'property_access';

const expressionSurface = (value: PhpAstValue): ExpressionSurface => {
  // Access-mode surface is syntax projection, not semantic inference. Narrow the
  // two access-bearing AST variants before entering the exhaustive visitor;
  // the existing visitor's generic RelationVariant type does not retain their
  // concrete access field under the current AST declaration.
  if (isPhpMethodChainValue(value)) {
    return matchPhpAccessMode<ExpressionSurface>(value.access, {
      direct: () => ({ kind: 'php_method_call' }),
      nullsafe: () => ({ kind: 'php_nullsafe_method_call' }),
    });
  }
  if (isPhpPropertyAccessValue(value)) {
    return matchPhpAccessMode<ExpressionSurface>(value.access, {
      direct: () => ({ kind: 'php_property_access' }),
      nullsafe: () => ({ kind: 'php_nullsafe_property_access' }),
    });
  }
  return matchPhpAstValue<ExpressionSurface>(value, {
    literal: () => ({ kind: 'php_literal' }),
    interpolatedString: () => ({ kind: 'php_interpolated_string' }),
    resourceSingle: () => ({ kind: 'php_resource_reference' }),
    resourceCollection: () => ({ kind: 'php_resource_reference' }),
    methodChain: () => ({ kind: 'php_method_call' }),
    propertyAccess: () => ({ kind: 'php_property_access' }),
    arrayAccess: () => ({ kind: 'php_array_access' }),
    functionCall: () => ({ kind: 'php_function_call' }),
    callableCall: () => ({ kind: 'php_function_call' }),
    variableReference: () => ({ kind: 'php_variable' }),
    magicConstant: () => ({ kind: 'php_magic_constant' }),
    constantReference: () => ({ kind: 'php_constant_reference' }),
    shortTernary: () => ({ kind: 'php_short_ternary' }),
    nullCoalesce: () => ({ kind: 'php_coalesce' }),
    binaryExpression: () => ({ kind: 'php_binary' }),
    unaryExpression: () => ({ kind: 'php_unary' }),
    castExpression: () => ({ kind: 'php_cast' }),
    ternaryExpression: () => ({ kind: 'php_ternary' }),
    nestedArray: () => ({ kind: 'php_array' }),
    staticCall: () => ({ kind: 'php_static_call' }),
    classReference: () => ({ kind: 'php_class_reference' }),
    classConstant: () => ({ kind: 'php_class_constant' }),
    construct: () => ({ kind: 'php_constructor' }),
    assignmentExpression: () => ({ kind: 'php_assignment' }),
    dynamicConstruct: () => ({ kind: 'php_constructor' }),
    anonymousClassConstruct: () => ({ kind: 'php_anonymous_class_constructor' }),
    instanceOf: () => ({ kind: 'php_instance_of' }),
    closure: () => ({ kind: 'php_closure' }),
    arrowFunction: () => ({ kind: 'php_arrow_function' }),
    matchExpression: () => ({ kind: 'php_match' }),
    unsupported: () => ({ kind: 'php_unsupported' }),
  });
};

export const expressionAstFromPhpAst: ExpressionAstFromPhpAstOperationInterface<PhpAstValue> = {
  project: (input: ExpressionAstFromPhpAstInput<PhpAstValue>): ExpressionAst => {
    const { syntax: value, expression, origin, sourceFile } = input;
    const source: SourceSpan = {
      kind: 'source_span',
      file: sourceFile,
      start: { kind: 'number_value', value: value.source.startOffset },
      end: { kind: 'number_value', value: value.source.endOffset },
    };
    return createAstJudgment({
      kind: 'expression_ast',
      semantic: expression,
      surface: expressionSurface(value),
      origin,
      source,
      rule: { kind: 'ast_rule', value: stringValue('php-expression-to-upstream-expression') },
      witness: { kind: 'ast_witness', value: stringValue(value.kind) },
    });
  },
};
