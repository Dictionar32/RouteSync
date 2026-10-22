import type { SemanticType } from '../domain/semanticType';

/** Upstream-owned contract for canonical semantic type identity. */
export interface TypeInternerInterface {
    readonly intern: (type: SemanticType) => SemanticType;
    readonly getCacheSize: () => number;
    readonly clear: () => void;
}
