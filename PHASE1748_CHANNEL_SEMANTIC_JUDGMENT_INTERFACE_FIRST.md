# RouteSync Phase 1748 — Channel Semantic Judgment Interface-First

## Scope

This phase continues from Phase 1747 and intentionally prioritizes the upstream semantic contract before changing scanner wiring. It addresses one concrete gap found in `packages/core/src/compiler/scanner/subscanners/ChannelScanner.ts`: channel mode is inferred locally from pattern text (`presence`, `chat`, and `public.`), despite the fact that a server-side `Broadcast::channel(...)` declaration alone does not establish whether a client subscribes using a public, private, or presence channel.

## Changes

- Added source-bound channel declaration and client-subscription evidence contracts to `laravelScannerSemanticJudgment.ts`.
- Added `BroadcastChannelKindJudgmentAuthority` with a closed `resolved | unresolved | ambiguous` outcome.
- A resolved candidate must retain non-empty subscription evidence; missing subscription evidence is explicitly `unresolved`; competing kinds are explicitly `ambiguous`.
- Advanced `LaravelScannerSemanticJudgmentContract` from v2 to v3 and documented that channel kind must not be inferred from channel-name heuristics.
- Advanced `LaravelChannelScannerInterface` from v2 to v3. Its input now requires subscription evidence and an injected classification authority; each output artifact correlates declaration evidence, AST, and judgment.
- Added and exported `LARAVEL_CHANNEL_SCANNER_MIGRATION_CONTRACT` to disclose that current runtime is not yet wired to the v3 interface.
- Added audit command `audit:phase1748-channel-semantic-judgment-interface`.
- No dependency on `core/src/semantic/foundation` was introduced.

## Current implementation status — intentionally explicit

- Interface / closed judgment model: **implemented**.
- Concrete channel-kind authority implementation: **not implemented**.
- Client subscription evidence acquisition in the Laravel source pipeline: **not implemented**.
- `ChannelScanner` v3 adoption and production wiring: **not implemented**. The old pattern heuristic remains in the runtime until the evidence source and authority implementation are ready. This is a migration gate, not a claim of end-to-end completion.
- Route and Resource authorities are still interface-only in their current scanner contracts; their runtime migration remains separate work. The controller invocation integrated response from Phase 1746 remains the existing wired path, with static invocation coverage still incomplete.

## Verification

- Phase 1748 static interface audit: **20/20 passed**.
- Phase 1747 subscanner trace regression audit: **35/35 passed**.
- Phase 1746 integrated-response authority regression audit: **32/32 passed**.
- TypeScript transpile/syntax diagnostics for the three changed TypeScript files: **0 errors**.
- Full project typecheck: **not run**.
- Package build: **not run**.

## Next interface-first steps

1. Identify and model actual client subscription source evidence in the Laravel/consumer ecosystem; do not fabricate it from channel names.
2. Implement the channel kind authority against the closed judgment contract and test resolved, unresolved, and ambiguous outcomes.
3. Wire `ChannelScanner` to the authority and make downstream `ChannelAst` consumers preserve unresolved/ambiguous outcomes instead of forcing a guessed kind.
4. Apply the same trace discipline to Route and Resource: implement existing upstream authority contracts and remove local route-target/model-binding reasoning before moving their concrete facades behind scanner interfaces.
5. Keep controller static invocation as a separate explicit coverage gate; do not conflate ordinary invocation composition with full invocation coverage.
