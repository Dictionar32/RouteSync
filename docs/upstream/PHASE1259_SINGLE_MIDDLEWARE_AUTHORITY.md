# Phase 1259 — Single Upstream Middleware Authority

The route middleware semantic resolver has one executable authority: the
upstream scanner lane. The historical wiring path is now only a compatibility
re-export and contains no semantic implementation. Wiring may transport or
adapt the already-owned semantic result, but it must not duplicate applicability
or exclusion reasoning.

```text
Laravel evidence
    -> upstream middleware relation/closure
    -> closed policy/dataflow authority
    -> wiring
    -> downstream projection
```

This follows the same boundary principle used by MLIR interfaces and CodeQL
data-flow configurations: semantic/modeling logic has one declared authority,
while consumers operate through an interface/model boundary.
