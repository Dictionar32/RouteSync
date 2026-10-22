import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { LARAVEL_CONTROLLER_RESPONSE_DTO_DECLARATION_RESOLUTION_CONTRACT } from '../laravelControllerResponseDtoDeclarationResolutionAuthority';

describe('Laravel response method ownership provenance phase 2200', () => {
  it('requires the declaration-resolution contract to retain a closed request owner', () => {
    expect(LARAVEL_CONTROLLER_RESPONSE_DTO_DECLARATION_RESOLUTION_CONTRACT.version).toBe(5);
    expect(LARAVEL_CONTROLLER_RESPONSE_DTO_DECLARATION_RESOLUTION_CONTRACT.ownerProvenanceRule)
      .toContain('consumers-must-not-reconstruct-method-ownership-by-source-span-lookup');
  });

  it('projects response shape from judgment ownership instead of rejoining methods by source span', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../laravelControllerResponseSemanticPipeline.ts'),
      'utf8',
    );
    expect(source).toContain("judgment.request.owner.kind");
    expect(source).toContain("judgment.request.owner.methodEvidence.responseAttribute.shape");
    expect(source).not.toContain('method.responseAttribute.source === judgment.request.requestSource');
  });
});
