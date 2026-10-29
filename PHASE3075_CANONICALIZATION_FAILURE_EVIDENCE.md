# Phase 3075 — Canonicalization Failure Evidence Normalization

## Objective

Continue the real `upstream → CLI → manifest` path by removing the raw Node filesystem rejection (`unknown`) from the source-project canonicalization ADT, without converting a failed canonicalization into an empty or complete manifest.

## Implementation

- `ControllerSourceProjectIdentityCanonicalizationBlockedEvidence` now carries `failureName: StringValue` and `failureMessage: StringValue` instead of `failure: unknown`.
- `ControllerSourceProjectIdentityCanonicalizationBlockedJudgment` carries the same normalized diagnostic fields and keeps the domain operation `preserveFailureEvidence()`.
- The CLI-owned `nodeFilesystemFailureObservation` remains the platform boundary. It classifies the known Node filesystem code into the existing closed `FilesystemFailureCode` ADT and wraps the `Error.name` / `Error.message` diagnostic values as `StringValue`.
- The requested project identity, root failure location, typed failure code, and blocked manifest terminal remain intact.
- No generic relation foundation was restored; `collections.ts` remains exactly one newline byte.

## Runtime trace

```text
CLI scan / sync
  → manifest scan operation
  → composition authority
  → interface-first canonicalization adapter
  → fs.realpath(requested root)
      ├─ success → canonical SourceProjectIdentity → source discovery → source reads
      │            → invocation semantic pipeline → inventory → manifest → validation → generator/persistence
      └─ rejection → Node boundary normalizes code/name/message
                   → typed blocked canonicalization judgment
                   → preserveFailureEvidence()
                   → existing CLI source-project-identity-blocked manifest terminal
```

## Verification boundaries

The phase audit checks structure, changed-file syntax transpilation, the protected collections invariant, continued absence of deleted relation foundation modules, and regression scripts for phases 3069–3074. It does not claim a whole-workspace strict TypeScript pass or an end-to-end PHP → CLI → manifest run.

## Remaining limitations

- The Node adapter still accepts the platform rejection as `unknown` because JavaScript promises may reject with arbitrary values. That `unknown` is now contained at the adapter boundary rather than crossing into the upstream semantic ADT.
- For a non-`Error` rejection, the adapter records a stable diagnostic label instead of retaining arbitrary object internals. If those internals become necessary, add a bounded typed diagnostic model rather than returning to an opaque domain payload.
- Other discovery failure APIs and the CLI-owned discriminated mapping are outside this phase. No claim is made that all primitive types or control-flow constructs have been removed globally.
