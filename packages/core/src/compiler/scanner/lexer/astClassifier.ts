/**
 * astClassifier.ts
 *
 * Classifies micro-AST values from PHP expression tokens.
 * Handles literal scalars, resource instantiation/collections, method chains, and property access.
 *
 * @module core/compiler/scanner/lexer/astClassifier
 */

import { TokenDescriptor, PhpAstValue, PhpAstFactory } from './PhpAst';
import { tokenizePhpSource } from './tokenizer';

/**
 * Classifies a raw PHP expression string into a structured PhpAstValue.
 */
export function classifyAstValue(raw: string): PhpAstValue {
    const tokens = tokenizePhpSource(raw);
    const exprTokens = tokens.filter(t => t.type !== 'EOF');
    return classifyAstTokens(exprTokens, raw);
}

/**
 * Classifies a sequence of token descriptors into a structured PhpAstValue.
 */
export function classifyAstTokens(exprTokens: readonly TokenDescriptor[], raw: string): PhpAstValue {
    switch (exprTokens.length) {
        case 0:
            return PhpAstFactory.rawExpression(raw);

        // 1. Literal Scalars & Variables
        case 1: {
            const first = exprTokens[0];
            switch (first.type) {
                case 'STRING': return PhpAstFactory.stringLiteral(first.value);
                case 'NUMBER': return PhpAstFactory.numberLiteral(first.value);
                case 'TRUE': return PhpAstFactory.booleanLiteral(true);
                case 'FALSE': return PhpAstFactory.booleanLiteral(false);
                case 'NULL': return PhpAstFactory.nullLiteral();
                case 'VARIABLE': return PhpAstFactory.variableReference(first.value);
                default: return PhpAstFactory.rawExpression(raw);
            }
        }

        // 2. Multi-token Expressions
        default: {
            const first = exprTokens[0];
            switch (first.value) {
                // new UserResource(...)
                case 'new':
                    return exprTokens[1]?.type === 'IDENTIFIER'
                        ? PhpAstFactory.resourceSingle(exprTokens[1].value, raw)
                        : PhpAstFactory.rawExpression(raw);

                default: {
                    // $this->prop or $this->user->name or $user?->prop
                    if (first.type === 'VARIABLE') {
                        const lastArrowIndex = exprTokens.map((t, idx) => ({ t, idx }))
                            .filter(item => item.t.value === '->' || item.t.value === '?->')
                            .pop()?.idx;

                        if (lastArrowIndex !== undefined && lastArrowIndex > 0) {
                            const arrowToken = exprTokens[lastArrowIndex];
                            const isNullsafe = arrowToken.value === '?->';
                            const target = exprTokens.slice(0, lastArrowIndex).map(t => t.value).join('');
                            const property = exprTokens[lastArrowIndex + 1]?.value || '';
                            const isMethod = exprTokens[lastArrowIndex + 2]?.value === '(';

                            return isMethod
                                ? PhpAstFactory.methodChain(target, property, isNullsafe)
                                : PhpAstFactory.propertyAccess(target, property, isNullsafe);
                        }

                        return PhpAstFactory.rawExpression(raw);
                    }

                    // UserResource::collection(...) or UserResource::make(...)
                    switch (exprTokens[1]?.value) {
                        case '::': {
                            const method = exprTokens[2]?.value;
                            const openParenIndex = exprTokens.findIndex(t => t.value === '(');
                            const closeParenIndex = exprTokens.length > 0 && exprTokens[exprTokens.length - 1].value === ')'
                                ? exprTokens.length - 1
                                : exprTokens.length;
                            const argument = openParenIndex >= 0 && closeParenIndex > openParenIndex
                                ? exprTokens.slice(openParenIndex + 1, closeParenIndex).map(t => t.value).join('')
                                : raw;

                            if (method === 'collection') {
                                return PhpAstFactory.resourceCollection(first.value, argument);
                            }
                            if (method === 'make') {
                                return PhpAstFactory.resourceSingle(first.value, argument);
                            }
                            return PhpAstFactory.rawExpression(raw);
                        }
                        default:
                            return PhpAstFactory.rawExpression(raw);
                    }
                }
            }
        }
    }
}
