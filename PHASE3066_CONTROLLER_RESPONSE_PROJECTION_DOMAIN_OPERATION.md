# Phase 3066 — Controller Response Projection Domain Operation

## Goal

Continue the Fully Explicit Typed Runtime Scanner Operations migration by moving the controller scan complete/blocked decision out of route-declaration composition and into the controller scanner judgment ADT. This is a targeted domain migration, not a repository-wide primitive-removal claim.

## Implementation

### Upstream ADT

`packages/core/src/types/upstream/laravelControllerScannerInterface.ts` now defines `LaravelControllerScanResponseProjectionHandlers<Result>` and exposes `continueToResponseProjection` on both complete and blocked scan judgments. The `laravelControllerScanJudgmentOperations.complete` constructor invokes `onComplete`; `.blocked` invokes `onBlocked`.

### Runtime consumer

`packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts` previously inspected `controllerScan.kind` in the matched-action response projection path. It now calls:

```ts
controllerScan.continueToResponseProjection({
  onBlocked: () => Object.freeze({
    kind: 'controller_response_projection_blocked',
    reason: 'response_judgment_unavailable',
  }),
  onComplete: completeScan => {
    // Correlate the already-published controller identity and response product.
  },
});
```

The controller/action publication identity checks and explicit unmatched/ambiguous/invalid action outcomes remain intact. The scanner ADT owns only the complete-versus-blocked continuation; it does not take over route-publication matching or response semantics.

## Runtime trace

```text
PHP controller source
  → LaravelControllerScannerInterface.scan(input)
  → LaravelControllerScanJudgment
  → matched_action_judgment route publication
  → continueToResponseProjection(handlers)
      ├─ complete → correlate controller identity → response product
      └─ blocked  → explicit response_judgment_unavailable
  → route boundary response binding
  → upstream manifest builder
  → CLI scan/sync manifest terminal gate
  → output publication only after complete manifest continuation
```

## Audit

Run:

```bash
npm run audit:phase3066-controller-response-projection-domain-operation
```

The audit checks the new interface operation, both constructor branches, migrated consumer, retained controller identity correlation, distinct route action judgments, CLI output gates, the one-byte `collections.ts` invariant, and absence of deleted relation foundation modules.

## Verification limits

- Structural audit: executed for Phase 3066.
- Phase 3065 schema-evidence regression audit: rerun and required to pass 14/14.
- PHP → CLI → manifest/IR end-to-end fixture: not run.
- Syntax transpilation: passed for the changed schema interface, schema authority, route composition, and controller scanner interface files.
- Strict TypeScript: blocked by missing ambient type definitions (`chai`, `deep-eql`, `estree`, `fs-extra`, `jsonfile`, `node`, `react`).
- Global removal of `if`, `===`, `??`, ternaries, `map`, `reduce`, or primitive types: not claimed.
- Deleted relation foundation modules were not restored. `packages/core/src/types/upstream/collections.ts` remains exactly one newline byte.
