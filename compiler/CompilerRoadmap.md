# RouteSync Compiler Roadmap

Source of truth for this document: the eight audit documents in this folder
(`CompilerArchitecture.md`, `CompilerPipeline.md`, `Constitution.md`, `ContractGraph.md`,
`GeneratorSpecification.md`, `IntermediateRepresentation.md`, `SemanticSpecification.md`,
`ZeroBoilerplate.md`) plus direct inspection of `packages/*/src`.

This is not a TODO list — `CompilerBacklog.md` is the TODO list. This document describes the
**shape** the compiler needs to grow into, and why each stage is a prerequisite for the next one.
Every stage below already has a partial, unwired, or hand-coded precursor sitting in the
codebase today; the roadmap's job is to name where each precursor is heading, not to invent
work from nothing.

```
IR v2 ──▶ IR v3 ──▶ Incremental Compilation ──▶ Dependency Graph ──▶ Domain Graph ──▶ Plugin Compiler ──▶ AI Contract Engine
```

## Stage 1 — IR v2 (Current State)

Three layers exist and are real: `IRRawNode → ParsedASTNode → SemanticNode`
(`IntermediateRepresentation.md`). The root wrapper, `SemanticIRNode`, is fully specified
(`id`, `source`, `node`, `semantic`, `meta`) but is only ever constructed transiently inside
`packages/sdk/src/generator.ts` with `meta.stableHash` and `meta.lineage` hardcoded to empty —
the wrapper is not what actually flows through `scan`/`generate`. **This stage is functionally
done for correctness; it is not done for identity/caching.**

## Stage 2 — IR v3 (Make `SemanticIRNode` the Real Unit of Compilation)

Today, `scan.ts` and `sync.ts` resolve fields inline and write a flat `RouteManifest` — there is
no point in the pipeline where a `SemanticIRNode` with a populated `id`/`source`/`meta` actually
exists per-field. IR v3's job is narrow: make every resolved field a real, addressable
`SemanticIRNode`, computed once, so that stages 3–6 have something stable to key off. This is a
data-shape change, not a new capability — it should ship with no user-visible behavior change.

**Prerequisite for**: everything below. Stage 3 needs `id`; stage 4 needs `source`+`lineage`;
stage 5 needs models to be graph nodes, not scattered manifest entries; stage 6 needs a stable
node shape plugins can pattern-match against.

## Stage 3 — Incremental Compilation

`ZeroBoilerplate.md` §6 already diagnoses this: `IRMeta.stableHash`/`lineage` are declared and
never computed. Once Stage 2 gives every node a real identity, `stableHash` becomes
`hash(sourceFile mtime + reflected signature)`, and `scan` can skip re-resolving any node whose
hash is unchanged since the last run. `watch.ts` — currently a full re-scan on every file save —
becomes the direct beneficiary: file changed → nodes touching that file recomputed → rest of the
manifest reused. See `CompilerPerformance.md` for the concrete plan.

**Prerequisite for**: Stage 4's dependency graph needs to know which nodes are "dirty" to
propagate invalidation correctly; without stable identity, invalidation has nothing to key off.

## Stage 4 — Dependency Graph

`packages/core/src/graph/ServiceGraphBuilder.ts` already exists and already targets the
`ServiceGraph` shape (`services`, `controllers`, `models`, `edges`) — it is simply never called
(`ContractGraph.md` §5). This stage is "wire it in," not "design it." Once wired, invalidation in
Stage 3 stops being file-local and becomes graph-aware: changing a model's column doesn't just
invalidate that model's node, it invalidates every resource/hook/schema node with an edge to it.
This is also what would let `routesync explain` answer "what else changes if I rename this
column?" — a question the current flat manifest structurally cannot answer.

**Prerequisite for**: Stage 5, which is this same graph with domain semantics layered on top.

## Stage 5 — Domain Graph

The `cart` special-case in `HookGenerator.ts` (`ZeroBoilerplate.md` §2) is what a domain
capability looks like *before* there's a graph to hang it off. Today "cart-ness" is detected by
string-matching group names and sub-paths at generation time, because there is nowhere upstream
to declare "this resource plays the role of a cart." Once Stage 4's dependency graph exists,
domain roles (cart, wishlist, saved-for-later, comparison list) become **annotations on graph
nodes** — declared once in the manifest schema, read generically by any generator — instead of
one hardcoded generator branch per domain concept.

**Prerequisite for**: Stage 6. A plugin can't be scoped to "the cart domain" if "domain" isn't a
first-class graph concept yet.

## Stage 6 — Plugin Compiler

Two things point the same direction here, and one already half-exists:

- `SemanticResolutionKernel` (`packages/cli/src/resolvers/SemanticResolutionKernel.ts`) is
  **already** a working plugin dispatcher (`ResolverPlugin[]` with `canResolve`/`resolve`,
  see `CompilerPluginArchitecture.md`) — it's just wired to the wrong (introspection-only) code
  path. `SemanticKernelV2`, the kernel that actually feeds `generate`, is a ~350-line cascade of
  `if`/`else` on `normalizedAst.kind` and method names.
- The generator layer has the same shape problem one level up: 15 generator classes
  (`GeneratorSpecification.md`) each independently decide what to emit; there is no
  `LaravelResourcePlugin` / `SanctumPlugin` / `BroadcastPlugin` seam a fifth framework feature
  could hook into without a new generator class and a new `generate.ts` wire-up.

Stage 6 unifies both into one pipeline: `Pipeline → Plugin → Resolver → Generator`, detailed in
`CompilerPluginArchitecture.md`.

**Prerequisite for**: Stage 7. An AI contract engine needs a plugin seam to attach to — it cannot
usefully hook into a monolithic `if`/`else` cascade.

## Stage 7 — AI Contract Engine

Speculative, and intentionally the least specified stage. Once Laravel is compiled into a
graph of typed, evidence-carrying contracts (Stage 5) with a plugin seam for interpretation
(Stage 6), that same graph is consumable by more than TypeScript emitters — an MCP server or
agent tool could query "what does `POST /orders` require and return" directly from the IR
instead of from generated source. This stage has no code precursor today; it is listed to give
Stage 6's plugin architecture a design constraint ("the plugin interface must not assume its
consumer emits TypeScript") rather than as near-term work. See `CompilerVision2030.md`.

## Sequencing Note

Stages 1–4 are almost entirely mechanical (wire up code that already exists, compute a hash that
already has a field reserved for it). Stage 5 requires one manifest-schema decision (how domain
roles are declared). Stage 6 requires an actual kernel migration/deletion (`CompilerRefactorPlan.md`
Phase A). Stage 7 requires nothing be built before Stage 6 ships. This ordering — not effort size
— is why `CompilerRefactorPlan.md` sequences Phase A (kernel unification) before Phase C
(true IR/incremental compile), even though the kernel unification is the more invasive change:
Stage 6 does not depend on Stage 3 being complete, but every stage after Stage 2 assumes the
duplicate-kernel divergence (`ZeroBoilerplate.md` §5) has already been resolved, or invalidation
and plugin dispatch would each need to be built twice.
