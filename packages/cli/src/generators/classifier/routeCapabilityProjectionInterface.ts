/**
 * Downstream route-capability wiring contract.
 *
 * RouteSemanticFlow is already a closed upstream semantic projection. This
 * interface declares only the upstream -> downstream materialization; it does
 * not derive CRUD meaning from syntax.
 */
import type { RouteSemanticFlow, UpstreamWiringInterface } from '@routesync/core';
import type { ClassifiedRoute } from './classifiedRouteDescriptor';

export interface RouteCapabilityProjectionAlgebraInterface
  extends UpstreamWiringInterface<RouteSemanticFlow, ClassifiedRoute> {}

export interface RouteCapabilityProjectionContract
  extends RouteCapabilityProjectionAlgebraInterface {}

export interface RouteCapabilityProjectionInterface
  extends RouteCapabilityProjectionContract {}
