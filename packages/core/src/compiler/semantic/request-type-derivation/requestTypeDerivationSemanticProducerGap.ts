/**
 * Explicit boundary for RequestType semantic stages that are not yet complete.
 * A gap is an error, never a fabricated judgment or successful verification.
 */
export class RequestTypeDerivationSemanticProducerGapError extends Error {
  readonly code = 'REQUEST_TYPE_SEMANTIC_PRODUCER_GAP' as const;
  override readonly name = 'RequestTypeDerivationSemanticProducerGapError';

  constructor(
    readonly stage: 'reasoning' | 'verification' | 'decision' | 'authority' | 'integrity',
    readonly capability: string,
  ) {
    super(`RequestType ${stage} capability is incomplete: ${capability}. No semantic judgment or verification success was fabricated.`);
  }
}
