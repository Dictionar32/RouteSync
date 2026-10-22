# Phase 2121 Trace — Canonical Controller Response ADT

## Evidence path

1. `packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts` already derived `resourceResponse` as `ControllerResponse`.
2. The same value was passed into return-semantic derivation and controller dataflow creation.
3. Phase 2120's `laravelControllerExecutionDependencies.ts` rebuilt a new `response_present` object from `responseTypeName()`, which erased the `response_absent` branch and duplicated classification.
4. `LaravelControllerActionSemanticJudgment` already owns `response: ControllerResponse`.
5. `laravelControllerScanner.ts` consumes `result.semanticJudgment.response`.
6. `laravelControllerActionExecutionInterface.ts` preserves the entire `semanticJudgment` in its execution result.

## Change

The action contract now exposes the already-canonical `semanticResponse`, populated from `resourceResponse`. The adapter forwards it directly. This reduces the number of semantic response authorities without moving the legacy resolver into another file.

## Remaining debt

`resolveControllerActionContract` still depends on controller/resource subscanner helpers, and `scanControllerAction` remains the production action judgment implementation. The change does not claim a transitive elimination of `relation`, `foundation`, or `subscanners`.

## Transitive import trace (static relative-import resolver)

Entry points: `laravelControllerScanner.ts` and `controllerInvocationManifestComposition.ts`.

- Reachable modules: 416
- Resolved relative import edges: 1,973
- Reachable modules under `packages/core/src/semantic/relations/`: 8
- Reachable paths with a `/foundation/` segment: 0
- Reachable `relationFoundation` module: 1 (`packages/core/src/semantic/relations/relationFoundation.ts`)
- Reachable modules under `subscanners/`: 20

The trace script is `scripts/audits/trace-phase2121-laravel-controller-transitive-imports.cjs`; run it with `npm run trace:phase2121-laravel-controller-transitive-imports`.

The counts reflect relative imports resolvable by this script. They do not cover package aliases, generated imports, or dynamic runtime loading, and must not be described as a proof of total dependency closure.

### Remaining relation/subscanner path

The highest-priority direct migration is still the production adapter in `packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts`, whose action judgment calls `scanControllerAction`. That route reaches `controllerActionContract.ts`, which in turn imports controller/resource/expression subscanner helpers. The canonical-response correction removes duplicated response reclassification but does not retire this legacy semantic owner.
