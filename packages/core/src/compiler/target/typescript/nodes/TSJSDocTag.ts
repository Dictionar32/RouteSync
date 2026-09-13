/**
 * @file TSJSDocTag.ts
 * @description Structured JSDoc tags and tag factory helpers.
 *
 * @module core/compiler/target/typescript/nodes
 */

export interface JSDocTag {
    readonly tag: string;
    readonly name?: string;
    readonly description: string;
}

export function paramTag(name: string, description: string): JSDocTag {
    return { tag: 'param', name, description };
}

export function returnsTag(description: string): JSDocTag {
    return { tag: 'returns', description };
}

export function exampleTag(code: string): JSDocTag {
    return { tag: 'example', description: code };
}

export function deprecatedTag(message: string): JSDocTag {
    return { tag: 'deprecated', description: message };
}
