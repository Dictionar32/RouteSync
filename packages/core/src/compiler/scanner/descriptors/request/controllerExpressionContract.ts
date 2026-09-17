/** Semantic expression ADT resolved from Laravel expression AST. */
import { createAstIdentifier } from '../../lexer/phpAstTypes';
import type { AstIdentifier, PhpAstValue, PhpUnsupportedExpressionReason } from '../../lexer/phpAstTypes';
import { matchPhpAstValue } from '../../lexer/phpAstAlgebra';

export interface ControllerPropertyPath {
    readonly root: AstIdentifier;
    readonly steps: readonly AstIdentifier[];
}

export type ControllerBinaryOperator = import('../../lexer/phpAstTypes').PhpBinaryOperator;
export type ControllerAccessMode = import('../../lexer/phpAstTypes').PhpAccessMode;
export type ControllerUnaryOperator = import('../../lexer/phpAstTypes').PhpUnaryOperator;
export type ControllerCastType = import('../../lexer/phpAstTypes').PhpCastType;

export type ControllerExpressionContract =
    | { readonly kind: 'literal'; readonly literalType: 'string' | 'number' | 'boolean' | 'null'; readonly value: string | number | boolean | null }
    | { readonly kind: 'variable'; readonly name: AstIdentifier }
    | { readonly kind: 'class_reference'; readonly className: AstIdentifier }
    | { readonly kind: 'property_access'; readonly target: ControllerPropertyPath; readonly property: AstIdentifier; readonly access: ControllerAccessMode }
    | { readonly kind: 'method_call'; readonly target: ControllerPropertyPath; readonly method: AstIdentifier; readonly arguments: readonly ControllerArgumentContract[]; readonly access: ControllerAccessMode }
    | { readonly kind: 'static_call'; readonly className: AstIdentifier; readonly method: AstIdentifier; readonly arguments: readonly ControllerArgumentContract[] }
    | { readonly kind: 'function_call'; readonly functionName: AstIdentifier; readonly arguments: readonly ControllerArgumentContract[] }
    | { readonly kind: 'array_access'; readonly target: ControllerExpressionContract; readonly index: ControllerExpressionContract }
    | { readonly kind: 'resource'; readonly resourceName: AstIdentifier; readonly collection: boolean; readonly argument: ControllerExpressionContract }
    | { readonly kind: 'object'; readonly properties: readonly ControllerExpressionProperty[] }
    | { readonly kind: 'array'; readonly entries: readonly ControllerArrayEntry[] }
    | { readonly kind: 'ternary'; readonly condition: ControllerExpressionContract; readonly trueBranch: ControllerExpressionContract; readonly falseBranch: ControllerExpressionContract }
    | { readonly kind: 'short_ternary'; readonly condition: ControllerExpressionContract; readonly falseBranch: ControllerExpressionContract }
    | { readonly kind: 'null_coalesce'; readonly left: ControllerExpressionContract; readonly right: ControllerExpressionContract }
    | { readonly kind: 'binary'; readonly operator: ControllerBinaryOperator; readonly left: ControllerExpressionContract; readonly right: ControllerExpressionContract }
    | { readonly kind: 'unary'; readonly operator: ControllerUnaryOperator; readonly operand: ControllerExpressionContract }
    | { readonly kind: 'cast'; readonly castType: ControllerCastType; readonly operand: ControllerExpressionContract }
    | { readonly kind: 'match'; readonly subject: ControllerExpressionContract; readonly arms: readonly ControllerMatchArm[] }
    | { readonly kind: 'closure'; readonly parameters: readonly AstIdentifier[]; readonly captures: readonly AstIdentifier[]; readonly body: ControllerStatementContract[] }
    | { readonly kind: 'arrow_function'; readonly parameters: readonly AstIdentifier[]; readonly body: ControllerExpressionContract }
    | { readonly kind: 'unsupported'; readonly reason: PhpUnsupportedExpressionReason };

export type ControllerArgumentContract =
    | { readonly kind: 'positional'; readonly value: ControllerExpressionContract }
    | { readonly kind: 'named'; readonly name: AstIdentifier; readonly value: ControllerExpressionContract }
    | { readonly kind: 'unpacked'; readonly value: ControllerExpressionContract };

export type ControllerArrayKey =
    | { readonly kind: 'string'; readonly value: string }
    | { readonly kind: 'integer'; readonly value: number }
    | { readonly kind: 'expression'; readonly value: ControllerExpressionContract };

export type ControllerArrayEntry =
    | { readonly kind: 'keyed'; readonly key: ControllerArrayKey; readonly value: ControllerExpressionContract }
    | { readonly kind: 'positional'; readonly value: ControllerExpressionContract };

export type ControllerMatchArm =
    | { readonly kind: 'conditional'; readonly conditions: readonly ControllerExpressionContract[]; readonly value: ControllerExpressionContract }
    | { readonly kind: 'default'; readonly value: ControllerExpressionContract };

export type ControllerStatementContract =
    | { readonly kind: 'expression_statement'; readonly expression: ControllerExpressionContract }
    | { readonly kind: 'return_with_value'; readonly expression: ControllerExpressionContract }
    | { readonly kind: 'return_void' }
    | { readonly kind: 'assignment'; readonly target: ControllerAssignmentTarget; readonly value: ControllerExpressionContract }
    | { readonly kind: 'if'; readonly condition: ControllerExpressionContract; readonly thenBlock: readonly ControllerStatementContract[]; readonly alternative: ControllerIfAlternative }
    | { readonly kind: 'foreach'; readonly iterable: ControllerExpressionContract; readonly target: ControllerForeachTarget; readonly body: readonly ControllerStatementContract[] }
    | { readonly kind: 'for'; readonly initializer: ControllerForClause; readonly condition: ControllerForClause; readonly update: ControllerForClause; readonly body: readonly ControllerStatementContract[] }
    | { readonly kind: 'try'; readonly body: readonly ControllerStatementContract[]; readonly catches: readonly ControllerCatchClause[]; readonly finallyBlock: ControllerFinallyClause }
    | { readonly kind: 'throw'; readonly expression: ControllerExpressionContract };


export type ControllerIfAlternative =
    | { readonly kind: 'none' }
    | { readonly kind: 'else'; readonly block: readonly ControllerStatementContract[] }
    | { readonly kind: 'else_if'; readonly statement: Extract<ControllerStatementContract, { kind: 'if' }> };

export type ControllerForeachTarget =
    | { readonly kind: 'value'; readonly variable: AstIdentifier }
    | { readonly kind: 'key_value'; readonly key: AstIdentifier; readonly value: AstIdentifier };

export type ControllerForClause =
    | { readonly kind: 'empty' }
    | { readonly kind: 'expression'; readonly value: ControllerExpressionContract }
    | { readonly kind: 'assignment'; readonly target: ControllerAssignmentTarget; readonly value: ControllerExpressionContract };

export interface ControllerCatchClause {
    readonly exceptionType: AstIdentifier;
    readonly variable: AstIdentifier;
    readonly body: readonly ControllerStatementContract[];
}

export type ControllerFinallyClause =
    | { readonly kind: 'absent' }
    | { readonly kind: 'present'; readonly block: readonly ControllerStatementContract[] };

export type ControllerAssignmentTarget =
    | { readonly kind: 'variable'; readonly name: AstIdentifier }
    | { readonly kind: 'property'; readonly target: ControllerPropertyPath; readonly property: AstIdentifier }
    | { readonly kind: 'array_element'; readonly target: ControllerExpressionContract; readonly index: ControllerExpressionContract };

export interface ControllerExpressionProperty {
    readonly name: AstIdentifier;
    readonly value: ControllerExpressionContract;
}

export function resolveControllerExpression(value: PhpAstValue): ControllerExpressionContract {
    return matchPhpAstValue<ControllerExpressionContract>(value, {
        literal: v => ({ kind: 'literal', literalType: v.literalType, value: v.value }),
        arrayAccess: v => ({ kind: 'array_access', target: resolveControllerExpression(v.target), index: resolveControllerExpression(v.index) }),
        functionCall: v => ({ kind: 'function_call', functionName: v.functionName, arguments: Object.freeze(v.arguments.map(resolveArgument)) }),
        shortTernary: v => ({ kind: 'short_ternary', condition: resolveControllerExpression(v.condition), falseBranch: resolveControllerExpression(v.falseBranch) }),
        nullCoalesce: v => ({ kind: 'null_coalesce', left: resolveControllerExpression(v.left), right: resolveControllerExpression(v.right) }),
        binaryExpression: v => ({ kind: 'binary', operator: v.operator, left: resolveControllerExpression(v.left), right: resolveControllerExpression(v.right) }),
        unaryExpression: v => ({ kind: 'unary', operator: v.operator, operand: resolveControllerExpression(v.operand) }),
        castExpression: v => ({ kind: 'cast', castType: v.castType, operand: resolveControllerExpression(v.operand) }),
        matchExpression: v => ({ kind: 'match', subject: resolveControllerExpression(v.subject), arms: Object.freeze(v.arms.map(resolveMatchArm)) }),
        variableReference: v => ({ kind: 'variable', name: v.name }),
        propertyAccess: v => ({ kind: 'property_access', target: v.target, property: v.property, access: v.access }),
        methodChain: v => ({ kind: 'method_call', target: v.target, method: v.property, arguments: Object.freeze(v.arguments.map(resolveArgument)), access: v.access }),
        resourceSingle: v => ({ kind: 'resource', resourceName: v.resourceName, collection: false, argument: resolveControllerExpression(v.argument) }),
        resourceCollection: v => ({ kind: 'resource', resourceName: v.resourceName, collection: true, argument: resolveControllerExpression(v.argument) }),
        nestedArray: v => ({ kind: 'array', entries: Object.freeze(v.entries.map(resolveArrayEntry)) }),
        ternaryExpression: v => ({ kind: 'ternary', condition: resolveControllerExpression(v.condition), trueBranch: resolveControllerExpression(v.trueBranch), falseBranch: resolveControllerExpression(v.falseBranch) }),
        staticCall: v => ({ kind: 'static_call', className: v.className, method: v.method, arguments: Object.freeze(v.arguments.map(resolveArgument)) }),
        classReference: v => ({ kind: 'class_reference', className: v.className }),
        closure: v => ({ kind: 'closure', parameters: Object.freeze(v.parameters.map(p => p.variable)), captures: Object.freeze(v.captures.map(c => c.variable)), body: v.body.statements.map(resolveStatement) }),
        arrowFunction: v => ({ kind: 'arrow_function', parameters: Object.freeze(v.parameters.map(p => p.variable)), body: resolveControllerExpression(v.body) }),
        unsupported: v => ({ kind: 'unsupported', reason: v.reason })
    });
}

function resolveArgument(argument: import('../../lexer/phpAstTypes').PhpArgument): ControllerArgumentContract {
    if (argument.kind === 'positional') return { kind: 'positional', value: resolveControllerExpression(argument.value) };
    if (argument.kind === 'named') return { kind: 'named', name: argument.name, value: resolveControllerExpression(argument.value) };
    return { kind: 'unpacked', value: resolveControllerExpression(argument.value) };
}

function resolveArrayEntry(entry: import('../../lexer/phpAstTypes').PhpArrayEntry): ControllerArrayEntry {
    if (entry.kind === 'positional') return { kind: 'positional', value: resolveControllerExpression(entry.value) };
    return { kind: 'keyed', key: resolveArrayKey(entry.key), value: resolveControllerExpression(entry.value) };
}

function resolveArrayKey(key: import('../../lexer/phpAstTypes').PhpArrayKey): ControllerArrayKey {
    if (key.kind === 'string') return key;
    if (key.kind === 'integer') return key;
    return { kind: 'expression', value: resolveControllerExpression(key.value) };
}

function resolveMatchArm(arm: import('../../lexer/phpAstTypes').PhpMatchArm): ControllerMatchArm {
    if (arm.kind === 'default') return { kind: 'default', value: resolveControllerExpression(arm.value) };
    return { kind: 'conditional', conditions: arm.conditions.map(resolveControllerExpression), value: resolveControllerExpression(arm.value) };
}

function resolveStatement(statement: import('../../lexer/phpAstTypes').PhpStatement): ControllerStatementContract {
    if (statement.kind === 'return_void') return statement;
    if (statement.kind === 'return_with_value') return { kind: statement.kind, expression: resolveControllerExpression(statement.expression) };
    if (statement.kind === 'expression_statement') return { kind: statement.kind, expression: resolveControllerExpression(statement.expression) };
    if (statement.kind === 'assignment') return { kind: 'assignment', target: resolveAssignmentTarget(statement.target), value: resolveControllerExpression(statement.value) };
    if (statement.kind === 'throw_statement') return { kind: 'throw', expression: resolveControllerExpression(statement.expression) };
    if (statement.kind === 'if_statement') return { kind: 'if', condition: resolveControllerExpression(statement.condition), thenBlock: statement.thenBlock.statements.map(resolveStatement), alternative: resolveIfAlternative(statement.alternative) };
    if (statement.kind === 'foreach_statement') return { kind: 'foreach', iterable: resolveControllerExpression(statement.iterable), target: statement.target, body: statement.body.statements.map(resolveStatement) };
    if (statement.kind === 'for_statement') return { kind: 'for', initializer: resolveForClause(statement.initializer), condition: resolveForClause(statement.condition), update: resolveForClause(statement.update), body: statement.body.statements.map(resolveStatement) };
    return { kind: 'try', body: statement.body.statements.map(resolveStatement), catches: statement.catches.map(catchClause => ({ exceptionType: catchClause.exceptionType, variable: catchClause.variable, body: catchClause.body.statements.map(resolveStatement) })), finallyBlock: resolveFinallyClause(statement.finallyBlock) };
}

function resolveIfAlternative(alternative: import('../../lexer/phpAstTypes').PhpIfAlternative): ControllerIfAlternative {
    if (alternative.kind === 'none') return alternative;
    if (alternative.kind === 'else_block') return { kind: 'else', block: alternative.block.statements.map(resolveStatement) };
    return { kind: 'else_if', statement: resolveStatement(alternative.statement) as Extract<ControllerStatementContract, { kind: 'if' }> };
}

function resolveForClause(clause: import('../../lexer/phpAstTypes').PhpForClause): ControllerForClause {
    if (clause.kind === 'empty') return clause;
    if (clause.kind === 'assignment') return { kind: 'assignment', target: resolveAssignmentTarget(clause.target), value: resolveControllerExpression(clause.value) };
    return { kind: 'expression', value: resolveControllerExpression(clause.value) };
}

function resolveFinallyClause(clause: import('../../lexer/phpAstTypes').PhpFinallyClause): ControllerFinallyClause {
    return clause.kind === 'absent' ? clause : { kind: 'present', block: clause.block.statements.map(resolveStatement) };
}

function resolveAssignmentTarget(target: import('../../lexer/phpAstTypes').PhpAssignmentTarget): ControllerAssignmentTarget {
    if (target.kind === 'variable') return target;
    if (target.kind === 'property') return target;
    return { kind: 'array_element', target: resolveControllerExpression(target.target), index: resolveControllerExpression(target.index) };
}
