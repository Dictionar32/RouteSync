# Phase 1551 — Route-domain closed judgment and scanner reasoning ownership

## Model change

`RouteDomainResolutionJudgment` no longer exposes only a projected `result` and a generic `closed: true`. It now carries:

- `selected: RelationOption<RouteDomainCandidate>` — source-derived evidence or explicit absence;
- `outcome: candidate_selected | default_applied` — prevents the fallback `App` from masquerading as an inferred domain;
- a stable precedence rule identity;
- `authority: upstream` and `closed: true`.

The canonical authority remains `routeDomainAuthority`. The scanner `RouteDomainResolver` is only a compatibility projection. No second resolver or solver was added.

## Ownership rule

- Scanner may parse syntax and collect source evidence.
- Upstream semantic authorities own candidate ranking, precedence, domain classification, constraint resolution, and final semantic judgment.
- Runtime executor may delegate to authority; it may not infer a competing answer.
- Consumers should use the judgment when provenance or default-vs-inferred status matters, rather than reverse-engineering it from the projected `result`.

## Scanner trace interpretation

`PHASE1550_SCANNER_REASONING_INVENTORY.json` accounts for all scanner TS/TSX files and records candidate signals. It is heuristic, not proof that every flagged file performs semantic reasoning. The next migration should trace the candidate clusters through imports and consumers, beginning with AST/domain classifiers, route-group resolvers, model/type derivation, and resource mapping.

The goal is not to move parsing mechanics into `types/upstream`. The goal is to remove domain inference and authority decisions from scanner code while preserving syntax evidence production there.
