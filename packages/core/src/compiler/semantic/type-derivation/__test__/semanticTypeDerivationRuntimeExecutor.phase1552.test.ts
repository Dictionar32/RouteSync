import { describe, expect, it } from 'vitest';
import type {
  SemanticTypeDerivationAuthorityInterface,
  SemanticTypeDerivationJudgment,
  SemanticTypeDerivationRequest,
} from '../../../../types/upstream/semanticTypeDerivationInterface';
import { createSemanticTypeDerivationRuntimeExecutor } from '../semanticTypeDerivationRuntimeExecutor';

const request: SemanticTypeDerivationRequest = {
  resources: [],
  models: [],
  routes: [],
  interner: {
    intern: value => value,
    getCacheSize: () => 0,
    clear: () => undefined,
  },
};

const judgment: SemanticTypeDerivationJudgment = {
  kind: 'semantic_type_derivation_judgment',
  status: 'closed',
  result: [],
  sourceCoverage: { resources: 0, models: 0, routes: 0 },
  proof: {
    kind: 'semantic_type_derivation_proof',
    stageReceipts: [
      { stage: 'resource', evidenceCount: 0, resultCount: 0 },
      { stage: 'route_response', evidenceCount: 0, resultCount: 0 },
      { stage: 'model', evidenceCount: 0, resultCount: 0 },
    ],
    sourceEvidence: [],
    sourceCoverage: { resources: 0, models: 0, routes: 0 },
    resultCount: 0,
    complete: true,
  },
  derivation: 'resource+route_response+model',
  authority: 'semantic_type_derivation',
  closed: true,
};

describe('semantic type derivation runtime executor', () => {
  it('delegates the original request and validates the returned closed proof without re-deriving', () => {
    let received: SemanticTypeDerivationRequest | undefined;
    const authority: SemanticTypeDerivationAuthorityInterface = {
      resolve: input => {
        received = input;
        return judgment;
      },
      authority: 'semantic_type_derivation',
      closed: true,
    };
    const executor = createSemanticTypeDerivationRuntimeExecutor(authority);
    expect(executor.execute(request)).toBe(judgment);
    expect(received).toBe(request);
    expect(executor.authority).toBe('upstream');
  });


  it('rejects malformed runtime values through the contract boundary instead of leaking property-access errors', () => {
    const malformedAuthority: SemanticTypeDerivationAuthorityInterface = {
      resolve: () => ({ ...judgment, proof: null } as unknown as SemanticTypeDerivationJudgment),
      authority: 'semantic_type_derivation',
      closed: true,
    };
    const executor = createSemanticTypeDerivationRuntimeExecutor(malformedAuthority);
    expect(() => executor.execute(request)).toThrow(/contract violation/);
  });

  it('rejects a missing judgment object through the same contract boundary', () => {
    const malformedAuthority: SemanticTypeDerivationAuthorityInterface = {
      resolve: () => null as unknown as SemanticTypeDerivationJudgment,
      authority: 'semantic_type_derivation',
      closed: true,
    };
    const executor = createSemanticTypeDerivationRuntimeExecutor(malformedAuthority);
    expect(() => executor.execute(request)).toThrow(/contract violation/);
  });

  it('rejects stage receipts whose contributions do not account for the judgment result', () => {
    const authority: SemanticTypeDerivationAuthorityInterface = {
      resolve: () => ({
        ...judgment,
        result: [{}] as SemanticTypeDerivationJudgment['result'],
        proof: { ...judgment.proof, resultCount: 1 },
      }),
      authority: 'semantic_type_derivation',
      closed: true,
    };
    const executor = createSemanticTypeDerivationRuntimeExecutor(authority);
    expect(() => executor.execute(request)).toThrow(/contract violation/);
  });

  it('rejects a judgment whose stage receipts do not account for the result', () => {
    const authority: SemanticTypeDerivationAuthorityInterface = {
      resolve: () => ({
        ...judgment,
        result: [{}] as SemanticTypeDerivationJudgment['result'],
        proof: { ...judgment.proof, resultCount: 1 },
      }),
      authority: 'semantic_type_derivation',
      closed: true,
    };
    const executor = createSemanticTypeDerivationRuntimeExecutor(authority);
    expect(() => executor.execute(request)).toThrow(/contract violation/);
  });

  it('rejects a judgment whose source coverage does not match the request', () => {
    const authority: SemanticTypeDerivationAuthorityInterface = {
      resolve: () => ({
        ...judgment,
        sourceCoverage: { resources: 1, models: 0, routes: 0 },
      }),
      authority: 'semantic_type_derivation',
      closed: true,
    };
    const executor = createSemanticTypeDerivationRuntimeExecutor(authority);
    expect(() => executor.execute(request)).toThrow(/contract violation/);
  });
});


describe('semantic source identity coverage', () => {
  it('rejects count-preserving substitution of source evidence identities', () => {
    const expectedIdentity = { kind: 'expected_source_identity' } as never;
    const substitutedIdentity = { kind: 'substituted_source_identity' } as never;
    const requestWithResource: SemanticTypeDerivationRequest = {
      ...request,
      resources: [{ identity: expectedIdentity } as never],
    };
    const substituted = {
      ...judgment,
      sourceCoverage: { resources: 1, models: 0, routes: 0 },
      proof: {
        ...judgment.proof,
        stageReceipts: [
          { stage: 'resource', evidenceCount: 1, resultCount: 0 },
          { stage: 'route_response', evidenceCount: 0, resultCount: 0 },
          { stage: 'model', evidenceCount: 0, resultCount: 0 },
        ],
        sourceEvidence: [{ kind: 'resource', identity: substitutedIdentity }],
        sourceCoverage: { resources: 1, models: 0, routes: 0 },
      },
    };
    const authority: SemanticTypeDerivationAuthorityInterface = {
      resolve: () => substituted,
      authority: 'semantic_type_derivation',
      closed: true,
    };
    const executor = createSemanticTypeDerivationRuntimeExecutor(authority);
    expect(() => executor.execute(requestWithResource)).toThrow(/contract violation/);
  });
});
