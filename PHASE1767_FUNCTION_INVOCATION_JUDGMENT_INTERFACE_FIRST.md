# Phase 1767 — Function Invocation Judgment Interface First

## Trace finding

Phase 1766 added `PhpFunctionNameResolutionAuthorityInterface`, but no implementation or consumer used it. The active Laravel resource mapper still calls `phpFunctionCallSemanticAuthority.derive()` with only `FunctionName`; that implementation compares the short name against a 94-entry builtin relation. Therefore the new name-resolution interface was an orphan contract, not an integrated fix.

The scanner AST's `function_call` node currently carries `functionName: AstIdentifier` and arguments. It does not carry a typed distinction among unqualified, qualified, and fully-qualified function names, nor namespace/import/declaration evidence. Wiring a resolver directly into that scanner would require fabricating evidence or moving semantic guesses into the mapper.

## Interface-first correction

Added `phpFunctionInvocationSemanticAuthorityInterface.ts` as the contract after name resolution:

`PHP AST source evidence -> PhpFunctionNameResolutionJudgment -> PhpFunctionInvocationSemanticJudgment -> Expression projection`

The invocation judgment is closed:

- `php_function_invocation_resolved` carries the resolution judgment and canonical `builtin`/`call` expression.
- `php_function_invocation_unresolved` preserves the ambiguous/unresolved name judgment, arguments, and source span. It does not fabricate an `Expression` that pretends the name was resolved.

This interface consumes the name-resolution judgment; it does not expose `lookup` or repeat name resolution. It is exported from the upstream barrel. Existing invocation semantic judgment and integrated response contracts were traced and retained: integrated response remains the exact publication result, and composition result pairs the original knowledge with that response.

## Explicitly not claimed

This phase is interface-first only. The legacy function-call authority and Laravel mapper have not yet been migrated because the AST/source model does not currently provide the required typed name syntax, namespace, imports, and declaration evidence. The 94-entry short-name match remains active and is flagged by the audit. Do not retire the resource subscanner until all 41 references (12 files at trace time) have migrated and reference audit is clean.

## Audit

Run:

`node scripts/audits/phase1767-function-invocation-judgment-interface-first.mjs`

This is a static contract audit only. It does not claim TypeScript typecheck, Vitest, or full build success.
