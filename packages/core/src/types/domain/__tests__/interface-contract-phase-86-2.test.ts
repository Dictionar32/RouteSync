import { describe, expect, it } from 'vitest';
import type { ClosureAstNode, PhpBlock } from '../phpAst';

describe('Phase 86.2 PHP AST closure body boundary', () => {
    it('represents a closure body as a block, not as a single expression', () => {
        const body: PhpBlock = {
            kind: 'block',
            statements: [
                {
                    kind: 'expression_statement',
                    expression: {
                        kind: 'variable',
                        originalCode: '$query',
                        source: { kind: 'absent' },
                        name: { kind: 'variable_name', value: 'query' },
                    },
                },
                {
                    kind: 'return_statement',
                    expression: {
                        kind: 'literal',
                        originalCode: 'true',
                        source: { kind: 'absent' },
                        value: true,
                    },
                },
            ],
        };

        const node: ClosureAstNode = {
            kind: 'closure',
            originalCode: 'function ($query) use ($request) { ... }',
            source: { kind: 'absent' },
            parameters: [{ variable: { kind: 'variable_name', value: 'query' } }],
            captures: [{ kind: 'by_value', variable: { kind: 'variable_name', value: 'request' } }],
            body,
        };

        expect(node.body.kind).toBe('block');
        expect(node.body.statements).toHaveLength(2);
        expect(node.body.statements[1].kind).toBe('return_statement');
    });
});

test('preserves void return as syntax rather than semantic null', () => {
    const statement = { kind: 'return_statement' as const, expression: { kind: 'void' as const } };
    expect(statement.expression.kind).toBe('void');
});
