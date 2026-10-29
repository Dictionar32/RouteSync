# Phase 2983 — Upstream Semantic Knowledge Runtime Operations

## Principle

**Naikkan pengetahuan menjadi data model; jangan menurunkan pengetahuan menjadi control flow.** Runtime entry points should be explicit typed operation objects (`export const name: Interface = Object.freeze({...})`). Domain ADTs should continue the decision through their own operations rather than exposing payloads for every consumer to reinterpret.

## Implemented slice

`packages/core/src/types/upstream/semanticDataflowKnowledge.ts` no longer imports the removed generic relation foundation. Its local `SemanticKnowledgeSelectionOperationsInterface` owns these domain questions:

- Which semantic assignment effect describes an assignment operator?
- Which assignment-reference definition matches the reference mode?
- Which evidence provider is the parser provider?
- Which semantic data-flow role describes a role code?
- How does an optional flow guard become explicit `SemanticPresence` data?

This is a vocabulary-specific authority, not a replacement generic relation/collection framework. `SemanticPresence<T>` continues to carry `continueWith(handlers)`, so callers can continue from the `present`/`absent` judgment without reconstructing its meaning from a raw nullable payload.

## Runtime trace — source evidence to manifest / IR

```text
PHP / Laravel source evidence
  └─ routes, controllers, resources, models
       ↓
scanner / source readers
  └─ preserve source path, source span, and evidence provider
       ↓
core/src/types/upstream
  ├─ semanticDataflowKnowledge.ts
  │    └─ semanticKnowledgeSelectionOperations
  │         ├─ assignment effect judgment
  │         ├─ assignment-reference judgment
  │         ├─ source evidence selection
  │         ├─ data-flow role resolution
  │         └─ optional guard → SemanticPresence ADT
  └─ semanticDataflowInputProducer / semantic projection authorities
       ↓
CLI composition
  └─ scan command invokes the service-graph builder factory
       ↓
manifest graph compilation / assembly
  └─ graph-local sequence traversal and graph projection authorities
       ↓
ServiceGraph → manifest / IR consumers
```

This trace describes the established pipeline and the specific upstream slice changed in Phase 2983. It does **not** claim that every upstream, CLI, manifest, or IR import has been migrated. The historical `build.log` is an older snapshot and reports 230 unresolved imports, so it is evidence of existing migration debt, not a validation run against this workspace revision.

## Laravel evidence alignment

Laravel routing defines routes in route files and supports controller-action references, route parameters, and resource-controller conventions. RouteSync should preserve those as source evidence and typed domain facts; TypeScript interface-typed runtime operation objects are RouteSync architecture, not Laravel syntax. References: [Laravel Routing](https://laravel.com/framework/docs/routing) and [Laravel Controllers](https://laravel.com/framework/docs/12.x/controllers).

## Audit findings and next migration targets

1. Continue from `semanticDataflowKnowledge.ts` into `semanticTypedRelation.ts` and adjacent upstream consumers, one domain owner at a time; do not recreate `relationMembership`, `relationalSequence`, or `semanticRelations`.
2. Trace importers from upstream into CLI composition, manifest projection, and IR consumption using actual build output from the current workspace when dependencies are available.
3. Inventory exported runtime functions and arrows on those exact execution paths. Convert them to `export const name: NameInterface = Object.freeze({...})` where the named interface represents a real domain operation, and migrate call sites in the same change.
4. Keep control flow that genuinely recognizes syntax in scanner/parser code; move semantic interpretation out of control-flow branches into explicit typed judgments.
5. Do not fill `packages/core/src/types/upstream/collections.ts`; it remains an empty compatibility boundary.

## Verification limits

Run `node scripts/audits/audit-phase2983-upstream-knowledge-runtime.cjs`. This audit is structural. Full workspace build and full tests are not claimed because local dependencies are absent and the historical build log is not a current run.
