/** Extract source text from a parser node with verified location data. */

interface LocatedNode {
    readonly loc?: {
        readonly start?: { readonly offset?: number };
        readonly end?: { readonly offset?: number };
    };
}

export function sliceNodeSource(node: unknown, source: string): string {
    if (!isLocatedNode(node)) {
        throw new Error('PHP AST source boundary: node has no usable location');
    }

    return source.slice(node.loc.start.offset, node.loc.end.offset);
}

function isLocatedNode(value: unknown): value is RequiredLocationNode {
    if (typeof value !== 'object' || value === null || !('loc' in value)) return false;
    const loc = value.loc;
    if (typeof loc !== 'object' || loc === null || !('start' in loc) || !('end' in loc)) return false;
    const start = loc.start;
    const end = loc.end;
    return isOffset(start) && isOffset(end);
}

interface RequiredLocationNode {
    readonly loc: {
        readonly start: { readonly offset: number };
        readonly end: { readonly offset: number };
    };
}

function isOffset(value: unknown): value is { readonly offset: number } {
    return typeof value === 'object' && value !== null && 'offset' in value && typeof value.offset === 'number';
}
