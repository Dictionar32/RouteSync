# Phase2959 — Explicit domain rejection tuple

## Change

Retired the generic `nonEmpty<T>` tuple helper from `laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts`. Its replacement is `InventoryRejections` plus `inventoryRejections`, explicitly tied to `LaravelControllerInvocationSemanticJudgmentInventoryRejection`. This avoids a generic type parameter at a domain boundary and makes the non-empty rejection contract visible in the authority source.

The authority continues to consume the existing `LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface`, reasoning interface, rejection ADT, and source inventory ADT. No replacement generic collection or new upstream contract was introduced. `packages/core/src/types/upstream/collections.ts` remains empty.

## CLI manifest trace

`controllerInvocationManifestBuilder.build(...)` → CLI scan operation → `ControllerInvocationManifestCompositionAuthority.compose(...)` → source-project canonicalization → source discovery and source-document read/identity binding → semantic judgment preparation → `LaravelControllerInvocationSemanticJudgmentInventoryAuthority.close(...)` → source identity and judgment correspondence judgments → manifest-builder judgment continuation → CLI terminal manifest operation → manifest projection/output.

The current production builder remains interface-first (`export const controllerInvocationManifestBuilder: ControllerInvocationManifestBuilderInterface = Object.freeze({...})`). TypeScript interfaces can describe callable contracts and object shapes; see the official [TypeScript Handbook — Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html).

## Known remaining gaps

This phase does not claim the whole runtime has reached the target. `judgeJudgmentCorrespondence` still materializes source files through `toSourceFiles()`, uses `flatMap()` for orphan judgments, and branches on `rejections.length`. Some paths still use arrays as intermediate evidence. A repository-wide `export function` migration has not been completed. The next meaningful step is to model correspondence classification as a source/judgment-domain operation after checking the existing upstream contracts, rather than adding another generic helper.

## Verification boundary

The Phase2959 structural audit and TypeScript syntax-transpile checks are intended to be run for this phase. A focused Vitest run was attempted for the source-inventory and judgment-cardinality tests but timed out before returning results. Full typecheck, full build, and CLI end-to-end execution were not run.
