/** Immutable constructors for scanner-level PHP syntax AST. */
import type { AstIdentifier, PhpArgument, PhpArrayEntry, PhpAstValue, PhpClosureCapture, PhpParameter, PhpPropertyPath, PhpBlock, PhpArrayKey, PhpBinaryOperator, PhpUnaryOperator, PhpCastType, PhpMatchArm, PhpStatement, PhpAccessMode, PhpIfAlternative, PhpForeachTarget, PhpForClause, PhpCatchClause, PhpFinallyClause } from './phpAstTypes';

export class PhpAstFactory {
    static stringLiteral(value: string): PhpAstValue { return Object.freeze({ kind: 'literal', literalType: 'string', value }); }
    static numberLiteral(raw: string): PhpAstValue { return Object.freeze({ kind: 'literal', literalType: 'number', value: Number(raw) }); }
    static booleanLiteral(value: boolean): PhpAstValue { return Object.freeze({ kind: 'literal', literalType: 'boolean', value }); }
    static nullLiteral(): PhpAstValue { return Object.freeze({ kind: 'literal', literalType: 'null', value: null }); }
    static variableReference(name: AstIdentifier): PhpAstValue { return Object.freeze({ kind: 'variable_reference', name }); }
    static propertyPath(root: AstIdentifier, steps: readonly AstIdentifier[]): PhpPropertyPath {
        const frozen = Object.freeze([...steps]);
        return frozen.length === 0
            ? Object.freeze({ kind: 'single' as const, root, steps: [] as const })
            : Object.freeze({ kind: 'chain' as const, root, steps: frozen });
    }
    static propertyAccess(target: PhpPropertyPath, receiver: PhpAstValue, property: AstIdentifier, access: PhpAccessMode): PhpAstValue { return Object.freeze({ kind: 'property_access', target, receiver, property, access }); }
    static methodChain(target: PhpPropertyPath, receiver: PhpAstValue, property: AstIdentifier, args: readonly PhpArgument[], access: PhpAccessMode): PhpAstValue { return Object.freeze({ kind: 'method_chain', target, receiver, property, arguments: Object.freeze([...args]), access }); }
    static resourceSingle(resourceName: AstIdentifier, argument: PhpAstValue): PhpAstValue { return Object.freeze({ kind: 'resource_single', resourceName, argument }); }
    static resourceCollection(resourceName: AstIdentifier, argument: PhpAstValue): PhpAstValue { return Object.freeze({ kind: 'resource_collection', resourceName, argument }); }
    static staticCall(className: AstIdentifier, method: AstIdentifier, args: readonly PhpArgument[]): PhpAstValue { return Object.freeze({ kind: 'static_call', className, method, arguments: Object.freeze([...args]) }); }
    static classReference(className: AstIdentifier): PhpAstValue { return Object.freeze({ kind: 'class_reference', className }); }
    static construct(className: AstIdentifier, args: readonly PhpArgument[]): PhpAstValue { return Object.freeze({ kind: 'construct', className, arguments: Object.freeze([...args]) }); }
    static instanceOf(expression: PhpAstValue, className: AstIdentifier): PhpAstValue { return Object.freeze({ kind: 'instance_of', expression, className }); }
    static ternaryExpression(condition: PhpAstValue, trueBranch: PhpAstValue, falseBranch: PhpAstValue): PhpAstValue { return Object.freeze({ kind: 'ternary_expression', condition, trueBranch, falseBranch }); }
    static arrayAccess(target: PhpAstValue, index: PhpAstValue): PhpAstValue { return Object.freeze({ kind: 'array_access', target, index }); }
    static functionCall(functionName: AstIdentifier, args: readonly PhpArgument[]): PhpAstValue { return Object.freeze({ kind: 'function_call', functionName, arguments: Object.freeze([...args]) }); }
    static shortTernary(condition: PhpAstValue, falseBranch: PhpAstValue): PhpAstValue { return Object.freeze({ kind: 'short_ternary', condition, falseBranch }); }
    static nullCoalesce(left: PhpAstValue, right: PhpAstValue): PhpAstValue { return Object.freeze({ kind: 'null_coalesce', left, right }); }
    static binaryExpression(operator: PhpBinaryOperator, left: PhpAstValue, right: PhpAstValue): PhpAstValue { return Object.freeze({ kind: 'binary_expression', operator, left, right }); }
    static unaryExpression(operator: PhpUnaryOperator, operand: PhpAstValue): PhpAstValue { return Object.freeze({ kind: 'unary_expression', operator, operand }); }
    static castExpression(castType: PhpCastType, operand: PhpAstValue): PhpAstValue { return Object.freeze({ kind: 'cast_expression', castType, operand }); }
    static nestedArray(entries: readonly PhpArrayEntry[]): PhpAstValue { return Object.freeze({ kind: 'nested_array', entries: Object.freeze([...entries]) }); }
    static matchConditional(conditions: readonly PhpAstValue[], value: PhpAstValue): PhpMatchArm { return Object.freeze({ kind: 'conditional', conditions: Object.freeze([...conditions]), value }); }
    static matchDefault(value: PhpAstValue): PhpMatchArm { return Object.freeze({ kind: 'default', value }); }
    static matchExpression(subject: PhpAstValue, arms: readonly PhpMatchArm[]): PhpAstValue { return Object.freeze({ kind: 'match_expression', subject, arms: Object.freeze([...arms]) }); }
    static variableAssignment(names: readonly AstIdentifier[]): import('./phpAstTypes').PhpAssignmentTarget { return Object.freeze({ kind: 'variables', names: Object.freeze([...names]) }); }
    static assignment(target: import('./phpAstTypes').PhpAssignmentTarget, value: PhpAstValue): PhpStatement { return Object.freeze({ kind: 'assignment', target, value }); }
    static ifStatement(condition: PhpAstValue, thenBlock: PhpBlock, alternative: PhpIfAlternative): PhpStatement { return Object.freeze({ kind: 'if_statement', condition, thenBlock, alternative }); }
    static foreachStatement(iterable: PhpAstValue, target: PhpForeachTarget, body: PhpBlock): PhpStatement { return Object.freeze({ kind: 'foreach_statement', iterable, target, body }); }
    static forStatement(initializer: PhpForClause, condition: PhpForClause, update: PhpForClause, body: PhpBlock): PhpStatement { return Object.freeze({ kind: 'for_statement', initializer, condition, update, body }); }
    static tryStatement(body: PhpBlock, catches: readonly PhpCatchClause[], finallyBlock: PhpFinallyClause): PhpStatement { return Object.freeze({ kind: 'try_statement', body, catches: Object.freeze([...catches]), finallyBlock }); }
    static throwStatement(expression: PhpAstValue): PhpStatement { return Object.freeze({ kind: 'throw_statement', expression }); }
    static closure(parameters: readonly PhpParameter[], captures: readonly PhpClosureCapture[], body: PhpBlock): PhpAstValue { return Object.freeze({ kind: 'closure', parameters: Object.freeze([...parameters]), captures: Object.freeze([...captures]), body }); }
    static arrowFunction(parameters: readonly PhpParameter[], body: PhpAstValue): PhpAstValue { return Object.freeze({ kind: 'arrow_function', parameters: Object.freeze([...parameters]), body }); }
    static unsupported(tokens: readonly import('./phpAstTypes').TokenDescriptor[]): PhpAstValue { return Object.freeze({ kind: 'unsupported', reason: 'unclassified_expression', tokens: Object.freeze([...tokens]) }); }
}
