/**
 * typeScriptSyntax.ts
 *
 * Pure Algebraic Grammar Combinator Engine for TypeScript.
 *
 * @module compiler/domain/common/ts-lowerer/typeScriptSyntax
 */

import { TypeScriptToken, TypeScriptAliasSuffix } from './typeScriptVocabulary';

export class TypeScriptSyntax {
    /**
     * Algebraic Primitive 1: Delimited Stream
     */
    public static delimit<T>(
        items: readonly T[],
        formatter: (item: T) => string,
        separator: string
    ): string {
        return items.map(formatter).join(separator);
    }

    /**
     * Algebraic Primitive 2: Enclosed Block
     */
    public static enclose(open: string, content: string, close: string): string {
        return `${open}${content}${close}`;
    }

    /**
     * Algebraic Primitive 3: Binary Infix Expression
     */
    public static binary(left: string, operator: string, right: string): string {
        return `${left}${operator}${right}`;
    }

    /* ── Grammar Rules (100% Derived Algebraically) ── */

    public static union<T>(members: readonly T[], formatter: (item: T) => string): string {
        return this.delimit(members, formatter, TypeScriptToken.Union);
    }

    public static intersection<T>(members: readonly T[], formatter: (item: T) => string): string {
        return this.delimit(members, formatter, TypeScriptToken.Intersection);
    }

    public static nullable(innerType: string): string {
        return this.binary(innerType, TypeScriptToken.Union, TypeScriptToken.Null);
    }

    public static optional(innerType: string): string {
        return this.binary(innerType, TypeScriptToken.Union, TypeScriptToken.Undefined);
    }

    public static array(elementType: string): string {
        if (elementType.startsWith('{') || elementType.endsWith('}')) {
            return `${elementType}[]`;
        }
        return this.enclose(TypeScriptToken.ArrayOpen, elementType, TypeScriptToken.ArrayClose);
    }

    public static inlineObject<T>(properties: readonly T[], formatter: (prop: T) => string): string {
        if (properties.length === 0) return '{}';
        const formatted = properties.map(formatter);
        return `{\n  ${formatted.join('\n  ')}\n}`;
    }

    public static formatInterface<T>(
        name: string,
        properties: readonly T[],
        formatter: (prop: T) => string
    ): string {
        const header = `${TypeScriptToken.InterfaceKeyword}${name}${TypeScriptToken.InterfaceOpen}`;
        const body = this.delimit(properties, formatter, TypeScriptToken.IndentSeparator);
        return this.enclose(header, body, TypeScriptToken.InterfaceClose);
    }

    public static formatProperty(name: string, targetType: string): string {
        return `${name}: ${targetType};`;
    }

    public static formatOptionalProperty(name: string, targetType: string): string {
        return `${name}?: ${targetType};`;
    }

    public static formatJsDoc(description: string): string {
        return `${TypeScriptToken.JsDocSingleOpen}${description}${TypeScriptToken.JsDocSingleClose}`;
    }

    public static formatTypeAlias(name: string, targetType: string): string {
        return `${TypeScriptToken.TypeKeyword}${name}${TypeScriptToken.Assignment}${targetType}${TypeScriptToken.Semicolon}`;
    }

    public static formatResourceAlias(baseName: string, suffix: TypeScriptAliasSuffix, targetType: string): string {
        return this.formatTypeAlias(`${baseName}${suffix}`, targetType);
    }

    public static joinDeclarations(declarations: readonly string[]): string {
        return declarations.join(TypeScriptToken.LineBreak);
    }

    public static joinBlocks(blocks: readonly string[]): string {
        return blocks.join(TypeScriptToken.BlockSeparator);
    }
}
