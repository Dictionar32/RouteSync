/**
 * Typed boundary adapter: php-parser grammar → canonical PHP AST ADT.
 * No semantic inference is performed here.
 */

import type {
    PhpArgument, PhpAstNode, PhpBlock, PhpClosureCapture, PhpParameter,
    PhpBinaryOperator, PhpCastType, PhpUnaryOperator, PhpPropertyName,
    PhpClassName, PhpConstantName, PhpFunctionName, PhpMethodName,
    PhpVariableName, ArrayKey, PhpStatement
} from '@routesync/core';
import type { PhpGrammarNode, PhpGrammarNode as GrammarNode, GrammarStatement } from './ast/grammar';
import { matchPhpGrammar, type PhpGrammarVisitor } from './ast/grammarCatamorphism';
import { matchCallee, createCalleeAstVisitor } from './ast/calleeCatamorphism';

const propertyName = (value: string): PhpPropertyName => ({ kind: 'property_name', value });
const className = (value: string): PhpClassName => ({ kind: 'class_name', value });
const methodName = (value: string): PhpMethodName => ({ kind: 'method_name', value });
const functionName = (value: string): PhpFunctionName => ({ kind: 'function_name', value });
const variableName = (value: string): PhpVariableName => ({ kind: 'variable_name', value });
const constantName = (value: string): PhpConstantName => ({ kind: 'constant_name', value });
const source = { kind: 'absent' } as const;

function requireNode<T>(value: T | undefined, label: string): T {
    if (value === undefined) throw new Error(`PHP AST boundary: missing ${label}`);
    return value;
}

function memberName(node: PhpGrammarNode, label: string): string {
    if (node.kind === 'identifier' || node.kind === 'name') return node.name;
    throw new Error(`PHP AST boundary: invalid ${label} node ${node.kind}`);
}

function classReference(node: PhpGrammarNode): string {
    if (node.kind === 'name') return node.name;
    if (node.kind === 'selfreference' || node.kind === 'staticreference') return node.raw;
    throw new Error(`PHP AST boundary: invalid class reference node ${node.kind}`);
}

function binaryOperator(value: string): PhpBinaryOperator {
    const table: Readonly<Record<string, PhpBinaryOperator>> = {
        '+': { kind: 'addition' }, '-': { kind: 'subtraction' }, '*': { kind: 'multiplication' }, '/': { kind: 'division' }, '%': { kind: 'modulo' }, '**': { kind: 'exponentiation' },
        '==': { kind: 'equal' }, '!=': { kind: 'not_equal' }, '===': { kind: 'identical' }, '!==': { kind: 'not_identical' }, '<': { kind: 'less_than' }, '<=': { kind: 'less_than_or_equal' }, '>': { kind: 'greater_than' }, '>=': { kind: 'greater_than_or_equal' },
        '&&': { kind: 'logical_and' }, '||': { kind: 'logical_or' }, 'xor': { kind: 'logical_xor' }, '&': { kind: 'bitwise_and' }, '|': { kind: 'bitwise_or' }, '^': { kind: 'bitwise_xor' }, '<<': { kind: 'left_shift' }, '>>': { kind: 'right_shift' }, '.': { kind: 'concat' }, '??': { kind: 'null_coalesce' }
    };
    const operator = table[value];
    if (operator === undefined) throw new Error(`PHP AST boundary: unsupported binary operator ${value}`);
    return operator;
}

function unaryOperator(value: string): PhpUnaryOperator {
    const table: Readonly<Record<string, PhpUnaryOperator>> = {
        '!': { kind: 'not' }, '+': { kind: 'positive' }, '-': { kind: 'negative' }, '~': { kind: 'bitwise_not' }, '@': { kind: 'error_control' },
        '++': { kind: 'pre_increment' }, '--': { kind: 'pre_decrement' }
    };
    const operator = table[value];
    if (operator === undefined) throw new Error(`PHP AST boundary: unsupported unary operator ${value}`);
    return operator;
}

function castType(value: string): PhpCastType {
    const table: Readonly<Record<string, PhpCastType>> = {
        int: { kind: 'int' }, integer: { kind: 'int' }, float: { kind: 'float' }, double: { kind: 'float' }, string: { kind: 'string' }, bool: { kind: 'bool' }, boolean: { kind: 'bool' }
    };
    const cast = table[value];
    if (cast === undefined) throw new Error(`PHP AST boundary: unsupported cast type ${value}`);
    return cast;
}


function staticLookup(
    node: import('./ast/grammar').GrammarStaticLookup,
    code: string,
    source: { readonly kind: 'absent' }): PhpAstNode {
    const classNameValue = classReference(node.what);
    if (node.offset.kind === 'variable') {
        return {
            kind: 'static_property_lookup',
            originalCode: code,
            source,
            className: className(classNameValue),
            property: propertyName(node.offset.name)
        };
    }
    if (node.offset.kind === 'identifier' || node.offset.kind === 'name') {
        return {
            kind: 'static_constant',
            originalCode: code,
            source,
            className: className(classNameValue),
            constantName: constantName(node.offset.name)
        };
    }
    throw new Error(`PHP AST boundary: unsupported static member offset ${node.offset.kind}`);
}

function parameter(node: { readonly name: string }): PhpParameter {
    return { variable: variableName(node.name) };
}

function capture(node: { readonly variable: { readonly name: string }; readonly byref?: boolean }): PhpClosureCapture {
    return node.byref ? { kind: 'by_reference', variable: variableName(node.variable.name) } : { kind: 'by_value', variable: variableName(node.variable.name) };
}

function statement(node: GrammarStatement, adapt: (node: PhpGrammarNode) => PhpAstNode): PhpStatement {
    if (node.kind === 'expressionstatement') return { kind: 'expression_statement', expression: adapt(node.expression) };
    return node.expr === undefined
        ? { kind: 'return_statement', expression: { kind: 'void' } }
        : { kind: 'return_statement', expression: { kind: 'value', value: adapt(node.expr) } };
}

function block(node: { readonly children?: readonly GrammarStatement[] }, adapt: (node: PhpGrammarNode) => PhpAstNode): PhpBlock {
    return { kind: 'block', statements: requireNode(node.children, 'closure block statements').map(item => statement(item, adapt)) };
}

function arrayKey(key: PhpGrammarNode | null, adapt: (node: PhpGrammarNode) => PhpAstNode): ArrayKey {
    return key === null ? { kind: 'implicit' } : { kind: 'explicit', expression: adapt(key) };
}

export function adaptPhpAstBoundary(node: unknown, code: string): PhpAstNode {
    if (typeof node !== 'object' || node === null || !('kind' in node)) throw new Error('PHP AST boundary: input is not a grammar node');
    const grammarNode = node as PhpGrammarNode;
    return adaptGrammarNode(grammarNode, code, true);
}

function adaptGrammarNode(node: PhpGrammarNode, sourceText: string, root: boolean): PhpAstNode {
    const code = root ? sourceText : requireNodeSource(node, sourceText);
    const adaptChild = (child: PhpGrammarNode): PhpAstNode => adaptGrammarNode(child, sourceText, false);
    const calleeVisitor = createCalleeAstVisitor(adaptChild);
    const args = (values: readonly PhpGrammarNode[]): readonly PhpArgument[] => values.map(value => ({ kind: 'positional', value: adaptChild(value) }));

    const visitor: PhpGrammarVisitor<PhpAstNode> = {
        propertylookup: n => ({ kind: 'property_lookup', originalCode: code, source, target: adaptChild(n.what), property: propertyName(memberName(n.offset, 'property')) }),
        nullsafepropertylookup: n => ({ kind: 'nullsafe_property_lookup', originalCode: code, source, target: adaptChild(n.what), property: propertyName(memberName(n.offset, 'property')) }),
        offsetlookup: n => ({ kind: 'offset_lookup', originalCode: code, source, target: adaptChild(n.what), offset: adaptChild(n.offset) }),
        staticlookup: n => staticLookup(n, code, source),
        call: n => matchCallee(n.what, args(n.arguments), code, calleeVisitor),
        new: n => ({ kind: 'new_instance', originalCode: code, source, className: className(classReference(n.what)), args: args(n.arguments) }),
        closure: n => ({ kind: 'closure', originalCode: code, source, parameters: n.arguments.map(parameter), captures: n.uses.map(capture), body: block(n.body, adaptChild) }),
        arrowfunc: n => ({ kind: 'arrow_func', originalCode: code, source, parameters: n.arguments.map(parameter), body: adaptChild(n.body) }),
        bin: n => ({ kind: 'binary', originalCode: code, source, operator: binaryOperator(n.type), left: adaptChild(n.left), right: adaptChild(n.right) }),
        unary: n => ({ kind: 'unary', originalCode: code, source, operator: unaryOperator(n.type), what: adaptChild(n.what) }),
        cast: n => ({ kind: 'type_cast', originalCode: code, source, castType: castType(n.type), expr: adaptChild(n.expr) }),
        retif: n => ({ kind: 'ternary', originalCode: code, source, condition: adaptChild(n.test), truthy: adaptChild(n.trueExpr), falsy: adaptChild(n.falseExpr) }),
        array: n => ({ kind: 'array', originalCode: code, source, items: requireNode(n.items, 'array items').map(item => ({ key: arrayKey(item.key, adaptChild), value: adaptChild(item.value) })) }),
        string: n => ({ kind: 'literal', originalCode: code, source, value: n.value }),
        number: n => ({ kind: 'literal', originalCode: code, source, value: Number(n.value) }),
        boolean: n => ({ kind: 'literal', originalCode: code, source, value: n.value }),
        nullkeyword: () => ({ kind: 'literal', originalCode: code, source, value: null }),
        encapsed: () => ({ kind: 'literal', originalCode: code, source, value: code }),
        variable: n => ({ kind: 'variable', originalCode: code, source, name: variableName(n.name) }),
        unknown: () => ({ kind: 'unsupported', originalCode: code, source, reason: { kind: 'parser_gap' } })
    };
    return matchPhpGrammar(node, visitor);
}

function requireNodeSource(node: PhpGrammarNode, sourceText: string): string {
    const loc = node.loc;
    if (loc === undefined) throw new Error(`PHP AST boundary: missing location for child node ${node.kind}`);
    return sourceText.slice(loc.start.offset, loc.end.offset);
}
