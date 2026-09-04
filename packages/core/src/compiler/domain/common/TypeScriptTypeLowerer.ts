/**
 * TypeScriptTypeLowerer.ts
 *
 * Target-Specific Lowering Engine for Transforming Semantic AST Nodes
 * into TypeScript Type Expressions and Interfaces.
 *
 * @module compiler/domain/common
 */

import {
    PrimitiveKind,
    SemanticTypeKind,
    type ObjectType,
    type SemanticType,
    type ObjectProperty
} from '../../types/SemanticType';
import type { ResolvedSemanticType, ResolvedObjectType } from './ResolvedSemanticType';

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

/**
 * TypeScriptSyntax
 *
 * Pure Algebraic Grammar Combinator Engine.
 */
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

/**
 * SourceLineRange
 *
 * Explicit Domain Model for source location span in generated artifacts.
 */
export type SourceLineRange = readonly [startLine: number, endLine: number];

export const SourceLineRange = Object.freeze({
    Unmapped: Object.freeze([1, 1] as const),
    create: (start: number, end: number): SourceLineRange => Object.freeze([start, end] as const)
});

export interface GeneratedInterfaceMetadata {
    readonly name: string;
    readonly propertyCount: number;
    readonly lineRange: SourceLineRange;
}

export interface LoweredTypeDeclaration {
    readonly code: string;
    readonly metadata: GeneratedInterfaceMetadata;
}

export interface TypeScriptBuildResult {
    readonly code: string;
    readonly interfaces: readonly GeneratedInterfaceMetadata[];
}

/**
 * TypeScriptCodeBuilder
 *
 * Structured Code Builder consuming Canonical ObjectType[] AST streams.
 * 100% mirrors ContractCodeBuilder, MapperCodeBuilder, and FormCodeBuilder.
 */
export class TypeScriptCodeBuilder {
    public readonly targetVersion: TypeScriptTargetVersion;
    public readonly includeJsDoc: boolean;

    constructor({
        targetVersion = TypeScriptTargetVersion.ES2022,
        includeJsDoc = true
    }: TypeScriptLowererOptions = {}) {
        this.targetVersion = targetVersion;
        this.includeJsDoc = includeJsDoc;
        Object.freeze(this);
    }

    public readonly lowerTypeExpression = (type: SemanticType): string => {
        switch (type.kind) {
            case SemanticTypeKind.Primitive:
                return TypeScriptPrimitiveMapping.forPrimitive(type.type);
            case SemanticTypeKind.Optional:
                return TypeScriptSyntax.optional(this.lowerTypeExpression(type.innerType));
            case SemanticTypeKind.Nullable:
                return TypeScriptSyntax.nullable(this.lowerTypeExpression(type.innerType));
            case SemanticTypeKind.ReadonlyCollection:
            case SemanticTypeKind.MutableCollection:
                return TypeScriptSyntax.array(this.lowerTypeExpression(type.elementType));
            case SemanticTypeKind.Reference:
                return (type.name.endsWith('Resource') && !type.name.endsWith('Transformed'))
                    ? `${type.name}Transformed`
                    : type.name;
            case SemanticTypeKind.Union:
                return TypeScriptSyntax.union(type.members, this.lowerTypeExpression);
            case SemanticTypeKind.Intersection:
                return TypeScriptSyntax.intersection(type.members, this.lowerTypeExpression);
            case SemanticTypeKind.Object:
                return TypeScriptSyntax.inlineObject(type.properties, this.lowerProperty);
            default:
                return TypeScriptPrimitiveMapping.UNKNOWN;
        }
    };

    public readonly lowerProperty = (prop: ObjectProperty): string => {
        const isOptional = prop.type.kind === SemanticTypeKind.Optional || prop.required === false;
        const targetType = this.lowerTypeExpression(
            prop.type.kind === SemanticTypeKind.Optional ? (prop.type as any).innerType : prop.type
        );
        const propCode = isOptional
            ? TypeScriptSyntax.formatOptionalProperty(prop.name, targetType)
            : TypeScriptSyntax.formatProperty(prop.name, targetType);

        if (this.includeJsDoc && prop.description) {
            return `${TypeScriptSyntax.formatJsDoc(prop.description)}${propCode}`;
        }
        return propCode;
    };

    /**
     * Single Atomic Lowering:
     * Menghasilkan kode deklarasi DAN metadatanya dalam 1 tarikan napas (100% in-sync).
     */
    public readonly lowerObjectType = (objType: ObjectType): LoweredTypeDeclaration => {
        const seenProps = new Set<string>();
        const uniqueProps = objType.properties.filter(p => {
            if (seenProps.has(p.name)) return false;
            seenProps.add(p.name);
            return true;
        });

        const ifaceDecl = TypeScriptSyntax.formatInterface(
            objType.name,
            uniqueProps,
            this.lowerProperty
        );
        const showAlias = TypeScriptSyntax.formatResourceAlias(
            objType.baseName,
            ControllerActionToAlias.show,
            objType.name
        );
        const indexAlias = TypeScriptSyntax.formatResourceAlias(
            objType.baseName,
            ControllerActionToAlias.index,
            TypeScriptSyntax.array(objType.name)
        );
        const aliases = TypeScriptSyntax.joinDeclarations([showAlias, indexAlias]);
        const code = TypeScriptSyntax.joinBlocks([ifaceDecl, aliases]);

        return {
            code,
            metadata: {
                name: objType.name,
                propertyCount: uniqueProps.length,
                lineRange: SourceLineRange.Unmapped
            }
        };
    };

    /**
     * Compiles ObjectType[] AST streams into a complete build result.
     * Single linear pass: Kode dan metadata dikumpulkan bersamaan (0 traversal ganda).
     * Exact 100% lineRange source mapping calculated during block assembly.
     */
    public readonly build = (types: readonly ObjectType[]): TypeScriptBuildResult => {
        const declarations: string[] = [];
        const interfaces: GeneratedInterfaceMetadata[] = [];
        const seenInterfaceNames = new Set<string>();
        const seenAliases = new Set<string>();
        let currentLine = 1;

        for (const objType of types) {
            if (seenInterfaceNames.has(objType.name)) {
                continue;
            }
            seenInterfaceNames.add(objType.name);

            const seenProps = new Set<string>();
            const uniqueProps = objType.properties.filter(p => {
                if (seenProps.has(p.name)) return false;
                seenProps.add(p.name);
                return true;
            });

            const ifaceDecl = TypeScriptSyntax.formatInterface(
                objType.name,
                uniqueProps,
                this.lowerProperty
            );

            const aliasDecls: string[] = [];
            const showKey = `${objType.baseName}Show`;
            if (!seenAliases.has(showKey)) {
                seenAliases.add(showKey);
                aliasDecls.push(TypeScriptSyntax.formatResourceAlias(
                    objType.baseName,
                    ControllerActionToAlias.show,
                    objType.name
                ));
            }
            const indexKey = `${objType.baseName}Index`;
            if (!seenAliases.has(indexKey)) {
                seenAliases.add(indexKey);
                aliasDecls.push(TypeScriptSyntax.formatResourceAlias(
                    objType.baseName,
                    ControllerActionToAlias.index,
                    TypeScriptSyntax.array(objType.name)
                ));
            }

            const blocks = aliasDecls.length > 0
                ? [ifaceDecl, TypeScriptSyntax.joinDeclarations(aliasDecls)]
                : [ifaceDecl];
            const code = TypeScriptSyntax.joinBlocks(blocks);

            const lineCount = code.split('\n').length;
            const lineRange = SourceLineRange.create(currentLine, currentLine + lineCount - 1);

            declarations.push(code);
            interfaces.push({
                name: objType.name,
                propertyCount: uniqueProps.length,
                lineRange
            });

            currentLine += lineCount + 1;
        }

        const code = TypeScriptSyntax.joinBlocks(declarations);

        return {
            code,
            interfaces: Object.freeze(interfaces)
        };
    };
}

const TS_PRIMITIVES: Record<string, string> = {
    string: 'string',
    number: 'number',
    boolean: 'boolean',
    datetime: 'string',
    file: 'File',
    unknown: 'unknown'
};

function lowerTypeScriptNode(
    resolved: ResolvedSemanticType,
    singleLine: boolean,
    indentLevel: number
): string {
    switch (resolved.kind) {
        case 'primitive':
            return TS_PRIMITIVES[resolved.primitiveKind] ?? 'string';

        case 'reference':
            return resolved.name;

        case 'optional':
            return `${lowerTypeScriptNode(resolved.innerType, singleLine, indentLevel)} | undefined`;

        case 'nullable':
            return `${lowerTypeScriptNode(resolved.innerType, singleLine, indentLevel)} | null`;

        case 'collection': {
            const inner = lowerTypeScriptNode(resolved.elementType, singleLine, indentLevel);
            return inner.includes(' | ') ? `(${inner})[]` : `${inner}[]`;
        }

        case 'object': {
            if (resolved.fields.length === 0) return 'object';
            const properties = resolved.fields.map(([name, type]) =>
                type.formatProperty(name, t => lowerTypeScriptNode(t, singleLine, indentLevel))
            );
            return `{ ${properties.join(' ')} }`;
        }

        case 'union':
            return resolved.members
                .map(m => lowerTypeScriptNode(m, singleLine, indentLevel))
                .join(' | ');

        case 'intersection':
            return resolved.members
                .map(m => lowerTypeScriptNode(m, singleLine, indentLevel))
                .join(' & ');

        case 'unknown':
        default:
            return 'unknown';
    }
}

export function toTypeScriptTypeExpression(
    resolved: ResolvedSemanticType,
    { singleLine = false, indentLevel = 0 }: TypeScriptLowererOptions = {}
): string {
    return lowerTypeScriptNode(resolved, singleLine, indentLevel);
}

export function buildTopLevelDeclaration(name: string, resolvedObj: ResolvedObjectType): string {
    const properties = resolvedObj.fields
        .map(([propName, propType]) => `  ${propType.formatProperty(propName, t => lowerTypeScriptNode(t, true, 1))}`)
        .join('\n');
    return `export interface ${name} {\n${properties}\n}`;
}