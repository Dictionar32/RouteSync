# Phase 2185 — DTO Response Value Projection Interface

## Trace finding

Phase 2184 established a canonical `ResponseContractField`, but the next boundary was still unspecified: the existing `TypeExpression` algebra does not preserve enough information to safely map every PHP type into `ResponseValueContract`.

In particular, `phpTypeAtomAlgebra` currently maps both PHP `int` and `float` to the same `TypeExpression` primitive `number`. Mapping that primitive to either `whole_number` or `decimal_number` would invent meaning. The current atom vocabulary also maps `array` to `json`, which does not prove whether a DTO property is a list, keyed map, or structured object. A class `reference` is not itself a canonical response type identity.

## Interface-first change

Added `laravelDtoResponseValueProjectionInterface.ts` with:

- typed input retaining `TypeExpression` and `SourceSpan`;
- a closed resolved/unresolved judgment over `ResponseValueContract`;
- an explicit versioned mapping contract;
- a runtime executor interface that delegates to the bound projection interface only.

No implementation or pipeline wiring was added in this phase. That is intentional: the interface exposes semantic gaps instead of hiding them in runtime classification.

## Mapping obligations

- `string` may map to `scalar/textual`.
- `boolean` may map to `scalar/boolean_flag`.
- the collapsed `number` primitive remains unresolved until the upstream vocabulary preserves `int` versus `float` meaning.
- class references require a canonical declaration binding before becoming `named_type`.
- arrays require a resolved element projection before becoming `collection`.
- unions are closed only when every member is resolved.
- nullable expressions must preserve the null member rather than erase it.
- intersections, callables, optional presence semantics, error expressions, and generic declarations remain explicitly unresolved until the response domain has faithful representations/evidence.
- unsupported types are never guessed as JSON.

## Architectural boundaries

No `relation` or `foundation` layer, subscanner, duplicate integrated-response authority, or duplicate invocation authority was introduced. Existing `PhpTypeExpressionInterface` remains the source type-expression contract. The next phase may implement the mapping authority only after the missing type vocabulary/class-binding semantics are addressed without losing provenance.

## Verification limits

The phase regression test and static source checks are present. TypeScript typecheck, Vitest, and build have not been run in this environment.


## Phase 2186 follow-up: preserve numeric source identity

The Phase 2185 trace exposed a loss of source semantics: `int` and `float` were both represented as `{ kind: 'primitive', value: { kind: 'number' } }`. Phase 2186 evolves the existing `PrimitiveVocabulary` with `integer` and `decimal` variants. The PHP type atom authority, response DTO declaration parser, and attribute producer now retain that distinction. Generic semantic-type lowering can still map both to the target-neutral numeric primitive, while the existing DTO reader maps `integer` to `whole_number` and `decimal` to `decimal_number`. The legacy `number` variant remains unresolved for response-value projection because its source meaning is ambiguous.

No new authority, relation/foundation layer, or subscanner is introduced. Runtime projection remains unimplemented until the interface and the remaining TypeExpression cases are closed.
