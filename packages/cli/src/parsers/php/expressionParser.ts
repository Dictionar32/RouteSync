/**
 * PHP expression parser. Parse failure is a boundary error, never semantic unknown.
 */

import { Engine } from 'php-parser';
import { relationResolve } from '@routesync/core';
import type { FieldNode } from '@routesync/core';
import { mapPhpAstNode } from './nodeMapper';

const parser = new Engine({
    parser: { extractDoc: true, php7: true },
    ast: { withPositions: true },
});

export class PhpExpressionParseError extends Error {
    public readonly code: string;

    constructor(code: string, cause: unknown) {
        super(`PHP expression parse failed: ${code}`);
        this.name = 'PhpExpressionParseError';
        this.code = code;
        this.cause = cause;
    }
}

export function parsePhpExpression(code: string): FieldNode {
    const wrapped = `<?php $val = ${code};`;
    try {
        const ast = parser.parseCode(wrapped, 'eval');
        const statement = requireFirstChild(ast.children);
        const assignment = requireAssignment(statement);
        return mapPhpAstNode(assignment.right, wrapped);
    } catch (error) {
        return relationResolve(error instanceof PhpExpressionParseError,
            () => { throw error; },
            () => { throw new PhpExpressionParseError(code, error); });
    }
}

function requireFirstChild(children: readonly unknown[]): Record<string, unknown> {
    const child = children[0];
    return relationResolve(isObject(child),
        () => child as Record<string, unknown>,
        () => { throw new PhpExpressionParseError('missing expression statement', undefined); });
}

function requireAssignment(statement: Record<string, unknown>): { readonly right: unknown } {
    const validStatement = statement.kind === 'expressionstatement' && isObject(statement.expression);
    return relationResolve(validStatement,
        () => {
            const expression = statement.expression as Record<string, unknown>;
            return relationResolve(expression.kind === 'assign' && 'right' in expression,
                () => ({ right: expression.right }),
                () => { throw new PhpExpressionParseError('missing assignment right-hand side', undefined); });
        },
        () => { throw new PhpExpressionParseError('missing assignment expression', undefined); });
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}
