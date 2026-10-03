/**
 * compiler/analysis/ssa/index.ts
 *
 * Explicit Sub-Domain Exports for SSA Analysis.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module core/compiler/analysis/ssa
 */

export {
    type SSABasicBlock,
    SSARepresentation,
    createSSARepresentation
} from "./ssaRepresentation";

export {
    SSABuilder
} from "./ssaBuilder";

export {
    SSARenamer,
    createSSARenamer
} from "./ssaRenamer";
