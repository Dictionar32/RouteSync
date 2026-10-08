# RouteSync Compiler Milestones

Each milestone below corresponds to one phase in `CompilerRefactorPlan.md`, restated as a
checkpoint with a concrete, testable acceptance criterion — not a date. This project has no
committed timeline; milestones are ordering and "done" checkpoints, not a schedule.

## Milestone 1 — One Semantic Kernel

**Phase**: A. **Backlog closed**: H1, L2.

**Acceptance criteria**:
- [ ] `SemanticKernelV2.ts` no longer exists in `packages/core/src/semantic/`.
- [ ] `scan.ts`, `sync.ts`, `audit.ts`, and `explain.ts` all import the same kernel class.
- [ ] Running `routesync scan --models` then `routesync explain <path>` against
      `ecommerce_shop-main` for every currently-`unknown`-or-<100%-confidence field produces a
      trace whose final `type`/`status` matches what's actually in `routesync.manifest.json`
      for that field — for all of them, not "for the ones checked."
- [ ] `mapSqlTypeToTs`/`mapCastToTs` exist in exactly one place.

**Regression check**: full re-generation of `ecommerce_shop-main/frontend/src/api` produces
output identical to pre-refactor, field-for-field, for every route already resolved at
confidence 100 pre-refactor. (Sub-100 confidence fields are allowed to change if Milestone 1
fixes a genuine kernel disagreement — that's the point — but any such change must be
individually explainable by a specific ported rule from `SemanticSpecification.md` §1, not an
unexplained diff.)

## Milestone 2 — Domain Roles Are Declarative

**Phase**: B (steps 1–2). **Backlog closed**: H2, M1.

**Acceptance criteria**:
- [ ] `HookGenerator.ts` contains no string literal `'cart'`.
- [ ] The cart wrapper is generated purely from a `frontend.domains.cart = { role, itemsGroup,
      promoGroup, itemKey }`-shaped manifest entry (exact key names TBD in the Phase B design
      step) — deleting that manifest entry and adding an equivalent one for a synthetic second
      resource (e.g. a test `wishlist` group) produces an analogous wrapper without touching
      `HookGenerator.ts`.
- [ ] `KNOWN_ISSUES.md` #1 and #2 are re-classified from "Diagnosed & Fixed" (patched in the
      generator) to a note that the root cause is now handled generically — the dummy-ID and
      `String()`-coercion special cases are no longer needed once the domain recipe declares the
      correct item-identity key and type up front.

**Regression check**: re-generated `ecommerce_shop-main/frontend/src/api/hooks.ts`'s cart
wrapper is byte-identical to pre-refactor, since the manifest's actual cart shape hasn't
changed — only its source of truth (schema vs. string-matching) has.

## Milestone 3 — One Form-Type Source, One Schema File

**Phase**: B (steps 3–4). **Backlog closed**: M2, M3.

**Acceptance criteria**:
- [ ] `ApiFormValues['{Group}{Action}']` in generated `contract/api-schema.ts` is a type alias to
      `{Group}Form['{Action}']`, not an independently re-derived shape.
- [ ] With `--zod` passed, `schemas.ts` is not written.
- [ ] Without `--zod`, `schemas.ts` is written exactly as before (this milestone must not change
      the no-`--zod` code path at all).

## Milestone 4 — Dead Backend Resolved

**Phase**: C (step 5). **Backlog closed**: H4, L1, L3.

**Acceptance criteria** (exactly one of the two, decided during Phase C):
- [ ] **Delete path**: `CompilerBackendGenerator.ts`, `SdkGenerator` (in
      `packages/sdk/src/generator.ts`), `ZodToTSEmitIR.ts`, `TSPrinter.ts`, and
      `ValuesGenerator.ts` are removed; `@routesync/sdk`'s exports and `package.json` no longer
      reference them.
  **OR**
- [ ] **Keep-experimental path**: all of the above are retained but moved under a clearly-named
      `experimental/` boundary, `@routesync/sdk`'s public exports no longer surface them, and
      `CompilerArchitecture.md` §5 is updated to say "experimental, not wired" instead of "dead."
- [ ] Either way: no behavior change to `routesync generate`'s output, since neither path was
      ever invoked by it.

## Milestone 5 — True Incremental Compilation

**Phase**: C (steps 1–4, 6). **Backlog closed**: H3, M4, M5.

**Acceptance criteria**:
- [ ] `IRMeta.stableHash` is a real computed hash (not `""`) for every node in a `scan` run.
- [ ] Running `scan --models` twice against `ecommerce_shop-main` with zero source changes
      between runs results in **zero** nodes being re-resolved on the second run (measurable via
      a recompute counter emitted with `--verbose`).
- [ ] Changing a single Eloquent model's column (e.g. adding a nullable field to `Category`)
      results in re-resolution of exactly that model's node and every node with a graph edge to
      it (via the now-wired `ServiceGraphBuilder`) — not a full re-scan, and not *only* that one
      node if downstream nodes actually depend on it.
- [ ] `routesync.manifest.json` and `routesync.graph.json` cannot independently drift — a check
      (test or build step) fails if one is regenerated without the other reflecting the same
      extraction.

## Milestone 6 — Confidence Is Visible, Not Just Logged

**Phase**: C (step 7). **Backlog closed**: M6.

**Acceptance criteria**:
- [ ] Any field emitted by `ZodTierGenerator` at confidence below an agreed threshold (proposed:
      90, matching `ZeroBoilerplate.md` §7's framing of confidence 50 as "no evidence") carries a
      generated comment pointing at `routesync explain <path>`.
- [ ] No change to emitted *types* — this milestone only adds comments, and must not alter
      generated type signatures, since surfacing a warning is not license to change behavior
      silently.

## Sequencing

Milestones 1 → 2/3 (can run in parallel once 1 ships, since Phase B doesn't depend on Phase A's
internals, only on its verification gate having already proven kernel stability) → 4 (independent,
can happen any time, but scheduled here so Phase C's IR shape change in Milestone 5 doesn't have
to consider a fourth generation backend) → 5 → 6.
