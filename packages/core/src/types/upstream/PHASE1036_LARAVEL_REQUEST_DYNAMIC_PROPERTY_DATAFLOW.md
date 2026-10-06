# Phase 1036 — Laravel Request Dynamic-Property Dataflow

## Frontier

Laravel `Illuminate\Http\Request` supports dynamic input properties such as `$request->qty`.
The ecommerce fixture uses this form in controller reads, query predicates, and Eloquent mutations.

## Change

`semanticDataflowRequestProjection.ts` now recognizes a property expression as raw request input only when its receiver is the controller action's bound request variable.

This produces the same canonical request lineage used by `input/query/string/integer/...` without treating arbitrary object properties as request input.

## Authority boundaries

- `DataFlowInterface` remains execution-only: `seed`, `derive`, `close`, `reaches`.
- Request projection emits seed facts only.
- Assignment and query identities remain scanner-owned.
- Manifest remains seed aggregation only.
- Graph remains structural projection and does not solve closure.
- IR consumes the closed semantic-dataflow judgment and does not reconstruct it.
- Model relation and schema remain structural evidence unless an explicit semantic projection proves value flow.

## Upstream evidence

Laravel 13 documents dynamic request properties and states that Laravel first checks request payload input, then matched route parameters. This means `$request->qty` is legitimate request-input evidence, not merely an ordinary PHP property access.
