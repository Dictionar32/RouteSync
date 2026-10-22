# Phase 2307 — Controller constructor authority alignment

## Trace

`CLI scan → controller invocation manifest composition → LaravelControllerScannerInterface.scan → LaravelControllerScannerExecutor → controller declaration closure → constructor selection authority → action judgment inputs`.

The attribute producer already consumes `PhpClassConstructorSelectionAuthorityInterface`, but the controller scanner independently selected `__construct` using `declaration.methods.find(...)`. That left two consumers with different constructor selection semantics.

## Change

- Reuse the existing upstream `PhpClassConstructorSelectionAuthorityInterface`; no second selector contract was introduced.
- Inject the same authority into `LaravelControllerScannerInterface` and its executor.
- Convert controller method evidence to the authority's source-correlated input and consume its judgment.
- A missing constructor remains valid for controller scanning and yields no constructor parameters; this differs from attribute production, where constructor absence blocks producing an attribute expression.
- An ambiguous constructor now blocks the whole controller scan before action/response/AST work. No first-match selection occurs.
- Advance `LaravelControllerScannerInterface` contract version from 40 to 41.

## Boundaries

The selector's missing outcome is consumer-interpreted because PHP permits classes without a locally declared constructor, while attribute production requires constructor body evidence. Ambiguity is a declaration-integrity failure for both consumers. The controller scanner preserves that failure as a closed scan judgment rather than repairing it locally.

This phase does not remove transitive `semantic/relations` dependencies from the expression authority, and does not claim full typecheck/build/runtime verification. The structural audit only verifies the intended source boundary.
