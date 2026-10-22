import { describe, expect, it } from 'vitest';
import { laravelControllerResponseSemanticPipeline } from '../laravelControllerResponseSemanticPipeline';

describe('DTO response projection binding scope phase 2216', () => {
  it('declares exact DTO declaration ownership as a pipeline boundary', () => {
    expect(laravelControllerResponseSemanticPipeline.contract.contractVersion).toBe(31);
    expect(laravelControllerResponseSemanticPipeline.contract.dtoProjectionBindingScopeRule).toBe(
      'each-DTO-response-contract-projection-receives-only-property-reference-bindings-owned-by-that-exact-resolved-DTO-declaration;cross-DTO-bindings-are-excluded-before-the-projection-interface-is-called',
    );
  });

  it('uses the existing DTO projection authority rather than introducing another owner', () => {
    expect(laravelControllerResponseSemanticPipeline.dependencies.dtoResponseContractProjectionAuthority).toBe(
      laravelControllerResponseSemanticPipeline.dtoResponseContractProjection,
    );
    expect(laravelControllerResponseSemanticPipeline.dtoResponseContractProjection.kind).toBe(
      'laravel_dto_response_contract_projection',
    );
  });
});
