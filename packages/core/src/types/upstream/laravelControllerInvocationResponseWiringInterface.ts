import type { LaravelControllerInvocationSemanticJudgmentInterface } from './laravelControllerInvocationSemanticJudgmentInterface';
import type { LaravelControllerResponseSemanticJudgmentFor } from './laravelControllerResponseSemanticJudgmentInterface';
import type { LaravelControllerScanArtifact } from './laravelControllerScannerInterface';

/**
 * Typed result of forwarding the judgments already owned by one canonical
 * controller artifact. This shape does not authorize creation or reclassification
 * of either judgment.
 */
export interface LaravelControllerInvocationResponseWiringResult<
  Artifact extends LaravelControllerScanArtifact = LaravelControllerScanArtifact,
> {
  readonly kind: 'laravel_controller_invocation_response_wiring_result';
  /** The exact input artifact remains the canonical owner of both judgments. */
  readonly artifact: Artifact;
  /** Must be forwarded from artifact.invocationJudgment without reconstruction. */
  readonly invocationJudgment: Artifact['invocationJudgment'] & LaravelControllerInvocationSemanticJudgmentInterface;
  /** Must be forwarded from artifact.responseJudgment without widening its invocation subtype. */
  readonly responseJudgment: Artifact['responseJudgment'];
}

/**
 * Interface contract for the invocation -> response wiring edge.
 *
 * `forward` is a structural wiring operation, not a semantic authority: it may
 * only expose the artifact-owned judgments. It must not parse source, select a
 * different source file, classify invocation/response kinds, or synthesize an
 * outcome. The contract is declared here before any runtime implementation is
 * migrated to it.
 */
export interface LaravelControllerInvocationResponseWiringInterface<
  Artifact extends LaravelControllerScanArtifact = LaravelControllerScanArtifact,
> {
  readonly kind: 'laravel_controller_invocation_response_wiring';
  readonly closed: true;
  readonly contractVersion: 2;
  readonly forward: <Candidate extends Artifact>(
    artifact: Candidate,
  ) => LaravelControllerInvocationResponseWiringResult<Candidate>;
  readonly sourceCorrelation: 'forward-the-artifact-owned-judgments-without-reconstruction-or-independent-source-file-selection';
  readonly outcomePreservation: 'not-connected-source-binding-rejected-blocked-and-complete-remain-distinct';
  readonly runtimeResponsibility: 'execute-the-declared-forwarding-edge-only-no-invocation-or-response-classification';
}

/** Type-level output projection for audits and downstream declarations. */
export type LaravelControllerInvocationResponseWiringArtifact<
  Artifact extends LaravelControllerScanArtifact = LaravelControllerScanArtifact,
> = LaravelControllerInvocationResponseWiringResult<Artifact>;
