# RouteSync Phase 1749 — Interface-First Subscanner Retirement

## Decision

The Laravel subscanner directory is a migration surface, not a permanent architecture layer. The terminal architecture is source evidence acquisition → typed upstream semantic judgment → source-bound integrated response / canonical projection. `RouteScanner`, `ControllerScanner`, `ModelScanner`, `FormRequestScanner`, `ResourceScanner`, and `ChannelScanner` must be deleted after their production consumers no longer depend on them and the retirement audit passes.

This phase deliberately improves the upstream contracts first. It does not claim the legacy subscanner modules have already been deleted.

## Source trace

Trace root: `packages/core/src/compiler/scanner/subscanners/`, `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts`, and `packages/core/src/types/upstream/laravel*ScannerInterface.ts`.

Static source inventory found:

- 35 non-test TypeScript files referencing `subscanners`.
- 38 direct import lines from subscanner paths.
- 24 direct facade method call sites for `RouteScanner`, `ControllerScanner`, `ModelScanner`, `FormRequestScanner`, `ResourceScanner`, or `ChannelScanner`.
- `laravelSourceAstPipeline.ts` still imports all six facades and invokes their `scanCanonicalBundle` / `scanCanonicalAsts` operations.
- `ChannelScanner.ts` still derives `public` / `private` / `presence` from channel-pattern text. It does not collect client-side subscription evidence or invoke `BroadcastChannelKindJudgmentAuthority`.

These findings mean deleting the directory now would break production imports. The correct next action is to migrate each consumer to the upstream contract and then delete the legacy modules, not to keep the subscanners as permanent thin facades.

## Interface changes

### Channel source AST and closed judgment

`laravelChannelScannerInterface.ts` is now contract v4. `BroadcastChannelDeclarationAst` represents only source facts: canonical channel name, pattern, runtime pattern, route parameters, and source span. It intentionally contains no public/private/presence classification.

`LaravelChannelScanArtifact` is a discriminated union:

- `resolved_laravel_channel`: source declaration + resolved judgment + canonical `ChannelAst`.
- `unresolved_laravel_channel`: source declaration + unresolved judgment; no canonical semantic `ChannelAst` is fabricated.
- `ambiguous_laravel_channel`: source declaration + ambiguous judgment; no arbitrary candidate is selected.

This prevents an unresolved/ambiguous judgment from being projected into a canonical channel AST that requires a definite kind.

### Semantic judgment contract

`LaravelScannerSemanticJudgmentContract` is v4 and now states the source-only channel AST boundary. Existing route/resource judgment authorities and invocation integrated response ownership remain upstream concerns.

### Explicit subscanner retirement contract

Added `laravelSubscannerRetirementInterface.ts`, exported through `packages/core/src/index.ts`. It records the upstream boundary and retirement condition for each of the six legacy facades. Its terminal contract explicitly forbids a permanent subscanner layer and requires zero production consumers plus a passing audit before directory deletion.

## Verification

- `audit:phase1749-upstream-interface-first-subscanner-retirement`: 24/24 static checks passed.
- TypeScript syntax transpilation: 4/4 changed/export files, zero syntax diagnostics.
- Focused TypeScript typecheck: not clean because the extracted project reports 34 diagnostics in pre-existing, unrelated upstream/domain files (including resource-model resolver, sequence, query, and semantic-dataflow contracts). No diagnostic in the three changed upstream interface files or the updated core index was reported.
- Package build: not run.
- Runtime behavior: not tested; channel authority implementation/wiring remains open.

## Next implementation order

1. Complete source-only channel declaration acquisition and implement the channel-kind authority.
2. Migrate channel consumers to the new resolved/unresolved/ambiguous contract.
3. Migrate route and resource consumers to their existing upstream judgment authorities.
4. Migrate model and FormRequest consumers to source evidence + correlated canonical definition contracts.
5. Migrate controller consumers to source-bound invocation integrated response, including explicit static-invocation coverage status.
6. Re-run import/call-site inventory; delete each old facade and helper only when no production consumers remain. Delete `subscanners/` only after the full retirement gate passes.

No dependency on `core/src/semantic/foundation` was introduced. `npm run build` was not run.
