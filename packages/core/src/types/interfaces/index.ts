export type { InterfaceDependencyAlgebraInterface, InterfaceDependencyContractInterface, InterfaceDependencyBoundary, UpstreamWiringInterface } from './interfaceDependencyBoundary';

export type { SemanticCapabilityProjectionAlgebraInterface, SemanticCapabilityProjectionContract, SemanticCapabilityProjectionInterface } from './semanticCapabilityProjectionInterface';

export * from './operationIdentityProjectionInterface';
export * from './mapperProjectionInterface';

export { composeUpstreamWiring } from './interfaceComposition';
export type { InterfaceCompositionAlgebra, InterfaceCompositionContract, InterfaceComposition } from './interfaceComposition';
