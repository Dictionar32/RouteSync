/** Closed syntax-classification request/response ADTs and their single port. */

export interface AstClassifierExpressionRequest<TToken> {
  readonly kind: 'expression';
  readonly tokens: readonly TToken[];
}

export interface AstClassifierBlockRequest<TToken> {
  readonly kind: 'block';
  readonly tokens: readonly TToken[];
}

/** Closed request ADT: the syntax classifier accepts typed token evidence only. */
export type AstClassifierEvidenceRequest<TToken> =
  | AstClassifierExpressionRequest<TToken>
  | AstClassifierBlockRequest<TToken>;

export interface AstClassifierExpressionResult<TValue> {
  readonly kind: 'expression';
  readonly value: TValue;
}

export interface AstClassifierBlockResult<TBlock> {
  readonly kind: 'block';
  readonly value: TBlock;
}

/** Closed response ADT; semantic judgment remains owned by the existing semantic producer. */
export type AstClassifierEvidenceResult<TValue, TBlock> =
  | AstClassifierExpressionResult<TValue>
  | AstClassifierBlockResult<TBlock>;

/**
 * One syntax-classification port. Request and response variants are closed ADTs;
 * the implementation dispatches syntax requests but does not produce semantic judgments.
 * Semantic evidence remains with AstSemanticEvidenceProducerInterface/AstSemanticInterface.
 */
export interface AstClassifierEvidenceInterface<TToken, TValue, TBlock> {
  /** The result variant is correlated to the request variant at the call site. */
  readonly classify: {
    (request: AstClassifierExpressionRequest<TToken>): AstClassifierExpressionResult<TValue>;
    (request: AstClassifierBlockRequest<TToken>): AstClassifierBlockResult<TBlock>;
  };
}
