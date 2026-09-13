/**
 * route-classifier.ts
 *
 * Active Consumer & Orchestrator: Deterministic route classifier and domain graph builder.
 * Consumes modular sub-domains from classifier/ with zero wildcard re-exports.
 *
 * @module cli/generators
 */

import {
  type RouteManifest,
  type ClassifiedDomainGraph,
  type ResourceGroupDescriptor,
  type BaseResourceGroupTypeSignature,
  type FullCrudTypeSignature,
  type ReadOnlyCrudTypeSignature,
  type FlexibleCrudTypeSignature,
  type SingletonTypeSignature,
  type CustomTypeSignature,
  type ResourceGroupTypeSignature,
  type ResourceGroupVisitor,
  type ExhaustiveFineGrainedResourceGroupVisitor,
  type UnifiedCrudResourceGroupVisitor,
  type CrudResourceGroupDescriptor,
  type FullCrudResourceGroupDescriptor,
  type ReadOnlyCrudResourceGroupDescriptor,
  type FlexibleCrudResourceGroupDescriptor,
  type SingletonResourceGroupDescriptor,
  type CustomResourceGroupDescriptor,
  type MutationCapability,
  CrudRole,
  ResourceGroupKind,
  RESOURCE_GROUP_REGISTRY,
  matchResourceGroup,
  ScannedCrudResourceGroupDescriptor,
  ScannedFullCrudResourceGroupDescriptor,
  ScannedReadOnlyCrudResourceGroupDescriptor,
  ScannedFlexibleCrudResourceGroupDescriptor,
  ScannedSingletonResourceGroupDescriptor,
  ScannedCustomResourceGroupDescriptor,
  ScannedResourceGroupTypeSignature,
  ScannedResourceGroupGraph,
  createResourceGroupGraph
} from '@routesync/core';
import { toTypeName } from './names';

// Sub-domain imports
import {
  type ClassifiedRoute,
  type ScannedClassifiedRouteParams,
  type ResourceCrudMap,
  type ResolvedTypeInfo,
  ScannedClassifiedRouteDescriptor
} from './classifier/classifierTypes';

import {
  isDynamic,
  toRuntimePath,
  deriveGroupName,
  classifyCrudRole,
  ROLE_ACTION
} from './classifier/pathClassifier';

import {
  classifyRoutes,
  buildResourceMap,
  buildGroupedRoutes
} from './classifier/routeGrouper';

import {
  resolveItemPrimaryKeyType,
  resolveRouteResponseType,
  resolveRouteFormType,
  resolveGroupErrorType,
  collectImportedTypes,
  getStandardMutationKeys
} from './classifier/typeResolver';

import {
  partitionGroupSubRoutes,
  buildCrudGroupDescriptor,
  buildCustomOrSingletonGroupDescriptor
} from './classifier/groupDescriptorBuilder';

import { buildClassifiedDomainGraph } from './classifier/domainGraphBuilder';

/**
 * Classify a RouteManifest into a ClassifiedDomainGraph.
 */
export function classifyDomainGraph(manifest: RouteManifest): ClassifiedDomainGraph<ClassifiedRoute> {
  return buildClassifiedDomainGraph(manifest);
}

// ─── Explicit Named Exports (Rule 14: Zero Wildcard Re-export) ────────────────

export {
  CrudRole,
  ResourceGroupKind,
  RESOURCE_GROUP_REGISTRY,
  matchResourceGroup,
  ScannedCrudResourceGroupDescriptor,
  ScannedFullCrudResourceGroupDescriptor,
  ScannedReadOnlyCrudResourceGroupDescriptor,
  ScannedFlexibleCrudResourceGroupDescriptor,
  ScannedSingletonResourceGroupDescriptor,
  ScannedCustomResourceGroupDescriptor,
  ScannedResourceGroupTypeSignature,
  ScannedResourceGroupGraph,
  createResourceGroupGraph,
  ScannedClassifiedRouteDescriptor,
  isDynamic,
  toRuntimePath,
  deriveGroupName,
  classifyCrudRole,
  ROLE_ACTION,
  classifyRoutes,
  buildResourceMap,
  buildGroupedRoutes,
  resolveItemPrimaryKeyType,
  resolveRouteResponseType,
  resolveRouteFormType,
  resolveGroupErrorType,
  collectImportedTypes,
  getStandardMutationKeys,
  partitionGroupSubRoutes,
  buildCrudGroupDescriptor,
  buildCustomOrSingletonGroupDescriptor,
  toTypeName
};

export type {
  ClassifiedRoute,
  ScannedClassifiedRouteParams,
  ResourceCrudMap,
  ResolvedTypeInfo,
  ResourceGroupDescriptor,
  CrudResourceGroupDescriptor,
  FullCrudResourceGroupDescriptor,
  ReadOnlyCrudResourceGroupDescriptor,
  FlexibleCrudResourceGroupDescriptor,
  SingletonResourceGroupDescriptor,
  CustomResourceGroupDescriptor,
  BaseResourceGroupTypeSignature,
  FullCrudTypeSignature,
  ReadOnlyCrudTypeSignature,
  FlexibleCrudTypeSignature,
  SingletonTypeSignature,
  CustomTypeSignature,
  ResourceGroupTypeSignature,
  ResourceGroupVisitor,
  ExhaustiveFineGrainedResourceGroupVisitor,
  UnifiedCrudResourceGroupVisitor,
  ClassifiedDomainGraph,
  MutationCapability
};
