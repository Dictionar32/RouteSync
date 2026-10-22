# Phase 2278 — Action Judgment Independent of Legacy Projection

## Trace finding

The production action authority already invokes upstream request, body, response-reference, schema, dependency, resource-binding, and runtime-return authorities. It then calls `actionContractResolver.resolve(...)` and previously read semantic fields back from that legacy consumer contract to construct the canonical action judgment. That made the sibling projection contract an accidental source for canonical semantic publication.

## Change

- Canonical action judgment fields are now composed directly from the already-produced upstream judgments and the exact method evidence.
- `createActionName(input.method.name)` derives the action identity from the method evidence at the semantic authority boundary.
- `actionContractResolver.resolve(...)` remains in place solely to produce `publication.projection` for existing compiler consumers.
- The existing action semantic contract is evolved from version 48 to 49 to record this ownership boundary.
- No new semantic authority or duplicate interface was introduced.

## Remaining work

- The legacy projection resolver still exists and still assembles a compiler-facing `ControllerActionContract`; it is not retired in this phase.
- The return semantic adapter still delegates to `controllerAstCanonical`.
- Transitive `semantic/relations` dependencies remain elsewhere in the controller dataflow/AST path; this phase does not claim to remove them.
- Full CLI consumer migration, typecheck, and build are not claimed.

## Validation

Run `node scripts/audits/audit-phase2278-action-judgment-independent-from-projection.cjs`.
