# RouteSync Compiler Performance

Source of truth: `ZeroBoilerplate.md` §6, `packages/core/src/types/semantic.ts` (`IRMeta`),
`packages/sdk/src/generator.ts:121`, and `routesync.graph.json` from `ecommerce_shop-main`
(a real Laravel project scanned by this repo: 35 routes, 20 models, 4 resources).

## 1. Current State: Every `scan` Is a Full Cold Extraction

`CompilerArchitecture.md` §3 already documents *why* `scan --models` is expensive: it is not
static analysis, it is reflection against a fully booted Laravel application — every invocation
re-boots the app (`bootstrap/app.php`, `$kernel->bootstrap()`), re-runs
`ReflectionMethod`/`ReflectionClass` against every controller/model/resource, and re-runs
`Schema::getColumns($table)` for every Eloquent model over a live database connection. None of
this is cached between runs. `watch.ts` inherits this cost on every file save with no
mitigation — it is a thin re-run wrapper, not an incremental one.

**This document does not claim a benchmarked millisecond number**, because no profiling harness
exists in the repo today (`scan_log.txt` in the repo root is a captured failure log, not a timing
run — see §4 for the harness this should be replaced with). What can be stated precisely from the
code: the cost scales with route + model + resource count, since every one of them triggers its
own reflection/DB round trip, and `ecommerce_shop-main`'s 35 routes / 20 models is representative
of a small-to-medium real project — RouteSync's own docs (`README.md`) target apps with
"hundreds of routes/models," where this cost compounds linearly at minimum.

## 2. Root Cause: `IRMeta` Was Designed for Caching, Never Wired

```
packages/core/src/types/semantic.ts:

export interface IRMeta {
  version: "ir.v2";
  stableHash: string;   // ← reserved for exactly this purpose
  lineage: string[];    // ← reserved for exactly this purpose
  createdAt?: string;
  tags?: string[];
}
```

The only place this shape is ever instantiated is `packages/sdk/src/generator.ts:121`:

```ts
meta: { version: "ir.v2", stableHash: "", lineage: [], tags: [route.method] }
```

`stableHash` is a literal empty string. `lineage` is a literal empty array. The field exists,
the intent is documented in the type itself, and it has never been populated — this is not a
missing feature request, it is a half-finished one.

## 3. What "Fixing It" Actually Requires

Per `CompilerRoadmap.md` Stage 3 and `CompilerRefactorPlan.md` Phase C:

1. **A real hash function**, keyed per extracted unit (route, model, or resource), computed from:
   - the source file's mtime (or content hash, more robust across git operations that preserve
     mtime — e.g. `git checkout`), and
   - the reflected signature RouteSync itself already extracts (method list, parameter types,
     column list) — i.e. re-use data already being read, don't add a second extraction pass just
     to compute the hash.
2. **A persisted "last known hash" store** — the simplest version is a sibling JSON file next to
   `routesync.manifest.json` (e.g. `.routesync-cache.json`), not a database; this stays
   consistent with the project's file-based, git-diffable manifest philosophy
   (`Constitution.md` §9).
3. **A diff step at the start of `scan`**: for each unit, compare current hash to the persisted
   one; if unchanged, reuse the prior resolution from the last manifest instead of re-extracting.
4. **Graph-aware invalidation** once `ServiceGraphBuilder.ts` is wired in
   (`CompilerRefactorPlan.md` Phase C step 4): a changed model must invalidate not just its own
   node but every node with an edge to it (a resource that exposes that model's column, a hook
   that consumes that resource) — file-mtime invalidation alone under-invalidates cross-file
   dependencies.

## 4. Recommended Profiling Harness (Prerequisite to Claiming Any Speedup)

Before/after numbers for Phase C should not be asserted without a repeatable measurement. Add a
`--verbose` flag to `scan` (referenced already in `CompilerMilestones.md` Milestone 5) that
prints, per run:

- total units considered (routes + models + resources),
- units actually re-resolved (vs. skipped via cache hit),
- wall-clock time for the PHP reflection sub-process specifically, isolated from Node-side JSON
  parsing/manifest assembly.

Run this against `ecommerce_shop-main` (35/20/4 — a fixed, checked-in fixture available in this
monorepo already) before Phase C starts, to get a real cold-run baseline, and again after each
of Milestone 5's acceptance criteria pass. This turns "incremental compilation is faster" from a
claim into the exact number this document intentionally avoids fabricating right now.

## 5. Non-Goals

This document is scoped to `scan`'s extraction cost, which is the only cost with unused
caching infrastructure already sitting in the type system. It does **not** propose:

- Parallelizing `generate`'s 15 independent generator classes (`GeneratorSpecification.md`) —
  they're already architecturally independent per `Constitution.md` §5 ("pure functions of the
  manifest"), so this is a real possible follow-up, but it's a separate, smaller optimization
  with no unused infrastructure behind it yet, and is not blocking any roadmap stage.
- Optimizing the PHP-side reflection script itself (`routesync-extractor-temp.php`) — that cost
  is Laravel's own boot time, not RouteSync's compiler logic, and is out of scope for a
  TypeScript-side incremental-compilation effort.
