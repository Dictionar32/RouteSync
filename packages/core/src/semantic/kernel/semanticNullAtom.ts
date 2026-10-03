/**
 * Semantic PHP null is data, never a host-language absence sentinel.
 * The atom is intentionally tagged so Presence remains responsible only for
 * relation absence.
 */
export interface SemanticNullAtom {
  readonly kind: 'null';
  readonly semantic: 'php-null';
}

export const semanticNullAtom = (): SemanticNullAtom => Object.freeze({
  kind: 'null',
  semantic: 'php-null',
});
