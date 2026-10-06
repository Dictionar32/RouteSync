import type { ServiceGraph, ServiceModelNode } from '../types/semantic';
import type { GraphModelNodeSurface } from '../types/semantic/modelGraphTypes';

/**
 * Downstream graph assembly surface for producers that incrementally register
 * structural model nodes. This is deliberately separate from the manifest
 * projection boundary: it does not expose the concrete graph implementation.
 */
export interface ServiceGraphAssemblyInterface {
  readonly buildModelNode: (model: GraphModelNodeSurface) => ServiceModelNode;
  readonly registerModel: (name: string, model: ServiceModelNode) => void;
  readonly getGraph: () => ServiceGraph;
}
