import type { Expression } from '../../../../types/upstream/expression';
import type { PhpAstValue } from '../../lexer/phpAstExpressionTypes';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import { matchPhpAstValue } from '../../LaravelSourceLexer';
import { createSourceFile } from '../../../../types/upstream/names';
import { matchPhpMatchArm } from '../../lexer/phpAstAlgebra';
import {
  variable, className, resource, cardinality, expressions, functionName, method,
  mapArguments, mapLiteral, memberExpression, methodExpression, mapBinaryOperator, mapUnaryOperator,
  mapCastType, mapArrayEntry,
} from './resourceUpstreamExpressionMappings';
import { mapClosureBody } from './resourceUpstreamExpressionClosure';

export function mapResourcePhpAstToUpstream(value: PhpAstValue, file: string): Expression {
  const source: SourceSpan = { kind: 'source_span', file: createSourceFile(file), start: { kind: 'number_value', value: value.source.startOffset }, end: { kind: 'number_value', value: value.source.endOffset } };
  const mapChild = (child: PhpAstValue, _file: string): Expression => mapResourcePhpAstToUpstream(child, file);
  return matchPhpAstValue(value, {
    literal: node => mapLiteral(node.literalType, node.value, source),
    resourceSingle: node => ({ kind: 'resource_reference', resource: resource(node.resourceName), cardinality: cardinality('single'), source }),
    resourceCollection: node => ({ kind: 'resource_reference', resource: resource(node.resourceName), cardinality: cardinality('collection'), source }),
    variableReference: node => ({ kind: 'variable', name: variable(node.name), source }),
    propertyAccess: node => memberExpression(node.receiver, node.target, node.property, node.access, mapChild, file, source),
    methodChain: node => methodExpression(node.receiver, node.target, node.property, node.arguments, node.access, mapChild, file, source),
    arrayAccess: node => ({ kind: 'index', receiver: mapChild(node.target, file), key: mapChild(node.index, file), source }),
    functionCall: node => ({ kind: 'call', function: functionName(node.functionName), arguments: expressions(mapArguments(node.arguments, mapChild, file)), source }),
    ternaryExpression: node => ({ kind: 'conditional', condition: mapChild(node.condition, file), branches: { kind: 'then_else', whenTrue: mapChild(node.trueBranch, file), whenFalse: mapChild(node.falseBranch, file) }, source }),
    shortTernary: node => ({ kind: 'short_ternary', condition: mapChild(node.condition, file), falseBranch: mapChild(node.falseBranch, file), source }),
    nullCoalesce: node => ({ kind: 'coalesce', left: mapChild(node.left, file), right: mapChild(node.right, file), source }),
    binaryExpression: node => ({ kind: 'binary', operator: mapBinaryOperator(node.operator.kind), left: mapChild(node.left, file), right: mapChild(node.right, file), source }),
    unaryExpression: node => ({ kind: 'unary', operator: mapUnaryOperator(node.operator.kind), operand: mapChild(node.operand, file), source }),
    castExpression: node => ({ kind: 'cast', target: mapCastType(node.castType.kind), expression: mapChild(node.operand, file), source }),
    nestedArray: node => ({ kind: 'array', entries: node.entries.map((entry, index) => mapArrayEntry(entry, index, mapChild, file, source)), source }),
    staticCall: node => ({ kind: 'static_method', receiver: { kind: 'class', name: className(node.className) }, action: { kind: 'domain', name: method(node.method) }, arguments: expressions(mapArguments(node.arguments, mapChild, file)), source }),
    classReference: node => ({ kind: 'class_reference', className: className(node.className), source }),
    construct: node => ({ kind: 'construct', className: className(node.className), arguments: expressions(mapArguments(node.arguments, mapChild, file)), source }),
    instanceOf: node => ({ kind: 'instance_of', expression: mapChild(node.expression, file), className: className(node.className), source }),
    closure: node => ({ kind: 'closure', value: { kind: 'closure', parameters: { kind: 'variable_names', items: sequence(node.parameters.map(item => variable(item.variable))) }, captures: { kind: 'closure_captures', items: sequence(node.captures.map(item => ({ kind: item.kind, variable: variable(item.variable) }))) }, body: mapClosureBody(node.body.statements, file, mapChild), source }, source }),
    arrowFunction: node => ({ kind: 'arrow_function', parameters: { kind: 'variable_names', items: sequence(node.parameters.map(item => variable(item.variable))) }, body: mapChild(node.body, file), source }),
    matchExpression: node => ({
      kind: 'match',
      subject: mapChild(node.subject, file),
      arms: {
        kind: 'match_arms',
        items: sequence(node.arms.map(arm => matchPhpMatchArm(arm, {
          conditional: armNode => ({
            kind: 'conditional',
            conditions: expressions(armNode.conditions.map(item => mapChild(item, file))),
            result: mapChild(armNode.value, file),
            source
          }),
          default: armNode => ({
            kind: 'default',
            result: mapChild(armNode.value, file),
            source
          })
        })))
      },
      source
    }),
    unsupported: node => ({ kind: 'unsupported_expression', reason: node.reason, source }),
  });
}

const sequence = <T>(items: readonly T[]): import('../../../../types/upstream/collections').Sequence<T> => items.reduceRight((tail, item) => ({ kind: 'cons', head: item, tail }), { kind: 'empty' });
