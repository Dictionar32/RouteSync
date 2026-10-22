/**
 * PHP expression parser. Parse failure is a boundary error, never semantic unknown.
 */

import { Engine } from 'php-parser';
import { relationResolve } from '@routesync/core';
import type { PhpAstNode } from '@routesync/core';
import type { PhpGrammarNode } from './ast/grammar';
import { phpAstNodeMappingOperation } from './nodeMapper';

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

const parsePhpExpressionImplementation = (code: string): PhpAstNode => {
    const wrapped = `<?php $val = ${code};`;
    try {
        const ast = parser.parseCode(wrapped, 'eval');
        const statement = requireFirstChild(ast.children);
        const assignment = requireAssignment(statement);
        return phpAstNodeMappingOperation.map(assignment.right, wrapped);
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

function requireAssignment(statement: Record<string, unknown>): { readonly right: PhpGrammarNode } {
    const validStatement = statement.kind === 'expressionstatement' && isObject(statement.expression);
    return relationResolve(validStatement,
        () => {
            const expression = statement.expression as Record<string, unknown>;
            return relationResolve(expression.kind === 'assign' && isPhpGrammarNode(expression.right),
                () => ({ right: expression.right as PhpGrammarNode }),
                () => { throw new PhpExpressionParseError('missing or unsupported assignment right-hand side', undefined); });
        },
        () => { throw new PhpExpressionParseError('missing assignment expression', undefined); });
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const phpGrammarNodeKinds: ReadonlySet<string> = new Set([
    'identifier', 'name', 'variable', 'string', 'number', 'boolean', 'nullkeyword',
    'encapsed', 'selfreference', 'staticreference', 'propertylookup',
    'nullsafepropertylookup', 'offsetlookup', 'staticlookup', 'call', 'new',
    'closure', 'arrowfunc', 'array', 'entry', 'bin', 'unary', 'cast', 'retif', 'unknown',
]);

function isPhpGrammarNode(value: unknown): value is PhpGrammarNode {
    return isObject(value) && typeof value.kind === 'string' && phpGrammarNodeKinds.has(value.kind);
}


export interface PhpExpressionParsingOperationInterface {
    readonly parse: (code: string) => PhpAstNode;
}

export const phpExpressionParsingOperation: PhpExpressionParsingOperationInterface = Object.freeze({
    parse: parsePhpExpressionImplementation,
});
