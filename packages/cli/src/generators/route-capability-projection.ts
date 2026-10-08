/**
 * route-capability-projection.ts
 *
 * Downstream projection boundary: consumes upstream-resolved route capability and
 * projects it into deterministic generator/grouping views. It does not derive
 * semantic CRUD meaning.
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
  projectRoutes,
  buildResourceMap,
  buildGroupedRoutes,
  routeCapabilityProjection
} from './classifier/routeGrouper';

import type { RouteCapabilityProjectionInterface } from './classifier/routeCapabilityProjectionInterface';

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
 * Project a RouteManifest into a ClassifiedDomainGraph view.
 * Semantic capability meaning is already resolved upstream; this is naming
 * compatibility for existing generator contracts, not semantic classification.
 */
export function projectDomainGraph(manifest: RouteManifest): ClassifiedDomainGraph<ClassifiedRoute> {
  return buildClassifiedDomainGraph(manifest);
}

/** @deprecated Compatibility alias; production consumers must use projectDomainGraph. */
export const classifyDomainGraph = projectDomainGraph;

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
  projectRoutes,
  buildResourceMap,
  buildGroupedRoutes,
  routeCapabilityProjection,
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

export type { RouteCapabilityProjectionInterface } from './classifier/routeCapabilityProjectionInterface';
