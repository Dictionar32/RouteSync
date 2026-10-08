# Phase 767 — Upstream Name/Policy Authority Frontier

## Diagnostic frontier

The Phase 766 DTS frontier was not a missing cast. `authAndPolicy.ts` still
contained a second `AbilityName` semantic type with `value: string`, while the
upstream route security algebra required `AbilityName.value: StringValue`.
The same module also referenced `RouteSecurityDescriptor` without a local
canonical type binding and duplicated `RoutePolicyDescriptor` rather than
consuming the upstream route algebra.

## Model elevation

The semantic authority is now:

Laravel source evidence
→ closed AST
→ upstream names/value objects
→ upstream route security/policy ADTs
→ resolver judgments
→ relation closure/fixed point
→ declarative rewrite
→ canonical Laravel route semantics
→ Next.js projection

`AbilityName` is owned by `types/upstream/names.ts`; its payload is the
canonical `StringValue`. The domain semantic-values module re-exports that
upstream type instead of defining a second primitive-string authority.

`RouteSecurityDescriptor` and `RoutePolicyDescriptor` are consumed from the
upstream route algebra. The domain module no longer defines a second policy
ADT. The policy registry is metadata over the canonical ADT and uses
`TruthValue`/`StringValue` rather than raw semantic booleans/strings.

## Legacy rule

No parsed descriptor ontology is introduced to satisfy the DTS frontier.
The legacy semantic-resolution adapter remains empty. The fix raises the
interface and removes duplicate authority instead of adding assertions or a
compatibility conversion in the capability builder.

## Next frontier

The next architectural sweep must continue upward through scanner/lexer,
resolver graph, AST/upstream mapping, analysis/data-flow, semantic-type
lowering, diagnostic algebra, generic solver and rewrite engine. Host control
flow and collection operations must be removed from semantic authority by
replacing them with relation folds, closed variants, indexed relations and
fixed-point judgments; source-language tokens remain valid scanner evidence.
