# Phase 603 — Response Descriptor Algebra

RouteSync is treated as a domain-specific compiler: Laravel route/source evidence is lowered into canonical Route Contract IR and projected to Next.js.

## Frontier

This phase removes constructor authority from the response-descriptor algebra used by the scanner/controller response boundary.

`ResourceResponseDescriptor`, `ModelResponseDescriptor`, `InlineResponseDescriptor`, and `VoidResponseDescriptor` are now structural semantic witnesses plus frozen factory catalogs. Construction is relation/record creation rather than class instantiation.

`responseDescriptors.ts` also removes the remaining imperative `switch`/array `.map` from this frontier. Semantic-type projection uses the existing catamorphic `SemanticType.accept` algebra; response dispatch uses an exhaustive handler relation.

Controller scanner consumers were migrated from `new Descriptor(...)` to the descriptor witness factories.

## Design correspondence

- Soufflé/Datalog: descriptor variants are facts/relations rather than mutable object identity.
- MLIR PDLL/PDL: match/construct boundaries are explicit and the constructed value is an IR witness.
- WebAssembly: semantic typing is expressed as a declarative judgement over abstract syntax rather than an algorithm encoded in the type object.
- egglog: variant construction can become a rewrite/equality-saturation input instead of constructor ownership.

## Vacuum

The active production tree had no zero-byte TypeScript files at the beginning of this phase, so no active source file was deleted merely to satisfy a file-count target. Existing archive/dead-file cleanup from earlier phases remains intact.

## Validation

- 1,017 production TypeScript files scanned.
- 0 zero-byte production TypeScript files.
- All five modified frontier files transpile with TypeScript `transpileModule` with 0 diagnostics.
- The full repository typecheck remains environment-blocked by missing `@types/node` / `vitest/globals` in the workspace; this phase does not claim a clean full `tsc`.

The AST audit is intentionally scoped: source-language words such as `new` and `null` inside Laravel/PHP vocabulary are not treated as host-language constructor/null authority unless represented by the corresponding TypeScript AST node.
