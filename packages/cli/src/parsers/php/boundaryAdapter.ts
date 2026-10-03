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
import type { PhpGrammarNode, GrammarStatement } from './ast/grammar';
import { matchPhpGrammar, type PhpGrammarVisitor } from './ast/grammarCatamorphism';
import { matchCallee, createCalleeAstVisitor } from './ast/calleeCatamorphism';
import { relationResolve, projectRelation } from '@routesync/core';
const propertyName = (value: string): PhpPropertyName => ({ kind: 'property_name', value });
const className = (value: string): PhpClassName => ({ kind: 'class_name', value });
const methodName = (value: string): PhpMethodName => ({ kind: 'method_name', value });
const functionName = (value: string): PhpFunctionName => ({ kind: 'function_name', value });
const variableName = (value: string): PhpVariableName => ({ kind: 'variable_name', value });
const constantName = (value: string): PhpConstantName => ({ kind: 'constant_name', value });
const source = { kind: 'absent' } as const;

const fail = (message: string): never => { throw new Error(message); };
const requireNode = <T>(value: T | undefined, label: string): T => value ?? fail(`PHP AST boundary: missing ${label}`);

const memberReaders = Object.freeze({
    identifier: (node: Extract<PhpGrammarNode, { readonly kind: 'identifier' }>) => node.name,
    name: (node: Extract<PhpGrammarNode, { readonly kind: 'name' }>) => node.name,
});
const memberName = (node: PhpGrammarNode, label: string): string =>
    (memberReaders[node.kind as keyof typeof memberReaders] ?? ((value: never) => fail(`PHP AST boundary: invalid ${label} node ${(value as PhpGrammarNode).kind}`)))(node as never);

const classReaders = Object.freeze({
    name: (node: Extract<PhpGrammarNode, { readonly kind: 'name' }>) => node.name,
    selfreference: (node: Extract<PhpGrammarNode, { readonly kind: 'selfreference' }>) => node.raw,
    staticreference: (node: Extract<PhpGrammarNode, { readonly kind: 'staticreference' }>) => node.raw,
});
const classReference = (node: PhpGrammarNode): string =>
    (classReaders[node.kind as keyof typeof classReaders] ?? ((value: never) => fail(`PHP AST boundary: invalid class reference node ${(value as PhpGrammarNode).kind}`)))(node as never);

const binaryOperator = (value: string): PhpBinaryOperator => {
    const table: Readonly<Record<string, PhpBinaryOperator>> = {
        '+': { kind: 'addition' }, '-': { kind: 'subtraction' }, '*': { kind: 'multiplication' }, '/': { kind: 'division' }, '%': { kind: 'modulo' }, '**': { kind: 'exponentiation' },
        '==': { kind: 'equal' }, '!=': { kind: 'not_equal' }, '===': { kind: 'identical' }, '!==': { kind: 'not_identical' }, '<': { kind: 'less_than' }, '<=': { kind: 'less_than_or_equal' }, '>': { kind: 'greater_than' }, '>=': { kind: 'greater_than_or_equal' },
        '&&': { kind: 'logical_and' }, '||': { kind: 'logical_or' }, 'xor': { kind: 'logical_xor' }, '&': { kind: 'bitwise_and' }, '|': { kind: 'bitwise_or' }, '^': { kind: 'bitwise_xor' }, '<<': { kind: 'left_shift' }, '>>': { kind: 'right_shift' }, '.': { kind: 'concat' }, '??': { kind: 'null_coalesce' },
    };
    return table[value] ?? fail(`PHP AST boundary: unsupported binary operator ${value}`);
};

const unaryOperator = (value: string): PhpUnaryOperator => {
    const table: Readonly<Record<string, PhpUnaryOperator>> = {
        '!': { kind: 'not' }, '+': { kind: 'positive' }, '-': { kind: 'negative' }, '~': { kind: 'bitwise_not' }, '@': { kind: 'error_control' },
        '++': { kind: 'pre_increment' }, '--': { kind: 'pre_decrement' },
    };
    return table[value] ?? fail(`PHP AST boundary: unsupported unary operator ${value}`);
};

const castType = (value: string): PhpCastType => {
    const table: Readonly<Record<string, PhpCastType>> = {
        int: { kind: 'int' }, integer: { kind: 'int' }, float: { kind: 'float' }, double: { kind: 'float' }, string: { kind: 'string' }, bool: { kind: 'bool' }, boolean: { kind: 'bool' },
    };
    return table[value] ?? fail(`PHP AST boundary: unsupported cast type ${value}`);
};

function staticLookup(node: import('./ast/grammar').GrammarStaticLookup, code: string): PhpAstNode {
    const classNameValue = classReference(node.what);
    const readers: Readonly<Record<string, () => PhpAstNode>> = Object.freeze({
        variable: () => ({
            kind: 'static_property_lookup', originalCode: code, source,
            className: className(classNameValue), property: propertyName((node.offset as { readonly name: string }).name),
        }),
        identifier: () => ({
            kind: 'static_constant', originalCode: code, source,
            className: className(classNameValue), constantName: constantName((node.offset as { readonly name: string }).name),
        }),
        name: () => ({
            kind: 'static_constant', originalCode: code, source,
            className: className(classNameValue), constantName: constantName((node.offset as { readonly name: string }).name),
        }),
    });
    return (readers[node.offset.kind] ?? (() => fail(`PHP AST boundary: unsupported static member offset ${node.offset.kind}`)))();
}

const parameter = (node: { readonly name: string }): PhpParameter => ({ variable: variableName(node.name) });
const capture = (node: { readonly variable: { readonly name: string }; readonly byref?: boolean }): PhpClosureCapture =>
    relationResolve(node.byref === true,
        () => ({ kind: 'by_reference', variable: variableName(node.variable.name) }),
        () => ({ kind: 'by_value', variable: variableName(node.variable.name) }));

const statement = (node: GrammarStatement, adapt: (node: PhpGrammarNode) => PhpAstNode): PhpStatement => {
    const expressionNode = node as Extract<GrammarStatement, { readonly kind: 'expressionstatement' }>;
    const returnNode = node as Extract<GrammarStatement, { readonly kind: 'return' }>;
    const readers: Readonly<Record<string, () => PhpStatement>> = Object.freeze({
        expressionstatement: () => ({ kind: 'expression_statement', expression: adapt(expressionNode.expression) }),
        return: () => ({
            kind: 'return_statement',
            expression: relationResolve(returnNode.expr !== undefined,
                () => ({ kind: 'value', value: adapt(returnNode.expr as PhpGrammarNode) }),
                () => ({ kind: 'void' })),
        }),
    });
    const reader = readers[node.kind] ?? (() => fail(`PHP AST boundary: unsupported statement ${node.kind}`));
    return reader();
};

const block = (node: { readonly children?: readonly GrammarStatement[] }, adapt: (node: PhpGrammarNode) => PhpAstNode): PhpBlock => ({
    kind: 'block', statements: projectRelation(requireNode(node.children, 'closure block statements'), item => statement(item, adapt)),
});

const arrayKey = (key: PhpGrammarNode | null, adapt: (node: PhpGrammarNode) => PhpAstNode): ArrayKey => {
    const readers: Readonly<Record<string, () => ArrayKey>> = Object.freeze({
        null: () => ({ kind: 'implicit' }),
        value: () => ({ kind: 'explicit', expression: adapt(key as PhpGrammarNode) }),
    });
    const tag = Object.freeze({ true: 'null', false: 'value' } as const)[String(key === null) as 'true' | 'false'];
    return readers[tag]();
};

const requireGrammarNode = (node: unknown): PhpGrammarNode => {
    const candidate = node as Record<string, unknown> | null;
    return relationResolve(candidate !== null && typeof candidate === 'object' && 'kind' in candidate,
        () => candidate as unknown as PhpGrammarNode,
        () => fail('PHP AST boundary: input is not a grammar node'));
};

export function adaptPhpAstBoundary(node: unknown, code: string): PhpAstNode {
    return adaptGrammarNode(requireGrammarNode(node), code, true);
}

function adaptGrammarNode(node: PhpGrammarNode, sourceText: string, root: boolean): PhpAstNode {
    const code = relationResolve(root, () => sourceText, () => requireNodeSource(node, sourceText));
    const adaptChild = (child: PhpGrammarNode): PhpAstNode => adaptGrammarNode(child, sourceText, false);
    const calleeVisitor = createCalleeAstVisitor(adaptChild);
    const args = (values: readonly PhpGrammarNode[]): readonly PhpArgument[] => projectRelation(values, value => ({ kind: 'positional', value: adaptChild(value) }));

    const visitor: PhpGrammarVisitor<PhpAstNode> = {
        propertylookup: n => ({ kind: 'property_lookup', originalCode: code, source, target: adaptChild(n.what), property: propertyName(memberName(n.offset, 'property')) }),
        nullsafepropertylookup: n => ({ kind: 'nullsafe_property_lookup', originalCode: code, source, target: adaptChild(n.what), property: propertyName(memberName(n.offset, 'property')) }),
        offsetlookup: n => ({ kind: 'offset_lookup', originalCode: code, source, target: adaptChild(n.what), offset: adaptChild(n.offset) }),
        staticlookup: n => staticLookup(n, code),
        call: n => matchCallee(n.what, args(n.arguments), code, calleeVisitor),
        new: n => ({ kind: 'new_instance', originalCode: code, source, className: className(classReference(n.what)), args: args(n.arguments) }),
        closure: n => ({ kind: 'closure', originalCode: code, source, parameters: projectRelation(n.arguments, parameter), captures: projectRelation(n.uses, capture), body: block(n.body, adaptChild) }),
        arrowfunc: n => ({ kind: 'arrow_func', originalCode: code, source, parameters: projectRelation(n.arguments, parameter), body: adaptChild(n.body) }),
        bin: n => ({ kind: 'binary', originalCode: code, source, operator: binaryOperator(n.type), left: adaptChild(n.left), right: adaptChild(n.right) }),
        unary: n => ({ kind: 'unary', originalCode: code, source, operator: unaryOperator(n.type), what: adaptChild(n.what) }),
        cast: n => ({ kind: 'type_cast', originalCode: code, source, castType: castType(n.type), expr: adaptChild(n.expr) }),
        retif: n => ({ kind: 'ternary', originalCode: code, source, condition: adaptChild(n.test), truthy: adaptChild(n.trueExpr), falsy: adaptChild(n.falseExpr) }),
        array: n => ({ kind: 'array', originalCode: code, source, items: projectRelation(requireNode(n.items, 'array items'), item => ({ key: arrayKey(item.key, adaptChild), value: adaptChild(item.value) })) }),
        string: n => ({ kind: 'literal', originalCode: code, source, value: n.value }),
        number: n => ({ kind: 'literal', originalCode: code, source, value: Number(n.value) }),
        boolean: n => ({ kind: 'literal', originalCode: code, source, value: n.value }),
        nullkeyword: () => ({ kind: 'literal', originalCode: code, source, value: null }),
        encapsed: () => ({ kind: 'literal', originalCode: code, source, value: code }),
        variable: n => ({ kind: 'variable', originalCode: code, source, name: variableName(n.name) }),
        unknown: () => ({ kind: 'unsupported', originalCode: code, source, reason: { kind: 'parser_gap' } }),
    };
    return matchPhpGrammar(node, visitor);
}

function requireNodeSource(node: PhpGrammarNode, sourceText: string): string {
    const loc = node.loc;
    return (loc && sourceText.slice(loc.start.offset, loc.end.offset)) ?? fail(`PHP AST boundary: missing location for child node ${node.kind}`);
}
