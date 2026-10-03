# Phase 602 — Scanner / AST Relational Frontier

RouteSync is treated as a domain-specific compiler: Laravel route/source evidence is lowered through canonical semantic Route Contract IR and projected to Next.js.

## Research basis

The frontier follows declarative compiler patterns documented by MLIR PDLL/PDL: patterns have explicit match and rewrite sections; PDL itself represents rewrite patterns as IR. egglog combines Datalog-style deductive reasoning with equality saturation and fixed-point execution. These ideas are applied as architecture guidance, not as a claim that RouteSync implements those systems wholesale.

## Changes

- `phpAstFactory.ts` remains a structural syntax witness catalog rather than a class/constructor object; its object-method syntax was repaired so the baseline parses.
- `request-deriver/groupAggregator.ts` moved keyed aggregation from host `Map` mutation to `RelationIndex` tuples plus `relationIndexAdd`/`relationIndexLookup`.
- request/resource lookup is now relation-backed and immutable.
- the empty archived `types/semantic/__archive__/parsedAstTypes.ts` file was removed because it had no active consumer; the live `types/semantic/parsedAstTypes.ts` remains.

## Boundary

Source vocabulary such as `if`, `for`, `null`, and `new` inside PHP syntax AST kinds is evidence vocabulary and is not treated as host-language authority. Host implementation constructs are the target of the relational cutover.

## Validation

Modified files were independently TypeScript-transpiled with zero diagnostics. Full project `tsc` is environment-blocked by missing `node` and `vitest/globals` type definitions.
