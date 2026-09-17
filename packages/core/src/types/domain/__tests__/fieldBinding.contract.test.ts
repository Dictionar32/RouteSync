import { describe, expect, expectTypeOf, it } from 'vitest';
import type { FieldNode } from '../../field';
import type { FieldBinding, ResolvedFieldBinding } from '../fieldBinding';
import type { SemanticResolution } from '../../semanticResolution';

describe('FieldBinding contract', () => {
  it('keeps syntax and semantic result as separate values', () => {
    expectTypeOf<ResolvedFieldBinding['syntax']>().toEqualTypeOf<FieldNode>();
    expectTypeOf<ResolvedFieldBinding['semantic']>().toEqualTypeOf<SemanticResolution>();
  });

  it('is a closed binding ADT', () => {
    expectTypeOf<FieldBinding>().toMatchTypeOf<
      | { readonly kind: 'resolved' }
      | { readonly kind: 'unresolved' }
    >();
  });
});
