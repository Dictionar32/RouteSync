/**
 * modelGraphBuilder.ts
 *
 * Populates and loads the ServiceGraph for Eloquent models into the SemanticResolutionKernel.
 *
 * @module cli/generators/normalizer
 */

import {
  type RouteManifest,
  type SemanticResolutionKernel,
  ServiceGraphBuilder,
  DATABASE_COLUMN_KIND_REGISTRY,
  ModelFieldMap,
  ModelRelationMap,
  ModelAccessorMap,
  ModelCastCollection
} from '@routesync/core'

export function buildModelGraph(manifest: RouteManifest, kernel: SemanticResolutionKernel): void {
  const graphBuilder = new ServiceGraphBuilder()
  if (manifest.models) {
    manifest.models.forEach(m => {
      const modelNode = graphBuilder.buildModelNode(m.name)
      const fields: Record<string, { type: string; nullable: boolean }> = {}
      m.columns.forEach(col => {
        let type = 'string'
        if (col.columnKind && DATABASE_COLUMN_KIND_REGISTRY[col.columnKind]) {
          type = DATABASE_COLUMN_KIND_REGISTRY[col.columnKind].tsType
        } else {
          const lower = col.type.toLowerCase()
          if (lower.includes('int') || lower.includes('float') || lower.includes('double') || lower.includes('decimal')) type = 'number'
          else if (lower.includes('bool') || lower.includes('tinyint(1)')) type = 'boolean'
        }
        fields[col.name] = { type, nullable: !!col.nullable }
      })
      modelNode.fields = ModelFieldMap.fromRecord(fields)
      if (m.relations) {
        modelNode.relations = ModelRelationMap.fromRecord(m.relations)
      }
      if (m.accessors) {
        modelNode.accessors = ModelAccessorMap.fromRecord(m.accessors)
      }
      if (m.casts) {
        modelNode.casts = ModelCastCollection.fromRecord(m.casts)
      }
      graphBuilder.registerModel(m.name, modelNode)
    })
  }
  kernel.loadGraph(graphBuilder.getGraph())
}
