# Phase 3124 — Manifest Judgment Boundary Migration

## Change made

The runtime composition in `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` called `judgment.continueWith({ onComplete, onBlocked })`, but `ManifestBuilderJudgment` in `packages/core/src/types/upstream/manifestBuilderInterface.ts` does not declare that operation. Its real contract is a closed union of `manifest_builder_complete` and `manifest_builder_blocked`, and each arm exposes `continueToFlow` for a different projection domain.

The CLI adapter now exhausts that existing closed union at the CLI boundary and passes the original complete or blocked judgment to the corresponding terminal operation. The complete arm retains the exact `manifest`; the blocked arm retains its original blocker stage and evidence. No relation-foundation module was restored or recreated.

This is deliberately a boundary correction, not a claim that all conditional control flow has been eliminated. A closed-union elimination is appropriate here because the CLI needs the original manifest terminal contract, while `continueToFlow` projects into a different domain (`RouteSyncManifestFlow`) and cannot substitute for the original manifest judgment without changing the public terminal contract.

## Runtime trace

`CLI scan/sync`
→ `ControllerInvocationManifestCompositionAuthorityInterface.compose`
→ source identity canonicalization
→ Laravel controller source discovery
→ PHP source document acquisition and identity binding
→ source invocation semantic pipeline
→ invocation judgment inventory closure
→ `inventoryResult.buildManifest(...)`
→ `ManifestBuilderOperationPreparationInterface.prepare(...)`
→ `ManifestBuilderInterface.build()`
→ `ManifestBuilderJudgment` (`manifest_builder_complete` | `manifest_builder_blocked`)
→ CLI terminal adaptation preserving the original judgment
→ `requireCompleteManifest()` or typed terminal failure with original evidence.

## Validation performed

- `node scripts/audits/test-phase3124-manifest-judgment-boundary-migration.cjs`: 6/6 checks passed.
- `node scripts/audits/test-phase3123-explicit-ast-domain-sequences.cjs`: 9/9 checks passed.
- The CJS checks are static contract checks. They do not establish full TypeScript type correctness or runtime end-to-end behavior.
- Full typecheck and end-to-end tests were not run in this workspace; no local project dependencies/compiler were found.

## Known remaining work

- The AST sequence model from Phase 3123 still needs a domain-ownership review; removing generic `AstSequence<T>` did not prove the nine typed sequence structures are the right model or eliminate possible duplicated abstractions.
- `astSemanticInterface.ts` still imports deleted relation-foundation paths. Do not restore `relationMembership`, `relationalSequence`, or `semanticRelations`; migrate each consumer to the existing owning domain ADT/operation based on its real responsibility.
- Repository-wide export-interface conversion and full upstream → CLI → manifest → generator migration remain incomplete.

## References

- TypeScript discriminated unions and narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- Laravel controllers and route-to-controller dispatch: https://laravel.com/docs/12.x/controllers
- PHP type declarations: https://www.php.net/manual/en/language.types.declarations.php

These references explain the language/framework contracts; they are not evidence that unexecuted RouteSync paths pass.


## Phase 3125 correction

The previous CLI adapter still inspected `judgment.kind`. Phase 3125 moves the success/rejection operation onto each upstream `ManifestBuilderJudgment` variant. Complete judgments expose `requireCompleteManifest()` returning the canonical manifest; blocked judgments expose the same domain operation with a `never` result and throw `ManifestBuilderBlockedError` retaining the exact blocked judgment. The CLI adapter now binds the operation and does not branch on the discriminator.
