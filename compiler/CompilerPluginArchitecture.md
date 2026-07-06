# RouteSync Compiler Plugin Architecture

Source of truth: `packages/cli/src/resolvers/SemanticResolutionKernel.ts`,
`packages/cli/src/resolvers/plugins/*`, `packages/core/src/semantic/SemanticKernelV2.ts`,
`packages/cli/src/generators/*`.

## 1. The Irony This Document Starts From

RouteSync already has a working plugin dispatcher. It is just wired to the wrong pipeline.

`SemanticResolutionKernel` — used **only** by `audit`/`explain`, i.e. introspection, never by
the code path that actually produces generated output — is a clean `ResolverPlugin[]` array with
a `canResolve(meta) → boolean` / `resolve(meta, context) → SemanticResolution` interface:

```ts
// packages/cli/src/resolvers/SemanticResolutionKernel.ts
this.plugins = [
  new PrimitiveResolver(),
  new ModelColumnResolver(),
  new AccessorResolver(),
  new ResourceGraphResolver(),
  new MethodReturnResolver(),
  new ExpressionResolver(),
  new FrameworkRegistryResolver(),
  { canResolve: (meta) => meta.kind === 'model', resolve: (meta) => ({ /* fallback */ }) }
];
```

Meanwhile `SemanticKernelV2` — the kernel `scan`/`sync` actually call, i.e. the one whose output
ships to every RouteSync user — is a single ~350-line method with a long sequence of
`if (normalizedAst.kind === '...')` branches (`SemanticSpecification.md` §1 documents the full
rule order). Adding a new resolution rule today means finding the right point in that cascade and
inserting another `if`; there is no seam a contributor — or a future framework-specific plugin
package — can attach to without editing the kernel's own source.

**The plugin architecture this document proposes is not new invention. It is: delete the
cascade, keep the dispatcher, and make sure the dispatcher's rule set is feature-complete** (this
is `CompilerRefactorPlan.md` Phase A, step 2 in detail).

## 2. Target Pipeline Shape

```
Pipeline → Plugin → Resolver → Generator
```

- **Pipeline**: the ordered stages already named in `CompilerPipeline.md`
  (`annotate → scan → generate`) — unchanged by this document.
- **Plugin**: a `canResolve`/`resolve` unit exactly like today's `ResolverPlugin` interface,
  registered into the kernel's dispatch list. This layer answers "can I make sense of this IR
  node, and if so, what does it resolve to."
- **Resolver**: the kernel itself (`SemanticResolutionKernel`, post-Phase-A the *only* kernel) —
  owns dispatch order, cycle detection (`CycleDetector`, already implemented), and the
  fallback-to-`unknown` behavior. It does not itself know framework-specific rules; it only knows
  how to ask each plugin "can you handle this."
- **Generator**: consumes the manifest post-resolution, unchanged in interface from today's
  `GeneratorSpecification.md` generator classes, but see §4 below for the generator-level
  equivalent of the same problem.

## 3. Semantic Plugin Registry: What Exists vs. What's Missing

The current seven plugins already cover most of `SemanticKernelV2`'s cascade. Per
`SemanticSpecification.md` §1, the gaps to close in Phase A step 2 are:

| `SemanticKernelV2` rule (cascade branch) | Target plugin |
|---|---|
| Explicit primitives | `PrimitiveResolver` (exists) |
| `Resource::collection()` / `new Resource()` | `ResourceGraphResolver` (exists, verify coverage) |
| Variable resolution (`$this`, assignments) | New: `VariableResolver` |
| Model/resource literal nodes | `ResourceGraphResolver`/`ModelColumnResolver` (exists) |
| Static method calls (`Model::all()` etc.) | `MethodReturnResolver` (exists, verify coverage) |
| Type casts (`(int)`, `(bool)`, ...) | `PrimitiveResolver` or new `TypeCastResolver` |
| Binary expressions incl. `??` | New: `ExpressionResolver` extension |
| Ternary expressions | New: `ExpressionResolver` extension |
| `whenLoaded`/`when`/`mergeWhen` wrappers | New: `ConditionalWrapperResolver` |
| Auth user detection (`auth()->user()`, etc.) | New: `AuthResolver` or `FrameworkRegistryResolver` extension |
| Carbon date methods | `FrameworkRegistryResolver` extension |
| Eloquent builder method allowlist (`where`, `orderBy`, ...) | `MethodReturnResolver` extension |
| Sanctum `createToken` | `FrameworkRegistryResolver` extension |
| `validated()`/`safe()` | `FrameworkRegistryResolver` extension |
| Property access against resolved object/model fields | `ModelColumnResolver`/`AccessorResolver` (exists) |

This table is the literal migration checklist for Phase A step 2 — each row must have a plugin
and a corresponding test before `SemanticKernelV2.ts` can be deleted.

## 4. The Same Problem One Level Up: Generators

`GeneratorSpecification.md` lists 15 generator classes, each independently deciding what to
check for and emit (does the manifest have `channels`? emit `EchoGenerator`. does it have
`pages`? emit `RoutesGenerator`. is `--zod` passed? run `ZodTierGenerator`, and — per
`ZeroBoilerplate.md` §4 — *also* unconditionally run the legacy `SchemaGenerator`). Every new
Laravel-ecosystem feature RouteSync wants to support today means: a new generator class, plus a
new conditional branch added to `generate.ts`'s call sequence.

The roadmap's Stage 6 (`CompilerRoadmap.md`) names concrete future generator plugins that would
sit behind this same seam instead of each requiring a `generate.ts` edit:

- `LaravelResourcePlugin` — the "does this route return a Resource" detection currently spread
  across `annotate.ts` and `SemanticKernelV2`'s `resource`-kind handling.
- `FormRequestPlugin` — the `FormRequest::rules()` extraction currently embedded directly in
  `ZodTierGenerator`.
- `PolicyPlugin` — Laravel authorization policies; no current RouteSync support.
- `BroadcastPlugin` — currently `EchoGenerator`, gated by `manifest.channels` presence; a
  reasonable first plugin to convert since it's already conditionally-invoked.
- `SanctumPlugin` — currently a special case inside `SemanticKernelV2` (`createToken`) with no
  generator-side counterpart.
- `LivewirePlugin` / `InertiaPlugin` — no current support; named here as the kind of addition
  this architecture is meant to make cheap, not as committed scope.

**This is explicitly listed as future work, not part of `CompilerRefactorPlan.md`'s three
phases.** The refactor plan's Phase A/B/C are about consolidating what exists; a generator plugin
registry is new infrastructure that should be designed only after Phase A proves the
resolver-side plugin pattern holds up under a real migration (i.e. don't build the second plugin
system before validating the first one survived contact with `SemanticKernelV2`'s full rule set).

## 5. Design Constraint Carried Forward from `CompilerVision2030.md`

If a plugin interface is designed narrowly around "resolves to a TypeScript type," it will need
to be redesigned the moment a second target runtime (Vue — which already exists in
`packages/vue`, or a hypothetical Flutter/OpenAPI target) needs the same resolution but a
different emission shape. The `Resolver`/`Generator` split above already separates "what does
this mean" from "what do I emit for it" for exactly this reason — plugins should register against
the Resolver stage in framework/domain terms (Laravel concepts), never in target-language terms
(TypeScript types), keeping the emission decision entirely inside the Generator stage where it
already lives today.
