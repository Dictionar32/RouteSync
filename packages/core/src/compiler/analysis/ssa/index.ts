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
    SSARepresentation
} from "./ssaRepresentation";

export {
    SSABuilder
} from "./ssaBuilder";

export {
    SSARenamer
} from "./ssaRenamer";
