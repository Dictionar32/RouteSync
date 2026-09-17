import type { EndpointContract, EndpointErrorResponseContract, EndpointResponseContract } from '../packages/core/src/types/domain/contracts';
import type {
  ErrorTypeName,
  MethodName,
  ResourceName,
  RouteGroupName,
  RouteName,
  RoutePath,
  RuntimePath,
} from '../packages/core/src/types/domain/semanticValues';

type Assert<T extends true> = T;
type Extends<A, B> = A extends B ? true : false;

type _RouteId = Assert<Extends<EndpointContract['id'], RouteName>>;
type _EndpointName = Assert<Extends<EndpointContract['name'], MethodName>>;
type _Path = Assert<Extends<EndpointContract['path'], RoutePath>>;
type _RuntimePath = Assert<Extends<EndpointContract['runtimePath'], RuntimePath>>;
type _Group = Assert<Extends<EndpointContract['groupName'], RouteGroupName>>;
type _Resource = Assert<Extends<EndpointContract['resourceName'], ResourceName>>;
type _ErrorName = Assert<Extends<EndpointErrorResponseContract['name'], ErrorTypeName>>;
type _ErrorType = Assert<Extends<EndpointErrorResponseContract['typeName'], ErrorTypeName>>;
type _NoDerivedUnion = Assert<Extends<keyof EndpointResponseContract, 'success' | 'errors'>>;
