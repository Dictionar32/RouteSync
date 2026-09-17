/**
 * ManifestContractValidator.ts
 *
 * Origin-boundary invariant checks. A manifest is emitted only when its
 * semantic route contract is complete enough for pure downstream lowering.
 */

import type { ParsedModel, ParsedResource, RouteManifest } from '@routesync/core'

function requireValue(value: unknown, label: string): void {
  if (value === undefined || value === null) {
    throw new Error(`Manifest invariant failed: ${label} is missing`)
  }
}

function validateResponse(route: RouteManifest['routes'][number], models: readonly ParsedModel[], resources: readonly ParsedResource[]): void {
  const response = route.response
  requireValue(response, `${route.name}.response`)

  if (response.kind === 'model') {
    const exists = models.some(model => model.name === response.modelName)
    if (!exists) throw new Error(`Manifest invariant failed: ${route.name} references unknown model ${response.modelName}`)
  }

  if (response.kind === 'resource') {
    const exists = resources.some(resource => resource.name === response.resourceName)
    if (!exists) throw new Error(`Manifest invariant failed: ${route.name} references unknown resource ${response.resourceName}`)
  }

  if (response.kind === 'inline') {
    requireValue(response.origin, `${route.name}.response.origin`)
    requireValue(response.semanticContract, `${route.name}.response.semanticContract`)
  }
}

export function validateManifestContract(manifest: RouteManifest): void {
  if (manifest.routes.length !== manifest.contracts.length) {
    throw new Error('Manifest invariant failed: routes/contracts cardinality mismatch')
  }

  manifest.routes.forEach(route => {
    requireValue(route.identity, `${route.name}.identity`)
    requireValue(route.binding, `${route.name}.binding`)
    requireValue(route.capability, `${route.name}.capability`)
    requireValue(route.provenance, `${route.name}.provenance`)
    requireValue(route.identity.parameters, `${route.name}.identity.parameters`)
    requireValue(route.binding.handler, `${route.name}.binding.handler`)
    requireValue(route.binding.response, `${route.name}.binding.response`)
    requireValue(route.capability.security, `${route.name}.capability.security`)
    requireValue(route.capability.executionSignature, `${route.name}.capability.executionSignature`)
    requireValue(route.capability.errorResponses, `${route.name}.capability.errorResponses`)
    validateResponse(route, manifest.models, manifest.resources)
  })
}
