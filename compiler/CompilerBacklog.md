# RouteSync Compiler Backlog

Every item below is sourced from a specific finding in `ZeroBoilerplate.md`, `Constitution.md`
§10, or `ContractGraph.md` §5 — nothing here is newly speculated. Severity reflects **blast
radius if left unfixed**, not effort: an item is HIGH if it silently produces wrong output or
blocks the roadmap in `CompilerRoadmap.md`; MEDIUM if it's a maintenance/consistency cost with no
current user-visible symptom; LOW if it's cleanup with no behavioral effect either way.

## HIGH

### H1. Duplicate semantic kernel with diverging rule tables
**Files**: `packages/core/src/semantic/SemanticKernelV2.ts` (used by `scan`/`sync` — the code
path that actually produces the manifest) vs.
`packages/cli/src/resolvers/SemanticResolutionKernel.ts` (used by `audit`/`explain` only).
**Impact**: `routesync explain` can report a resolution path that would not have produced the
type currently in the manifest, because the two kernels implement different framework-helper
allowlists and different confidence-gating (`SemanticSpecification.md` §5,
`ZeroBoilerplate.md` §5). This breaks `Constitution.md` §3 ("every resolution must carry
evidence") specifically in the disagreement case.
**Blocks**: `CompilerRoadmap.md` Stage 6 (plugin compiler) — can't build one plugin dispatcher
until there's one kernel to dispatch through.

### H2. `cart` domain logic hardcoded into a general-purpose generator
**Files**: `packages/cli/src/generators/HookGenerator.ts` lines ~430–593.
**Impact**: `domainVal === 'cart'` is a literal string check; sibling groups ("items", "promo")
are found by sub-path string-matching, not manifest data. `KNOWN_ISSUES.md` #1 and #2 are both
symptoms of this — bugs fixed by editing `HookGenerator.ts`'s source to special-case one
project's cart shape, which is boilerplate migrating into the compiler instead of disappearing
(`ZeroBoilerplate.md` §2). No second domain (wishlist, saved-for-later) can reuse this without
copy-pasting the block and re-doing the string-matching.
**Blocks**: `CompilerRoadmap.md` Stage 5 (domain graph).

### H3. Unused IR wrapper — `stableHash`/`lineage` never computed
**Files**: `packages/core/src/types/semantic.ts` (`IRMeta`), only ever instantiated with
`stableHash: ""`, `lineage: []` in `packages/sdk/src/generator.ts:121`.
**Impact**: every `scan` is a full cold re-extraction; there is no incremental compilation path
even though the IR spec explicitly reserved fields for it (`ZeroBoilerplate.md` §6). Directly
blocks `watch` mode from ever being genuinely incremental.
**Blocks**: `CompilerRoadmap.md` Stage 3.

### H4. Dead SDK generation backend
**Files**: `packages/cli/src/generators/CompilerBackendGenerator.ts`,
`packages/sdk/src/generator.ts` (`SdkGenerator`), `packages/sdk/src/emitter/ZodToTSEmitIR.ts`,
`packages/sdk/src/emitter/TSPrinter.ts`.
**Impact**: a complete second manifest→SDK pipeline exists, is exported from `@routesync/sdk`,
and is never called by `generate.ts`/`sync.ts` (`CompilerArchitecture.md` §5,
`Constitution.md` §10 item 2). Not user-visible, but a real contributor-trap: a bug fix applied
to the dead path silently does nothing, and the two implementations must be mentally reconciled
by anyone reading `packages/sdk`.
**Note on severity**: classified HIGH not because of runtime impact (there is none — this is why
`ZeroBoilerplate.md` §1 calls it "confusing, not harmful") but because dead parallel
implementations compound: every future change to `SemanticIRNode`'s shape (Stage 2 of the
roadmap) must decide whether to also update the dead path, and that decision cost recurs
indefinitely until the path is deleted.

## MEDIUM

### M1. `cart` domain pattern — see H2 for the hardcoding; separately, its **generalization** (a
declarative domain-recipe schema) is scoped as its own backlog item once H2's specific bugs are
patched, since designing the general schema is a bigger design task than un-hardcoding the
current one (see `CompilerRefactorPlan.md` Phase B).

### M2. Form types generated twice from the same source
**Files**: `ZodTierGenerator.generateForm()` and `ZodTierGenerator.generateSchema()`.
**Impact**: both derive from the same `FormRequest::rules()` data through two independent
tree-walks; nothing enforces they stay in sync (`ZeroBoilerplate.md` §3). Not dead code — both
outputs are consumed (`HookGenerator.resolveFormType()` uses both) — but a latent
inconsistency bug waiting for one of the two paths to be edited without the other.

### M3. Legacy schema generator always runs alongside its replacement
**Files**: `generate.ts` calls `SchemaGenerator.generate()` (`schemas.ts`) unconditionally; with
`--zod`, `ZodTierGenerator`'s `contract/api-schema.ts` does the same job plus more
(`ZeroBoilerplate.md` §4). `.claude/skills/run-routesync/SKILL.md` already states this
"can be deprecated once the new Zod tier fully covers all validation needs."
**Impact**: every generated project with `--zod` ships a redundant `schemas.ts`, inflating
output surface a consuming developer has to disambiguate — directly contrary to the
zero-boilerplate principle applied to the *generated* output, not just the compiler's own code.

### M4. `ServiceGraphBuilder.ts` implemented but unwired
**Files**: `packages/core/src/graph/ServiceGraphBuilder.ts`.
**Impact**: no functional impact today (nothing depends on it), but it is exactly the Stage 4
dependency-graph precursor named in `CompilerRoadmap.md` — leaving it unwired indefinitely means
re-discovering or re-writing it when Stage 4 work starts (`ContractGraph.md` §5).

### M5. Manifest inconsistency between `scan` output and `graph.json`
**Files**: `scan.ts` writes both `routesync.manifest.json` (portable IR) and
`routesync.graph.json` (fully-elaborated, `resolved`/`parsed_ast` populated) — see
`CompilerArchitecture.md` §2. These are two representations of the same extraction, maintained
by the same code path today, but nothing schema-validates that they can't drift if a future
change updates one without the other.

### M6. Confidence computed but not consumed downstream
**Files**: every generator reads `resolved.type`/`.model`/`.collection`, none read
`.confidence` (`ZeroBoilerplate.md` §7).
**Impact**: a field resolved at confidence 50 renders into generated TypeScript with the exact
same unconditional certainty as one resolved at 100 from a real DB column — confidence is
currently pure `routesync audit` exhaust, invisible in the artifact a developer actually reads.

## LOW

### L1. `ValuesGenerator.ts` (8 lines) — unwired, same pattern as H4 at smaller scale.
**Files**: `packages/cli/src/generators/ValuesGenerator.ts`.
**Impact**: none currently observed; flagged for the same deletion-vs-document decision as H4.

### L2. Duplicated `mapSqlTypeToTs`/`mapCastToTs` logic
**Files**: implemented independently in both semantic kernels (`Constitution.md` §10 item 1).
Subsumed by H1's fix — once the kernels are unified this duplication disappears with it, so it
is not separately scheduled in `CompilerRefactorPlan.md`.

### L3. Emit-backend cleanup once H4 is resolved
Once a decision is made on `CompilerBackendGenerator`/`SdkGenerator` (delete vs. explicitly mark
experimental), the corresponding `@routesync/sdk` exports and `package.json` `exports` map
should be cleaned up to match — a mechanical follow-up, not a separate investigation.

---

**Backlog scope note**: `KNOWN_ISSUES.md` items #1–#3 are *symptoms* already diagnosed and
patched at the generator-output level (dummy ID `1`, `String()` coercion, DB host override).
H2's fix is what would make items #1–#2 unnecessary at the source rather than patched downstream
— they are cited above as evidence, not listed as separate backlog rows, to avoid double-counting
the same root cause.
