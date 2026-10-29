# Phase 3114 — Complete Discovery Judgment Identity

## Change
The complete upstream discovery ADT previously implemented `preserveCompleteJudgment()` by reconstructing a new judgment from its evidence. That retained the project/root/source fields but did not preserve the identity of the original complete judgment object. The blocked projection already preserved its original judgment by reference.

The complete factory now binds its frozen judgment to a local, explicitly typed `judgment` value and the manifest projection returns that exact value from `preserveCompleteJudgment()`. The existing runtime shape and CLI ownership of manifest construction remain unchanged.

## Runtime trace
`sourceDiscovery.discover(...)` → complete upstream discovery judgment → `projectForManifest()` → complete manifest projection → `preserveCompleteJudgment()` returns the same judgment object → CLI continues using the projected source inventory toward PHP source reads and manifest construction.

## Regression evidence
The upstream test now asserts `projection.preserveCompleteJudgment() === complete`, in addition to asserting that project identity, root identity, and source inventory identity survive projection. The blocked-judgment identity test remains in place.

## Audit
Run `npm run audit:phase3114-complete-judgment-identity` or `node scripts/audits/audit-phase3114-complete-judgment-identity.cjs`. The audit records the runtime contract, exact-identity regression, deleted relation-foundation constraint, and current repository AST migration inventory.

## Limits
This is a bounded identity/provenance correction, not a repository-wide export-interface or primitive/control-flow migration. Full TypeScript typecheck, full tests, and PHP → CLI → manifest generator E2E remain unverified because the workspace does not contain local `node_modules`.
