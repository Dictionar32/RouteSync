/**
 * index.ts
 *
 * SSA Renamer domain exports.
 *
 * @module core/compiler/analysis/ssa/renamer
 */

export { VariableVersionScope } from './variableVersionScope';
export {
    renameBlockInstructions,
    updateSuccessorPhis
} from './blockInstructionRenamer';
