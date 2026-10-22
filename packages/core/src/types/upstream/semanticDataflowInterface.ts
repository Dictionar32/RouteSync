/**
 * Canonical upstream semantic-dataflow interface surface.
 *
 * The closed semantic ADTs live in `semanticDataflow.ts`; this module names the
 * stable AST-facing aliases and runtime contracts without implementing their
 * behavior. Executable admission logic belongs in semanticDataflowAdmission.ts;
 * the runtime composition belongs in semanticDataflowRuntimeExecutor.ts.
 */
import type { DataFlowAuthorityInterface } from '../dataflow/dataFlowInterface';
import type {
  SemanticDataflowIdentity,
  SemanticDataflowFact,
  SemanticDataflowInput,
  SemanticDataflowJudgment,
} from './semanticDataflow';

export type {
  SemanticDataflowEntityRole,
  SemanticDataflowRole,
  SemanticDataflowIdentity,
  SemanticDataflowIdentityKey,
  SemanticDataflowGuard,
  SemanticDataflowPath,
  SemanticDataflowFactLineage,
  SemanticDataflowFact,
  SemanticDataflowDerivation,
  SemanticDataflowInputFact,
  SemanticDataflowJudgment,
  SemanticDataflowClosureCertificate,
  SemanticDataflowOrigin,
  SemanticDataflowLineageProducer,
  SemanticDataflowLineage,
  SemanticDataflowInput,
  SemanticDataflowInterface,
} from './semanticDataflow';
export {
  semanticDataflowIdentityKey,
  semanticDataflowIdentityEqual,
  semanticDataflowFactWithLineage,
  semanticDataflowInterfaceFromJudgment,
} from './semanticDataflow';

/** Canonical semantic identity used by AST-derived dataflow facts. */
export type AstDataflowIdentity = SemanticDataflowIdentity;
/** Closed dependency/value-flow/reachability relation algebra. */
export type AstDataflowFact = SemanticDataflowFact;
/** Typed seed surface supplied by upstream AST/knowledge producers. */
export type AstDataflowInput = SemanticDataflowInput;
/** Closed result produced only by the upstream semantic-dataflow authority. */
export type AstDataflowJudgment = SemanticDataflowJudgment;
/** Read-only AST-to-analysis boundary; execution/reasoning methods are excluded. */
export type AstDataflowInterface = DataFlowAuthorityInterface<
  AstDataflowInput,
  AstDataflowJudgment,
  AstDataflowIdentity
>;


/**
 * Contract for admitting an already-derived semantic judgment. Implementations
 * validate the proof envelope only; they MUST NOT derive facts, rebuild paths,
 * infer roles, or repair a partial judgment.
 */
export type SemanticDataflowBoundaryRejection = Readonly<{
  readonly kind: 'semantic_dataflow_boundary_rejection';
  readonly reason:
    | 'wrong_judgment_kind'
    | 'judgment_not_closed'
    | 'reasoning_contract_not_closed'
    | 'missing_evidence_collections'
    | 'origin_identity_mismatch'
    | 'reasoning_proof_facets_inconsistent'
    | 'source_identity_mismatch'
    | 'input_fact_missing_from_closure'
    | 'derivation_premise_missing'
    | 'derivation_conclusion_missing'
    | 'path_endpoint_mismatch'
    | 'path_step_disconnected'
    | 'fact_lineage_mismatch'
    | 'closure_certificate_missing'
    | 'closure_certificate_invalid'
    | 'closure_derivation_missing'
    | 'closure_fact_duplicate'
    | 'derivation_not_grounded'
    | 'derivation_witness_duplicate'
    | 'derivation_identity_invalid'
    | 'derivation_rule_unknown'
    | 'derivation_premise_shape_invalid'
    | 'derivation_rule_conclusion_mismatch';
}>;

export type SemanticDataflowBoundaryAcceptance = Readonly<{
  readonly kind: 'semantic_dataflow_boundary_acceptance';
  readonly judgment: AstDataflowJudgment;
  readonly closed: true;
}>;

export type SemanticDataflowBoundaryResult =
  | SemanticDataflowBoundaryAcceptance
  | SemanticDataflowBoundaryRejection;

/**
 * Admission contract, deliberately free of implementation details. The
 * authority derives; this boundary accepts or rejects; the executor composes.
 */
export interface SemanticDataflowJudgmentBoundaryInterface {
  readonly admit: (judgment: AstDataflowJudgment) => SemanticDataflowBoundaryResult;
}

/**
 * Runtime-facing execution contract for scanner/AST consumers.
 *
 * The executor accepts typed upstream input and returns only an admitted
 * closed judgment or a typed rejection. Consumers must not call the reasoning
 * authority and boundary separately, because doing so lets each consumer
 * recompose (and potentially diverge from) the semantic trust boundary.
 */
/**
 * Explicit non-judgment outcome for an input surface that contains no dataflow
 * facts. This is not an empty semantic judgment: without a source anchor the
 * system must not invent an identity, source span, or closure certificate.
 */
export type SemanticDataflowNoEvidenceResult = Readonly<{
  readonly kind: 'semantic_dataflow_no_evidence';
  readonly reason: 'no_dataflow_facts';
  /** No semantic judgment was derived; downstream must not treat this as success. */
  readonly semanticStatus: 'not_evaluated';
  /** The protocol variant is complete, not a claim that semantic analysis succeeded. */
  readonly protocolClosed: true;
}>;

/** Request variant carrying canonical evidence for upstream evaluation. */
export type SemanticDataflowEvidenceExecutionRequest = Readonly<{
  readonly kind: 'semantic_dataflow_execution_request';
  readonly input: Readonly<{ readonly kind: 'evidence_input'; readonly value: SemanticDataflowInput }>;
}>;

/** Request variant that explicitly reports the absence of evidence. */
export type SemanticDataflowNoEvidenceExecutionRequest = Readonly<{
  readonly kind: 'semantic_dataflow_execution_request';
  readonly input: Readonly<{ readonly kind: 'no_evidence'; readonly reason: SemanticDataflowNoEvidenceResult['reason'] }>;
}>;

/** Closed request algebra accepted by the single runtime execution interface. */
export type SemanticDataflowRuntimeExecutionRequest =
  | SemanticDataflowEvidenceExecutionRequest
  | SemanticDataflowNoEvidenceExecutionRequest;

export type SemanticDataflowRuntimeExecutionResult =
  | SemanticDataflowBoundaryResult
  | SemanticDataflowNoEvidenceResult;

/**
 * Runtime execution contract for scanner/AST consumers. Both evidence-bearing
 * and no-evidence requests cross this same boundary. The discriminant selects
 * a protocol case; it is not semantic inference. The executor is the sole owner
 * of composing authority and admission.
 *
 * Invariants: (1) consumers submit requests, never compose authority + boundary;
 * (2) accepted judgment is admitted upstream; (3) no-evidence is not a judgment;
 * (4) the executor does not invent evidence or repair rejected judgments.
 */
export interface SemanticDataflowRuntimeExecutorInterface {
  readonly kind: 'semantic_dataflow_runtime_executor';
  readonly authority: 'upstream';
  readonly execute: {
    (request: SemanticDataflowEvidenceExecutionRequest): SemanticDataflowBoundaryResult;
    (request: SemanticDataflowNoEvidenceExecutionRequest): SemanticDataflowNoEvidenceResult;
    /** Union overload allows adapters to forward a closed request algebra without dispatching semantics. */
    (request: SemanticDataflowRuntimeExecutionRequest): SemanticDataflowRuntimeExecutionResult;
  };
}
