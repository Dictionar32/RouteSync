/**
 * expressionParser.ts
 *
 * PHP expression parser. Parse failure is a boundary error, never semantic unknown.
 */

import { Engine } from 'php-parser';
import type { FieldNode } from '@routesync/core';
import { mapPhpAstNode } from './nodeMapper';

const parser = new Engine({
    parser: { extractDoc: true, php7: true },
    ast: { withPositions: true }
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
        if (error instanceof PhpExpressionParseError) throw error;
        throw new PhpExpressionParseError(code, error);
    }
}

function requireFirstChild(children: readonly unknown[]): Record<string, unknown> {
    const child = children[0];
    if (!isObject(child)) throw new PhpExpressionParseError('missing expression statement', undefined);
    return child;
}

function requireAssignment(statement: Record<string, unknown>): { readonly right: unknown } {
    if (statement.kind !== 'expressionstatement' || !isObject(statement.expression)) {
        throw new PhpExpressionParseError('missing assignment expression', undefined);
    }

    const expression = statement.expression;
    if (expression.kind !== 'assign' || !('right' in expression)) {
        throw new PhpExpressionParseError('missing assignment right-hand side', undefined);
    }

    return { right: expression.right };
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}
