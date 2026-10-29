# Phase2884 — Source Project Identity Domain Input

## Root cause

The upstream project-identity factory accepted `sourceRoot: string` and a second optional `SemanticDataflowQueryPolicyIntent`. This allowed a raw path primitive to cross the domain boundary and encoded policy selection through parameter omission.

## Change

- `LaravelSourceProjectIdentityFactoryInterface.create` now accepts `SourceFile`.
- `createWithPolicy` accepts the domain-specific `LaravelSourceProjectIdentityWithPolicyInput` ADT, which requires both a `SourceFile` and an explicit policy intent.
- CLI scan/sync, composition canonicalization, drift auditing, and TypeScript call sites were migrated to construct `SourceFile` at ingress.
- The policy test example uses `createWithPolicy` and explicit input evidence.
- `packages/core/src/types/upstream/collections.ts` remains empty.

## Runtime trace

`CLI path string → createSourceFile(...) → createLaravelSourceProjectIdentity.create(SourceFile) → SourceProjectIdentity → manifest builder`

Policy path:

`CLI/test source path → createSourceFile(...) + SemanticDataflowQueryPolicyIntent → LaravelSourceProjectIdentityWithPolicyInput → createWithPolicy(...) → SourceProjectIdentity → manifest builder`

## Scope and limits

This phase removes raw `string` and optional-policy parameters from the project-identity factory contract. `SourceProjectIdentity` itself still represents policy presence with an optional property; eliminating that requires a wider migration of downstream manifest-builder contracts and is intentionally not claimed here. Batch reading still has recursive traversal control flow and is a separate audit target.
