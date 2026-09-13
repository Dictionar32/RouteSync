/**
 * groupDescriptorBuilder.ts
 *
 * Builders for CRUD, Singleton, and Custom ResourceGroupDescriptors.
 * Active Consumer delegating to sub-domain builders.
 *
 * @module cli/generators/classifier
 */

import type { ResourceGroupDescriptor, ParsedModel } from '@routesync/core';
import type { ClassifiedRoute, ResourceCrudMap } from './classifierTypes';
import {
  partitionGroupSubRoutes,
  buildCrudGroupDescriptor,
  buildCustomOrSingletonGroupDescriptor,
  type ErrorResolutionResult
} from './builders';

export {
  partitionGroupSubRoutes,
  buildCrudGroupDescriptor,
  buildCustomOrSingletonGroupDescriptor,
  type ErrorResolutionResult
};
