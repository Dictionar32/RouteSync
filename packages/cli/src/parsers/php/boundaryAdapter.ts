/**
 * Typed boundary adapter: php-parser grammar → canonical PHP AST ADT.
 * No semantic inference is performed here.
 */

import type {
    PhpArgument, PhpAstNode, PhpBlock, PhpClosureCapture, PhpParameter,
    PhpBinaryOperator, PhpCastType, PhpUnaryOperator, PhpPropertyName,
    PhpClassName, PhpConstantName, PhpFunctionName, PhpMethodName,
    PhpVariableName, ArrayKey, PhpStatement, PhpReturnExpression, BoundLiteralValue, PhpAstSource
} from '@routesync/core';
import type { PhpGrammarNode, GrammarStatement } from './ast/grammar';
import { matchPhpGrammar, type PhpGrammarVisitor } from './ast/grammarCatamorphism';
import { matchCallee, createCalleeAstVisitor } from './ast/calleeCatamorphism';
import { phpAstBoundaryJudgment, type PhpAstBoundaryJudgment } from './astBoundarySemanticInterface';
import { relationResolve, relationOptionFold, relationOptionalFold, relationFirst, relationFirstOption, relationEqual, relationNotEqual, relationNone, relationSome, relationAll, relationVariant, projectRelation } from '@routesync/core';
const propertyName = (value: string): PhpPropertyName => ({ kind: 'property_name', value });
const className = (value: string): PhpClassName => ({ kind: 'class_name', value });
const methodName = (value: string): PhpMethodName => ({ kind: 'method_name', value });
const functionName = (value: string): PhpFunctionName => ({ kind: 'function_name', value });
const variableName = (value: string): PhpVariableName => ({ kind: 'variable_name', value });
const constantName = (value: string): PhpConstantName => ({ kind: 'constant_name', value });
const source: PhpAstSource = { kind: 'absent' };

const fail = (message: string): never => { throw Error(message); };
type GrammarBoundaryNode = PhpGrammarNode | GrammarStatement;

const grammarVariant = <K extends GrammarBoundaryNode['kind']>(
    node: GrammarBoundaryNode,
    kind: K,
): Extract<GrammarBoundaryNode, { readonly kind: K }> | void =>
    relationOptionFold(
        relationVariant(node, kind),
        () => void 0,
        value => value,
    );

const memberName = (node: PhpGrammarNode, label: string): string =>
    relationOptionalFold(
        grammarVariant(node, 'identifier'),
        () => relationOptionalFold(
            grammarVariant(node, 'name'),
            () => fail(`PHP AST boundary: invalid ${label} node ${node.kind}`),
            value => value.name,
        ),
        value => value.name,
    );

const classReference = (node: PhpGrammarNode): string =>
    relationOptionalFold(
        grammarVariant(node, 'name'),
        () => relationOptionalFold(
            grammarVariant(node, 'selfreference'),
            () => relationOptionalFold(
                grammarVariant(node, 'staticreference'),
                () => fail(`PHP AST boundary: invalid class reference node ${node.kind}`),
                value => value.raw,
            ),
            value => value.raw,
        ),
        value => value.name,
    );

const binaryOperator = (value: string): PhpBinaryOperator => {
    const table: Readonly<Record<string, PhpBinaryOperator>> = {
        '+': { kind: 'addition' }, '-': { kind: 'subtraction' }, '*': { kind: 'multiplication' }, '/': { kind: 'division' }, '%': { kind: 'modulo' }, '**': { kind: 'exponentiation' },
        '==': { kind: 'equal' }, '!=': { kind: 'not_equal' }, '===': { kind: 'identical' }, '!==': { kind: 'not_identical' }, '<': { kind: 'less_than' }, '<=': { kind: 'less_than_or_equal' }, '>': { kind: 'greater_than' }, '>=': { kind: 'greater_than_or_equal' },
        '&&': { kind: 'logical_and' }, '||': { kind: 'logical_or' }, 'xor': { kind: 'logical_xor' }, '&': { kind: 'bitwise_and' }, '|': { kind: 'bitwise_or' }, '^': { kind: 'bitwise_xor' }, '<<': { kind: 'left_shift' }, '>>': { kind: 'right_shift' }, '.': { kind: 'concat' }, '??': { kind: 'null_coalesce' },
    };
    return relationOptionalFold(table[value], () => fail(`PHP AST boundary: unsupported binary operator ${value}`), value => value);
};

const unaryOperator = (value: string): PhpUnaryOperator => {
    const table: Readonly<Record<string, PhpUnaryOperator>> = {
        '!': { kind: 'not' }, '+': { kind: 'positive' }, '-': { kind: 'negative' }, '~': { kind: 'bitwise_not' }, '@': { kind: 'error_control' },
        '++': { kind: 'pre_increment' }, '--': { kind: 'pre_decrement' },
    };
    return relationOptionalFold(table[value], () => fail(`PHP AST boundary: unsupported unary operator ${value}`), value => value);
};

const castType = (value: string): PhpCastType => {
    const table: Readonly<Record<string, PhpCastType>> = {
        int: { kind: 'int' }, integer: { kind: 'int' }, float: { kind: 'float' }, double: { kind: 'float' }, string: { kind: 'string' }, bool: { kind: 'bool' }, boolean: { kind: 'bool' },
    };
    return relationOptionalFold(table[value], () => fail(`PHP AST boundary: unsupported cast type ${value}`), value => value);
};

function staticLookup(node: import('./ast/grammar').GrammarStaticLookup, code: string): PhpAstNode {
    const classNameValue = classReference(node.what);
    const constant = (name: string): PhpAstNode => ({
        kind: 'static_constant', originalCode: code, source,
        className: className(classNameValue), constantName: constantName(name),
    });
    return relationOptionalFold<Extract<GrammarBoundaryNode, { readonly kind: 'variable' }>, PhpAstNode>(
        grammarVariant(node.offset, 'variable'),
        () => relationOptionalFold<Extract<GrammarBoundaryNode, { readonly kind: 'identifier' }>, PhpAstNode>(
            grammarVariant(node.offset, 'identifier'),
            () => relationOptionalFold<Extract<GrammarBoundaryNode, { readonly kind: 'name' }>, PhpAstNode>(
                grammarVariant(node.offset, 'name'),
                () => fail(`PHP AST boundary: unsupported static member offset ${node.offset.kind}`),
                value => constant(value.name),
            ),
            value => constant(value.name),
        ),
        value => ({
            kind: 'static_property_lookup', originalCode: code, source,
            className: className(classNameValue), property: propertyName(value.name),
        }),
    );
}

const parameter = (node: { readonly name: string }): PhpParameter => ({ variable: variableName(node.name) });
const capture = (node: { readonly variable: { readonly name: string }; readonly byref?: boolean }): PhpClosureCapture =>
    relationResolve(relationEqual(node.byref, true),
        () => ({ kind: 'by_reference', variable: variableName(node.variable.name) }),
        () => ({ kind: 'by_value', variable: variableName(node.variable.name) }));

const statement = (node: GrammarStatement, adapt: (node: PhpGrammarNode) => PhpAstNode): PhpStatement =>
    relationOptionalFold<Extract<GrammarBoundaryNode, { readonly kind: 'expressionstatement' }>, PhpStatement>(
        grammarVariant(node, 'expressionstatement'),
        () => relationOptionalFold<Extract<GrammarBoundaryNode, { readonly kind: 'return' }>, PhpStatement>(
            grammarVariant(node, 'return'),
            () => fail(`PHP AST boundary: unsupported statement ${node.kind}`),
            value => ({ kind: 'return_statement', expression: relationOptionalFold<PhpGrammarNode, PhpReturnExpression>(
                value.expr,
                () => ({ kind: 'void' }),
                expression => ({ kind: 'value', value: adapt(expression) }),
            ) }),
        ),
        value => ({ kind: 'expression_statement', expression: adapt(value.expression) }),
    );

const block = (node: { readonly children: readonly GrammarStatement[] }, adapt: (node: PhpGrammarNode) => PhpAstNode): PhpBlock => ({
    kind: 'block', statements: projectRelation(node.children, item => statement(item, adapt)),
});

const isGrammarNodeKey = (candidate: PhpGrammarNode | null): candidate is PhpGrammarNode =>
    relationNotEqual<PhpGrammarNode | null>(candidate, null);

const arrayKey = (key: PhpGrammarNode | null, adapt: (node: PhpGrammarNode) => PhpAstNode): ArrayKey =>
    relationOptionFold(
        relationFirstOption([key], isGrammarNodeKey),
        () => ({ kind: 'implicit' }),
        value => ({ kind: 'explicit', expression: adapt(value) }),
    );

export function adaptPhpAstBoundaryJudgment(node: PhpGrammarNode, code: string): PhpAstBoundaryJudgment {
    const ast = adaptGrammarNode(node, code, true);
    return phpAstBoundaryJudgment(node, ast, relationEqual(ast.originalCode, code));
}

export function adaptPhpAstBoundary(node: PhpGrammarNode, code: string): PhpAstNode {
    return adaptPhpAstBoundaryJudgment(node, code).ast;
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
        array: n => ({ kind: 'array', originalCode: code, source, items: projectRelation(n.items, item => ({ key: arrayKey(item.key, adaptChild), value: adaptChild(item.value) })) }),
        string: n => ({ kind: 'literal', originalCode: code, source, value: { kind: 'string', value: n.value } satisfies BoundLiteralValue }),
        number: n => ({ kind: 'literal', originalCode: code, source, value: { kind: 'number', value: Number(n.value) } satisfies BoundLiteralValue }),
        boolean: n => ({ kind: 'literal', originalCode: code, source, value: { kind: 'boolean', value: n.value } satisfies BoundLiteralValue }),
        nullkeyword: () => ({ kind: 'literal', originalCode: code, source, value: { kind: 'null' } satisfies BoundLiteralValue }),
        encapsed: () => ({ kind: 'literal', originalCode: code, source, value: { kind: 'string', value: code } satisfies BoundLiteralValue }),
        variable: n => ({ kind: 'variable', originalCode: code, source, name: variableName(n.name) }),
        unknown: () => ({ kind: 'unsupported', originalCode: code, source, reason: { kind: 'parser_gap' } }),
    };
    return matchPhpGrammar(node, visitor);
}

function requireNodeSource(node: PhpGrammarNode, sourceText: string): string {
    const loc = node.loc;
    return relationOptionalFold<import('./ast/grammar').GrammarLocation, string>(
        loc,
        () => fail(`PHP AST boundary: missing location for child node ${node.kind}`),
        value => sourceText.slice(value.start.offset, value.end.offset),
    );
}
