# Compiler Architecture Audit: Generator Semantic Leakage

> **Status**: Completed Refactor
> **Target**: `packages/cli/src/generators/HookGenerator.ts` → `packages/cli/src/resolvers/IntentResolver.ts`

---

## 1. The Core Issue: Generator Doing Semantic Inference

Prior to this audit, the `HookGenerator` was performing database schema and Eloquent relationship analysis directly during the code generation (emission) phase. It was attempting to scan:
- Routes to match the GET endpoints of the group.
- Eloquent models to find parent-to-child `hasMany` relationships.
- Column definitions to search for quantity-like fields (`qty`, `quantity`, `jumlah`).
- Foreign key definitions to detect child identity mapping keys.

This was a major violation of the RouteSync compiler pipeline design:

```
Laravel (PHP) ──> Extractor ──> Manifest (IR) ──> Semantic Resolution (Middle-End) ──> Generator (Dumb Emitter)
```

The Generator is supposed to be **100% dumb and deterministic**, simply translating resolved intent blocks from the manifest/graph into target code. Doing inference inside the emitter couples frontend target generation with Laravel database semantics, making target extensions (e.g. React Native, Vue, Flutter) extremely complex and redundant.

---

## 2. Refactored Architecture (Deterministic Emission)

We introduced a dedicated middle-end compilation step using the new class **[IntentResolver](file:///home/annas-zen/Documents/RouteSync/packages/cli/src/resolvers/IntentResolver.ts)**.

### Middle-End Pass: `IntentResolver`
The resolver executes immediately after reading the manifest, but before any generators run:
- It parses routes, models, columns, and relations once.
- It identifies cart/domain structures and resolves all schema keys (`itemsField`, `itemKey`, `qtyField`, `itemsGroupName`, `promoGroupName`).
- It populates the resolved attributes directly inside the manifest's `frontend.domains` config metadata block.

### Emitter: `HookGenerator`
The emitter is now completely dumb:
- It merely reads the pre-resolved attributes from `manifest.frontend.domains[groupName]`.
- It prints the generic `useCartIntent` hook invocation using those deterministic parameters.
- It contains no Eloquent models search, no column matching, and no regex heuristics.

---

## 3. Benefits & Vision Realized
- **Deterministic Emitters**: The code generator is now a pure mapping function.
- **Portability**: Support for Vue/other frameworks can consume the exact same pre-resolved metadata without needing backend domain logic replication.
- **Strict Verification**: Output compiled successfully under Next.js production builds with zero type castings and zero build-time warnings.
