/**
 * compiler/query/salsa/index.ts
 *
 * Explicit Sub-Domain Exports for Salsa Query Engine.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module core/compiler/query/salsa
 */

export {
    type QueryKey,
    type QueryNode,
    type QueryContext,
    type QueryFrame,
    type QueryCycleError,
    createQueryCycleError,
    type ActiveQueryFrame,
    type SalsaCompilerStats
} from "./salsaTypes";

export {
    createQueryKey
} from "./queryKeyFactory";

export {
    createQueryGraphManager,
    type QueryGraphManager
} from "./queryGraphManager";

export {
    assertNoCycle,
    buildCycleFrames
} from "./cycleDetector";

export {
    executeSalsaQuery
} from "./queryExecutor";
