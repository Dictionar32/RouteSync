import { describe, expect, it } from 'vitest';
import type {
    ArrowFuncAstNode,
    ClosureAstNode,
    PhpAstNode,
} from '../phpAst';

describe('Phase 85 PHP AST closure boundary', () => {
    it('requires closure parameters and captures', () => {
        const node: ClosureAstNode = {
            kind: 'closure',
            originalCode: 'function ($query) use ($request) { $query->where(...) }',
            source: { kind: 'absent' },
            parameters: [{ variable: { kind: 'variable_name', value: 'query' } }],
            captures: [{ kind: 'by_value', variable: { kind: 'variable_name', value: 'request' } }],
            body: {
                kind: 'block',
                statements: [{
                    kind: 'expression_statement',
                    expression: {
                        kind: 'variable',
                        originalCode: '$query',
                        source: { kind: 'absent' },
                        name: { kind: 'variable_name', value: 'query' },
                    },
                }],
            },
        };
        expect(node.parameters[0].variable.value).toBe('query');
        expect(node.captures[0].variable.value).toBe('request');
    });

    it('requires arrow-function parameters', () => {
        const node: ArrowFuncAstNode = {
            kind: 'arrow_func',
            originalCode: 'fn($q) => $q->where(...)',
            source: { kind: 'absent' },
            parameters: [{ variable: { kind: 'variable_name', value: 'q' } }],
            body: {
                kind: 'variable',
                originalCode: '$q',
                source: { kind: 'absent' },
                name: { kind: 'variable_name', value: 'q' },
            },
        };
        expect(node.parameters).toHaveLength(1);
    });

    it('keeps PHP AST recursive', () => {
        const node: PhpAstNode = {
            kind: 'variable',
            originalCode: '$query',
            source: { kind: 'absent' },
            name: { kind: 'variable_name', value: 'query' },
        };
        expect(node.kind).toBe('variable');
    });
});
