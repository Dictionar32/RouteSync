# Phase 120 — Data-Loss / Data-Model / Data-Flow Escalation Audit

## Rule

> Naikkan pengetahuan menjadi data model; jangan menurunkan pengetahuan menjadi control flow.

The previous Phase 119 audit was correct for the **routeAst navigation boundary**, but it was not yet a repository-wide data-model audit. This phase therefore distinguishes three layers:

1. **navigation mechanics** — positional cursor arithmetic is allowed here;
2. **syntax/domain model** — Laravel meaning must be represented as facts, catalogs, policies, relations, and tagged data;
3. **data flow** — every datum must retain source → producer → model → consumer provenance.

A reusable typed audit vocabulary was added at:

`packages/core/src/compiler/scanner/audit/dataModelAudit.ts`

The audit findings themselves are now data (`DataLossFinding`) rather than another branch-heavy semantic parser.

## Findings in the current checkpoint

The earlier claim of "zero data loss" must be narrowed: it is true for the specific Phase 119 positional/navigation checks, but **not** for every free datum in `routeAst`.

### 1. Positional arithmetic

The remaining `position - 1`, `position + 1`, `position + 2`, and cursor advancement occur inside `TokenCursor`.

**Classification:** navigation boundary — retained.

The arithmetic must not leak into semantic producers. This agrees with Tree-sitter's field/named-node navigation model. citeturn0search3turn0search6

### 2. `if` / `while`

Remaining branches in `TokenCursor`, delimiter navigation, syntax range, and top-level parsers are generic traversal/guard mechanics. They are not, by themselves, data loss.

**Required invariant:** Laravel vocabulary such as `middleware`, `whereIn`, `middlewareFor`, route method families, and group semantics must continue to be represented by model data/catalogs, not parser branches.

### 3. `undefined` / optional properties

The checkpoint still contains semantic-facing optional data such as:

- `RouteDeclarationAst.groupController?: ...` equivalent through `| undefined`;
- route constraint `value: ... | undefined` and optional `values`;
- resource parser helpers returning `T | undefined`;
- route-group state optional fields.

These are **not automatically data loss** at a syntax-navigation boundary, but they become a data-model problem when semantic absence is meaningful and is exposed downstream as a raw JavaScript absence.

`Presence<T>` already exists in `types/upstream/presence.ts`. The next elevation should therefore make `Presence` the boundary representation rather than repeatedly converting absence back into `undefined`.

### 4. `null`

No `null` literal was found in the current route-AST source set. The audit rule remains because Laravel/PHP source can contain explicit null semantics and PHP's null-coalescing operator changes the meaning of absence versus null. citeturn0search11turn0search4

### 5. Ternary / `??`

No actual TypeScript `??` was found in the current route-AST implementation. The apparent ternary hits are optional chaining/regex or expression syntax such as `?.`, not conditional expressions.

**Important:** the audit must distinguish syntax operators from textual `?` occurrences. A regex parameter marker such as `{id?}` is data, not a ternary.

### 6. `Record<string, T>`

The current syntax model still contains broad `Readonly<Record<string, T>>` catalogs. These are better than scattered `if/switch`, but an open string-keyed record is still weaker than a closed vocabulary model.

**Escalation:** replace open catalogs with closed typed catalog entries or a named catalog ADT where the key vocabulary is explicit.

This matters because the goal is not merely "no if"; the goal is preserving the complete domain vocabulary as model data.

### 7. `as T` casts

The syntax model still contains casts used to bridge dynamic token lookup into typed catalog keys. These are producer-boundary leaks: the producer should refine a datum into its ADT before exposing it.

**Escalation:** introduce typed catalog/refinement constructors so consumers receive an already-refined relation and do not inherit the cast.

### 8. Accumulation / overwrite

Group constraints are already append-only after Phase 118/119. This is important because Laravel documents nested route groups as merging `where` conditions and middleware while prefixes/names are appended. citeturn0search0

The same append-only rule must be applied to every multi-value datum: middleware arrays, constraint values, actions, route names, parameters, and resource middleware declarations.

## Laravel source knowledge that must become data flow

The current external contract requires these facts to survive extraction:

- route groups share attributes and nested groups merge middleware and `where` conditions;
- `whereIn` carries multiple constraint values;
- resource middleware supports all-action and action-scoped forms;
- `middlewareFor` can contain multiple actions and multiple middleware values;
- `withoutMiddlewareFor` is an exclusion relation rather than a replacement value.

Laravel's current documentation explicitly describes these behaviors. citeturn0search0turn0search2

The corresponding RouteSync flow should therefore be:

`Laravel source → syntax producer → typed syntax fact → semantic ADT → composed data flow → downstream consumer`

not:

`Laravel source → parser if/switch/ternary → guessed value → consumer`.

Tree-sitter's current parser model reinforces this separation: named fields and named nodes are intended to expose semantic structure instead of making consumers depend on ordered child positions. citeturn0search1turn0search3

## New implementation boundary

`dataModelAudit.ts` defines:

- `DataLossFindingKind`
- `DataModelBoundary`
- `DataLossFinding`
- `DataFlowDatum`
- `DataModelAuditReport`
- `DATA_MODEL_ESCALATION_RULES`
- `dataFlow(...)`
- `auditReport(...)`

This is deliberately a **model of the audit**, not another semantic control-flow engine.

## Next implementation target

The next elevation should proceed in this order:

1. `TokenCursor` → keep positional arithmetic private as navigation relations.
2. `routeSyntaxModel` → replace open `Record<string, ...>`, casts, and `undefined` semantic results with typed catalog/presence ADTs.
3. `routeDeclarationAst` / resource AST → expose semantic absence through `Presence`, not raw `undefined`.
4. Route-group and constraint facts → preserve all values append-only.
5. Connect `DataFlowDatum` provenance to the real Laravel source scanner so every model fact carries source/producer/model/consumer identity.
6. Only after this boundary is complete, continue upward into model/property/expression/assignment/Eloquent data flow.

## Validation statement

This phase does **not** claim a repository-wide TypeScript/test pass. The checkpoint is a phase-focused route-AST workspace and its previous validation explicitly noted missing complete repository dependencies. The architectural audit therefore separates confirmed navigation invariants from remaining model-elevation work.
