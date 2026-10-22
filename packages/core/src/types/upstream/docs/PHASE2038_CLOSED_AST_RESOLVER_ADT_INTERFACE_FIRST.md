# Phase 2038 — Closed AST Resolver ADT, Interface First

## Trace finding

The Phase 2037 resolver contract exposed `resolveLegacy?` and `deriveLegacy?` as optional callbacks under one `legacy_adapter` tag. That admitted invalid contract states (neither callback, or both callbacks) and forced runtime to interpret callback presence. This is a contract-shape defect, not a reason to add another scanner or foundation layer.

## Change

`AstClassificationResolverContract` now distinguishes three closed cases:

- `kind: 'judgment'`: required resolver returns `AstRuleResolution`.
- `kind: 'legacy_adapter', input: 'tokens'`: required token resolver.
- `kind: 'legacy_adapter', input: 'context'`: required context resolver.

The runtime dispatches on the declared ADT discriminant instead of optional callback presence. The single-token expression rule now emits `AstRuleResolution` directly rather than passing through `RelationOption`; this is a boundary migration, not a claim that all token classification internals are relation-free.

## Preserved architecture

- Existing `astClassificationRuleAlgebra` remains the single ordered arbitration authority.
- Assignment, match, cast, and compound rules keep their canonical judgment path.
- Laravel invocation semantic judgment and integrated response wiring are unchanged.
- No `relation` or `foundation` subscanner is introduced.

## Verification boundary

Run `npm run audit:phase2038-closed-ast-resolver-adt-interface-first` and the relevant earlier audit scripts. This audit is source-contract verification; it does not replace a full TypeScript type-check or package build.
