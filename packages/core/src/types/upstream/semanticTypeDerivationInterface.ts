import type { ObjectType } from '../domain/semanticType';
import type { RouteSemanticFlow } from '../route';
import type { ModelAst, ResourceAst } from './ast';

/** Minimal semantic interning capability; the upstream contract does not depend on the compiler's concrete TypeInterner. */
export interface SemanticTypeInterningInterface {
  readonly intern: (type: import('../domain/semanticType').SemanticType) => import('../domain/semanticType').SemanticType;
  readonly getCacheSize: () => number;
  readonly clear: () => void;
}

export interface SemanticTypeDerivationRequest {
  readonly resources: readonly ResourceAst[];
  readonly models: readonly ModelAst[];
  readonly routes: readonly RouteSemanticFlow[];
  readonly interner: SemanticTypeInterningInterface;
}

export interface SemanticTypeDerivationStageReceipt<Stage extends 'resource' | 'route_response' | 'model'> {
  readonly stage: Stage;
  /** Number of typed source-evidence items admitted to this stage. */
  readonly evidenceCount: number;
  /** Number of semantic object types contributed by this stage after authority-owned deduplication. */
  readonly resultCount: number;
}

/** Stable source identity included in the proof; counts alone cannot establish which evidence was covered. */
export type SemanticTypeSourceIdentity =
  | { readonly kind: 'resource'; readonly identity: ResourceAst['identity'] }
  | { readonly kind: 'model'; readonly identity: ModelAst['identity'] }
  | {
      readonly kind: 'route';
      readonly name: RouteSemanticFlow['identity']['coordinates']['name'];
      readonly sourceFile: RouteSemanticFlow['provenance']['sourceFile'];
      readonly sourceLine: RouteSemanticFlow['provenance']['sourceLine'];
    };

export interface SemanticTypeDerivationProof {
  readonly kind: 'semantic_type_derivation_proof';
  /** Ordered stage receipts make the derivation accountable, rather than merely naming the stages. */
  readonly stageReceipts: readonly [
    SemanticTypeDerivationStageReceipt<'resource'>,
    SemanticTypeDerivationStageReceipt<'route_response'>,
    SemanticTypeDerivationStageReceipt<'model'>,
  ];
  /** Exact source identities covered by this derivation, not just aggregate counts. */
  readonly sourceEvidence: readonly SemanticTypeSourceIdentity[];
  readonly sourceCoverage: Readonly<{
    readonly resources: number;
    readonly models: number;
    readonly routes: number;
  }>;
  readonly resultCount: number;
  /** True means every declared stage returned and its contribution is accounted for in resultCount. */
  readonly complete: true;
}

export interface SemanticTypeDerivationJudgment {
  readonly kind: 'semantic_type_derivation_judgment';
  readonly status: 'closed';
  readonly result: readonly ObjectType[];
  readonly sourceCoverage: Readonly<{
    readonly resources: number;
    readonly models: number;
    readonly routes: number;
  }>;
  readonly proof: SemanticTypeDerivationProof;
  readonly derivation: 'resource+route_response+model';
  readonly authority: 'semantic_type_derivation';
  readonly closed: true;
}

/** Sole authority port for deriving compiler semantic object types from typed source evidence. */
export interface SemanticTypeDerivationAuthorityInterface {
  readonly resolve: (request: SemanticTypeDerivationRequest) => SemanticTypeDerivationJudgment;
  readonly authority: 'semantic_type_derivation';
  readonly closed: true;
}




/** Canonical source inventory for this derivation contract. Order is deterministic by input lane and preserved within each lane. */
export const semanticTypeSourceEvidence = (
  request: SemanticTypeDerivationRequest,
): readonly SemanticTypeSourceIdentity[] => Object.freeze([
  ...request.resources.map(resource => Object.freeze({ kind: 'resource' as const, identity: resource.identity })),
  ...request.routes.map(route => Object.freeze({
    kind: 'route' as const,
    name: route.identity.coordinates.name,
    sourceFile: route.provenance.sourceFile,
    sourceLine: route.provenance.sourceLine,
  })),
  ...request.models.map(model => Object.freeze({ kind: 'model' as const, identity: model.identity })),
]);

/** Runtime shape guards are required because TypeScript contracts are erased in emitted JavaScript. */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Enforces the executable boundary of the semantic derivation contract.
 * Accepts unknown at the runtime boundary so malformed plugin/authority output
 * is rejected as a contract violation rather than leaking a TypeError.
 * It validates the closed judgment; it never derives or reinterprets types.
 */
export const assertSemanticTypeDerivationJudgment = (
  request: SemanticTypeDerivationRequest,
  candidate: unknown,
): SemanticTypeDerivationJudgment => {
  const expectedCoverage = {
    resources: request.resources.length,
    models: request.models.length,
    routes: request.routes.length,
  };
  const invalid = (): never => {
    throw new Error('Semantic type derivation contract violation: judgment is not closed or its proof does not match the request.');
  };

  if (!isRecord(candidate)) return invalid();
  const coverage = candidate.sourceCoverage;
  const proof = candidate.proof;
  const result = candidate.result;
  if (!isRecord(coverage) || !isRecord(proof) || !Array.isArray(result)) return invalid();
  const proofCoverage = proof.sourceCoverage;
  const stageReceipts = proof.stageReceipts;
  const sourceEvidence = proof.sourceEvidence;
  if (!isRecord(proofCoverage) || !Array.isArray(stageReceipts) || !Array.isArray(sourceEvidence)) return invalid();

  const coverageMatches = coverage.resources === expectedCoverage.resources
    && coverage.models === expectedCoverage.models
    && coverage.routes === expectedCoverage.routes;
  const proofCoverageMatches = proofCoverage.resources === expectedCoverage.resources
    && proofCoverage.models === expectedCoverage.models
    && proofCoverage.routes === expectedCoverage.routes;
  const receiptMatches = (receipt: unknown, stage: string, evidenceCount: number): receipt is Record<string, unknown> =>
    isRecord(receipt)
    && receipt.stage === stage
    && receipt.evidenceCount === evidenceCount
    && typeof receipt.resultCount === 'number'
    && Number.isInteger(receipt.resultCount)
    && receipt.resultCount >= 0;
  const sourceEvidenceMatches = JSON.stringify(sourceEvidence) === JSON.stringify(semanticTypeSourceEvidence(request));
  const proofStagesMatch = stageReceipts.length === 3
    && receiptMatches(stageReceipts[0], 'resource', expectedCoverage.resources)
    && receiptMatches(stageReceipts[1], 'route_response', expectedCoverage.routes)
    && receiptMatches(stageReceipts[2], 'model', expectedCoverage.models)
    && stageReceipts.reduce((total, receipt) => total + (isRecord(receipt) && typeof receipt.resultCount === 'number' ? receipt.resultCount : 0), 0) === result.length;

  if (
    candidate.kind !== 'semantic_type_derivation_judgment'
    || candidate.status !== 'closed'
    || candidate.closed !== true
    || candidate.authority !== 'semantic_type_derivation'
    || candidate.derivation !== 'resource+route_response+model'
    || !coverageMatches
    || !proofCoverageMatches
    || !sourceEvidenceMatches
    || proof.kind !== 'semantic_type_derivation_proof'
    || proof.complete !== true
    || !proofStagesMatch
    || proof.resultCount !== result.length
  ) return invalid();

  return candidate as unknown as SemanticTypeDerivationJudgment;
};
