/**
 * ManifestContractValidator.ts
 *
 * Origin-boundary invariant checks. A manifest is emitted only when its
 * semantic route contract is complete enough for pure downstream lowering.
 */

import type { ModelAst, ResourceAst, RouteManifest } from '@routesync/core'

function requireValue(value: unknown, label: string): void {
  if (value === undefined || value === null) {
    throw new Error(`Manifest invariant failed: ${label} is missing`)
  }
}

function validateResponse(route: RouteManifest['routes'][number], models: readonly ModelAst[], resources: readonly ResourceAst[]): void {
  const response = route.binding.response
  requireValue(response, `${route.identity.coordinates.name.value.value}.response`)

  if (response.kind === 'model') {
    const exists = models.some(model => model.definition.name === response.modelName)
    if (!exists) throw new Error(`Manifest invariant failed: ${route.identity.coordinates.name.value.value} references unknown model ${response.modelName}`)
  }

  if (response.kind === 'resource') {
    const exists = resources.some(resource => resource.definition.name === response.resourceName)
    if (!exists) throw new Error(`Manifest invariant failed: ${route.identity.coordinates.name.value.value} references unknown resource ${response.resourceName}`)
  }

  if (response.kind === 'inline') {
    requireValue(response.origin, `${route.identity.coordinates.name.value.value}.response.origin`)
    requireValue(response.semanticContract, `${route.identity.coordinates.name.value.value}.response.semanticContract`)
  }
}

export function validateManifestContract(manifest: RouteManifest): void {
  if (manifest.routes.length !== manifest.contracts.length) {
    throw new Error('Manifest invariant failed: routes/contracts cardinality mismatch')
  }

  manifest.routes.forEach(route => {
    requireValue(route.identity, `${route.identity.coordinates.name.value.value}.identity`)
    requireValue(route.binding, `${route.identity.coordinates.name.value.value}.binding`)
    requireValue(route.capability, `${route.identity.coordinates.name.value.value}.capability`)
    requireValue(route.provenance, `${route.identity.coordinates.name.value.value}.provenance`)
    requireValue(route.identity.parameters, `${route.identity.coordinates.name.value.value}.identity.parameters`)
    requireValue(route.binding.operation.handler, `${route.identity.coordinates.name.value.value}.binding.handler`)
    requireValue(route.binding.response, `${route.identity.coordinates.name.value.value}.binding.response`)
    requireValue(route.capability.security, `${route.identity.coordinates.name.value.value}.capability.security`)
    requireValue(route.capability.executionSignature, `${route.identity.coordinates.name.value.value}.capability.executionSignature`)
    requireValue(route.capability.errorResponses, `${route.identity.coordinates.name.value.value}.capability.errorResponses`)
    validateResponse(route, manifest.models, manifest.resources)
  })
}
