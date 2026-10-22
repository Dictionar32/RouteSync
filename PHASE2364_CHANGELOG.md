# Phase 2364 — Resource source evidence contract

## Root cause addressed

`RouteDeclarationAst` already retained the resource action filter and the `shallow`, `scoped`, `creatable`, and `destroyable` modifiers, but `RouteDeclarationEvidence` did not. The producer projection therefore had to read these resource facts directly from the scanner AST when building `RouteResourceRegistration`.

## Change

- Evolved the existing upstream `RouteDeclarationEvidence` with `RouteDeclarationResourceEvidence`.
- Represented action-filter presence with a closed ADT: `unfiltered`, `only`, or `except`.
- Preserved all four resource modifier facts in that evidence.
- Projected declaration AST to evidence once inside `routeProducerInputFromRouteBoundary` and used that evidence for resource registration modifiers.
- Reused existing contracts; no new authority/interface or duplicate v2 contract was introduced.

## Scope and limits

This is a focused contract improvement, not completion of the overall interface-first route-emission architecture. Route emission decisions, route method judgment, authorization, and other `RouteProducerInput` fields still need end-to-end authority and consumer tracing. The path still imports relation utilities and subscanner modules; this phase does not claim those constraints are resolved.

## Verification

Run `node scripts/audits/audit-phase2364-resource-evidence-contract.cjs`. This is a static source-contract audit, not a TypeScript type-check or CLI integration test.
