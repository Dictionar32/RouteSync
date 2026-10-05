/**
 * modelGraphTypes.ts
 *
 * Service-graph model node descriptors, Eloquent cast collections, and dependencies.
 *
 * @module core/types/semantic
 */

import type { ModelSemanticDefinition } from '../upstream/model';
import type { ModelColumnFact } from '../upstream/modelSourceFacts';
import type { ClassReference, ControllerReference, ModelReference, ResourceReference, ServiceReference } from '../upstream/semanticReferences';

export type ExecutionLayer =
  | "controller"
  | "service"
  | "model"
  | "repository";

export type ServiceGraphNodeReference = ClassReference | ControllerReference | ModelReference | ResourceReference | ServiceReference;

/** Materialized graph edge retained as the public graph projection. */
export interface ServiceDependency {
  readonly from: ServiceGraphNodeReference;
  readonly to: ServiceGraphNodeReference;
  readonly type: "calls" | "composes" | "depends_on_class" | "depends_on_model" | "depends_on_service" | "uses_repository";
  readonly weight: number;
}



export interface ServiceModelNode {
  readonly kind: "model_node";
  readonly model: ModelSemanticDefinition;
  readonly layer: "model";
}

