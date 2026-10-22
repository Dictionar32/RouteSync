# Phase 2002 — Parser Return Evidence, Interface First

## Trace finding

The controller method parser already records `ControllerMethodAst.returns`, with a return-keyword token and a parsed expression source range. The scanner previously dropped those parser observations when projecting `ControllerMethodEvidence`; response production therefore only saw the controller-action descriptor candidate. That erased useful source evidence before the response semantic authority could evaluate it.

## Contract change

`ControllerMethodEvidence` now requires `returnExpressions: readonly ControllerReturnExpressionEvidence[]`. The upstream evidence contract stores the full return statement span, the exact expression span, and a closed `PhpAstExpressionKind`. It does not expose the concrete scanner AST node across the upstream boundary.

The response evidence ADT now distinguishes:

- `observed_controller_return`: a parser-observed PHP return expression with provenance and syntax kind;
- `controller_action_response_reference_candidate`: a descriptor-derived candidate, explicitly not relabeled as parser evidence.

A canonical method observation retains the same method evidence, action, parser return observations, and both evidence kinds. The producer flattens the evidence without discarding origin. Source binding still uses `LaravelSourceIdentitySemanticsInterface`; the response authority does not promote a syntax observation to a resolved response product.

## Runtime integration

`laravelControllerScanner.ts` projects the already-existing `ControllerMethodAst.returns` into the upstream evidence contract, then the existing pipeline correlates declaration source, produces evidence, binds every evidence item, executes response judgment, and forwards the invocation/response pair to the existing AST projection authority.

## Boundaries

- No new `relation/foundation` subscanner was added.
- Existing legacy `semantic/relations` references were not removed by this phase.
- Parser-observed return syntax is not by itself a complete semantic response product. Response judgment remains blocked until a later authority can classify the expression under an explicit response contract.
- Full project typecheck/build was not run successfully; the current dependency graph has pre-existing diagnostics unrelated to the modified response-contract files.

## Audit

Run `npm run audit:phase2002-parser-return-evidence-interface-first`.
