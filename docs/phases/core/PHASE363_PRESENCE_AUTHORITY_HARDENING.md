# Phase 363 — Presence Authority Hardening

The semantic presence ADT is now the canonical absence model.

## Authority

`types/upstream/presence.ts` represents absence with the tagged `absent` relation and presence with the tagged `present` relation. It does not expose host `undefined` or host `null` as semantic absence.

Optional parser boundaries are converted exactly once into `Presence<T>`; semantic layers consume the ADT thereafter.

## Architectural rule

- absence -> `Presence<T>`
- PHP `null` -> tagged semantic literal / `SemanticNullAtom`
- equality -> relation equality
- selection/projection/folding -> relational operators
- semantic decisions -> solver/rewrite/fixed-point closure

## Next cutover

`syntaxRelationProgram.ts` remains a typed relation executor but still contains compatibility casts. Its next migration should introduce typed witness/decode relations so heterogeneous child programs do not require host-language casts.
