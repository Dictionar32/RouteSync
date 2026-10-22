/** Single public authority for resource mapping; the scanner only delegates to this contract. */
import type { ResourceSemanticMappingAuthorityInterface } from './resourceSemanticMappingInterface';
import type { ResourceSemanticMappingContract } from './resourceSemanticMappingInterface';
import {
  resolveResourceSemanticKind,
  resolveResourceStructuralKind,
  resolveResourceStaticReceiver,
  resolveResourceStaticAction,
  resolveResourceSemanticMappingPort,
  resolveResourceAstMappingInterface,
  resolveResourceSemanticMappingInterface,
} from './resourceSemanticMappingAlgebra';

export const RESOURCE_SEMANTIC_MAPPING_CONTRACT: ResourceSemanticMappingContract = Object.freeze({
  kind: 'resource_semantic_mapping_contract',
  version: 1,
  sourceVocabulary: 'php-resource-ast-evidence',
  targetVocabulary: 'upstream-semantic-ast',
  ruleOwnership: 'upstream-semantic-algebra',
  executorOwnership: 'generic-upstream-runtime',
  unsupportedMapping: 'explicit-error',
});

export const resourceSemanticMappingAuthority: ResourceSemanticMappingAuthorityInterface = Object.freeze({
  kind: 'resource_semantic_mapping_authority',
  contract: RESOURCE_SEMANTIC_MAPPING_CONTRACT,
  resolveSemanticKind: resolveResourceSemanticKind,
  resolveStructuralKind: resolveResourceStructuralKind,
  resolveStaticReceiver: resolveResourceStaticReceiver,
  resolveStaticAction: resolveResourceStaticAction,
  resolveMappingPort: resolveResourceSemanticMappingPort,
  resolveAstMappingInterface: resolveResourceAstMappingInterface,
  resolveMappingInterface: resolveResourceSemanticMappingInterface,
});

export const resolveResourceSemanticKindThroughAuthority = resourceSemanticMappingAuthority.resolveSemanticKind;
export const resolveResourceStructuralKindThroughAuthority = resourceSemanticMappingAuthority.resolveStructuralKind;
export const resolveResourceStaticReceiverThroughAuthority = resourceSemanticMappingAuthority.resolveStaticReceiver;
export const resolveResourceStaticActionThroughAuthority = resourceSemanticMappingAuthority.resolveStaticAction;
export const resolveResourceMappingPortThroughAuthority = resourceSemanticMappingAuthority.resolveMappingPort;
export const resolveResourceAstMappingInterfaceThroughAuthority = resourceSemanticMappingAuthority.resolveAstMappingInterface;
export const resolveResourceMappingInterfaceThroughAuthority = resourceSemanticMappingAuthority.resolveMappingInterface;
