import type { ControllerActionHighLevelContract } from '../highLevelContracts';
import type { ControllerDependency } from '../controller';

type Assert<T extends true> = T;
type Extends<A, B> = A extends B ? true : false;

type ControllerDependencyIsInterface = Assert<Extends<ControllerDependency, { readonly kind: 'controller_dependency'; readonly type: ControllerDependency['type'] }>>;
type ControllerCarriesDependencyFlow = Assert<Extends<ControllerActionHighLevelContract, { readonly semantic: { readonly dependencies: readonly ControllerDependency[] } }>>;

void (0 as ControllerDependencyIsInterface);
void (0 as ControllerCarriesDependencyFlow);
