import { describe, expectTypeOf, it } from 'vitest';
import type {
  BoundCardinality,
  BoundModelColumnNode,
  BoundRelationNode,
  BoundSemanticNode,
  BoundUnsupportedNode,
  BoundNullability,
} from '../boundAst';
import type { SemanticType } from '../../../compiler/types/SemanticType';

describe('Bound Laravel semantic AST contract', () => {
  it('uses first-class SemanticType for resolved results', () => {
    expectTypeOf<BoundModelColumnNode['semanticType']>().toEqualTypeOf<SemanticType>();
  });

  it('represents cardinality as a closed ADT', () => {
    expectTypeOf<BoundCardinality>().toEqualTypeOf<
      | { readonly kind: 'single' }
      | { readonly kind: 'collection' }
    >();
  });

  it('represents nullability as a closed ADT', () => {
    expectTypeOf<BoundNullability>().toEqualTypeOf<
      | { readonly kind: 'non_nullable' }
      | { readonly kind: 'nullable' }
    >();
  });

  it('does not expose the legacy unknown node', () => {
    expectTypeOf<BoundSemanticNode>().not.toHaveProperty('rawExpression');
    expectTypeOf<BoundUnsupportedNode['reason']>().toEqualTypeOf<
      | 'parser_gap'
      | 'unsupported_syntax'
      | 'unresolved_symbol'
      | 'unresolved_property'
      | 'unresolved_method'
      | 'invalid_boundary_input'
    >();
  });

  it('requires a resolved relation target and closed relation vocabulary', () => {
    expectTypeOf<BoundRelationNode['targetModel']>().toEqualTypeOf<string>();
    expectTypeOf<BoundRelationNode['cardinality']>().toEqualTypeOf<BoundCardinality>();
  });
});
