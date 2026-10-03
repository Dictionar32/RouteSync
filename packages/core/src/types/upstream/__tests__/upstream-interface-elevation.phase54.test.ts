import type { RouteAst } from '../ast';
import type { RouteProducer, RouteProducerInput } from '../route';

describe('Phase 54 upstream route producer boundary', () => {
  it('keeps RouteAst as the producer output instead of deleting AST upstream', () => {
    type Produced = ReturnType<RouteProducer['produce']>;
    const _ast: RouteAst = null as unknown as Produced;
    void _ast;
  });

  it('requires declaration provenance at the upstream producer boundary', () => {
    type HasDeclaration = RouteProducerInput extends { readonly declaration: unknown } ? true : false;
    const value: HasDeclaration = true;
    expect(value).toBe(true);
  });
});
