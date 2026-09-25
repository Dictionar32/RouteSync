/** Immutable constructors for scanner-level PHP syntax AST. */
import type { SourceRange, AstIdentifier, PhpArgument, PhpArrayEntry, PhpAstValue, PhpAstValueNode, PhpClosureCapture, PhpParameter, PhpPropertyPath, PhpBlock, PhpArrayKey, PhpBinaryOperator, PhpUnaryOperator, PhpCastType, PhpMatchArm, PhpStatement, PhpAccessMode, PhpAssignmentOperator, PhpIfAlternative, PhpForeachTarget, PhpForClause, PhpCatchClause, PhpFinallyClause } from './phpAstTypes';

export class PhpAstFactory {
    static stringLiteral(value: string): PhpAstValueNode { return Object.freeze({ kind: 'literal', literalType: 'string', value }); }
    static interpolatedString(parts: readonly import('./phpAstExpressionTypes').PhpInterpolatedStringPart[]): PhpAstValueNode { return Object.freeze({ kind: 'interpolated_string', parts: Object.freeze([...parts]) }); }
    static numberLiteral(raw: string): PhpAstValueNode { return Object.freeze({ kind: 'literal', literalType: 'number', value: Number(raw) }); }
    static booleanLiteral(value: boolean): PhpAstValueNode { return Object.freeze({ kind: 'literal', literalType: 'boolean', value }); }
    static nullLiteral(): PhpAstValueNode { return Object.freeze({ kind: 'literal', literalType: 'null', value: null }); }
    static variableReference(name: AstIdentifier): PhpAstValueNode { return Object.freeze({ kind: 'variable_reference', name }); }
    static magicConstant(value: import('./phpAstExpressionTypes').PhpMagicConstant): PhpAstValueNode { return Object.freeze({ kind: 'magic_constant', value }); }
    static constantReference(name: AstIdentifier): PhpAstValueNode { return Object.freeze({ kind: 'constant_reference', name }); }
    static propertyPath(root: AstIdentifier, steps: readonly AstIdentifier[]): PhpPropertyPath {
        const frozen = Object.freeze([...steps]);
        return frozen.length === 0
            ? Object.freeze({ kind: 'single' as const, root, steps: [] as const })
            : Object.freeze({ kind: 'chain' as const, root, steps: frozen });
    }
    static propertyAccess(target: PhpPropertyPath, receiver: PhpAstValue, property: AstIdentifier, access: PhpAccessMode): PhpAstValueNode { return Object.freeze({ kind: 'property_access', target, receiver, property, access }); }
    static methodChain(target: PhpPropertyPath, receiver: PhpAstValue, property: AstIdentifier, args: readonly PhpArgument[], access: PhpAccessMode): PhpAstValueNode { return Object.freeze({ kind: 'method_chain', target, receiver, property, arguments: Object.freeze([...args]), access }); }
    static resourceSingle(resourceName: AstIdentifier, argument: PhpAstValue): PhpAstValueNode { return Object.freeze({ kind: 'resource_single', resourceName, argument }); }
    static resourceCollection(resourceName: AstIdentifier, argument: PhpAstValue): PhpAstValueNode { return Object.freeze({ kind: 'resource_collection', resourceName, argument }); }
    static staticCall(className: AstIdentifier, method: AstIdentifier, args: readonly PhpArgument[]): PhpAstValueNode { return Object.freeze({ kind: 'static_call', className, method, arguments: Object.freeze([...args]) }); }
    static classReference(className: AstIdentifier): PhpAstValueNode { return Object.freeze({ kind: 'class_reference', className }); }
    static classConstant(owner: AstIdentifier, name: AstIdentifier): PhpAstValueNode { return Object.freeze({ kind: 'class_constant', owner, name }); }
    static construct(className: AstIdentifier, args: readonly PhpArgument[]): PhpAstValueNode { return Object.freeze({ kind: 'construct', className, arguments: Object.freeze([...args]) }); }
    static dynamicConstruct(classExpression: PhpAstValue, args: readonly PhpArgument[]): PhpAstValueNode { return Object.freeze({ kind: 'dynamic_construct', classExpression, arguments: Object.freeze([...args]) }); }
    static anonymousClassConstruct(value: import('./phpAstExpressionTypes').PhpAnonymousClass, args: readonly PhpArgument[]): PhpAstValueNode { return Object.freeze({ kind: 'anonymous_class_construct', class: value, arguments: Object.freeze([...args]) }); }
    static instanceOf(expression: PhpAstValue, className: AstIdentifier): PhpAstValueNode { return Object.freeze({ kind: 'instance_of', expression, className }); }
    static ternaryExpression(condition: PhpAstValue, trueBranch: PhpAstValue, falseBranch: PhpAstValue): PhpAstValueNode { return Object.freeze({ kind: 'ternary_expression', condition, trueBranch, falseBranch }); }
    static arrayAccess(target: PhpAstValue, index: PhpAstValue): PhpAstValueNode { return Object.freeze({ kind: 'array_access', target, index }); }
    static functionCall(functionName: AstIdentifier, args: readonly PhpArgument[]): PhpAstValueNode { return Object.freeze({ kind: 'function_call', functionName, arguments: Object.freeze([...args]) }); }
    static callableCall(callable: PhpAstValue, args: readonly PhpArgument[]): PhpAstValueNode { return Object.freeze({ kind: 'callable_call', callable, arguments: Object.freeze([...args]) }); }
    static shortTernary(condition: PhpAstValue, falseBranch: PhpAstValue): PhpAstValueNode { return Object.freeze({ kind: 'short_ternary', condition, falseBranch }); }
    static nullCoalesce(left: PhpAstValue, right: PhpAstValue): PhpAstValueNode { return Object.freeze({ kind: 'null_coalesce', left, right }); }
    static binaryExpression(operator: PhpBinaryOperator, left: PhpAstValue, right: PhpAstValue): PhpAstValueNode { return Object.freeze({ kind: 'binary_expression', operator, left, right }); }
    static unaryExpression(operator: PhpUnaryOperator, operand: PhpAstValue): PhpAstValueNode { return Object.freeze({ kind: 'unary_expression', operator, operand }); }
    static castExpression(castType: PhpCastType, operand: PhpAstValue): PhpAstValueNode { return Object.freeze({ kind: 'cast_expression', castType, operand }); }
    static nestedArray(entries: readonly PhpArrayEntry[]): PhpAstValueNode { return Object.freeze({ kind: 'nested_array', entries: Object.freeze([...entries]) }); }
    static matchConditional(conditions: readonly PhpAstValue[], value: PhpAstValue): PhpMatchArm { return Object.freeze({ kind: 'conditional', conditions: Object.freeze([...conditions]), value }); }
    static matchDefault(value: PhpAstValue): PhpMatchArm { return Object.freeze({ kind: 'default', value }); }
    static matchExpression(subject: PhpAstValue, arms: readonly PhpMatchArm[]): PhpAstValueNode { return Object.freeze({ kind: 'match_expression', subject, arms: Object.freeze([...arms]) }); }
    static variableAssignment(names: readonly AstIdentifier[]): import('./phpAstTypes').PhpAssignmentTarget { return Object.freeze({ kind: 'variables', names: Object.freeze([...names]) }); }
    static assignment(target: import('./phpAstTypes').PhpAssignmentTarget, operator: PhpAssignmentOperator, reference: import('./phpAstTypes').PhpAssignmentReference, value: PhpAstValue, source: import('./phpAstTypes').TokenDescriptor): PhpStatement { return Object.freeze({ kind: 'assignment', target, operator, reference, value, source }); }
    static assignmentExpression(target: import('./phpAstTypes').PhpAssignmentTarget, operator: PhpAssignmentOperator, reference: import('./phpAstTypes').PhpAssignmentReference, value: PhpAstValue): PhpAstValueNode { return Object.freeze({ kind: 'assignment_expression', target, operator, reference, value }); }
    static ifStatement(condition: PhpAstValue, thenBlock: PhpBlock, alternative: PhpIfAlternative, source: import('./phpAstTypes').TokenDescriptor): PhpStatement { return Object.freeze({ kind: 'if_statement', condition, thenBlock, alternative, source }); }
    static foreachStatement(iterable: PhpAstValue, target: PhpForeachTarget, body: PhpBlock, source: import('./phpAstTypes').TokenDescriptor): PhpStatement { return Object.freeze({ kind: 'foreach_statement', iterable, target, body, source }); }
    static forStatement(initializer: PhpForClause, condition: PhpForClause, update: PhpForClause, body: PhpBlock, source: import('./phpAstTypes').TokenDescriptor): PhpStatement { return Object.freeze({ kind: 'for_statement', initializer, condition, update, body, source }); }
    static tryStatement(body: PhpBlock, catches: readonly PhpCatchClause[], finallyBlock: PhpFinallyClause, source: import('./phpAstTypes').TokenDescriptor): PhpStatement { return Object.freeze({ kind: 'try_statement', body, catches: Object.freeze([...catches]), finallyBlock, source }); }
    static throwStatement(expression: PhpAstValue, source: import('./phpAstTypes').TokenDescriptor): PhpStatement { return Object.freeze({ kind: 'throw_statement', expression, source }); }
    static closure(parameters: readonly PhpParameter[], captures: readonly PhpClosureCapture[], body: PhpBlock): PhpAstValueNode { return Object.freeze({ kind: 'closure', parameters: Object.freeze([...parameters]), captures: Object.freeze([...captures]), body }); }
    static arrowFunction(parameters: readonly PhpParameter[], body: PhpAstValue): PhpAstValueNode { return Object.freeze({ kind: 'arrow_function', parameters: Object.freeze([...parameters]), body }); }
    static unsupported(tokens: readonly import('./phpAstTypes').TokenDescriptor[]): PhpAstValueNode { return Object.freeze({ kind: 'unsupported', reason: 'unclassified_expression', tokens: Object.freeze([...tokens]) }); }
}
