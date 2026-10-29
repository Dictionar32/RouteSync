# Phase 3103 — Directory Read Domain Operation

## Runtime trace

`CLI scan/sync → controllerInvocationManifestComposition → controllerPhpSourceDiscoveryOperation.discover → fs.lstat/fs.readdir → ControllerDirectoryReadSettlement → resolveDiscovery → controllerDirectoryEntriesOperation.discover → upstream LaravelControllerSourceDiscoveryResult → source inventory → semantic judgment → manifest build/validation → terminal manifest → generator`.

## Concrete migration

The CLI filesystem boundary previously represented directory read success/failure with `ControllerDirectoryReadHandlers<Result>` and a generic `continueWith<Result>`. Its consumer had to interpret the two cases through callback handlers. Phase 3103 replaces that interface with `resolveDiscovery`, a concrete operation that accepts the existing directory-entry discovery operation and the exact discovery evidence/context.

- The entries variant delegates the original `Dirent[]` to `ControllerDirectoryEntriesOperationInterface.discover`.
- The blocked variant returns the original `LaravelControllerSourceDiscoveryResult`; blocker and partial-source evidence are not reconstructed or dropped.
- `ControllerDirectoryEntriesVisitorInterface` / `controllerDirectoryEntriesVisitor` are renamed to operation-oriented `ControllerDirectoryEntriesOperationInterface` / `controllerDirectoryEntriesOperation`; the runtime call is explicit.
- No generic handler or continuation remains on the directory-read settlement contract.
- This is a local CLI filesystem boundary, not a replacement upstream relation foundation. The upstream discovery judgment remains the semantic authority.

## Interface-first usage

```ts
directoryReadSettlement.resolveDiscovery(
  controllerDirectoryEntriesOperation,
  initialEvidence,
  sourceProject,
  root,
  directory,
);
```

## Scope and remaining frontier

This phase closes one concrete generic continuation seam. It does **not** claim global removal of `string`, `number`, `undefined`, `null`, `boolean`, `reduce`, array literals, `??`, ternaries, `if`, `===`, `is`, `as`, `lookup`, `void`, `switch`, `for`, `map`, or every exported function. The entry cursor still has its own generic continuation, and the wider Phase 3101 AST export inventory remains open. Those require separate domain-owned migrations and regression checks rather than a repository-wide text replacement that risks changing PHP/Laravel source semantics or losing blocker evidence.

Deleted modules `packages/core/src/semantic/relations/relationMembership.ts`, `relationalSequence.ts`, and `semanticRelations.ts` remain absent. The pre-existing empty `packages/core/src/types/upstream/collections.ts` was not modified.

## Verification

Run `npm run audit:phase3103-directory-read-domain-operation` with dependencies available. This phase records structural audit results, TypeScript syntax transpilation, and ZIP integrity separately from full typecheck, full tests, and real PHP → CLI → manifest → generator E2E; the latter three remain unverified in this workspace.
