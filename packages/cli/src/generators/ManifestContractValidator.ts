/**
 * ManifestContractValidator.ts
 *
 * Origin-boundary invariant checks. A manifest is emitted only when its
 * semantic route contract is complete enough for pure downstream lowering.
 */

import type { ModelAst, ResourceAst, RouteManifest } from '@routesync/core'

const requireValue: (value: unknown, label: string) => void = (value: unknown, label: string): void => {
  if (value === undefined || value === null) {
    throw new Error(`Manifest invariant failed: ${label} is missing`)
  }
};

const validateResponse: (route: RouteManifest['routes'][number], models: readonly ModelAst[], resources: readonly ResourceAst[]) => void = (route: RouteManifest['routes'][number], models: readonly ModelAst[], resources: readonly ResourceAst[]): void => {
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
};

export interface ManifestContractViolation {
  readonly kind: 'manifest_contract_invariant_violated';
  readonly message: string;
}

export interface ManifestContractValidatedJudgment {
  readonly kind: 'manifest_contract_validated';
  readonly manifest: RouteManifest;
  readonly requireValidManifest: () => RouteManifest;
}

export interface ManifestContractRejectedJudgment {
  readonly kind: 'manifest_contract_rejected';
  readonly violations: readonly ManifestContractViolation[];
  readonly requireValidManifest: () => never;
}

export class ManifestContractValidationBlockedError extends Error {
  readonly kind = 'manifest_contract_validation_blocked_error' as const;

  constructor(readonly judgment: ManifestContractRejectedJudgment) {
    super('Manifest contract validation was rejected.');
    this.name = 'ManifestContractValidationBlockedError';
  }
}

/** Closed validation ADT: each terminal owns a typed domain continuation. */
export type ManifestContractValidationJudgment =
  | ManifestContractValidatedJudgment
  | ManifestContractRejectedJudgment;

export interface ManifestContractValidationOperationsInterface {
  readonly validate: (manifest: RouteManifest) => ManifestContractValidationJudgment;
}

const validatedJudgment = (manifest: RouteManifest): ManifestContractValidatedJudgment => {
  const judgment: ManifestContractValidatedJudgment = Object.freeze({
    kind: 'manifest_contract_validated',
    manifest,
    requireValidManifest: (): RouteManifest => judgment.manifest,
  });
  return judgment;
};

const rejectedJudgment = (violations: readonly ManifestContractViolation[]): ManifestContractRejectedJudgment => {
  const judgment: ManifestContractRejectedJudgment = Object.freeze({
    kind: 'manifest_contract_rejected',
    violations,
    requireValidManifest: (): never => {
      throw new ManifestContractValidationBlockedError(judgment);
    },
  });
  return judgment;
};

const validateManifestContractRuntime = (manifest: RouteManifest): ManifestContractValidationJudgment => {
  try {
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
    return validatedJudgment(manifest);
  } catch (error: unknown) {
    return rejectedJudgment(Object.freeze([{
      kind: 'manifest_contract_invariant_violated',
      message: error instanceof Error ? error.message : String(error),
    }]));
  }
};

export const manifestContractValidationOperations: ManifestContractValidationOperationsInterface = Object.freeze({
  validate: validateManifestContractRuntime,
});
