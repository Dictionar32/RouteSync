# Phase 768 — Security Authority Cleanup

## Diagnostic frontier

The Phase 767 DTS frontier was a stale `CanonicalRouteSecurityDescriptor` identifier in
`types/domain/authAndPolicy.ts`. The canonical upstream authority is already
`RouteSecurityDescriptor`; the stale name represented a duplicate vocabulary rather than a missing implementation.

## Model elevation

This phase removes that duplicate name instead of adding an alias descriptor.

`RouteSecurityClassifier.classify` now returns the upstream `RouteSecurityDescriptor` directly.

`AbilityName` construction also routes through the upstream `createAbilityName` constructor rather than
through the domain `SemanticValueFactory`. This prevents the domain semantic-value factory from becoming
a second authority for an upstream name ADT.

The intended semantic flow remains:

Laravel source evidence → closed AST → upstream route/security ADTs → relation facts → fixed-point closure
→ diagnostic judgment → declarative rewrite → canonical Laravel route semantics → Next.js target projection.

## Next frontier

The security classifier still has procedural host syntax and raw middleware text at the scanner boundary.
The next architectural step is to move middleware classification into relation facts and a closed security
classification judgment, while preserving source-language tokens as evidence only.
