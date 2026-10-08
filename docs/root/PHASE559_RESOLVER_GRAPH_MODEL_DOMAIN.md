# Phase 559 — Resolver Graph + Model/Domain Declarative Cutover

Phase 559 extends the declarative semantic relation frontier from the Phase 558 compiler scanner/model domain surface into the remaining resource-model resolver graph.

## Architecture

The resolver path is now expressed as:

`evidence -> candidate -> relation witness -> projection -> rewrite/result`

The implementation uses the existing relation substrate (`relationResolve`, `relationEqual`, `relationProject`, `relationFold`, `relationLookup`, `relationOptionFold`) instead of host-language branching/collection combinators.

## Cutover

- scanner/lexer source frontier re-audited as one closed surface;
- `resourceModelMethodResolverOperation` converted from imperative array traversal/absence checks to relation fold/project/option resolution;
- `resourceModelMethodResolver` converted to relation-gated semantic dispatch;
- `resourceModelMethodResolverProjection` converted to relation-gated member and handler resolution;
- `resourceModelSurface` converted to relation projection and relation-gated property/relation witnesses;
- `SemanticTypeResolvers` namespace absence test converted to relation equality.

Target-language PHP evidence remains data; the audit is AST-based and does not treat string/lexical evidence as host-language control flow.

## Verification

`PHASE559_RESOLVER_GRAPH_MODEL_DOMAIN_AUDIT.json` verifies every non-test TypeScript file under the scanner root plus the resolver/model-domain files above using TypeScript AST inspection and per-file transpilation.
