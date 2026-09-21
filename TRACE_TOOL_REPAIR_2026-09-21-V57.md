# Trace Tool Repair — V57

## Order
1. Repair auditor
2. Re-run trace
3. Validate first-loss
4. Recommend high-level interface only after proof
5. Production repair only where source-backed

## V57 tool repairs
- `channels` is classified as an upstream vocabulary extension gap, not a proven canonical SourceAsts data-loss critical finding.
- RouteScanner legacy delegation is deduplicated and classified as a route canonicalization defect.
- Added route-specific provenance audit: RouteAst requires SourceSpan while ParsedRoute does not expose a full span.
- Added explicit detection of missing RouteAst producer instead of treating the TypeScript return annotation as proof.
- High-level type declarations remain excluded from production value-flow evidence.

## V57 trace
- ecommerce-shop PHP files: 111
- status: UNPROVEN
- critical: 30
- high: 42
- unproven: 10
- semantic field loss: 0
- mapping unproven: 4
- lineage unproven: 4
- return mismatches: 1
- delegate mismatches: 1
- hidden rescans: 2
- pipeline rescans: 6
- nested project-root rescans: 8
- free-data observations: 13

## Proven model first-loss result
The eight traced model values (`table`, `primaryKey`, `keyType`, `incrementing`, `fillable`, `guarded`, `hidden`, `appends`) have no proven first-loss in the actual production path.

## Proven route first-loss
The route canonical boundary has a real provenance gap:

`RouteDeclarationAst.source` → `ParsedRoute.provenance` → `RouteAst.source`

`RouteAst` requires `SourceSpan`, while `ParsedRoute` exposes only source file/line/URI. The existing `RouteScanner.scanAsts()` also returns `ParsedRoute[]` through the legacy scanner rather than constructing `RouteAst`.

Therefore the safe repair target is the existing route provenance owner, not a new parallel interface and not a type cast.

## High-level interface decision
Do not add fields to `ModelSemanticNode` or create a parallel model interface. `ModelFacts` remains the semantic owner.

## Production repair gate
BLOCKED for RouteAst until the existing route declaration AST preserves a complete source span and that span is carried through the existing route owner. A cast from `ParsedRoute` to `RouteAst` is explicitly prohibited.
