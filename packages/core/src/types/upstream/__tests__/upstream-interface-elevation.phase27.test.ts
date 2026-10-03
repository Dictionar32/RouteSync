import { expectTypeOf, test } from 'vitest';
import type { ControllerActionFlowContract, ControllerActionHighLevelContract } from '../highLevelContracts';
import type { ControllerDependency } from '../controller';
import type { Sequence } from '../collections';

test('phase 27 elevates controller flow into an upstream interface', () => {
  expectTypeOf<ControllerActionFlowContract>().toExtend<ControllerActionHighLevelContract>();
  expectTypeOf<ControllerActionFlowContract['dependencies']>().toEqualTypeOf<Sequence<ControllerDependency>>();
  expectTypeOf<ControllerActionFlowContract['semantic']>().toHaveProperty('variables');
});

test('controller dependency is a semantic interface while injection mode remains an ADT', () => {
  expectTypeOf<ControllerDependency>().toHaveProperty('injection');
  expectTypeOf<ControllerDependency['injection']['kind']>().toEqualTypeOf<'constructor' | 'method'>();
});
