/** Declarative symbol hierarchy and relation projections. */
import type { SymbolNode } from './symbolTypes';
import type { RelationOption } from '../../../semantic/foundation/relationFoundation';
import { relationOptionFold, relationSelect, relationResolve } from '../../../semantic/foundation/relationalSequence';
import { relationEqual } from '../../../semantic/foundation/relationFoundation';

export function resolveClassHierarchy(
    classId: string,
    symbolLookup: (id: string) => RelationOption<SymbolNode>,
): readonly string[] {
    const walk = (currentId: string, depth: number, output: readonly string[]): readonly string[] => relationResolve(
        depth >= 100,
        () => output,
        () => relationOptionFold(symbolLookup(currentId),
            () => output,
            current => relationOptionFold(
                relationResolve(Object.prototype.hasOwnProperty.call(current, 'extendsId'), () => ({ kind: 'some' as const, value: current.extendsId }), () => ({ kind: 'none' as const })),
                () => output,
                parentId => walk(parentId as string, depth + 1, [...output, parentId as string]),
            ),
        ),
    );
    return walk(classId, 0, [classId]);
}

export function filterSymbolsByKind(symbols: Iterable<SymbolNode>, kind: SymbolNode['kind']): readonly SymbolNode[] {
    return relationSelect(Array.from(symbols), symbol => relationEqual(symbol.kind, kind));
}

export function filterSymbolsByNamespace(symbols: Iterable<SymbolNode>, namespace: string): readonly SymbolNode[] {
    return relationSelect(Array.from(symbols), symbol => relationEqual(symbol.namespace, namespace));
}

export function filterSymbolsByParent(symbols: Iterable<SymbolNode>, parentId: string): readonly SymbolNode[] {
    return relationSelect(Array.from(symbols), symbol => relationEqual(symbol.parentId, parentId));
}
