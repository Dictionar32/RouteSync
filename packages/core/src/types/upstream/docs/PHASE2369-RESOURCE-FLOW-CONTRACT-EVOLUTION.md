# Phase2369 — Resource Flow Contract Evolution

The existing `RouteResourceActionPlan` was incomplete for its active consumer: the resource emitter had to derive `runtimePath` and `constantKey` after receiving the upstream judgment. The plan now carries both values, and the emitter consumes them directly.

The existing `RouteResourceFlowJudgment` and `RouteResourceFlowAuthority` are evolved to contract version 2; no duplicate authority or `v2` interface was introduced. `deriveRouteConstantKey` is now owned beside the upstream `RoutePath` constructors rather than by the scanner's boundary resolver.

The resource branch in `laravelRouteScanner.ts` now passes the declaration path and group prefix to the resource authority without first calling `resolveRoutePath`. The authority owns the resource path plan including the `/api` projection. Standard and query routes still use the existing path parser.

The direct `semantic/relations` dependency was removed from `routeResourceFlow.ts`. This is not a repository-wide or scanner-wide dependency removal: `laravelRouteScanner.ts` and `routeEmitter.ts` still use relation operations for other work, and the active scanner still imports emitter/registration operations from `subscanners/route-scanner`.

Static audit evidence: `audit-phase2369-resource-flow-contract-evolution.cjs` (10 checks), focused Phase2360–Phase2367 audits. TypeScript validation did not pass due to unrelated existing compile errors and missing Node type declarations; CLI end-to-end validation remains outstanding.
