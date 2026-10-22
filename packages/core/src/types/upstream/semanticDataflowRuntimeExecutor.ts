/**
 * Canonical runtime execution boundary for semantic data-flow.
 *
 * This module composes the existing upstream reasoning authority with the
 * existing judgment admission contract. It introduces no solver and performs
 * no semantic classification: the authority derives the judgment, while the
 * interface boundary validates the proof envelope before runtime consumers
 * can observe it.
 */
import { semanticDataflowReasoningAuthority } from './semanticDataflowAuthority';
import type { SemanticDataflowReasoningAuthorityInterface } from './semanticDataflow';
import type {
  SemanticDataflowBoundaryResult,
  SemanticDataflowEvidenceExecutionRequest,
  SemanticDataflowNoEvidenceExecutionRequest,
  SemanticDataflowNoEvidenceResult,
  SemanticDataflowRuntimeExecutorInterface,
  SemanticDataflowRuntimeExecutionRequest,
  SemanticDataflowRuntimeExecutionResult,
} from './semanticDataflowInterface';
import { semanticDataflowJudgmentBoundary } from './semanticDataflowAdmission';
import type { SemanticDataflowJudgmentBoundaryInterface } from './semanticDataflowInterface';

export const createSemanticDataflowRuntimeExecutor = (
  authority: SemanticDataflowReasoningAuthorityInterface,
  boundary: SemanticDataflowJudgmentBoundaryInterface,
): SemanticDataflowRuntimeExecutorInterface => {
  function executeEvidenceRequest(request: SemanticDataflowEvidenceExecutionRequest): SemanticDataflowBoundaryResult;
  function executeEvidenceRequest(request: SemanticDataflowNoEvidenceExecutionRequest): SemanticDataflowNoEvidenceResult;
  function executeEvidenceRequest(request: SemanticDataflowRuntimeExecutionRequest): SemanticDataflowRuntimeExecutionResult;
  function executeEvidenceRequest(request: SemanticDataflowRuntimeExecutionRequest): SemanticDataflowRuntimeExecutionResult {
    return request.input.kind === 'no_evidence'
      ? Object.freeze({
          kind: 'semantic_dataflow_no_evidence',
          reason: request.input.reason,
          semanticStatus: 'not_evaluated',
          protocolClosed: true,
        })
      : boundary.admit(authority.judge(request.input.value));
  }

  return Object.freeze({
    kind: 'semantic_dataflow_runtime_executor',
    authority: 'upstream',
    execute: executeEvidenceRequest,
  });
};

export const semanticDataflowRuntimeExecutor: SemanticDataflowRuntimeExecutorInterface = createSemanticDataflowRuntimeExecutor(
  semanticDataflowReasoningAuthority,
  semanticDataflowJudgmentBoundary,
);
