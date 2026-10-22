# Phase 2183 — Interface-first DTO response-contract projection

## Trace finding

Phase 2182 resolves the controller response attribute to one canonical DTO declaration and retains that judgment in integrated response evidence. It does not yet define a typed contract for mapping the resolved DTO's public fields into `ResponseContract`. Declaration resolution and response-contract projection are distinct judgments: the former proves which declaration is requested; the latter must prove that every public field has a representable response value type, canonical name, nullability, and provenance.

## Interface introduced

`laravelDtoResponseContractProjectionInterface.ts` defines the contract before implementation or wiring:

- `LaravelDtoResponseContractProjectionInput` accepts only a `response_dto_declaration_resolved` judgment and the response shape already observed on the controller attribute.
- `LaravelDtoResponseContractProjectionJudgment` is a closed resolved/unresolved ADT.
- A resolved outcome carries the canonical `ResponseContract`, per-field projections, the exact declaration judgment, and declaration provenance.
- An unresolved outcome names the blocked semantic obligation and retains source provenance.
- `LaravelDtoResponseContractProjectionInterface` owns projection semantics.
- `LaravelDtoResponseContractProjectionRuntimeExecutorInterface` only describes transparent delegation; no executor implementation is introduced in this interface-first phase.

## Explicit non-goals

This phase does not implement type-expression conversion, wire the projection into integrated response, alter invocation semantic judgment, or delete legacy response-descriptor paths. Those changes must follow only after this contract is reviewed and its type mapping obligations are specified against the existing `TypeExpression` and `ResponseValueContract` ADTs.

No relation/foundation layer, subscanner, or parallel integrated-response authority is introduced.
