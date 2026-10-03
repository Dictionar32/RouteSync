/** Explicit SSA renamer relation exports. */
export {
    VariableVersionScope,
    createVariableVersionScope,
    type VariableVersionScope as VariableVersionScopeState,
} from './variableVersionScope';
export {
    renameBlockInstructions,
    updateSuccessorPhis,
    type RenamedBlockInstructions,
} from './blockInstructionRenamer';
