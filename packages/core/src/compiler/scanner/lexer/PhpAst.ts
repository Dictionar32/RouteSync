/**
 * PhpAst.ts
 *
 * Micro-AST shapes, token types, and expression factory for Laravel source code.
 *
 * @module core/compiler/scanner/lexer/PhpAst
 */

export type TokenType =
    | 'STRING'
    | 'NUMBER'
    | 'TRUE'
    | 'FALSE'
    | 'NULL'
    | 'IDENTIFIER'
    | 'VARIABLE'
    | 'ARROW'
    | 'DOUBLE_COLON'
    | 'OBJECT_OPERATOR'
    | 'NULLSAFE_OPERATOR'
    | 'PUNCTUATION'
    | 'EOF';

export interface TokenDescriptor {
    readonly type: TokenType;
    readonly value: string;
    readonly line: number;
    readonly startOffset: number;
    readonly endOffset: number;
}

export type PhpLiteralValue =
    | { readonly kind: 'literal'; readonly literalType: 'string'; readonly value: string }
    | { readonly kind: 'literal'; readonly literalType: 'number'; readonly value: number }
    | { readonly kind: 'literal'; readonly literalType: 'boolean'; readonly value: boolean }
    | { readonly kind: 'literal'; readonly literalType: 'null'; readonly value: null };

export type PhpAstValue =
    | PhpLiteralValue
    | { readonly kind: 'resource_single'; readonly resourceName: string; readonly argument: string }
    | { readonly kind: 'resource_collection'; readonly resourceName: string; readonly argument: string }
    | { readonly kind: 'method_chain'; readonly target: string; readonly property: string; readonly nullsafe: boolean }
    | { readonly kind: 'property_access'; readonly target: string; readonly property: string; readonly nullsafe: boolean }
    | { readonly kind: 'variable_reference'; readonly name: string }
    | { readonly kind: 'ternary_expression'; readonly condition: string; readonly trueBranch: PhpAstValue; readonly falseBranch: PhpAstValue }
    | { readonly kind: 'nested_array'; readonly entries: readonly PhpArrayEntry[] }
    | { readonly kind: 'raw_expression'; readonly raw: string };

export class PhpAstFactory {
    static stringLiteral(value: string): PhpAstValue {
        return { kind: 'literal', literalType: 'string', value };
    }

    static numberLiteral(raw: string): PhpAstValue {
        return { kind: 'literal', literalType: 'number', value: +raw };
    }

    static booleanLiteral(value: boolean): PhpAstValue {
        return { kind: 'literal', literalType: 'boolean', value };
    }

    static nullLiteral(): PhpAstValue {
        return { kind: 'literal', literalType: 'null', value: null };
    }

    static resourceSingle(resourceName: string, argument: string): PhpAstValue {
        return { kind: 'resource_single', resourceName, argument };
    }

    static resourceCollection(resourceName: string, argument: string): PhpAstValue {
        return { kind: 'resource_collection', resourceName, argument };
    }

    static methodChain(target: string, property: string, nullsafe: boolean): PhpAstValue {
        return { kind: 'method_chain', target, property, nullsafe };
    }

    static propertyAccess(target: string, property: string, nullsafe: boolean): PhpAstValue {
        return { kind: 'property_access', target, property, nullsafe };
    }

    static variableReference(name: string): PhpAstValue {
        return { kind: 'variable_reference', name };
    }

    static ternaryExpression(condition: string, trueBranch: PhpAstValue, falseBranch: PhpAstValue): PhpAstValue {
        return { kind: 'ternary_expression', condition, trueBranch, falseBranch };
    }

    static nestedArray(entries: readonly PhpArrayEntry[]): PhpAstValue {
        return { kind: 'nested_array', entries };
    }

    static rawExpression(raw: string): PhpAstValue {
        return { kind: 'raw_expression', raw };
    }
}

export interface PhpArrayEntry {
    readonly key: string;
    readonly value: PhpAstValue;
    readonly rawExpression: string;
}

export interface ParsedPhpArrayResult {
    readonly entries: readonly PhpArrayEntry[];
    readonly endIndex: number;
}

