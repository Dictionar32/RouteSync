# Phase 1780 — PHP Invocation Interface-First Migration

## Scope

This phase evolves the existing upstream contracts before Laravel scanner wiring. It intentionally does not claim an end-to-end migration or run the package build.

## Changes made

1. `PhpFunctionCallSemanticInput` now aliases the complete `PhpFunctionInvocationSemanticInput`; a raw `FunctionName` is no longer a valid semantic authority input.
2. `PhpFunctionCallSemanticJudgment` now aliases the closed `PhpFunctionInvocationSemanticJudgment` rather than pretending every outcome is already an `Expression`.
3. The call authority no longer owns a short-name builtin catalog and no longer imports `semantic/relations`. It delegates to the canonical invocation authority.
4. Added `PhpFunctionInvocationSemanticJudgmentBatch`, a closed batch of completed judgments.
5. Evolved the existing `InvocationSemanticIntegratedResponseCompositionInput` and result to require and preserve that exact batch. The composition does not reclassify judgments or reconstruct expressions.
6. Bumped the integrated-response composition contract version to 10 and documented the PHP invocation judgment ownership.
7. Added a static audit at `scripts/audits/test-phase1780-php-invocation-interface-first.cjs`.

## Trace findings that remain open

- `packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionCanonical.ts` still sends raw `FunctionName` evidence to the old call boundary. It must be migrated to provide parser-owned name syntax evidence, a complete/incomplete resolution environment judgment, and the closed invocation judgment.
- `packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts` still calls integrated composition with only `knowledge`. It must supply the completed PHP invocation judgment batch from the upstream source traversal. An empty fabricated batch is not acceptable.
- `PhpFunctionNameResolutionAuthorityInterface` exists, but a production resolver implementation was not found in the traced source. It must be implemented before scanner wiring can create valid judgments.
- The PHP builtin ADT and the old catalog currently mix PHP builtins with Laravel helpers. After resolution is implemented, builtin classification must be based on canonical global function identity; Laravel helpers must have their own semantic ownership rather than being treated as PHP builtins.
- Subscanner deletion remains gated on migrating all consumers and proving there are no references left.

## Static audit

Run:

```sh
node scripts/audits/test-phase1780-php-invocation-interface-first.cjs
```

Expected output: `11/11 checks satisfied`. Two checks intentionally confirm that the scanner and integrated-response call site still require migration; they are trace checks, not claims that those migrations are complete.

## Verification limits

- Static contract audit only.
- No `npm run build` or TypeScript build was run.
- Do not treat this phase as a production-complete or build-verified migration.

## External semantic references

- PHP Manual, namespace fallback: https://www.php.net/manual/en/language.namespaces.fallback.php
- PHP Manual, namespace basics: https://www.php.net/namespaces.basics
- PHP-Parser NameResolver documentation: https://github.com/nikic/PHP-Parser/blob/master/doc/2_Usage_of_basic_components.markdown

These references support preserving qualified-name evidence and deferring unqualified namespaced function resolution where PHP runtime fallback semantics prevent a safe static assertion.
