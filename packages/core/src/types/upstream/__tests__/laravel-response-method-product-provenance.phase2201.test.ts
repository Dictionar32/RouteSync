import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { LARAVEL_CONTROLLER_RESPONSE_DTO_DECLARATION_RESOLUTION_CONTRACT } from '../laravelControllerResponseDtoDeclarationResolutionAuthority';

describe('Laravel response method product provenance phase 2201', () => {
  it('keeps DTO declaration ownership closed before method-product projection', () => {
    expect(LARAVEL_CONTROLLER_RESPONSE_DTO_DECLARATION_RESOLUTION_CONTRACT.version).toBe(5);
    expect(LARAVEL_CONTROLLER_RESPONSE_DTO_DECLARATION_RESOLUTION_CONTRACT.ownerProvenanceRule)
      .toContain('consumers-must-not-reconstruct-method-ownership-by-source-span-lookup');
  });

  it('attaches DTO response-contract judgments to the exact canonical method product', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../laravelControllerResponseSemanticPipeline.ts'),
      'utf8',
    );
    expect(source).toContain('dtoResponseContracts: dtoResponseContractsForMethod(first, dtoResponseContractJudgments)');
    expect(source).toContain('...tail.methods');
    expect(source).toContain('owner.methodEvidence === method.methodEvidence');
    expect(source).toContain('projectMethodResponses(canonicalMethods, input.dtoResponseContractProjectionJudgments)');
  });

  it('does not add DTO response contracts as an aggregate-only side channel', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../laravelControllerResponseSemanticPipeline.ts'),
      'utf8',
    );
    expect(source).toContain('readonly dtoResponseContracts: readonly LaravelDtoResponseContractProjectionJudgment[]');
    expect(source).toContain('dtoContractProvenanceRule');
    expect(source).not.toContain('method.responseAttribute.source === judgment.request.requestSource');
  });
});
