# Phase 3115 — Static Upstream Interface Audit

## Purpose

This phase changes the audit method: the upstream ADT/interface and the runtime implementation are inspected statically by a CommonJS (`.cjs`) script using the TypeScript compiler AST. The audit does not import, execute, or depend on Vitest/Jest test files. It does not use a test runner as a substitute for checking the interface contract.

## Command

```sh
NODE_PATH=/opt/nvm/versions/node/v22.16.0/lib/node_modules node scripts/audits/audit-phase3115-static-upstream-interface.cjs
```

Or, where the TypeScript package is resolvable by Node:

```sh
npm run audit:phase3115-static-upstream-interface
```

## Static checks

- `LaravelControllerSourceDiscoveryJudgmentOperations` declares the fixed domain operations.
- The manifest projection contract exposes both complete and blocked judgment-preservation operations.
- Complete projection retains typed project identity, root, and source inventory; blocked projection retains partial sources and blocker.
- AST inspection follows the factory implementation to confirm `preserveCompleteJudgment()` and `preserveBlockedJudgment()` return the captured `judgment` identifier.
- CLI runtime composition calls source discovery and `projectForManifest()`, routes blocked evidence to its blocked terminal operation, and passes complete sources onward.
- Deleted relation-foundation modules remain absent from this runtime boundary.
- A repository-wide TypeScript AST inventory is recorded as a migration frontier, not misrepresented as completion.

## Result

See `reports/PHASE3115_STATIC_UPSTREAM_INTERFACE_AUDIT.json`. All required static checks passed. The report explicitly leaves repository-wide export/interface migration, primitive/control-flow reduction, full typecheck, full test suite, and PHP-to-CLI-to-manifest E2E verification incomplete.

## Scope boundary

Static AST inspection can establish that declared interface operations and source-level runtime wiring exist. It cannot prove runtime behavior, filesystem correctness, full type soundness, or end-to-end manifest output on its own. Those claims require their respective validation layers.
