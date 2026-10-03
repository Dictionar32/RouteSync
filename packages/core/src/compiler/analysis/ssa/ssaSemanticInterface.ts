/** Closed semantic interface for SSA construction/renaming. */
import type { ControlFlowGraph } from '../../utils/ControlFlowGraph';
import type { DominatorTree } from '../DominatorAnalysis';
import type { AstAnalysisFact, AstAnalysisJudgment } from '../astAnalysisInterface';
import { astAnalysisInterface, type AstAnalysisInterface } from '../astAnalysisInterface';
import { relationProject } from '../../../semantic/kernel/relationalSequence';

export type SsaSemanticJudgment = Readonly<{
  readonly kind: 'ssa_semantic_judgment';
  readonly input: Readonly<{ readonly cfg: ControlFlowGraph; readonly dominator: DominatorTree }>;
  readonly output: ControlFlowGraph;
  readonly facts: readonly AstAnalysisFact[];
  readonly analysis: AstAnalysisJudgment;
  readonly closed: true;
}>;

export type SsaSemanticInterface = Readonly<{
  readonly kind: 'ssa_semantic_interface';
  readonly authority: 'ssa_semantic_judgment';
  readonly judgment: SsaSemanticJudgment;
  readonly analysis: AstAnalysisInterface;
  readonly closed: true;
}>;

export const ssaSemanticInterface = (
  input: Readonly<{ readonly cfg: ControlFlowGraph; readonly dominator: DominatorTree }>,
  output: ControlFlowGraph,
  analysis: AstAnalysisJudgment,
): SsaSemanticInterface => {
  const judgment = Object.freeze({
    kind: 'ssa_semantic_judgment' as const,
    input,
    output,
    facts: Object.freeze(relationProject(analysis.facts, fact => fact)),
    analysis,
    closed: true as const,
  });
  return Object.freeze({
    kind: 'ssa_semantic_interface' as const,
    authority: 'ssa_semantic_judgment' as const,
    judgment,
    analysis: astAnalysisInterface(analysis),
    closed: true as const,
  });
};
