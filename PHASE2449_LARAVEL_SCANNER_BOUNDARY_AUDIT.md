# RouteSync — Laravel Scanner Boundary Audit (Phase 2449)

## Purpose

This phase adds a reproducible guard audit for the active Laravel route scanner boundary. It intentionally does not claim that the remaining relation/foundation dependencies have been removed. A failing audit is useful evidence: it blocks unsafe deletion and identifies the imports that need true upstream ownership.

## Run

```sh
node scripts/audits/audit-phase2449-laravel-scanner-legacy-boundaries.cjs
```

Exit code `0` means the selected route-scanner files have no direct forbidden imports. Exit code `1` means the report includes remaining blockers.

## Known blockers observed in the Phase2448 source

- `compiler/scanner/upstream/routeDeclarationComposition.ts` still delegates closure-return semantics to `subscanners/controller/controllerAstCanonical`.
- `types/upstream/resourceModelBindingSemanticInterface.ts` still imports `SemanticRelationRewrite`, `SemanticRelationPattern`, and `SemanticRelationVariable` from `semantic/relations/semanticRewriteEngine`.
- The resource binding authority still executes through the legacy relation engine; removing only the type import would not remove this execution dependency.

## Required implementation order

1. Define the controller closure-return semantic production authority at its actual upstream owner and migrate the return-semantic production logic without fabricating `absent` judgments.
2. Evolve the resource-model binding rule contract to use the existing upstream semantic rewrite protocol where compatible; do not create a second parallel rule vocabulary.
3. Migrate the solver implementation and all consumers off `semantic/relations` / `semantic/foundation` by owner, with equivalence tests for closed judgments, ambiguity, provenance, and fixed-point termination.
4. Retire legacy subscanner modules only after their consumers and transitive imports are gone.
5. Run project typecheck, package build, Vitest, and CLI E2E on the project's supported Arch environment.

This phase is an audit guard, not a claim that those implementation steps are already complete.
