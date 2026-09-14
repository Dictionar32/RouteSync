/**
 * phpAstFactory.ts
 *
 * Strict Frozen AST Constructor Factory for Laravel PHP Micro-AST.
 * Guarantees Object.freeze immutability & Rule 14 (<= 100 lines).
 *
 * @module core/compiler/scanner/lexer/phpAstFactory
 */

import type { PhpAstValue, PhpArrayEntry } from "./phpAstTypes";

export class PhpAstFactory {
    static stringLiteral(value: string): PhpAstValue {
        return Object.freeze({ kind: 'literal', literalType: 'string', value });
    }

    static numberLiteral(raw: string): PhpAstValue {
        return Object.freeze({ kind: 'literal', literalType: 'number', value: +raw });
    }

    static booleanLiteral(value: boolean): PhpAstValue {
        return Object.freeze({ kind: 'literal', literalType: 'boolean', value });
    }

    static nullLiteral(): PhpAstValue {
        return Object.freeze({ kind: 'literal', literalType: 'null', value: null });
    }

    static resourceSingle(resourceName: string, argument: string): PhpAstValue {
        return Object.freeze({ kind: 'resource_single', resourceName, argument });
    }

    static resourceCollection(resourceName: string, argument: string): PhpAstValue {
        return Object.freeze({ kind: 'resource_collection', resourceName, argument });
    }

    static methodChain(target: string, property: string, nullsafe: boolean): PhpAstValue {
        return Object.freeze({ kind: 'method_chain', target, property, nullsafe });
    }

    static propertyAccess(target: string, property: string, nullsafe: boolean): PhpAstValue {
        return Object.freeze({ kind: 'property_access', target, property, nullsafe });
    }

    static variableReference(name: string): PhpAstValue {
        return Object.freeze({ kind: 'variable_reference', name });
    }

    static ternaryExpression(condition: string, trueBranch: PhpAstValue, falseBranch: PhpAstValue): PhpAstValue {
        return Object.freeze({ kind: 'ternary_expression', condition, trueBranch, falseBranch });
    }

    static nestedArray(entries: readonly PhpArrayEntry[]): PhpAstValue {
        return Object.freeze({ kind: 'nested_array', entries: Object.freeze([...entries]) });
    }

    static rawExpression(raw: string): PhpAstValue {
        return Object.freeze({ kind: 'raw_expression', raw });
    }
}
