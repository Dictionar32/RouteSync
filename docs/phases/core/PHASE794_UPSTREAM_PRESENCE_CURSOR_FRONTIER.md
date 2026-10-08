# Phase 794 — Upstream Presence Cursor Frontier

## Diagnostic frontier

The authoritative DTS frontier was `packages/core/src/semantic/kernel/syntax/relationalSyntaxCursor.ts`.
The failure family had one root cause: the navigator introduced a second presence algebra (`CursorPresence`) while relation APIs consume `RelationOption`, and delimiter navigation consumed `DelimiterInput = RelationOption<string>` but received the upstream `Presence` witness.

## Trace

`TokenCursor` -> `relationalSyntaxCursor.ts` -> `types/upstream/presence.ts` / relation sequence -> delimiter navigation -> scanner syntax facts.

The consumer was therefore corrected at the semantic boundary rather than by casts or host-sentinel narrowing.

## Model elevation

- `CursorPresence<T>` is now an alias of upstream `Presence<T>`; no second presence ADT is introduced.
- Presence branching uses `presenceFold`, keeping the upstream `absent | present` judgment authoritative.
- Token-to-delimiter conversion is an explicit relation witness: `TokenDescriptor | void` is converted once into `RelationOption<string>` through the upstream presence fold before entering `DelimiterInput`.
- Cursor token predicates are presence-aware adapters, so `TokenDescriptor | void` never reaches semantic token classifiers as free data.
- `tokenSyntaxFact` is consumed through a presence-aware cursor adapter; no property access is performed on a relation witness before its variant is folded.
- `delimiterNavigation` separates its mapped delimiter relation catalog from the closed `other` variant, so token lookup no longer accesses a field that is absent from the `other` ADT case.

## Laravel ecommerce workload

The syntax cursor remains syntax evidence only. Laravel ecommerce meaning stays in the upstream AST/semantic relation layer. Existing workload contracts in the repository continue to model Product/Order/Request/Resource/controller evidence through semantic relations and the highest AST/dataflow judgment; no ecommerce parsed descriptor is added to the cursor layer.

## Legacy rule

No `Parsed*Descriptor` authority is introduced. No compatibility descriptor is added. The cursor only transports syntax evidence toward the existing upstream semantic interface.

## Verification

A focused strict TypeScript declaration check over `relationalSyntaxCursor.ts` and its imported dependency graph reports no diagnostics for `relationalSyntaxCursor.ts` or `delimiterNavigation.ts` after this phase.

The full repository `npm run build` is not claimed here because the sandbox checkpoint does not contain the workspace's installed `tsup` dependency (`tsup: not found`). The user's local build remains authoritative for the final DTS result.
