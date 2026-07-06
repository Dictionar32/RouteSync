# RouteSync Contract Graph

Source: `packages/core/src/types/semantic.ts` (`ServiceGraph` and friends),
`packages/core/src/graph/ServiceGraphBuilder.ts`, `scan.ts`'s `graphModels` construction,
`route-classifier.ts`, and `routesync.graph.json` from a real scan.

## 1. What "The Graph" Actually Is (Two Meanings)

The word "graph" is used for two different artifacts in this codebase, and they should not be
confused:

1. **`routesync.graph.json`** — the fully-resolved *manifest* (routes + models + resources with
   every field's semantic resolution attached). This is what `audit`/`explain` read. It is not
   graph-shaped in a nodes-and-edges sense; it's a resolved document, named "graph" because it
   represents the fully-elaborated dependency closure of every type in the app.
2. **`ServiceGraph`** (the actual typed graph structure in `types/semantic.ts`) — a real
   nodes-and-edges structure `{ services, controllers, models, edges }`, used *internally*
   during resolution as the in-memory model registry `SemanticKernelV2` queries via
   `this.graph.models[name]`. `scan.ts` builds one of these (`graphModels`) purely as a lookup
   table for column/relation/accessor data — it never populates `services`, `controllers`, or
   `edges` at all (they stay `{}`/`[]`). `ServiceGraphBuilder.ts` is a separate, more complete
   builder for that structure that exists but is not invoked anywhere in the current CLI
   pipeline (see §5).

## 2. `ServiceGraph` Node Types

```ts
interface ServiceGraph {
  services: Record<string, ServiceNode>
  controllers: Record<string, ControllerNode>
  models: Record<string, ModelNode>
  edges: ServiceDependency[]
}

interface ModelNode {
  kind: "model_node"
  name: string                      // "Order"
  table?: string                    // "orders"
  fields?: Record<string, string>   // column name → TS type
  relations?: string[]              // (spec says string[]; scan.ts actually stores the richer
                                     //  { [name]: { type, model } } shape here — see §3)
  layer: "model"
  confidence: number
}

interface ControllerNode {
  kind: "controller_node"
  name: string
  routes: string[]
  actions: ControllerAction[]
  layer: "controller"
  calls: string[]                   // service methods it triggers
  confidence: number
}

interface ServiceNode {
  kind: "service_node"
  name: string
  namespace?: string
  methods: string[]
  layer: "service"
  dependencies: ServiceDependency[]
  confidence: number
}

interface ServiceDependency {
  from: string
  to: string
  type: "calls" | "composes" | "depends_on_model" | "uses_repository"
  weight: number   // 0-1
}
```

## 3. What `scan.ts` Actually Populates (vs. the Full Spec)

`scan.ts` builds `graphModels: Record<string, any>` and calls `kernel.loadGraph({ services: {},
controllers: {}, models: graphModels, edges: [] })`. Each entry:

```ts
{
  kind: 'model_node',
  name: m.name,
  table: m.table,
  fields: { [colName]: { type: castedType, nullable } },   // richer than the ModelNode spec's
                                                              // Record<string,string> — includes
                                                              // nullability, not just a bare type string
  relations: m.relations,     // { [relationName]: { type: 'belongsTo'|'hasMany'|..., model } }
                               // — an object keyed by relation name, not the string[] the
                               // ServiceGraph interface declares
  accessors: m.accessors,     // { [accessorName]: { expression_code, parsed_ast, expression } }
                               // — not part of the ModelNode interface at all; an ad-hoc
                               // extension added because the kernel needs it
  layer: 'model',
  confidence: 1.0              // note: 1.0, not 100 — inconsistent scale vs. every other
                                 // confidence value in the system, which is 0-100
}
```

This is the concrete evidence that `ServiceGraph`/`ModelNode` as declared in `semantic.ts` is
an aspirational, coarser schema than what the resolution kernel actually needs and uses at
runtime. The real shape has three fields (`fields` nullability, `relations` object shape,
`accessors`) the type declaration doesn't capture, and one confidence unit mismatch (1.0 vs.
0–100 scale used everywhere else). None of this breaks anything today because the kernel reads
these fields dynamically (`as any` casts throughout `SemanticKernelV2.ts`), but it means the
`ServiceGraph`/`ModelNode` TypeScript types do not actually type-check the object shape that
flows through the system — they're documentation, not enforcement.

`services`, `controllers`, and `edges` are always empty/`{}` in the current pipeline. The
`ServiceDependency`/`ServiceNode`/`ControllerNode` types and the entire "map service-to-service
calls" capability the spec describes (comment: "SERVICE GRAPH INTELLIGENCE LAYER (IR v2
EXTENSION)") is unimplemented — no code anywhere populates a `ServiceNode` or a
`ServiceDependency`. This capability appears designed for a future feature (likely: tracing
`OrderController → OrderService → Order model` chains for more accurate response inference when
business logic sits in service classes rather than directly in controllers) that has not been
built yet.

## 4. The Route Classification Graph (What Actually Groups Endpoints Today)

The graph structure that **is** fully implemented and load-bearing is `route-classifier.ts`'s
grouping, which is a different, simpler kind of "graph": a flat mapping from route → resource
group → CRUD slot, built with zero reference to `ServiceGraph` at all.

- **`deriveGroupName(path)`**: walks path segments; static segments accumulate into a "bucket,"
  a dynamic segment (`{id}` / `:id`) with any static segment after it flushes the bucket as a
  completed sub-resource boundary; a *trailing* dynamic segment is ignored (belongs to the
  current resource). Example from the classifier's own docstring:
  `/cart/items/{produkItemId}` → group `cartItems` (trailing param stripped);
  `/produk/{id}/reviews` → group `produkReviews` (mid-path param is a boundary).
- **`classifyCrudRole(method, hasTrailingParam, paramCount)`**: a pure lookup table —
  `GET` + trailing param + exactly 1 param → `show`; `GET` + no param → `index`; `POST` + no
  param → `create`; `PUT`/`PATCH` + trailing param → `update`; `DELETE` + trailing param →
  `delete`; everything else → `custom`.
- **`buildResourceMap(classified)`**: groups classified routes by `groupName`, and for each
  group records first-wins slots for `index`/`show`/`create`/`update`/`delete` plus an `all`
  array (including `custom` routes, e.g. `POST /cart/promo` inside the `cart` group).

This is the graph every generator (`SDKGenerator`, `HookGenerator`, `ZodTierGenerator`) actually
walks to decide what to emit — not `ServiceGraph`. It is deliberately "zero heuristics" per its
own docstring: grouping is 100% a function of URL path shape, never of controller name, method
name, or model name.

## 5. `ServiceGraphBuilder.ts` — Present but Unwired

`packages/core/src/graph/ServiceGraphBuilder.ts` exists as a builder for the fuller
`ServiceGraph` shape (services/controllers/edges), but nothing in `packages/cli/src/commands/*`
or `packages/cli/src/generators/*` imports or calls it. Like `CompilerBackendGenerator`
(`CompilerArchitecture.md` §5), this is implemented-but-unused code — most plausibly an
earlier or future attempt at the "map business logic call chains" feature the `ServiceGraph`
type spec gestures at, not currently wired into the `scan`/`generate` pipeline.

## 6. Edges That Do Exist: Eloquent Relations Driving Cache Invalidation

The one place a real cross-resource "edge" concept is used in generated output is
`HookGenerator`'s Eloquent-relation-aware cache invalidation (referred to in
`.claude/skills/run-routesync/SKILL.md` as "strategy 5"): the generator walks the scanned
model relations (`belongsTo`/`hasOne`/`hasMany`) to decide which `QueryKey` entries a mutation
on one resource should invalidate on another (e.g. creating a `CartItems` mutates `Order`'s and
`Keranjang`'s list queries). This is a real, working edge-traversal capability — but it lives
entirely inside `HookGenerator.ts`'s own logic over the *manifest's* `relations` data, not over
the formal `ServiceGraph`/`ServiceDependency` types declared in `semantic.ts`. The formal graph
types and the actual cache-invalidation graph-walking code are, once again, two unconnected
implementations of a similar idea.
