# Phase 756 — Highest AST Authority + Diagnostic Frontier

## Diagnostic-first correction

The Phase 755 checkpoint could not run `npm run build` because the uploaded workspace does not contain the local dependency installation (`tsup` is absent). Rather than hiding that state, this phase establishes a dependency-independent compiler diagnostic for the highest AST boundary.

The targeted TypeScript compiler check now covers the canonical AST, the cross-stage AST semantic interface, and their direct dependencies. That targeted check passes with zero diagnostics.

## Structural correction

### 1. AST authority is a closed registry

`AstJudgmentRegistry` is now the explicit closed registry from which `AstJudgment` is formed. `SemanticAstNode` and `CanonicalAstNode` remain projections of `AstJudgmentContract`, not second AST schemas.

This preserves the type-level relationship needed by the generic constructor algebra while making the closed registry explicit to audits and downstream interfaces.

### 2. Cross-stage semantic facts have one constructor authority

The stage interface now owns the closed stage fact constructors for:

- scanner evidence
- upstream mapping
- resolver graph
- analysis
- semantic type lowering
- target projection

The stage relation vocabulary is explicitly typed at both contract and projection boundaries. Literal relation tables therefore cannot widen into free `string[]` values.

### 3. Stale stage-interface diagnostics removed

The previous diagnostic frontier contained missing stage fact constructors, missing `AstSemanticStage` export visibility, and widened relation literals. These are now resolved at the semantic interface rather than by casts or compatibility overloads.

A direct TypeScript compiler run over the highest AST interface returns zero diagnostics.

### 4. Parsed descriptor vacuum is preserved

There is no production `ParsedDescriptor`/`parsedDescriptor` authority. The old parsed-AST reservoirs remain zero-byte files after the reference audit:

- `types/semantic/parsedAstAlgebra.ts`
- `types/semantic/parsedAstTypes.ts`
- archived parsed-AST reservoirs
- `semanticResolutionLegacyAdapter.ts`

No compatibility implementation was restored.

## Architectural trace

```text
Laravel source evidence
        ↓
closed PHP AST judgment
        ↓
scanner-evidence relation facts
        ↓
upstream mapping relations
        ↓
resolver graph closure
        ↓
analysis/data-flow closure
        ↓
semantic type lowering relations
        ↓
constraint / fixed-point closure
        ↓
semantic rewrite engine
        ↓
Next.js target projection
```

The important boundary is the judgment/fact/derivation algebra, not the particular traversal algorithm. This is consistent with MLIR PDLL's explicit match/rewrite separation, CodeQL's tuple-valued logical predicates, WebAssembly's declarative validation rules, and circular reference attribute grammars' fixed-point evaluation model. citeturn0search0turn0search5turn0search4turn0search1

## Remaining highest frontiers

The next work is not another compatibility cleanup. The remaining leaks are concentrated in:

1. PHP parser boundary adapters and parser evidence compatibility fields;
2. incremental scanner models that still expose legacy raw records;
3. resolver graph candidate/closure contracts;
4. analysis data-flow stores;
5. semantic type lowering compatibility boundaries;
6. diagnostic payloads that still use host optional/primitive carriers.

Those should be replaced by closed ADTs whose facts, witnesses, provenance, diagnostics, and derivations are consumed through relation folds and fixed-point/rewrite evaluation.

## External domain trace

Laravel ecommerce source ecosystems reinforce the need for a graph rather than isolated route descriptors: product/catalog, cart, checkout, orders, payments, inventory, customer/address, and admin flows appear as connected route/resource domains. One recent Laravel ecommerce project also explicitly combines Laravel with a Next.js storefront, which is close to RouteSync's intended source-to-target ecosystem boundary. citeturn1search0turn1search7

## Verification

- targeted highest-AST TypeScript diagnostics: **PASS**
- parsed descriptor production leak: **none**
- legacy parsed-AST reservoirs: **empty**
- Phase 751–755 structural audits: **PASS**
- full `npm run build`: still blocked only by missing checkpoint dependencies; the user's locally installed build remains authoritative
