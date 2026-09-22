/**
 * typeScriptVocabulary.ts
 *
 * Canonical target domain vocabulary and primitive token mappings for TypeScript code emission.
 *
 * @module compiler/domain/common/ts-lowerer/typeScriptVocabulary
 */

import { PrimitiveKind } from '../../../types/SemanticType';

/**
 * TypeScriptTargetVersion
 *
 * Canonical Target ECMAScript / TypeScript Output Dialect.
 */
export const TypeScriptTargetVersion = Object.freeze({
    ES2020: 'ES2020',
    ES2021: 'ES2021',
    ES2022: 'ES2022',
    ESNext: 'ESNext'
} as const);

export type TypeScriptTargetVersion = typeof TypeScriptTargetVersion[keyof typeof TypeScriptTargetVersion];

export interface TypeScriptLowererOptions {
    readonly singleLine?: boolean;
    readonly indentLevel?: number;
    readonly targetVersion?: TypeScriptTargetVersion;
    readonly includeJsDoc?: boolean;
}

export type TypeScriptPrimitiveToken =
    | typeof TypeScriptPrimitiveMapping.STRING
    | typeof TypeScriptPrimitiveMapping.NUMBER
    | typeof TypeScriptPrimitiveMapping.BOOLEAN
    | typeof TypeScriptPrimitiveMapping.FILE
    | typeof TypeScriptPrimitiveMapping.UNKNOWN;

/**
 * TypeScriptPrimitiveMapping
 *
 * Explicit Domain Model representing the canonical target tokens
 * and total projection rules from PrimitiveKind to TypeScript expressions.
 */
export class TypeScriptPrimitiveMapping {
    public static readonly STRING = 'string' as const;
    public static readonly NUMBER = 'number' as const;
    public static readonly BOOLEAN = 'boolean' as const;
    public static readonly DATETIME = 'string' as const;
    public static readonly FILE = 'File' as const;
    public static readonly UNKNOWN = 'unknown' as const;

    /**
     * Exhaustive compile-time guaranteed projection from PrimitiveKind to TypeScript token.
     * Zero-allocation, total deterministic dispatch without unsafe type casts.
     */
    public static forPrimitive(kind: PrimitiveKind | string): TypeScriptPrimitiveToken {
        switch (kind) {
            case PrimitiveKind.STRING:
                return this.STRING;
            case PrimitiveKind.NUMBER:
                return this.NUMBER;
            case PrimitiveKind.BOOLEAN:
                return this.BOOLEAN;
            case PrimitiveKind.DATETIME:
                return this.DATETIME;
            case PrimitiveKind.FILE:
                return this.FILE;
            case PrimitiveKind.UNKNOWN:
            case PrimitiveKind.UNSPECIFIED:
            default:
                return this.UNKNOWN;
        }
    }
}

/**
 * TypeScriptAliasSuffix
 *
 * Canonical Domain Vocabulary for target interface alias conventions.
 */
export const TypeScriptAliasSuffix = Object.freeze({
    Show: 'Show',
    Index: 'Index'
} as const);

export type TypeScriptAliasSuffix = typeof TypeScriptAliasSuffix[keyof typeof TypeScriptAliasSuffix];

/**
 * ControllerActionToAlias
 *
 * Explicit Domain Model mapping Laravel RESTful controller actions
 * to target TypeScript alias conventions.
 */
export const ControllerActionToAlias = Object.freeze({
    index: TypeScriptAliasSuffix.Index,
    show: TypeScriptAliasSuffix.Show
} as const);

export type ControllerActionToAlias = typeof ControllerActionToAlias[keyof typeof ControllerActionToAlias];

/**
 * TypeScriptToken
 *
 * Exhaustive Lexical Token Model for Target TypeScript Grammar.
 */
export const TypeScriptToken = Object.freeze({
    // Delimiters & Infix Operators
    Union: ' | ',
    Intersection: ' & ',
    BlockSeparator: '\n\n',
    LineBreak: '\n',
    PropertySeparator: ' ',
    IndentSeparator: '\n  ',
    Assignment: ' = ',
    Semicolon: ';',

    // Enclosures
    ObjectOpen: '{ ',
    ObjectClose: ' }',
    InterfaceOpen: ' {\n  ',
    InterfaceClose: '\n}',
    ArrayOpen: 'Array<',
    ArrayClose: '>',

    // Keywords & Literals
    InterfaceKeyword: 'export interface ',
    TypeKeyword: 'export type ',
    Null: 'null',
    Undefined: 'undefined',

    // Documentation
    JsDocSingleOpen: '/** ',
    JsDocSingleClose: ' */\n  '
} as const);

export type TypeScriptToken = typeof TypeScriptToken[keyof typeof TypeScriptToken];
