import type { SemanticType } from '../domain/semanticType';

export type TypeHashEntry = readonly [SemanticType, string];

export interface TypeHashContext {
    readonly activeStack: readonly SemanticType[];
    finalized: readonly TypeHashEntry[];
}

/** Upstream-owned operation contract for deterministic semantic type hashing. */
export interface TypeHasherInterface {
    readonly createContext: () => TypeHashContext;
    readonly hash: (type: SemanticType, context: TypeHashContext) => string;
}
