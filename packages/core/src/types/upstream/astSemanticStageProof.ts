/**
 * Phase 2862 — closed cross-stage refinement proof ADT.
 *
 * Proof resolution is owned by upstream stage contracts. Each result exposes
 * a domain continuation so consumers can proceed without decoding a generic
 * option or treating the judgment as passive data.
 */
import type { AstSemanticPreservationRelation, AstSemanticStage, AstSemanticStageContract } from './astSemanticStageInterface';

export type AstSemanticProofStatus = 'obligation' | 'discharged';

export type AstSemanticStageProof =
  | Readonly<{ kind: 'scanner_to_mapping_proof'; from: 'scanner_evidence'; to: 'upstream_mapping'; preservation: readonly AstSemanticPreservationRelation[]; status: AstSemanticProofStatus }>
  | Readonly<{ kind: 'mapping_to_resolver_proof'; from: 'upstream_mapping'; to: 'resolver_graph'; preservation: readonly AstSemanticPreservationRelation[]; status: AstSemanticProofStatus }>
  | Readonly<{ kind: 'resolver_to_analysis_proof'; from: 'resolver_graph'; to: 'analysis'; preservation: readonly AstSemanticPreservationRelation[]; status: AstSemanticProofStatus }>
  | Readonly<{ kind: 'analysis_to_lowering_proof'; from: 'analysis'; to: 'semantic_type_lowering'; preservation: readonly AstSemanticPreservationRelation[]; status: AstSemanticProofStatus }>
  | Readonly<{ kind: 'lowering_to_target_proof'; from: 'semantic_type_lowering'; to: 'target_projection'; preservation: readonly AstSemanticPreservationRelation[]; status: AstSemanticProofStatus }>;

export type AstSemanticProofResultHandlers<Result> = Readonly<{
  readonly onProof: (proof: AstSemanticStageProof) => Result;
  readonly onTerminal: () => Result;
}>;

export type AstSemanticProofResult = Readonly<{
  readonly kind: 'proof';
  readonly proof: AstSemanticStageProof;
  readonly continueWith: <Result>(handlers: AstSemanticProofResultHandlers<Result>) => Result;
}>;

export type AstSemanticTerminalResult = Readonly<{
  readonly kind: 'terminal';
  readonly continueWith: <Result>(handlers: AstSemanticProofResultHandlers<Result>) => Result;
}>;

export type AstSemanticStageProofResult = AstSemanticProofResult | AstSemanticTerminalResult;

const proofResult = (proof: AstSemanticStageProof): AstSemanticProofResult => Object.freeze({
  kind: 'proof',
  proof,
  continueWith: <Result>(handlers: AstSemanticProofResultHandlers<Result>): Result => handlers.onProof(proof),
});

const terminalResult = (): AstSemanticTerminalResult => Object.freeze({
  kind: 'terminal',
  continueWith: <Result>(handlers: AstSemanticProofResultHandlers<Result>): Result => handlers.onTerminal(),
});

const nextStageImplementation = (stage: AstSemanticStage): AstSemanticStage | 'source_syntax' => {
  switch (stage) {
    case 'scanner_evidence': return 'source_syntax';
    case 'upstream_mapping': return 'scanner_evidence';
    case 'resolver_graph': return 'upstream_mapping';
    case 'analysis': return 'resolver_graph';
    case 'semantic_type_lowering': return 'analysis';
    case 'target_projection': return 'semantic_type_lowering';
  }
};

const resolveStageProofImplementation = (stage: AstSemanticStage, contract: AstSemanticStageContract): AstSemanticStageProofResult => {
  switch (stage) {
    case 'scanner_evidence':
      return proofResult({ kind: 'scanner_to_mapping_proof', from: 'scanner_evidence', to: 'upstream_mapping', preservation: contract.preservation, status: 'obligation' });
    case 'upstream_mapping':
      return proofResult({ kind: 'mapping_to_resolver_proof', from: 'upstream_mapping', to: 'resolver_graph', preservation: contract.preservation, status: 'obligation' });
    case 'resolver_graph':
      return proofResult({ kind: 'resolver_to_analysis_proof', from: 'resolver_graph', to: 'analysis', preservation: contract.preservation, status: 'obligation' });
    case 'analysis':
      return proofResult({ kind: 'analysis_to_lowering_proof', from: 'analysis', to: 'semantic_type_lowering', preservation: contract.preservation, status: 'obligation' });
    case 'semantic_type_lowering':
      return proofResult({ kind: 'lowering_to_target_proof', from: 'semantic_type_lowering', to: 'target_projection', preservation: contract.preservation, status: 'obligation' });
    case 'target_projection':
      return terminalResult();
  }
};

const resolveStageProofObligationsImplementation = (stage: AstSemanticStage, contract: AstSemanticStageContract): readonly AstSemanticStageProof[] =>
  resolveStageProofImplementation(stage, contract).continueWith({
    onProof: proof => Object.freeze([proof]),
    onTerminal: () => Object.freeze([]),
  });

export interface AstSemanticStageProofOperationsInterface {
  readonly kind: 'ast_semantic_stage_proof_operations';
  readonly resolve: (stage: AstSemanticStage, contract: AstSemanticStageContract) => AstSemanticStageProofResult;
  readonly obligations: (stage: AstSemanticStage, contract: AstSemanticStageContract) => readonly AstSemanticStageProof[];
  readonly nextStage: (stage: AstSemanticStage) => AstSemanticStage | 'source_syntax';
  readonly continueFrom: (stage: AstSemanticStage, contract: AstSemanticStageContract) => Readonly<{
    result: AstSemanticStageProofResult;
    obligations: readonly AstSemanticStageProof[];
    next: AstSemanticStage | 'source_syntax';
    continueWith: <Result>(handlers: AstSemanticProofResultHandlers<Result>) => Result;
  }>;
}

export const astSemanticStageProofOperations: AstSemanticStageProofOperationsInterface = Object.freeze({
  kind: 'ast_semantic_stage_proof_operations',
  resolve: resolveStageProofImplementation,
  obligations: resolveStageProofObligationsImplementation,
  nextStage: nextStageImplementation,
  continueFrom: (stage: AstSemanticStage, contract: AstSemanticStageContract) => {
    const result = resolveStageProofImplementation(stage, contract);
    return Object.freeze({
      result,
      obligations: resolveStageProofObligationsImplementation(stage, contract),
      next: nextStageImplementation(stage),
      continueWith: <Result>(handlers: AstSemanticProofResultHandlers<Result>): Result => result.continueWith(handlers),
    });
  },
});
