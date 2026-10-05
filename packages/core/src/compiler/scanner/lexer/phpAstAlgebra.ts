/** Exhaustive relational eliminator of scanner-level PHP syntax AST. */
import type { PhpAstValue, PhpPropertyPath } from './phpAstTypes';
import type { PhpAccessMode, PhpMatchArm } from './phpAstExpressionTypes';
import type { PhpStatement } from './phpAstStatementTypes';
import { relationOptionFold, relationRefine, type RelationVariant } from '../../../semantic/foundation/relationalSequence';
import { relationEqual } from '../../../semantic/foundation/semanticRelations';

export interface PhpAstValueVisitor<R> {
    readonly literal: (node: RelationVariant<PhpAstValue, 'literal'>) => R;
    readonly interpolatedString: (node: RelationVariant<PhpAstValue, 'interpolated_string'>) => R;
    readonly resourceSingle: (node: RelationVariant<PhpAstValue, 'resource_single'>) => R;
    readonly resourceCollection: (node: RelationVariant<PhpAstValue, 'resource_collection'>) => R;
    readonly methodChain: (node: RelationVariant<PhpAstValue, 'method_chain'>) => R;
    readonly propertyAccess: (node: RelationVariant<PhpAstValue, 'property_access'>) => R;
    readonly arrayAccess: (node: RelationVariant<PhpAstValue, 'array_access'>) => R;
    readonly functionCall: (node: RelationVariant<PhpAstValue, 'function_call'>) => R;
    readonly callableCall: (node: RelationVariant<PhpAstValue, 'callable_call'>) => R;
    readonly variableReference: (node: RelationVariant<PhpAstValue, 'variable_reference'>) => R;
    readonly magicConstant: (node: RelationVariant<PhpAstValue, 'magic_constant'>) => R;
    readonly constantReference: (node: RelationVariant<PhpAstValue, 'constant_reference'>) => R;
    readonly shortTernary: (node: RelationVariant<PhpAstValue, 'short_ternary'>) => R;
    readonly nullCoalesce: (node: RelationVariant<PhpAstValue, 'null_coalesce'>) => R;
    readonly binaryExpression: (node: RelationVariant<PhpAstValue, 'binary_expression'>) => R;
    readonly unaryExpression: (node: RelationVariant<PhpAstValue, 'unary_expression'>) => R;
    readonly castExpression: (node: RelationVariant<PhpAstValue, 'cast_expression'>) => R;
    readonly ternaryExpression: (node: RelationVariant<PhpAstValue, 'ternary_expression'>) => R;
    readonly nestedArray: (node: RelationVariant<PhpAstValue, 'nested_array'>) => R;
    readonly staticCall: (node: RelationVariant<PhpAstValue, 'static_call'>) => R;
    readonly classReference: (node: RelationVariant<PhpAstValue, 'class_reference'>) => R;
    readonly classConstant: (node: RelationVariant<PhpAstValue, 'class_constant'>) => R;
    readonly construct: (node: RelationVariant<PhpAstValue, 'construct'>) => R;
    readonly assignmentExpression: (node: RelationVariant<PhpAstValue, 'assignment_expression'>) => R;
    readonly dynamicConstruct: (node: RelationVariant<PhpAstValue, 'dynamic_construct'>) => R;
    readonly anonymousClassConstruct: (node: RelationVariant<PhpAstValue, 'anonymous_class_construct'>) => R;
    readonly instanceOf: (node: RelationVariant<PhpAstValue, 'instance_of'>) => R;
    readonly closure: (node: RelationVariant<PhpAstValue, 'closure'>) => R;
    readonly arrowFunction: (node: RelationVariant<PhpAstValue, 'arrow_function'>) => R;
    readonly matchExpression: (node: RelationVariant<PhpAstValue, 'match_expression'>) => R;
    readonly unsupported: (node: RelationVariant<PhpAstValue, 'unsupported'>) => R;
}
export type PhpMicroAstVisitor<R> = PhpAstValueVisitor<R>;

export interface PhpPropertyPathVisitor<R> {
    readonly single: (node: RelationVariant<PhpPropertyPath, 'single'>) => R;
    readonly chain: (node: RelationVariant<PhpPropertyPath, 'chain'>) => R;
}
export interface PhpAccessModeVisitor<R> {
    readonly direct: (node: RelationVariant<PhpAccessMode, 'direct'>) => R;
    readonly nullsafe: (node: RelationVariant<PhpAccessMode, 'nullsafe'>) => R;
}
export interface PhpMatchArmVisitor<R> {
    readonly conditional: (node: RelationVariant<PhpMatchArm, 'conditional'>) => R;
    readonly default: (node: RelationVariant<PhpMatchArm, 'default'>) => R;
}
export interface PhpStatementVisitor<R> {
    readonly expression_statement: (node: RelationVariant<PhpStatement, 'expression_statement'>) => R;
    readonly return_with_value: (node: RelationVariant<PhpStatement, 'return_with_value'>) => R;
    readonly return_void: (node: RelationVariant<PhpStatement, 'return_void'>) => R;
    readonly assignment: (node: RelationVariant<PhpStatement, 'assignment'>) => R;
    readonly if_statement: (node: RelationVariant<PhpStatement, 'if_statement'>) => R;
    readonly foreach_statement: (node: RelationVariant<PhpStatement, 'foreach_statement'>) => R;
    readonly while_statement: (node: RelationVariant<PhpStatement, 'while_statement'>) => R;
    readonly switch_statement: (node: RelationVariant<PhpStatement, 'switch_statement'>) => R;
    readonly for_statement: (node: RelationVariant<PhpStatement, 'for_statement'>) => R;
    readonly try_statement: (node: RelationVariant<PhpStatement, 'try_statement'>) => R;
    readonly throw_statement: (node: RelationVariant<PhpStatement, 'throw_statement'>) => R;
    readonly unset_statement: (node: RelationVariant<PhpStatement, 'unset_statement'>) => R;
    readonly include_statement: (node: RelationVariant<PhpStatement, 'include_statement'>) => R;
}

const dispatchPhpAstValueKind = <K extends PhpAstValue['kind'], R>(
  value: PhpAstValue,
  kind: K,
  handler: (node: RelationVariant<PhpAstValue, K>) => R,
  fallback: () => R,
): R => relationOptionFold(
  relationRefine(value, (candidate): candidate is RelationVariant<PhpAstValue, K> => relationEqual(candidate.kind, kind)),
  fallback,
  handler,
);

export function matchPhpAstValue<R>(value: PhpAstValue, visitor: PhpAstValueVisitor<R>): R {
  return dispatchPhpAstValueKind(value, 'literal', visitor.literal, () => dispatchPhpAstValueKind(value, 'interpolated_string', visitor.interpolatedString, () => dispatchPhpAstValueKind(value, 'resource_single', visitor.resourceSingle, () => dispatchPhpAstValueKind(value, 'resource_collection', visitor.resourceCollection, () => dispatchPhpAstValueKind(value, 'method_chain', visitor.methodChain, () => dispatchPhpAstValueKind(value, 'property_access', visitor.propertyAccess, () => dispatchPhpAstValueKind(value, 'array_access', visitor.arrayAccess, () => dispatchPhpAstValueKind(value, 'function_call', visitor.functionCall, () => dispatchPhpAstValueKind(value, 'callable_call', visitor.callableCall, () => dispatchPhpAstValueKind(value, 'variable_reference', visitor.variableReference, () => dispatchPhpAstValueKind(value, 'magic_constant', visitor.magicConstant, () => dispatchPhpAstValueKind(value, 'constant_reference', visitor.constantReference, () => dispatchPhpAstValueKind(value, 'short_ternary', visitor.shortTernary, () => dispatchPhpAstValueKind(value, 'null_coalesce', visitor.nullCoalesce, () => dispatchPhpAstValueKind(value, 'binary_expression', visitor.binaryExpression, () => dispatchPhpAstValueKind(value, 'unary_expression', visitor.unaryExpression, () => dispatchPhpAstValueKind(value, 'cast_expression', visitor.castExpression, () => dispatchPhpAstValueKind(value, 'ternary_expression', visitor.ternaryExpression, () => dispatchPhpAstValueKind(value, 'nested_array', visitor.nestedArray, () => dispatchPhpAstValueKind(value, 'static_call', visitor.staticCall, () => dispatchPhpAstValueKind(value, 'class_reference', visitor.classReference, () => dispatchPhpAstValueKind(value, 'class_constant', visitor.classConstant, () => dispatchPhpAstValueKind(value, 'construct', visitor.construct, () => dispatchPhpAstValueKind(value, 'assignment_expression', visitor.assignmentExpression, () => dispatchPhpAstValueKind(value, 'dynamic_construct', visitor.dynamicConstruct, () => dispatchPhpAstValueKind(value, 'anonymous_class_construct', visitor.anonymousClassConstruct, () => dispatchPhpAstValueKind(value, 'instance_of', visitor.instanceOf, () => dispatchPhpAstValueKind(value, 'closure', visitor.closure, () => dispatchPhpAstValueKind(value, 'arrow_function', visitor.arrowFunction, () => dispatchPhpAstValueKind(value, 'match_expression', visitor.matchExpression, () => dispatchPhpAstValueKind(value, 'unsupported', visitor.unsupported, () => { throw Error('Unreachable PhpAstValue kind'); })))))))))))))))))))))))))))))));
}

const dispatchPhpPropertyPathKind = <K extends PhpPropertyPath['kind'], R>(
  value: PhpPropertyPath,
  kind: K,
  handler: (node: RelationVariant<PhpPropertyPath, K>) => R,
  fallback: () => R,
): R => relationOptionFold(
  relationRefine(value, (candidate): candidate is RelationVariant<PhpPropertyPath, K> => relationEqual(candidate.kind, kind)),
  fallback,
  handler,
);

export function matchPhpPropertyPath<R>(value: PhpPropertyPath, visitor: PhpPropertyPathVisitor<R>): R {
  return dispatchPhpPropertyPathKind(value, 'single', visitor.single, () => dispatchPhpPropertyPathKind(value, 'chain', visitor.chain, () => { throw Error('Unreachable PhpPropertyPath kind'); }));
}

const dispatchPhpAccessModeKind = <K extends PhpAccessMode['kind'], R>(
  value: PhpAccessMode,
  kind: K,
  handler: (node: RelationVariant<PhpAccessMode, K>) => R,
  fallback: () => R,
): R => relationOptionFold(
  relationRefine(value, (candidate): candidate is RelationVariant<PhpAccessMode, K> => relationEqual(candidate.kind, kind)),
  fallback,
  handler,
);

export function matchPhpAccessMode<R>(value: PhpAccessMode, visitor: PhpAccessModeVisitor<R>): R {
  return dispatchPhpAccessModeKind(value, 'direct', visitor.direct, () => dispatchPhpAccessModeKind(value, 'nullsafe', visitor.nullsafe, () => { throw Error('Unreachable PhpAccessMode kind'); }));
}

const dispatchPhpMatchArmKind = <K extends PhpMatchArm['kind'], R>(
  value: PhpMatchArm,
  kind: K,
  handler: (node: RelationVariant<PhpMatchArm, K>) => R,
  fallback: () => R,
): R => relationOptionFold(
  relationRefine(value, (candidate): candidate is RelationVariant<PhpMatchArm, K> => relationEqual(candidate.kind, kind)),
  fallback,
  handler,
);

export function matchPhpMatchArm<R>(value: PhpMatchArm, visitor: PhpMatchArmVisitor<R>): R {
  return dispatchPhpMatchArmKind(value, 'conditional', visitor.conditional, () => dispatchPhpMatchArmKind(value, 'default', visitor.default, () => { throw Error('Unreachable PhpMatchArm kind'); }));
}

const dispatchPhpStatementKind = <K extends PhpStatement['kind'], R>(
  value: PhpStatement,
  kind: K,
  handler: (node: RelationVariant<PhpStatement, K>) => R,
  fallback: () => R,
): R => relationOptionFold(
  relationRefine(value, (candidate): candidate is RelationVariant<PhpStatement, K> => relationEqual(candidate.kind, kind)),
  fallback,
  handler,
);

export function matchPhpStatement<R>(value: PhpStatement, visitor: PhpStatementVisitor<R>): R {
  return dispatchPhpStatementKind(value, 'expression_statement', visitor.expression_statement, () => dispatchPhpStatementKind(value, 'return_with_value', visitor.return_with_value, () => dispatchPhpStatementKind(value, 'return_void', visitor.return_void, () => dispatchPhpStatementKind(value, 'assignment', visitor.assignment, () => dispatchPhpStatementKind(value, 'if_statement', visitor.if_statement, () => dispatchPhpStatementKind(value, 'foreach_statement', visitor.foreach_statement, () => dispatchPhpStatementKind(value, 'while_statement', visitor.while_statement, () => dispatchPhpStatementKind(value, 'switch_statement', visitor.switch_statement, () => dispatchPhpStatementKind(value, 'for_statement', visitor.for_statement, () => dispatchPhpStatementKind(value, 'try_statement', visitor.try_statement, () => dispatchPhpStatementKind(value, 'throw_statement', visitor.throw_statement, () => dispatchPhpStatementKind(value, 'unset_statement', visitor.unset_statement, () => dispatchPhpStatementKind(value, 'include_statement', visitor.include_statement, () => { throw Error('Unreachable PhpStatement kind'); })))))))))))));
}
