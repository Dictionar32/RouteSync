# RouteSync Compiler Refactor Plan

Three sequential phases, each shippable independently, each unblocking the next. Every step
names the exact file(s) touched and the backlog item(s) (`CompilerBacklog.md`) it closes. No step
here proposes new capability — only consolidation of what already exists into one deterministic
path, per `Constitution.md` §2 and §5.

## Phase A — Unify the Semantic Kernel

**Closes**: H1. **Unblocks**: Roadmap Stage 6.

```
SemanticKernelV2  (if/else cascade, used by scan/sync — live)
SemanticResolutionKernel  (ResolverPlugin[] dispatcher, used by audit/explain — introspection-only)
                    │
                    ▼
              unify (pick one shape)
                    │
                    ▼
          remove the duplicate kernel
```

1. **Decide the target shape first.** `SemanticResolutionKernel`'s plugin dispatcher
   (`canResolve`/`resolve`, `packages/cli/src/resolvers/plugins/*`) is architecturally the one
   worth keeping — it is already the shape `CompilerPluginArchitecture.md` recommends for Stage
   6. `SemanticKernelV2`'s cascade is not a plugin dispatcher; it is what needs to be *rewritten
   into* one.
2. **Port `SemanticKernelV2`'s rule coverage into `ResolverPlugin` classes.** `SemanticKernelV2`
   currently covers cases the existing seven plugins don't (e.g. `whenLoaded`/`when`/`mergeWhen`
   conditional wrappers, Carbon date methods, Sanctum `createToken`, the full Eloquent builder
   method allowlist — see `SemanticSpecification.md` §1). Each of these becomes a new
   `ResolverPlugin` (or an addition to `ExpressionResolver`/`MethodReturnResolver` where the
   existing plugin's `canResolve` scope already fits), not a port of the `if` statement itself.
3. **Re-point `scan.ts`/`sync.ts` at the (now feature-complete) `SemanticResolutionKernel`**,
   replacing the `SemanticKernelV2Impl` import.
4. **Delete `SemanticKernelV2.ts`, `ASTNormalizer.ts`'s now-unused branches, and the duplicated
   `mapSqlTypeToTs`/`mapCastToTs`** (closes L2 as a side effect — do not schedule it separately).
5. **Verification gate**: run `routesync scan --models` then `routesync explain <path>` against
   `ecommerce_shop-main` for every route currently resolved with confidence < 100 before the
   refactor; the resolved type and trace must be identical before/after. This is the concrete
   acceptance test for "the two kernels no longer disagree."

**Risk**: this is the largest single change in the plan — it touches the code path every
`generate` run depends on. Land it behind the existing `scan`/`generate` command boundary with
the verification gate in step 5 as a hard merge requirement, not a follow-up task.

## Phase B — Generators Become Dumb

**Closes**: H2, M1, M2, M3. **Unblocks**: Roadmap Stage 5.

```
Generator (decides + emits)
        │
        ▼
   becomes dumb (emits only)
        │
        ▼
  inference moves upstream (into the manifest / semantic layer)
```

1. **Design the domain-recipe manifest schema** (closes M1): replace the literal
   `frontend.domains.cart === 'cart'` check with a declared shape, e.g.
   `frontend.domains.cart = { role: "cart", itemsGroup: "cartItems", promoGroup: "cartPromo",
   itemKey: "produkItemId" }`. This is a schema decision, not a code change, and should be
   written up and agreed before step 2.
2. **Rewrite `HookGenerator.ts`'s cart block (H2) to read the declared shape** instead of
   deriving `itemsGroupName`/`promoGroupName` by string-matching sub-paths. The generator's job
   shrinks to "given a declared domain role, emit the wrapper" — it stops doing the detection
   work itself.
3. **Collapse `generateForm()`/`generateSchema()` into one canonical walk** (M2): make
   `ApiFormValues['{Group}{Action}']` a type alias referencing `{Group}Form['{Action}']` rather
   than a second independent derivation from raw `FormRequest::rules()`.
4. **Gate `SchemaGenerator` behind "only if `--zod` was not passed"** (M3), making it a real
   fallback instead of an always-on duplicate of `ZodTierGenerator`'s output.
5. **Verification gate**: re-generate `ecommerce_shop-main/frontend/src/api` before/after and
   diff. Steps 2–3 should produce byte-identical output for the existing cart/form shapes (proves
   the refactor is a pure restructuring); step 4 should be the only step that changes file output
   (removal of the redundant `schemas.ts` when `--zod` is passed).

## Phase C — Manifest Becomes True IR

**Closes**: H3, H4 (decision), M4, M5, M6. **Unblocks**: Roadmap Stages 2–4.

```
Manifest (flat, re-derived every scan)
        │
        ▼
    true IR (SemanticIRNode is the real unit, not a transient wrapper)
        │
        ▼
    stable hash (computed, not hardcoded)
        │
        ▼
  incremental compile (skip unchanged nodes)
```

1. **Make `SemanticIRNode` construction real** (Roadmap Stage 2): every resolved field becomes an
   addressable node with a real `id`/`source`, not just a shape instantiated transiently in
   `packages/sdk/src/generator.ts`.
2. **Compute `stableHash` per node** (closes H3) from source file mtime + reflected signature.
   Persist the previous run's hashes (e.g. alongside `routesync.manifest.json`) so `scan` can
   diff against them.
3. **Skip re-resolution for unchanged nodes**, wiring `watch.ts` to only recompute the manifest's
   changed subset — this is the incremental compilation Roadmap Stage 3 describes.
4. **Wire `ServiceGraphBuilder.ts` into `scan.ts`** (closes M4), giving invalidation in step 3 a
   real dependency graph to propagate through instead of file-local invalidation only.
5. **Resolve H4**: either delete `CompilerBackendGenerator`/`SdkGenerator`/`ZodToTSEmitIR`/
   `TSPrinter` outright, or mark them experimental in `@routesync/sdk`'s exports if a future
   migration is genuinely intended. This decision should be made *before* Stage 2's IR shape
   change, since a shape change otherwise has to be applied to a fourth, dead consumer for no
   reason.
6. **Add a schema check that `routesync.manifest.json` and `routesync.graph.json` cannot drift**
   (closes M5) — e.g. a test that re-derives one from the other and diffs.
7. **Attach a generated comment for any field resolved below a confidence threshold** (closes
   M6), e.g. `// ⚠ inferred at 50% confidence — see routesync explain <path>` above the affected
   field in `ZodTierGenerator`'s output.
8. **Verification gate**: `scan --models` on `ecommerce_shop-main` twice with no source changes
   between runs; the second run's manifest must be byte-identical and should short-circuit
   resolution for every node (measurable via a `--verbose` node-recompute counter added in step 2).

## Phase Ordering Rationale

Phase A before Phase B: Phase B's domain-recipe schema (step B1) is easier to design once there
is one semantic kernel to trust for what a "resolved shape" looks like, and Phase B's dumb
generators are a smaller surface to re-verify against once Phase A's verification gate has
already proven kernel-output stability. Phase B before Phase C: Phase C's `SemanticIRNode` shape
change (C1) should not have to account for the cart-specific and dual-form-generation branches
Phase B removes — landing C1 first would mean designing IR v3 around code paths already known to
be deleted.
