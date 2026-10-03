import type { ControllerAction } from '../controller';
import type { ControllerActionFlowContract } from '../highLevelContracts';
import type { ControllerDependency } from '../controller';
import type { Sequence } from '../collections';
import type { ControllerDependency } from '../controller';

describe('phase 31 controller dependency flow', () => {
  it('keeps method dependencies as an upstream semantic interface', () => {
    expectTypeOf<ControllerAction['dependencies']>().toEqualTypeOf<Sequence<ControllerDependency>>();
    expectTypeOf<ControllerActionFlowContract['dependencies']>().toEqualTypeOf<Sequence<ControllerDependency>>();
    expectTypeOf<ControllerDependency['parameter']>().toEqualTypeOf<import('../../names').VariableName>();
  });
});
