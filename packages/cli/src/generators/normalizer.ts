/**
 * normalizer.ts
 *
 * Active Consumer & Orchestrator: Manifest Normalization Pipeline.
 * Coordinates entity normalizers, model graphs, and compiler pipeline passes with zero wildcard re-exports.
 *
 * @module cli/generators
 */

import type {
  RouteManifest,
  SemanticResolutionKernel
} from '@routesync/core'
import { CompilerContext, CompilerPipeline } from './pipeline'
import {
  ModelGraphBuilderPass,
  SemanticResolutionPass,
  NormalizationPass,
  ValidationPass
} from './passes'

// Sub-domain imports
import type {
  SourceLocation,
  NormalizedField,
  PrimitiveField,
  ObjectField,
  ModelField,
  ResourceField,
  NormalizedResource,
  NormalizedAccessor,
  NormalizedModel,
  NormalizedRoute,
  NormalizedManifest,
  SemanticNode,
  RuntimeAugmented,
  ResolutionContext
} from './normalizer/normalizerTypes'

import {
  getSemanticNode,
  unwrapManifestNode,
  inferTypeFromName
} from './normalizer/semanticNodeHelpers'

import {
  normalizeAccessor,
  mapToNormalizedField
} from './normalizer/fieldNormalizer'

import {
  normalizeResources,
  normalizeModels,
  normalizeRoutes
} from './normalizer/entityNormalizers'

import { buildModelGraph } from './normalizer/modelGraphBuilder'

// ─── Active Consumer Orchestrator: Pure Flow ──────────────────────────────────

/**
 * Stateless normalizer pipeline using sequential compiler passes.
 */
export function normalizeManifest(manifest: RouteManifest, kernel: SemanticResolutionKernel): NormalizedManifest {
  const context = new CompilerContext()
  const pipeline = new CompilerPipeline()

  pipeline.addPass(new ModelGraphBuilderPass(kernel))
  pipeline.addPass(new SemanticResolutionPass())
  pipeline.addPass(new NormalizationPass(kernel))
  pipeline.addPass(new ValidationPass())

  const result = pipeline.compile(manifest, context)

  if (context.hasErrors()) {
    const errorMsg = context.diagnostics
      .filter(d => d.severity === 'error')
      .map(d => `[Error] ${d.message}`)
      .join('\n')
    throw new Error(`Compiler execution halted due to validation errors:\n${errorMsg}`)
  }

  return result
}

// ─── Explicit Named Exports (Rule 14: Zero Wildcard Re-export) ────────────────

export {
  // Helpers
  getSemanticNode,
  unwrapManifestNode,
  inferTypeFromName,
  // Field Normalizers
  normalizeAccessor,
  mapToNormalizedField,
  // Entity Normalizers
  normalizeResources,
  normalizeModels,
  normalizeRoutes,
  // Model Graph Builder
  buildModelGraph
}

export type {
  SourceLocation,
  NormalizedField,
  PrimitiveField,
  ObjectField,
  ModelField,
  ResourceField,
  NormalizedResource,
  NormalizedAccessor,
  NormalizedModel,
  NormalizedRoute,
  NormalizedManifest,
  SemanticNode,
  RuntimeAugmented,
  ResolutionContext
}
