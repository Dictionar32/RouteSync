# Phase 2714 — Fully Typed Runtime Scanner Operations / PHP Frontend Ownership

## Result

Moved the PHP lexer/tokenizer/AST implementation directory out of `packages/core/src/compiler/scanner/lexer` into `packages/core/src/compiler/frontend/php`.

- 210 files moved, including parser/AST source, tests, and accompanying audit/contract material.
- Rebased import/export specifiers that resolve to the moved modules.
- Updated repository path literals and script references so source/audit paths point to `compiler/frontend/php`.
- Corrected 13 legacy relative imports that pointed at nonexistent `scanner/*/lexer` paths but intended to consume the PHP lexer/AST modules.
- Converted the runtime route declaration parser from exported `parseRouteDeclarations(tokens)` to the typed object `routeDeclarationParser: RouteDeclarationParserInterface = Object.freeze({ parse })`; updated the scanner wiring facade and all direct consumers to `.parse(tokens)`.
- Added `npm run audit:phase2714-scanner-lexer-ownership`.
- Audit reports: old scanner lexer directory absent, frontend owner present, no legacy `compiler/scanner/lexer`/`scanner/lexer` references in runtime source, and CLI trace source files present.

## Upstream CLI manifest runtime trace

1. `packages/cli/src/commands/scan.ts` / `commands/sync.ts` obtain the supplied `composition.manifestScanOperation` and call `.scan(...)` with a typed `controller_invocation_manifest_composition_input`.
2. `packages/cli/src/manifestScanOperationInterface.ts` declares `RouteSyncCliManifestScanOperationInterface` and `RouteSyncCliManifestScanOperationFactoryInterface`; the exported factory is an interface-typed immutable object.
3. `packages/cli/src/upstreamCompositionFactory.ts` assembles the request-type semantic pipeline and wires the manifest authority into the CLI composition.
4. `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` composes source-project identity canonicalization, source discovery, source-document reading/identity binding, source invocation pipeline delivery, invocation semantic judgments, inventory closure, and manifest-builder preparation.
5. `manifestBuilderOperationPreparation.prepare(...)` builds the upstream manifest judgment. Blocked/rejected ADT variants are handled explicitly at the CLI boundary; they must not be converted into a successful manifest.
6. Only a completed upstream manifest proceeds to manifest-flow projection and request/resource semantic preflight/projection.

## Ownership decision

`compiler/scanner/lexer` was not a valid owner for PHP lexical and syntax implementations. The canonical ownership path is now `compiler/frontend/php`. This avoids adding another parser wrapper and consolidates imports onto the moved implementation.

The migration is deliberately not described as a complete scanner-only-wiring cutover. These implementation folders still remain under `compiler/scanner` and require ownership migrations in subsequent slices:

- `binders`
- `descriptors`
- `operations`
- `orchestrator`
- `resolvers`
- `semantic`
- `subscanners`
- `symbols`
- `upstream`

`wiring` should remain only for composition and dependency assembly. `__test__` and `audit` are non-runtime support folders.

## Typed runtime operation pattern

For runtime operations, preserve the actual domain result/ADT and put the operation behind a named interface:

```ts
export interface PhpMethodParserInterface {
  readonly parse: (
    source: string,
    tokens: readonly TokenDescriptor[],
    functionIndex: number,
  ) => RelationOption<PhpMethodAst>;
}

export const phpMethodParser: PhpMethodParserInterface = Object.freeze({
  parse: parsePhpMethodImplementation,
});
```

The route declaration parser is now implemented as this object pattern. This is a target for runtime operation boundaries, not a mandate to mechanically turn every private helper into an object. Private/local helpers may remain functions; public runtime entrypoints and cross-module authorities should be interface-typed objects, with consumers migrated to the operation property. Keep the result type closed and preserve rejection/blocked cases.

## Validation

Static audit command:

```sh
npm run audit:phase2714-scanner-lexer-ownership
```

Observed static checks: passed (6/6). The import scan over `compiler/frontend/php` found 870 relative import specifiers and zero unresolved relative imports.

Typecheck, unit tests, and CLI end-to-end tests were not run: the extracted workspace does not have the required `node_modules` toolchain installed. No claim is made that the build or runtime test suite passes.
