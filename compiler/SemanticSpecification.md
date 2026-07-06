# RouteSync Semantic Specification

This document specifies the actual resolution rules implemented by **both** kernels in the
codebase. As established in `CompilerArchitecture.md` §4, there are two independent
implementations; this document treats `SemanticKernelV2` as canonical (it is the one used
during `scan`, the path every generator's output ultimately depends on) and calls out where
`SemanticResolutionKernel` (used only by `audit`/`explain`) diverges.

## 1. `SemanticKernelV2.resolve(node, context)` — Rule Order

`packages/core/src/semantic/SemanticKernelV2.ts` is a single `resolve()` method that tries
rules in the following order, returning on first match. This ordering **is** the specification
— there is no separate rule-priority table anywhere else in the code.

| # | Pattern | Result |
|---|---|---|
| A | `kind: "primitive"` | Resolved as-is, confidence 100 |
| B | `method_call`/`new_instance` whose target is a `resource` node | `type: "resource"`, confidence 100 |
| C | `method_call` on `property_access` named `.collection` with a `resource` field | `type: "resource", collection: true` |
| D | `new_instance` whose target property ends in `Resource` | `type: "resource"`, confidence 90 (heuristic suffix match — the one place `SemanticKernelV2` accepts a naming convention instead of hard evidence) |
| E | `kind: "variable"` | Delegates to `resolveVariable()` (§2 below) |
| F | `kind: "resource"` / `kind: "model"` | Resolved as-is, confidence 100 |
| G | `kind: "static_method_call"` on a resolved model, method in `{all, get, paginate, cursorPaginate}` | `type: "model"`, `collection`/`paginated` flags set based on method name |
| H | `kind: "type_cast"` | `int`/`float`→number, `string`→string, `bool`→boolean |
| I | `kind: "binary_expression"` | `??` returns whichever side resolves non-unknown first; otherwise if either side is `number`, result is `number` |
| J | `kind: "ternary"` | Returns whichever of `truthy`/`falsy` resolves first (short-circuit, not full union) |
| K | `method_call` with no target, name in a fixed global-helper allowlist (`asset,url,route,ltrim,trim,strval,strtoupper,strtolower`→string; `intval,floatval,doubleval,count`→number; `boolval`→boolean) | Resolved as primitive |
| L | `method_call` with a target — a large cascade (see §3) | Varies |
| M | `property_access` / `nullsafe_property_access` with a target | Field/relation/accessor lookup against the loaded `ServiceGraph` (see §4) |
| — | Anything else | `status: "unknown"`, trace `"Unsupported AST kind: <kind>"` (the explicit strict-mode default — see `Constitution.md` §2) |

### Rule L in detail — method calls with a target

Checked in this sub-order, first match wins:

1. **Conditional wrappers**: `whenLoaded('rel')` resolves through the *current model's*
   loaded `ServiceGraph` relation metadata (looks up `$this`'s model, then
   `modelNode.relations[relationName]`, resolving to that relation's target model with
   `collection` set for `hasMany`/`belongsToMany`/`morphMany`/`morphToMany`/`morphedByMany`).
   `whenLoaded(cond, value)`, `when(cond, value)`, and `mergeWhen(cond, value)` all just resolve
   their `value` argument (2-arg form).
2. **Auth user detection**: `$request->user()`, `auth()->user()`, `Auth::user()` → hardcoded
   `type: "model", model: "User"`, confidence 100. (Note: this assumes the User model is
   literally named `User` — not derived from `config('auth.providers.users.model')`.)
3. **Carbon date methods** (`toDateTimeString, toISOString, toIso8601String, format,
   diffForHumans, toDateString, toDateTime`) on any target → `string`, inheriting the target's
   confidence.
4. **Eloquent query builder cascade** — only fires if the target already resolved to
   `type: "model"`:
   - `all|get|paginate|cursorPaginate` → same model, `collection: true`,
     `paginated` true only for the paginate variants.
   - `find|findOrFail|first|firstOrFail|create` → same model, `collection: false`.
   - `count|sum|avg|min|max` → `number`.
   - `exists|doesntExist` → `boolean`.
   - `pluck|toArray|jsonSerialize` → `array`.
5. **`createToken`** (Sanctum) → synthetic `type: "object"` with `fields: { plainTextToken:
   "string" }` — this is the *only* place the kernel hardcodes a specific third-party
   package's API shape rather than deriving it from reflection.
6. **`validated`/`safe`** (FormRequest) → `type: "object"` (unstructured — no field-level
   typing, since the kernel does not re-parse the FormRequest's `rules()` at this call site).
7. **Query builder passthrough** (`where, whereIn, orderBy, select, join, groupBy, having,
   limit, with, withCount, load, has, whereHas, query`, etc. — 30 method names) — if the target
   was already a resolved model, the builder method is a no-op for typing purposes; the
   original model resolution passes through unchanged.

### §2 — `resolveVariable(name, context)`

1. `$this` resolves to the current file's owning model name, derived from `context.layer`:
   for `resource` layer, strips a trailing `Resource` off `context.fileName`; for `model`
   layer, uses `context.fileName` directly.
2. Otherwise checks `context.resolvedAssignments[name]` (already-resolved local var — memoized).
3. Otherwise checks `context.assignments[name]` (raw AST not yet resolved) and recurses.
4. Otherwise does a **case-insensitive** lookup of `name` against `this.graph.models` keys
   (confidence 80), then a **capitalized-first-letter** lookup (confidence 70) — this is the
   kernel's fallback for an unassigned bare variable that happens to share a model's name
   (e.g. a controller parameter `$produk` typed as `Produk $produk`, whose type hint isn't
   tracked by the kernel itself — this fallback substitutes for that gap).
5. Otherwise `unknown`.

### §3/4 — Property access resolution against the loaded graph

For `$target->property`, once `target` resolves to `type: "model"`:

1. Check `modelNode.fields[property]` (a real DB column, camelCase-cast-aware) first.
2. Check `modelNode.relations[property]` second (relation traversal).
3. Check `modelNode.accessors[property]` **or** `modelNode.accessors[camelCase(property)]`
   third — accessor lookup is case-insensitive-by-convention so a PHP `getProdukNamaAttribute`
   accessor (stored under key `produk_nama`) still matches a resource field access spelled
   `produkNama`.
4. If the target resolved to `type: "object"` (not a model — e.g. `validated()`'s output) with
   a `fields` map, look up the property there instead.
5. Otherwise `unknown`, trace `"Property not found in Schema Model ..."`.

## 5. `SemanticResolutionKernel` (introspection-only) — Divergences from `SemanticKernelV2`

`packages/cli/src/resolvers/SemanticResolutionKernel.ts` + its `plugins/*` implement an
overlapping but **not identical** rule set, worth documenting because `routesync explain` will
sometimes justify a type using different reasoning than the one that actually produced it
during `scan`:

- It is **plugin-ordered**, not a single cascading function: `PrimitiveResolver` →
  `ModelColumnResolver` → `AccessorResolver` → `ResourceGraphResolver` → `MethodReturnResolver`
  → `ExpressionResolver` → `FrameworkRegistryResolver` → an inline fallback
  (`meta.kind === 'model'` → resolved model, confidence 100). Each plugin declares
  `canResolve(meta)` and the kernel picks the *first* plugin whose predicate matches — meaning
  plugin **order in the constructor array is itself part of the specification** (e.g.
  `ModelColumnResolver` is checked before `AccessorResolver`, so a `model_column` meta node can
  never accidentally be treated as an accessor even if both keys exist on the model).
- `PrimitiveResolver` explicitly downgrades any primitive with `confidence < 80` to `unknown` —
  a confidence *gate* that `SemanticKernelV2`'s Rule A does not have (Rule A accepts primitives
  at any confidence). This is the one place in the entire codebase where confidence is used as
  an active gate rather than passive metadata (contradicting the general rule stated in
  `Constitution.md` §7 — see `ZeroBoilerplate.md` for this called out as an inconsistency).
- `FrameworkRegistryResolver` maintains its *own*, smaller hardcoded table
  (`strtoupper, strtolower, ucfirst, ucwords, intval, floatval, boolval, now`) distinct from
  `SemanticKernelV2`'s Rule K allowlist (`asset, url, route, ltrim, trim, strval, strtoupper,
  strtolower, intval, floatval, doubleval, count, boolval`) — the two lists are neither a subset
  nor equal (e.g. `ucfirst`/`ucwords`/`now` exist only in one; `asset`/`url`/`route`/`ltrim`/
  `trim`/`strval`/`doubleval`/`count` exist only in the other).
- `ModelColumnResolver`/`AccessorResolver` route their SQL/cast type mapping through
  `context.kernel.mapSqlTypeToTs`/`mapCastToTs` — methods implemented redundantly on
  `SemanticResolutionKernel` itself, textually identical to the copies inlined in `scan.ts` and
  (functionally) to what `SemanticKernelV2`'s callers do — three copies of the same
  `sqlType.toLowerCase()` branching logic exist in the codebase (`scan.ts` inline, in
  `SemanticResolutionKernel.ts`, and conceptually re-derived per-column when `scan.ts` builds
  `graphModels` before ever calling the kernel).

## 6. Confidence Values Actually Used

Confidence is not a continuous score derived from a formula — it is a small set of hardcoded
constants chosen per-rule to reflect how much evidence backs the answer:

| Confidence | Meaning (as used) |
|---|---|
| 100 | Direct reflection evidence: PHP 8 attribute, real DB column, explicit primitive/type-cast, resource/model literal |
| 90 | Strong pattern match without a formal contract: `Resource` suffix on `new_instance` target; Eloquent query-builder single/collection returns; binary/ternary results; accessor resolution from a resolved cache |
| 80 | Case-insensitive variable-name-to-model match; primitive resolver's floor for accepting a value (below this, treated as unknown) |
| 70 | Capitalized-variable-to-model fallback match |
| 50 | `PrimitiveResolver`'s default confidence when the source AST supplied none |
| 0 | Any `status: "unknown"` result |

There is no interpolation, decay, or aggregation formula (e.g. no "average of sub-field
confidences" for an object type) — a composite `object` type's own confidence is simply
whatever the last write to it set, independent of its fields' individual confidences.
