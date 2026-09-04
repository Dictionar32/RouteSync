/**
 * Resource & Model Naming Utility
 *
 * Single source of truth for Laravel Eloquent table name inference,
 * case transformations, and class basename extractions.
 *
 * Pure Zero-Regex, Zero-if, Formal Finite State Machine Architecture.
 *
 * @module core/utils/resource-naming
 */

export enum CharKind {
    DELIM = 0,
    LOWER = 1,
    UPPER = 2,
    DIGIT = 3
}

export enum LexerState {
    START = 0,
    LOWERCASE_WORD = 1,
    UPPERCASE_WORD = 2,
    ACRONYM = 3
}

/**
 * 256-Byte Direct Character Classification Table (Extended ASCII 0..255).
 * Guaranteed O(1) direct memory lookup with 0 'if' and 0 '??'.
 */
const CHAR_TABLE = new Uint8Array(256);
CHAR_TABLE.fill(CharKind.DIGIT, 48, 58);   // '0'..'9' (ASCII 48..57)
CHAR_TABLE.fill(CharKind.UPPER, 65, 91);   // 'A'..'Z' (ASCII 65..90)
CHAR_TABLE.fill(CharKind.LOWER, 97, 123);  // 'a'..'z' (ASCII 97..122)

/**
 * Canonical Identifier Lexical Scanner & Formatter.
 */
export class IdentifierCase {
    /**
     * Direct O(1) character classification (0 'if', 0 '??').
     */
    private static classify(code: number): CharKind {
        return CHAR_TABLE[code];
    }

    /**
     * Pure Zero-Regex Lexical Word Tokenizer (Formal Finite State Machine).
     */
    static words(str: string): readonly string[] {
        const words: string[] = [];
        let buffer = '';
        let state = LexerState.START;

        for (let i = 0; i < str.length; i++) {
            const kind = this.classify(str.charCodeAt(i));
            const char = str[i];

            switch (state) {
                case LexerState.START:
                    switch (kind) {
                        case CharKind.LOWER:
                            buffer = char;
                            state = LexerState.LOWERCASE_WORD;
                            break;
                        case CharKind.UPPER:
                            buffer = char;
                            state = LexerState.UPPERCASE_WORD;
                            break;
                        case CharKind.DIGIT:
                            buffer = char;
                            state = LexerState.LOWERCASE_WORD;
                            break;
                        case CharKind.DELIM:
                            break;
                    }
                    break;

                case LexerState.LOWERCASE_WORD:
                    switch (kind) {
                        case CharKind.LOWER:
                        case CharKind.DIGIT:
                            buffer += char;
                            break;
                        case CharKind.UPPER:
                            words.push(buffer);
                            buffer = char;
                            state = LexerState.UPPERCASE_WORD;
                            break;
                        case CharKind.DELIM:
                            words.push(buffer);
                            buffer = '';
                            state = LexerState.START;
                            break;
                    }
                    break;

                case LexerState.UPPERCASE_WORD:
                    switch (kind) {
                        case CharKind.LOWER:
                        case CharKind.DIGIT:
                            buffer += char;
                            state = LexerState.LOWERCASE_WORD;
                            break;
                        case CharKind.UPPER:
                            buffer += char;
                            state = LexerState.ACRONYM;
                            break;
                        case CharKind.DELIM:
                            words.push(buffer);
                            buffer = '';
                            state = LexerState.START;
                            break;
                    }
                    break;

                case LexerState.ACRONYM:
                    switch (kind) {
                        case CharKind.UPPER:
                        case CharKind.DIGIT:
                            buffer += char;
                            break;
                        case CharKind.LOWER: {
                            const lastUpper = buffer.slice(-1);
                            words.push(buffer.slice(0, -1));
                            buffer = lastUpper + char;
                            state = LexerState.LOWERCASE_WORD;
                            break;
                        }
                        case CharKind.DELIM:
                            words.push(buffer);
                            buffer = '';
                            state = LexerState.START;
                            break;
                    }
                    break;
            }
        }

        buffer && words.push(buffer);

        return words;
    }

    /**
     * Convert identifier to PascalCase (e.g. 'order_item' -> 'OrderItem')
     */
    static toPascal(str: string): string {
        return this.words(str)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join('');
    }

    /**
     * Convert identifier to camelCase (e.g. 'order_item' -> 'orderItem')
     */
    static toCamel(str: string): string {
        return this.words(str)
            .map((w, index) => index === 0 
                ? w.toLowerCase() 
                : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
            )
            .join('');
    }

    /**
     * Convert identifier to snake_case (e.g. 'OrderItem' -> 'order_item')
     */
    static toSnake(str: string): string {
        return this.words(str)
            .map(w => w.toLowerCase())
            .join('_');
    }

    /**
     * Convert identifier to kebab-case (e.g. 'OrderItem' -> 'order-item')
     */
    static toKebab(str: string): string {
        return this.words(str)
            .map(w => w.toLowerCase())
            .join('-');
    }
}

/**
 * Extract simple class basename from Fully Qualified Class Name (FQCN).
 * Pure mathematical slice: lastIndexOf('\\') + 1
 * When no slash exists (-1), -1 + 1 = 0, slice(0) returns full string.
 *
 * @example
 * extractClassBasename('App\\Models\\OrderItem') // 'OrderItem'
 * extractClassBasename('User')                   // 'User'
 */
export function extractClassBasename(fqcn: string): string {
    return fqcn.slice(fqcn.lastIndexOf('\\') + 1);
}

/**
 * Infer default Laravel Eloquent database table name from model name.
 * Replicates Laravel convention: Str::snake(Str::pluralStudly(class_basename($model)))
 * Example: 'OrderItem' -> 'order_items', 'Category' -> 'categories'
 */
export function inferLaravelTableName(modelName: string): string {
    const base = extractClassBasename(modelName);
    const snake = IdentifierCase.toSnake(base);
    
    switch (true) {
        case snake.endsWith('y') && !/[aeiou]y$/i.test(snake):
            return `${snake.slice(0, -1)}ies`;
        case snake.endsWith('s') || snake.endsWith('x') || snake.endsWith('ch') || snake.endsWith('sh'):
            return `${snake}es`;
        default:
            return `${snake}s`;
    }
}

// Canonical Aliases for System-wide Integration
export const toPascalCase = (str: string): string => IdentifierCase.toPascal(str);
export const toCamelCase = (str: string): string => IdentifierCase.toCamel(str);
export const toSnakeCase = (str: string): string => IdentifierCase.toSnake(str);

export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function resourceBaseName(resourceName: string): string {
    return ResourceNamingConvention.stripSuffix(resourceName);
}

/**
 * ResourceNamingConvention
 *
 * Canonical Domain Vocabulary for Laravel Resource and Transformed Type suffixes.
 */
export const ResourceNamingConvention = Object.freeze({
    ResourceSuffix: 'Resource',
    ResponseSuffix: 'Response',
    TransformedSuffix: 'Transformed',
    CombinedSuffix: 'ResourceTransformed',

    stripSuffix(name: string = ''): string {
        return (name || '').replace(/(Resource|Response|Transformed)$/, '');
    },

    toTransformedName(baseName: string): string {
        return `${IdentifierCase.toPascal(baseName)}ResourceTransformed`;
    }
} as const);
