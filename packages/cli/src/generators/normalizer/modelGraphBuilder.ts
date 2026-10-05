/**
 * modelGraphBuilder.ts
 *
 * Projects the canonical upstream model semantic definitions into the
 * normalizer resolution graph. No model fields, casts, or relations are
 * reconstructed from RouteManifest compatibility bags here.
 */

import {
  type RouteManifest,
  type SemanticResolutionKernel,
  ServiceGraphBuilder,
} from '@routesync/core'

export function buildModelGraph(manifest: RouteManifest, kernel: SemanticResolutionKernel): void {
  const graphBuilder = new ServiceGraphBuilder()
  for (const model of manifest.models) {
    const semantic = model.definition.semantic
    const modelNode = graphBuilder.buildModelNode(semantic)
    graphBuilder.registerModel(semantic.identity.name.value.value, modelNode)
  }
  kernel.loadGraph(graphBuilder.getGraph())
}
