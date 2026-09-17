import { describe, expectTypeOf, it } from 'vitest';
import type { BoundCastType, BoundTargetModel } from '../semanticValues';
import type { BoundModelColumnNode, BoundMethodCallNode } from '../boundAst';
import type { ResponseShapeSpecification, BasePaginatedEnvelopeDescriptor } from '../responseShapes';
import type { ResponseWrapperKey, ResponseLinksKeySpecification } from '../semanticValues';
import type { RequestField, FileConstraintPresence } from '../request';

describe('Phase 70 null-free semantic contracts', () => {
  it('models optional response wrapper as an ADT', () => {
    expectTypeOf<ResponseShapeSpecification['defaultWrapperKey']>().toEqualTypeOf<ResponseWrapperKey>();
  });

  it('models optional pagination links as an ADT', () => {
    expectTypeOf<BasePaginatedEnvelopeDescriptor['linksKey']>().toEqualTypeOf<ResponseLinksKeySpecification>();
  });

  it('models optional bound cast as an ADT', () => {
    expectTypeOf<BoundModelColumnNode['castType']>().toEqualTypeOf<BoundCastType>();
  });

  it('models optional bound targets as an ADT', () => {
    expectTypeOf<BoundMethodCallNode['targetModel']>().toEqualTypeOf<BoundTargetModel>();
  });

  it('models optional file constraints as an ADT', () => {
    expectTypeOf<RequestField['fileConstraints']>().toEqualTypeOf<FileConstraintPresence>();
  });
});
