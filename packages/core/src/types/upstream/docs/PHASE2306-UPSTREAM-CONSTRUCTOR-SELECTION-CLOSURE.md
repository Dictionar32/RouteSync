# Phase 2306 — Upstream PHP Constructor Selection Closure

## Change

Added `PhpClassConstructorSelectionAuthorityInterface` and its existing-instance authority implementation in `types/upstream`. The interface carries parser-owned method payloads generically so upstream does not import scanner AST types. Its result is a closed ADT: `php_class_constructor_selected`, `php_class_constructor_missing`, or `php_class_constructor_ambiguous`.

The authority recognizes PHP's case-insensitive method names and refuses to silently select the first of multiple constructor declarations. The attribute producer no longer performs `declaration.methods.find(...)`; it forwards declaration evidence to the injected authority and projects the resulting judgment. Missing and ambiguous constructor outcomes propagate through `LaravelAttributeScanFailure` and the manifest diagnostic boundary.

## Existing contracts evolved

- `AttributeProducerInterface`: contract v3 → v4, because constructor selection authority is now an explicit dependency and ambiguity is a distinct blocked outcome.
- `LaravelAttributeScannerInterface` and its complete/blocked judgments: contract v18 → v19, because the failure ADT gained `laravel_attribute_constructor_ambiguous`.
- The canonical pipeline composition root and scanner implementation both publish v19.

No second Laravel attribute scanner interface was created. The existing controller declaration authority was not reused because its constructor exclusion means “not an executable action,” which is semantically different from selecting a constructor for attribute construction. The separate controller dependency-injection constructor lookup remains open for a later, consumer-specific migration; this phase does not claim that path is closed.

## Trace

`CLI scan` → manifest composition → `LaravelSourceAstPipeline` → `LaravelAttributeScannerInterface v19` → parsed class method evidence → injected `PhpClassConstructorSelectionAuthorityInterface` → selected/missing/ambiguous judgment → `AttributeProducerJudgment` → closed scanner result → manifest diagnostic.

## Boundaries

- The authority uses no `semantic/foundation` or `semantic/relations` imports.
- The existing expression authority still has transitive `semantic/relations` dependencies; this phase does not claim their removal.
- Typecheck, package build, and runtime integration tests were not run. The phase audit is structural only.
