/**
 * Typed registry for compiler analysis results.
 *
 * Analysis keys are resolved through this registry so the relationship between
 * an analysis name and its concrete result type is retained by the compiler.
 */
import type { ControlFlowGraph } from '../utils/ControlFlowGraph';
import type { DominatorTree } from './DominatorAnalysis';
import type { LoopAnalysis } from './LoopAnalysis';
import type { SSARepresentation } from './SSAAnalysis';
import type { UseDefGraph } from './UseDefAnalysis';

export interface AnalysisRegistry {
    readonly CFG: ControlFlowGraph;
    readonly Dominators: DominatorTree;
    readonly LoopInfo: LoopAnalysis;
    readonly SSA: SSARepresentation;
    readonly UseDef: UseDefGraph;
}

export type AnalysisKeyName<R extends object = AnalysisRegistry> = keyof R & string;
export type AnalysisValue<
    R extends object,
    K extends AnalysisKeyName<R>,
> = R[K];
