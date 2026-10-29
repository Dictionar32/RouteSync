import type { RouteManifest } from '@routesync/core'

export interface ManifestCodeGenerationInput {
  readonly manifest: RouteManifest
  readonly outputDir: string
  readonly options: Readonly<Record<string, unknown>>
}

export interface ManifestCodeGenerationBlockedOutcome {
  readonly kind: 'manifest_code_generation_blocked'
  readonly reason: string
  readonly requireCompleteGeneration: () => never
}

export interface ManifestCodeGenerationOperationInterface {
  readonly emit: (input: ManifestCodeGenerationInput) => ManifestCodeGenerationBlockedOutcome
}

export class ManifestCodeGenerationBlockedError extends Error {
  readonly kind = 'manifest_code_generation_blocked_error' as const

  constructor(readonly outcome: ManifestCodeGenerationBlockedOutcome) {
    super(outcome.reason)
    this.name = 'ManifestCodeGenerationBlockedError'
  }
}

export const manifestCodeGenerationOperation: ManifestCodeGenerationOperationInterface = Object.freeze({
  emit: (input: ManifestCodeGenerationInput): ManifestCodeGenerationBlockedOutcome => {
    const reason = [
      'RouteManifest -> ContractIR -> IREmitter is not composed in the active CLI runtime.',
      `Generation requested for ${input.outputDir}.`,
      'The retired CompilerBridge lowerers must not be reintroduced as a downstream semantic authority.',
    ].join(' ')
    const outcome: ManifestCodeGenerationBlockedOutcome = Object.freeze({
      kind: 'manifest_code_generation_blocked',
      reason,
      requireCompleteGeneration: (): never => {
        throw new ManifestCodeGenerationBlockedError(outcome)
      },
    })
    return outcome
  },
})
