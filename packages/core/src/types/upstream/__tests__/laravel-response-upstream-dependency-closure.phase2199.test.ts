import { describe, expect, it } from 'vitest';
import { laravelControllerResponseSemanticPipelineDependencies } from '../laravelControllerResponseSemanticPipeline';
import { phpClassNameResolutionAuthority } from '../phpClassNameResolutionAuthority';

describe('Laravel response upstream dependency closure phase 2199', () => {
  it('uses the DTO type-reference authority as the single owner of class-name and declaration-resolution dependencies', () => {
    const dtoBinding = laravelControllerResponseSemanticPipelineDependencies.dtoTypeReferenceBindingAuthority;
    const responseAuthority = laravelControllerResponseSemanticPipelineDependencies.responseSemanticAuthority;

    expect(dtoBinding.dependencies.classNameResolutionAuthority).toBe(phpClassNameResolutionAuthority);
    expect(dtoBinding.dependencies.declarationResolutionAuthority.dependencies.sourceIdentitySemantics)
      .toBe(responseAuthority.sourceIdentitySemantics);
  });

  it('does not expose duplicate class-name and DTO-declaration authority slots in the pipeline dependency contract', () => {
    expect(laravelControllerResponseSemanticPipelineDependencies).not.toHaveProperty('classNameResolutionAuthority');
    expect(laravelControllerResponseSemanticPipelineDependencies).not.toHaveProperty('dtoDeclarationResolutionAuthority');
  });
});
