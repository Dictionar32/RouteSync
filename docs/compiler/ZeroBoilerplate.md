# RouteSync "Zero Boilerplate" Audit

The project's stated goal (`README.md`): point RouteSync at `routes/api.php`, get a fully typed
frontend SDK, "and you didn't write any of it." This document is a concrete, code-referenced
audit of where the current implementation still requires a developer to write, configure, or
maintain something by hand — organized as root-cause chains (symptom → where → why), per the
methodology the project's own `KNOWN_ISSUES.md` already uses.

## 1. Dead Generation Backend — Confusing, Not Harmful, But a Maintenance Trap

**Where**: `packages/cli/src/generators/CompilerBackendGenerator.ts`,
`packages/sdk/src/generator.ts` (`SdkGenerator`), `packages/sdk/src/emitter/ZodToTSEmitIR.ts`,
`packages/sdk/src/emitter/TSPrinter.ts`.

**What**: A complete, independently-coherent second code-generation pipeline — manifest →
`GeneratedSDKModule[]` → TS Emit IR → printed `api-service.ts` — exists and is exported from
`@routesync/sdk`, but `generate.ts`/`sync.ts` never call `CompilerBackendGenerator.generate()`.

**Why this matters for "zero boilerplate"**: it doesn't directly cost the *end user* anything
(they never see this code path), but it is a real cost to whoever maintains RouteSync itself —
two implementations of "SDK from manifest" must be mentally reconciled by any contributor
reading the codebase, and a future contributor could easily wire the wrong one back in, or
"fix" a bug only in the dead path. Given `ZodTierGenerator` + `SDKGenerator` are strictly more
capable (contract tier, mapper tier, flatten strategy — none of which `ZodToTSEmitIR`/
`TSPrinter` implement), the recommendation is to delete the dead path rather than maintain it,
or to explicitly document it as "experimental, not wired" if it is meant to survive as a future
migration target.

**Root cause**: `SdkGenerator`/`ZodToTSEmitIR`/`TSPrinter` were very plausibly the *original*
generation backend, later superseded in-place by `SDKGenerator` + `ZodTierGenerator` as the
project's needs (contract/mapper/form tiers, flatten strategy, cart-domain hooks) grew — but the
superseded code was never removed. `ValuesGenerator.ts` (8 lines, also unwired) looks like the
same pattern at a smaller scale.

## 2. The `cart` Domain Pattern Is Hand-Coded, Not Generalized

**Symptom**: `README.md` advertises "Domain-Oriented Intent Patterns" as a zero-boilerplate
feature — set `frontend.domains.cart = "cart"` in the manifest and get `.inc()`/`.dec()`/
`.add()`/`.remove()`/`.applyPromo()`/`.removePromo()` for free.

**Where**: `HookGenerator.ts` lines ~430–593 (the `cartGroupName` block).

**Root cause**: the implementation is not a generic "domain pattern" engine — it is a single,
literally-named special case. The code explicitly checks
`domainVal === 'cart' || (typeof domainVal === 'object' && domainVal.type === 'cart')`, then
string-matches sibling resource groups by pattern-matching sub-paths (`itemsGroupName =
'${cartGroupName}Items'`, and a scan for any other group whose path starts with the cart path
followed by `/promo`). There is no `frontend.domains.wishlist = "wishlist"` equivalent, no
plugin/registry mechanism for a third domain to opt into similar sugar — "domain" in the
manifest schema currently only recognizes the literal string `'cart'`.

**Evidence this is a known rough edge, not a stable design**: `KNOWN_ISSUES.md` records two
issues (#1 and #2) that are specifically bugs *in this cart wrapper* — a hardcoded dummy ID `1`
passed to `removePromoMut` because "there is no meaningful ID at the frontend cart level," and a
hardcoded `String(produkItemId)` conversion because the DB type (`number`) doesn't match the
`FormRequest`'s validated type (`string`). Both fixes are described as edits to
`HookGenerator.ts` itself — i.e., fixing a *specific manifest's* cart shape by editing the
*generator's source code*, which is the definition of boilerplate migrating from the generated
frontend into the compiler's own codebase instead of disappearing.

**Fix direction**: generalize the pattern into a declarative "domain recipe" — e.g. a manifest
schema where `frontend.domains.cart` declares which sibling group plays the "items" role, which
plays "promo," and what the item-identity key is (`produkItemId` vs `id`), rather than deriving
those facts by sub-path string-matching. That turns today's one hardcoded cart implementation
into a config-driven capability any resource shaped like a cart (wishlist, saved-for-later,
comparison list) could reuse without editing `HookGenerator.ts`.

## 3. Form Types Are Generated Twice From the Same Source

**Symptom**: `types/api-form.ts`'s `{Group}Form` types (from `ZodTierGenerator.generateForm()`)
and `contract/api-schema.ts`'s `ApiFormValues['{Group}{Action}']` (from
`ZodTierGenerator.generateSchema()`) are both derived from the same `FormRequest::rules()`
data, producing what should be identical shapes through two separate code paths within the
*same* generator class.

**Where**: `ZodTierGenerator.ts`, `generateForm()` and `generateSchema()`.

**Why it persists**: `HookGenerator.resolveFormType()` needs a `Form['Create']`-shaped type for
*standard* CRUD actions but falls back to `ApiFormValues`-shaped contract types for
non-standard ones — meaning both representations are actually consumed somewhere, so neither is
dead code. But nothing enforces the two stay in sync if one code path is edited without the
other; a bug fix to how nested/array `FormRequest` rules are typed in `generateForm()` would not
automatically propagate to `generateSchema()`.

**Fix direction**: have `generateSchema()`'s `ApiFormValues` type alias directly reference
`{Group}Form['{Action}']` (a type-level re-export) rather than re-deriving the shape from the
raw rules a second time — collapsing two independent tree-walks into one canonical type plus one
alias.

## 4. `schemas.ts` (Legacy `SchemaGenerator`) Always Generates, Alongside Its Replacement

**Symptom**: every `routesync generate` run — with or without `--zod` — writes `schemas.ts` via
`SchemaGenerator` (162 lines), even though `contract/api-schema.ts` (from `ZodTierGenerator`,
only with `--zod`) does the same job with the flatten strategy and `ApiFormValues`/
`ApiDefaultValues` on top. `.claude/skills/run-routesync/SKILL.md` states outright: *"can be
deprecated once the new Zod tier fully covers all validation needs."*

**Where**: `generate.ts` calls `SchemaGenerator.generate()` unconditionally (no `--zod` gate) as
part of the always-on generator list, separately from the `--zod`-gated `ZodTierGenerator` call.

**Cost**: every generated project ships a file (`schemas.ts`) that is redundant with
`contract/api-schema.ts` whenever `--zod` is used (the common case per the README's recommended
command), inflating output surface area a consuming developer has to understand ("which schema
file is the real one?") — directly contrary to the zero-boilerplate principle of the generated
output itself being minimal and unambiguous.

**Fix direction**: gate `SchemaGenerator` behind "only run if `--zod` was NOT passed," making it
a genuine fallback rather than an always-on duplicate.

## 5. Two Semantic Kernels With Diverging Rule Tables

Fully detailed in `CompilerArchitecture.md` §4 and `SemanticSpecification.md` §5. Restated here
as a zero-boilerplate cost: because `SemanticResolutionKernel` (used by `audit`/`explain`) and
`SemanticKernelV2` (used by `scan`) implement *different* framework-helper allowlists and a
different confidence-gating rule, `routesync explain` can report a resolution path that would
not actually have produced the type currently sitting in the manifest — undermining the
project's own "every resolution carries evidence" principle (`Constitution.md` §3) for the
specific case where the two kernels disagree. A developer debugging why a field is `unknown`
via `routesync explain` could be given an explanation that doesn't match what `scan` actually
did, adding developer time (the opposite of zero-boilerplate: it's zero-*writing* code, but not
zero debugging friction).

**Fix direction**: `audit`/`explain` should resolve through the *same* kernel instance/rules
`scan` uses (extract `SemanticKernelV2`'s cascade into the plugin-based
`SemanticResolutionKernel` structure, or vice versa — pick one implementation and delete the
other) rather than maintaining two hand-synchronized rule tables.

## 6. IR Lineage/Caching Metadata Is Declared but Never Used

**Where**: `IRMeta { version, stableHash, lineage, createdAt?, tags? }` in
`packages/core/src/types/semantic.ts` (see `IntermediateRepresentation.md`).

**Cost**: every `scan` is a full cold re-extraction (re-boots the whole Laravel app, re-runs
every reflection call, re-resolves every field from scratch) — there is no cache invalidation
based on file mtimes, git diffs, or the `stableHash` the IR spec explicitly reserves a field
for. For a large Laravel app (hundreds of routes/models), this is a real, measurable
`scan --models` latency cost paid on every single invocation, including `watch` mode's
re-scans on every file save. This is not a "developer must write code" boilerplate cost, but it
is a "developer must wait" cost the IR's own design anticipated solving and the implementation
has not yet delivered.

**Fix direction**: compute `stableHash` per extracted unit (route/model/resource) from its
source file mtime + reflected signature, skip re-resolution for unchanged units, and only
recompute the manifest's changed subset — turning `watch` mode from "full rescan on every save"
into genuinely incremental compilation.

## 7. Confidence Is Computed but Not Consumed Downstream

**Where**: every generator (`SDKGenerator`, `HookGenerator`, `ZodTierGenerator`) reads
`resolved.type`/`resolved.model`/`resolved.collection` but never reads `resolved.confidence`.

**Cost**: a field resolved at confidence 50 (the `ExpressionResolver`/`PrimitiveResolver`
default-with-no-evidence floor) is emitted into generated TypeScript with exactly the same
unconditional certainty as a field resolved at confidence 100 from a real DB column — there is
no generated warning comment, no `// TODO: verify` annotation, nothing that surfaces "this type
is a guess" to the developer reading the generated `api-read.ts`. Combined with §5's confidence
inconsistency, this means confidence is currently pure diagnostic exhaust for `routesync audit`
— useful for a manual, opt-in health check, but invisible in the artifact a developer actually
works with day to day.

**Fix direction**: have `ZodTierGenerator`'s type/mapper emission attach a one-line comment
above any field resolved below a threshold (e.g. confidence < 90), pointing at
`routesync explain <path>` — turning the existing trace data into an in-context nudge instead of
a separate command a developer has to remember exists.
