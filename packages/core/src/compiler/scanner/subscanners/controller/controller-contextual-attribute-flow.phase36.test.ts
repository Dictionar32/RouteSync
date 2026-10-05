import { describe, expectTypeOf, it } from 'vitest';
import type { ControllerContextualAttribute, ControllerCustomContextualAttribute, ControllerDependencyResolution } from '../../../../types/upstream/controller';
import type { ControllerParameterAst, ControllerParameterAttributeAst } from '../../lexer/controllerAstTypes';

describe('phase 36 contextual attribute semantic boundary', () => {
  it('keeps parameter attributes at AST boundary', () => {
    expectTypeOf<ControllerParameterAst['attributes']>().toEqualTypeOf<readonly ControllerParameterAttributeAst[]>();
  });

  it('elevates Laravel contextual attributes into dependency resolution', () => {
    expectTypeOf<ControllerDependencyResolution>().toMatchTypeOf<
      | { readonly kind: 'container' }
      | { readonly kind: 'contextual_attribute'; readonly attribute: ControllerContextualAttribute | ControllerCustomContextualAttribute }
    >();
  });
});


describe('phase 41 custom contextual attribute semantic boundary', () => {
  it('keeps custom ContextualAttribute resolution semantic', () => {
    expectTypeOf<ControllerDependencyResolution>().toMatchTypeOf<
      { readonly kind: 'contextual_attribute'; readonly attribute: ControllerCustomContextualAttribute }
    >();
  });
});
