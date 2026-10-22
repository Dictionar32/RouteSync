# Phase 2190 — Interface-first DTO response-contract implementation

## Trace finding

Phases 2183–2189 defined the DTO response-contract projection and response-value projection contracts, preserved PHP type vocabulary, and integrated per-property class-reference binding. The projection contracts were still interfaces only: no authority was mapping `TypeExpression` into `ResponseValueContract`, no authority was building `ResponseContractField`, and integrated response did not retain the resulting projection judgment.

## Implemented against the existing interfaces

- Implemented `laravelDtoResponseValueProjectionAuthority` against `LaravelDtoResponseValueProjectionInterface`.
- Implemented `laravelDtoResponseContractProjectionAuthority` against `LaravelDtoResponseContractProjectionInterface`.
- Added transparent runtime executors for both authorities; each executes the exact bound interface method.
- Value projection preserves `string`, `integer`, `decimal`, and `boolean`; maps typed arrays to collections only when the element is projectable; retains nullable as a union with the domain null value; and rejects ambiguous number, JSON, date/time, file, unspecified, mixed, optional, intersection, generic, object, and unsupported expressions rather than guessing.
- Class references require the existing property-level binding judgment and use the resolved declaration's canonical qualified class identity. A short class name is never promoted into `named_type`.
- Contract projection derives the response type name from the resolved declaration identity, uses the existing `ResponseContractField` as the field SSOT, preserves per-field source provenance, and blocks the whole contract when any field or response-shape evidence is unresolved.
- The existing `LaravelControllerResponseSemanticPipelineInterface` now invokes the projection authority after declaration resolution and property reference binding, retains each projection judgment as response evidence, and blocks integrated response completion when projection is unresolved.
- Existing invocation semantic judgment, response semantic authority, source identity authority, and runtime executor ownership remain intact. No parallel integrated-response authority, relation/foundation layer, or subscanner was added.

## Deliberate limits

- A resolved projection judgment is currently retained as integrated-response evidence; this phase does not replace the existing method-return product with a single `object_response` product because a controller can contain multiple methods and response DTOs. The legacy descriptor/response-attribute descriptor path is not deleted.
- Nested class references inside composite type expressions require per-reference binding evidence that the current DTO property evidence does not yet encode. Such shapes remain unresolved instead of reusing one binding for unrelated nested references.
- A DTO property whose presence is optional or unspecified blocks the contract because the current `ResponseContractField` does not model field omission separately from nullability.

## Verification

Regression tests were added for scalar mapping, numeric identity, collection/nullable mapping, unresolved unions, missing class binding, canonical DTO contract projection, unsupported field types, unavailable response-shape evidence, and integrated pipeline ownership. The test suite was not executed because the archive has no installed project dependencies. The global `tsc --noEmit` command is not a valid project typecheck in this environment: its compiler does not support the repository's `es2025` target and Node/Vitest type definitions are absent. A fallback strict diagnostic pass with an `es2024` target reported repository-wide existing diagnostics in unrelated files; it reported no diagnostics in the changed implementation files, but therefore cannot be called a clean project typecheck. Syntax transpilation passed for every changed TypeScript implementation, export, and test file. Vitest was not executed because dependencies are absent. No `npm run build` was run.
