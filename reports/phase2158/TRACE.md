# Phase 2158 Trace — Response Presence Ownership

## Before

`resolveControllerActionContract` called `matchResponse(response, visitor)` and rebuilt the same response-presence semantic judgment in each variant branch. `matchResponse` is an exhaustive visitor dispatcher, not a semantic contract. The consumer therefore repeated a rule already knowable at descriptor construction.

## After

`ResponseDescriptorBase` extends `ResponseDescriptorPresenceContract` and every descriptor constructor publishes `semanticPresence`:

- `resource` -> `response_present`
- `model` -> `response_present`
- `inline` -> `response_present`
- `void` -> `response_absent`

The action contract now consumes `response.semanticPresence`. That exact judgment continues to feed return semantics, controller dataflow, and the published action contract.

## Scope

No new authority, relation/foundation, or subscanner was introduced. `matchResponse` remains available for genuinely variant-specific visitors, but it is no longer used to reconstruct response presence in the action contract consumer.

## Validation

- Phase 2156 updated audit: 12/12 static checks passed.
- Phase 2157 body authority audit: 15/15 static checks passed.
- Phase 2158 interface contract audit: 12/12 static checks passed.
- Syntax-only transpilation: 4 changed TypeScript files, 0 syntax diagnostics.
- Full build, full typecheck, and Vitest were not run.
