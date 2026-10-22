import { describe, expect, it } from 'vitest';
import { laravelControllerResponseSemanticPipeline } from '../laravelControllerResponseSemanticPipeline';

describe('controller lexical-resolution authority path phase 2215', () => {
  it('exposes the existing class-name authority through the DTO type-reference authority contract', () => {
    expect(laravelControllerResponseSemanticPipeline.dtoTypeReferenceBindingAuthority.dependencies.classNameResolutionAuthority).toBe(
      laravelControllerResponseSemanticPipeline.dependencies.dtoTypeReferenceBindingAuthority.dependencies.classNameResolutionAuthority,
    );
  });

  it('does not introduce a parallel class-name resolution authority on the pipeline', () => {
    expect(laravelControllerResponseSemanticPipeline.dtoTypeReferenceBindingAuthority.dependencies.classNameResolutionAuthority).toBe(
      laravelControllerResponseSemanticPipeline.dependencies.dtoTypeReferenceBindingAuthority.dependencies.classNameResolutionAuthority,
    );
  });
});
