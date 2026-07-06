# RouteSync Compiler Vision 2030

> Referenced from `CompilerRoadmap.md` (Stage 7) and `CompilerPluginArchitecture.md` (§5) but
> not previously written. This document is the missing piece those two point to: not a
> near-term plan, but the reason the near-term plan is shaped the way it is.

## 1. The claim, stated precisely

`README.md`'s tagline is "Compile Laravel into an executable frontend contract." Every other
document in this folder verifies that claim is true *today*, for one target: a TypeScript/React
frontend (concretely, `ecommerce_shop-main/frontend`, the one real consumer this repo has been
validated against — see `CompilerArchitecture.md` §1 and `CompilerPerformance.md`'s reference to
its 35 routes / 20 models / 4 resources).

The 2030 claim drops one word:

> **Compile Laravel into an executable *application* contract that can target multiple
> runtimes.**

"Frontend" → "application." React stops being *the* target and becomes *a* target — the first
one, and currently the only one that's been built past a prototype (`packages/vue` exists but,
per `CompilerArchitecture.md` §1, is "much smaller — only `useApiForm`," i.e. an unfinished
second target, not a second one).

This is not a rebrand. It is a falsifiable architectural claim: if it's true, adding a second
real target should require touching the Generator stage only, never the Resolver stage. Whether
that's actually true today is checked in §3.

## 2. Why this is a 2030 document and not a 2026 one

Every other roadmap stage (`CompilerRoadmap.md` Stages 1–6) has a partial precursor already
sitting in the code — a hardcoded special case, an unused type field, a plugin array wired to
the wrong pipeline. That's what makes them near-term: the work is consolidation, not invention.

Stage 7 (this document) has no precursor. There is no OpenAPI emitter, no MCP server, no agent
runtime consuming `routesync.graph.json`. Naming it now, before any of it exists, is deliberate
for one reason: it constrains decisions being made in Stages 1–6 *today* so they don't have to
be undone later. Concretely:

- If `CompilerRefactorPlan.md` Phase A unifies the semantic kernel around an interface that
  returns TypeScript-shaped types, Stage 7 is foreclosed before it starts.
- If `CompilerPluginArchitecture.md`'s Resolver/Generator split collapses the two stages into
  one "resolve-and-emit-TS" step, the same problem recurs.

Both documents already carry this constraint forward (see `CompilerPluginArchitecture.md` §5).
This document is where that constraint is justified, not just asserted.

## 3. Checking the claim against the actual IR

`IntermediateRepresentation.md` documents `ParsedASTNode` as a closed union of 14 node kinds —
`property_access`, `method_call`, `binary_expression`, etc. — expressed as plain discriminated
unions, not TypeScript-specific classes. `SemanticResolution`
(`packages/core/src/types/contract.ts`) is similarly shape-only: `{ status, type, confidence,
trace }`, where `type` is a closed string union (`'model' | 'resource' | 'primitive' | ...`),
not a TypeScript AST node.

This is the load-bearing fact for the whole vision: **nothing in the IR between "raw PHP" and
"resolved semantic meaning" mentions TypeScript.** TypeScript only enters at the Generator stage
— `TSPrinter.ts`, `ZodToTSEmitIR.ts`, and the 18 files under `packages/cli/src/generators/`
(per `GeneratorSpecification.md`). That means the architectural claim in §1 is *already true* at
the IR layer today, well ahead of any of the tooling needed to exploit it. The gap is entirely
on the emission side: no second full Generator set exists yet.

This is why Stage 7 is listed as "no code precursor" (`CompilerRoadmap.md`) rather than
"speculative in every sense" — the hard part (a framework-agnostic IR) is done; what's missing
is target diversity in the one stage designed to hold it.

## 4. Target sequence

Not a commitment or a schedule — an ordering, for the same reason `CompilerMilestones.md`
orders phases by dependency rather than by date.

1. **React** (done, validated against a real app) — the reference implementation for every
   generator interface.
2. **Vue** (started, incomplete) — the first real test of whether the Resolver/Generator split
   holds. Finishing `packages/vue` to parity with `packages/react` before starting any new
   target is the correct next step, because a second *incomplete* target proves nothing; a
   second *complete* one proves the split works.
3. **OpenAPI** — lower effort than a full runtime target (an OpenAPI document is closer to the
   Contract Graph shape already produced by `ContractGraph.md`'s pipeline than to a React hook),
   and valuable independent of the AI-agent motivation below: it makes the IR's evidence-carrying
   contracts (`Constitution.md` §3) consumable by any existing OpenAPI tooling.
4. **React Native / Flutter** — mobile targets sharing the resolved semantic layer with React;
   likely the second real stress test of the Generator boundary, since mobile query-hook
   ergonomics differ enough from web that a naive port would leak TypeScript-web assumptions
   back into the Resolver if the boundary isn't clean.
5. **CLI / SDK-as-a-library** — a target consumer that isn't UI at all: a typed script-callable
   client generated straight from the same graph, for backend-to-backend integration.
6. **AI Agent / MCP** — the target this document is ultimately building toward. An MCP server
   or agent tool that answers "what does `POST /orders` require and return, and what did I
   derive that from" directly from `SemanticResolution.trace` (already a real field — see
   `Constitution.md` §3's evidence-trail requirement), without an LLM anywhere in the resolution
   path per `Constitution.md` §2. The trace requirement already in place for humans reading
   `routesync explain` output is the same structure an agent needs to cite evidence for a tool
   call; no new IR concept is required, only a new emitter.

## 5. What would falsify this vision

Stated plainly, so this document is a claim that can be checked later, not a mission statement:

- If finishing `packages/vue` (target 2) requires changing anything in
  `packages/cli/src/resolvers/` or `packages/core/src/semantic/`, the Resolver/Generator split
  is not actually framework-agnostic, and Stages 6–7 need to be re-scoped around fixing that
  split before adding more targets.
- If the OpenAPI target (target 3) cannot represent everything `ContractGraph.md` already
  models (request/response contracts, Zod validation shapes), then the Contract Graph itself —
  not just the emitters — has TypeScript-shaped assumptions baked in, and that's a Stage 3–4
  problem, not a Stage 7 one.
- If an MCP/agent emitter (target 6) turns out to need semantic information beyond what
  `SemanticResolution.trace` already carries, the fix belongs in `SemanticSpecification.md`'s
  trace shape, not in a special-cased "AI mode" bolted onto one generator.

Each of these failure modes points back at an earlier stage, which is the intended property of
sequencing targets by increasing distance from React (§4): each new target is also a test of
whether the boundary claimed in §3 actually holds, and failures surface early, against a cheap
target, rather than late, against the expensive one.
