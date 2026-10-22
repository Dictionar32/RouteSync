# Phase 2102 — Interface-First Source Identity Correspondence to CLI

## Objective

Close a real gap in the Phase 2101 source-bearing declaration correspondence: the authority preserved a source record beside a declaration selection, but did not validate that the candidate's `sourceFile` was the exact source identity owned by the invocation judgment. A mismatched pair could therefore receive a semantic selection.

## Canonical contract change

`packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentInterface.ts` now defines the declaration subject with both:

- `source`: the parsed source record carried through without lookup;
- `sourceIdentity`: the canonical `SourceFile` owned by the invocation judgment;
- `candidate`: declaration evidence whose `sourceFile` must match that identity.

`ControllerDeclarationSemanticCorrespondence` is now a closed ADT:

- `controller_declaration_semantic_correspondence`: identity matched and a declaration selection exists;
- `controller_declaration_source_identity_mismatch`: identity mismatch and no selection exists.

This is not a second semantic authority. It is an identity-integrity boundary around the existing declaration authority.

## Runtime enforcement

`controllerDeclarationSemanticJudgmentAuthority.ts` checks the exact source-file value before creating a judgment. Candidates that fail the check are excluded from the ancestry inventory and receive the mismatch ADT arm. Valid subjects retain their exact source record and are judged against the valid inventory.

`laravelControllerScanner.ts` supplies `sourceIdentity` directly from `item.invocationJudgment.sourceFile`. It converts mismatch outcomes to explicit scan blockers and only admits matched correspondences into `declarationsWithSelections`. The existing declaration gate runs before `scanControllerAction`, integrated response judgment, and AST projection. A mismatch therefore cannot proceed to action execution or produce a controller artifact.

The scanner contract version advances from 30 to 31.

## Trace through production and CLI

```text
packages/cli/src/commands/scan.ts
  -> buildManifestWithInvocationPipeline
  -> packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts
  -> sourceInvocationPipeline / frontend AST adapter
  -> invocation inventory closure receipt
  -> packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts
  -> laravelSourceAstScanner
  -> laravelSourceAstPipeline
      -> laravelControllerScanner
          -> invocation judgment source identity
          -> declaration subject + canonical source identity
          -> declaration semantic judgment authority
          -> matched correspondence OR source-identity-mismatch ADT
          -> blocked inventory gate OR action/response/AST executor
      -> laravelResourceScanner
      -> laravelRouteScanner
      -> remaining source scanners and producers
  -> CompleteLaravelSourceModel
  -> semantic dataflow judgments
  -> RouteSyncManifest
  -> CLI manifest, graph, dataflow, and IR projections
```

The above is a static source trace, not a claim that the CLI was executed.

## Current dependency inventory

Static scan of `packages/core/src` found:

| Dependency family | Files with direct import references | Import references |
|---|---:|---:|
| `semantic/relations` | 379 | 713 |
| `semantic/foundation` | 0 | 0 |
| `subscanners` | 24 | 54 |

The per-file inventory is `PHASE2102_DEPENDENCY_IMPORT_INVENTORY.csv`.

The controller scanner still directly imports relation helpers and controller subscanners, including `scanControllerAction` and `controllerProducer`. `laravelSourceAstPipeline.ts` still imports relation helpers and multiple subscanner producers. This phase does **not** remove these dependencies. Zero direct `semantic/foundation` imports does not prove every foundation file is dead or safe to delete.

## Invocation / response / AST correlation

The existing invocation judgment remains a closed ADT whose response outcome is owned by the PHP invocation integration result. The controller artifact retains its exact invocation judgment, integrated response judgment, and AST projection judgment. Phase 2102 does not redesign those ADTs; it closes a source identity mismatch before declaration selection can run.

## Ancestry lattice / fixed point

The existing ancestry closure still records canonical identity-set order, bottom, join, transfer, monotonicity, convergence, height bound, rounds, and known ancestors. Its numeric fields are runtime witnesses, not a proof that the lattice laws hold. The authority currently follows the single-parent ancestry chain with a monotonically growing `seen` collection and terminates at root or a boundary/cycle. A full proof-oriented fixed-point model remains future work; Phase 2102 makes no stronger claim.

## Audits and validation

- Phase 2098 closed outcome audit: 10/10.
- Phase 2099 declaration gate audit: 12/12.
- Phase 2100 declaration correspondence audit: 12/12.
- Phase 2101 source-bearing correspondence audit: 12/12.
- Phase 2102 source identity closure audit: 12/12.

These are static source audits. Build, typecheck, and Vitest were not run.

## External design references

- TypeScript discriminated unions and exhaustiveness: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- TypeScript unions and intersections: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html
- MLIR interfaces as decoupled compiler abstraction: https://mlir.llvm.org/docs/Interfaces/
- MIT OpenCourseWare — Dataflow Analysis, Lattices, Fixed Points: https://ocw.mit.edu/courses/6-820-fundamentals-of-program-analysis-fall-2015/resources/mit6_820f15_l17/

These references inform the design criteria; they are not validation evidence for RouteSync itself.
