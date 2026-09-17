import { describe, it, expect } from 'vitest';
import {
    PhpAstKind,
    matchPhpAstKind,
    foldPhpAstNode,
    type PhpAstNode,
    type PhpAstFolder,
    PHP_AST_KIND_REGISTRY,
} from '@routesync/core';

describe('PhpAstKind & F-Algebra SSOT Test Suite', () => {
    it('defines all 21 frozen PhpAstKind variants with exhaustive registry', () => {
        const kinds = Object.values(PhpAstKind);
        expect(kinds.length).toBe(21);
        expect(Object.isFrozen(PHP_AST_KIND_REGISTRY)).toBe(true);

        kinds.forEach((kind) => {
            const spec = PHP_AST_KIND_REGISTRY[kind];
            expect(spec).toBeDefined();
            expect(spec.kind).toBe(kind);
            expect(typeof spec.category).toBe('string');
            expect(typeof spec.description).toBe('string');
        });
    });

    it('executes matchPhpAstKind catamorphism with exhaustive dispatch (0 if)', () => {
        const category = matchPhpAstKind(PhpAstKind.StaticConstant, {
            [PhpAstKind.PropertyLookup]: () => 'access',
            [PhpAstKind.NullsafePropertyLookup]: () => 'access',
            [PhpAstKind.OffsetLookup]: () => 'access',
            [PhpAstKind.StaticLookup]: () => 'access',
            [PhpAstKind.FunctionCall]: () => 'invocation',
            [PhpAstKind.MethodCall]: () => 'invocation',
            [PhpAstKind.NullsafeMethodCall]: () => 'invocation',
            [PhpAstKind.StaticMethodCall]: () => 'invocation',
            [PhpAstKind.VariableCall]: () => 'invocation',
            [PhpAstKind.NewInstance]: () => 'invocation',
            [PhpAstKind.Closure]: () => 'invocation',
            [PhpAstKind.ArrowFunc]: () => 'invocation',
            [PhpAstKind.Binary]: () => 'computation',
            [PhpAstKind.Unary]: () => 'computation',
            [PhpAstKind.TypeCast]: () => 'computation',
            [PhpAstKind.Ternary]: () => 'computation',
            [PhpAstKind.Array]: () => 'container',
            [PhpAstKind.Literal]: () => 'literal',
            [PhpAstKind.StaticConstant]: (spec) => spec.category,
            [PhpAstKind.Variable]: () => 'variable',
            [PhpAstKind.Unknown]: () => 'fallback',
        });
        expect(category).toBe('literal');
    });

    it('folds PhpAstNode bottom-up using pure F-Algebra (foldPhpAstNode)', () => {
        // Build AST: 10 + 20
        const astNode: PhpAstNode = {
            kind: PhpAstKind.Binary,
            operator: '+',
            left: { kind: PhpAstKind.Literal, value: 10, raw: '10' },
            right: { kind: PhpAstKind.Literal, value: 20, raw: '20' },
            code: '10 + 20',
        };

        const evalFolder: PhpAstFolder<number> = {
            propertyLookup: () => 0,
            nullsafePropertyLookup: () => 0,
            offsetLookup: () => 0,
            staticPropertyLookup: () => 0,
            functionCall: () => 0,
            methodCall: () => 0,
            nullsafeMethodCall: () => 0,
            staticMethodCall: () => 0,
            variableCall: () => 0,
            newInstance: () => 0,
            closure: () => 0,
            arrowFunc: () => 0,
            binary: (_node, left, right) => left + right,
            unary: (_node, operand) => -operand,
            typeCast: (_node, expr) => expr,
            ternary: (_node, cond, ifTrue, ifFalse) => (cond ? ifTrue : ifFalse),
            array: (_node, elements) => elements.reduce((acc, el) => acc + (el.value ?? 0), 0),
            literal: (node) => (typeof node.value === 'number' ? node.value : 0),
            staticConstant: () => 0,
            variable: () => 0,
            unknown: () => 0,
        };

        const result = foldPhpAstNode(astNode, evalFolder);
        expect(result).toBe(30);
    });

    it('verifies boolean literal preservation without inversion (Issue #36 regression)', () => {
        const trueNode: PhpAstNode = { kind: PhpAstKind.Literal, value: true, raw: 'true' };
        const falseNode: PhpAstNode = { kind: PhpAstKind.Literal, value: false, raw: 'false' };

        const boolFolder: PhpAstFolder<boolean> = {
            propertyLookup: () => false,
            nullsafePropertyLookup: () => false,
            offsetLookup: () => false,
            staticPropertyLookup: () => false,
            functionCall: () => false,
            methodCall: () => false,
            nullsafeMethodCall: () => false,
            staticMethodCall: () => false,
            variableCall: () => false,
            newInstance: () => false,
            closure: () => false,
            arrowFunc: () => false,
            binary: () => false,
            unary: () => false,
            typeCast: () => false,
            ternary: () => false,
            array: () => false,
            literal: (node) => Boolean(node.value),
            staticConstant: () => false,
            variable: () => false,
            unknown: () => false,
        };

        expect(foldPhpAstNode(trueNode, boolFolder)).toBe(true);
        expect(foldPhpAstNode(falseNode, boolFolder)).toBe(false);
    });
});
