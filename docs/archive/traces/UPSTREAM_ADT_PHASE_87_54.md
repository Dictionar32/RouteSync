# RouteSync Phase 87.54 — Semantic State Closure

## Goal
Close semantic state encoding so cardinality and nullability are ADTs rather than boolean flags. Remove the legacy `ModelDef` vocabulary from active public domain exports.

## Dataflow
Laravel AST -> Parsed/Verified ADT -> SemanticResolution -> BoundSemanticNode -> RouteSync IR -> Lowerer -> Emitter

## Changes
- `SemanticResolution` now uses `ResolutionCardinality`:
  - `single`
  - `collection`
  - `paginated_collection`
- Scalar/query projection nullability now uses `BoundNullability` instead of `nullable: boolean`.
- Semantic resolution factory follows the closed ADT contract.
- Eloquent pagination is converted once at the resolver boundary. `BoundCardinality` remains a two-state expression cardinality, while `ResolutionCardinality` preserves response-level pagination meaning.
- `ModelColumnResolver` consumes `ParsedColumn.semanticType` and `ParsedColumn.nullability` instead of re-inferring semantic meaning from primitive flags.
- Legacy `ModelDef` / `ModelDefDescriptor` was removed from active domain exports so it cannot become a third rich model representation. The old source file remains quarantined for compatibility inspection, not as the active semantic path.

## Important boundary rule
`string`, `boolean`, `undefined`, and `null` are not globally forbidden. They remain valid at syntax, lookup, runtime, and emitter boundaries. They must not encode semantic state downstream.

## ecommerce-shop trace
For the known `register.post` flow, the response identity remains established upstream from the Laravel response declaration (`RegisterResponse`). Runtime `data = null` is a payload value and must not replace the declared response contract.

Target:

Laravel AST
  -> ResponseDescriptor/RegisterResponse
  -> ResponseContract
  -> Semantic ADT
  -> IR
  -> ContractLowerer
  -> generated api contract

No downstream model fallback or response re-classification is introduced.

## Validation
Focused TypeScript compilation of the changed semantic-resolution/resolver files produces no diagnostics from those changed files. The repository still contains unrelated baseline type errors, especially in legacy response-shape/domain modules; this phase does not claim a full repository type-clean state.
