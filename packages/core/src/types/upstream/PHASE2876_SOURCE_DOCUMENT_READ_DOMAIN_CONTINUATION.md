# Phase2876 — Source Document Read Domain Continuation

## Goal

Continue Phase2875 by evolving the existing `PhpSourceDocumentReadResult` in `phpSourceFrontendInterface.ts`. Complete and blocked reads remain distinct domain outcomes, and each outcome carries `continueWith(...)` so consumers do not need to redispatch on `result.kind`.

## Existing contract reused

- `PhpSourceDocumentReadResult`
- `PhpSourceDocumentReaderInterface`
- `PhpSourceDocumentReadBlocker`
- upstream barrel export from `index.ts`

No generic `Result<T>` abstraction was introduced.

## Runtime changes

- Added named complete/blocked evidence types and handlers.
- Added `PhpSourceDocumentReadResultOperations` and the interface-first `phpSourceDocumentReadResultFactory`.
- The filesystem reader constructs complete and blocked outcomes through the factory.
- Identity binding consumes read results through `continueWith(...)`, not `switch (input.result.kind)`.
- Composition collects documents and blocked reads through the read-result operation rather than checking `result.kind` in its aggregation path.
- Blocked read evidence is preserved as blocked; it is never converted to an empty successful document set.

## Trace

```text
sourceDiscovery.continueWith(...)
  -> sourceDocumentReader.read(...)
  -> phpSourceDocumentReadResultFactory.complete(...) | blocked(...)
  -> PhpSourceDocumentReadResult.continueWith(...)
  -> phpSourceDocumentIdentityBinding.bind(...)
  -> identityBinding.continueWith(...)
  -> source-read continuation aggregation
  -> sourceDocumentsBlocked terminal OR invocation semantic pipeline
  -> inventory close
  -> ManifestBuilderJudgment.continueWith(...)
  -> ControllerInvocationManifest.continueForDriftAudit(...)
```

## Example

```ts
const result = await sourceDocumentReader.read(input);
const next = result.continueWith({
  onComplete: complete => continueWithDocument(complete.document),
  onBlocked: blocked => preserveBlockedRead(blocked),
});
```

This is a usage illustration of the implemented contract; the actual composition uses the same `continueWith` operation to aggregate document and blocker evidence.

## Verification limits

The Phase2876 audit is structural and checks the declared contract and call-site migration. It is not a substitute for TypeScript typecheck, build, or end-to-end tests. Those are reported separately and are not assumed to pass.
