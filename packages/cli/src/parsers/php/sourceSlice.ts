/** Extract source text from a parser node with verified location data. */
import { relationResolve } from '@routesync/core';

interface LocatedNode {
    readonly loc?: {
        readonly start?: { readonly offset?: number };
        readonly end?: { readonly offset?: number };
    };
}

export function sliceNodeSource(node: unknown, source: string): string {
    const located = requireLocatedNode(node);
    return source.slice(located.loc.start.offset, located.loc.end.offset);
}

function requireLocatedNode(value: unknown): RequiredLocationNode {
    return relationResolve(isLocatedNode(value),
        () => value as RequiredLocationNode,
        () => { throw new Error('PHP AST source boundary: node has no usable location'); });
}

function isLocatedNode(value: unknown): value is RequiredLocationNode {
    const candidate = value as LocatedNode | null;
    return relationResolve(typeof candidate === 'object' && candidate !== null && candidate.loc !== undefined,
        () => {
            const loc = candidate?.loc;
            return relationResolve(typeof loc === 'object' && loc !== null && loc.start !== undefined && loc.end !== undefined,
                () => isOffset(loc.start) && isOffset(loc.end),
                () => false);
        },
        () => false);
}

interface RequiredLocationNode {
    readonly loc: {
        readonly start: { readonly offset: number };
        readonly end: { readonly offset: number };
    };
}

function isOffset(value: unknown): value is { readonly offset: number } {
    const candidate = value as { readonly offset?: unknown } | null;
    return typeof candidate === 'object' && candidate !== null && typeof candidate.offset === 'number';
}
