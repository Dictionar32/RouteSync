# Phase 3004 — CLI Manifest Terminal Continuation and Runtime Trace

## Implementation scope

This phase tightens one concrete point on the reachable CLI `scan` runtime path: manifest contract validation previously converted a rejected judgment into `judgment.violations`, returned `undefined` for validation success, then used `if (manifestContractRejection !== undefined)` to recover the outcome. That encoded a domain result as an optional primitive and reconstructed the decision downstream.

The scan command now consumes `manifestContractValidationOperations.validate(resolvedManifest).continueWith(...)` directly. The rejected terminal owns the failure handling and uses its typed `judgment.violations`; the `undefined` sentinel and its comparison are gone. This is a targeted semantic change, not a mechanical removal of all `if` statements from the CLI.

## Runtime trace

```text
CLI scan command
  → composition.manifestScanOperation
  → routeSyncCliManifestScanOperationFactory.create(authority)
  → authority.compose(input)
  → canonical source-project identity
  → controller source discovery
  → source read settlements + source identity binding
  → invocation judgment preparation + inventory closure
  → manifestBuilderPreparation.prepare(input).build()
  → controllerInvocationManifestTerminalOperationsFactory.fromManifestBuilderJudgment(...)
  → ControllerInvocationManifest terminal ADT
  → scannedManifest.continueForDriftAudit(...)
  → complete manifest
  → route manifest projection / contract validation
       ├─ validated: continue to persistence
       └─ rejected: report typed violations and terminate scan
```

## Interface-first contracts and operational ADT

- `RouteSyncCliManifestScanOperationFactoryInterface` owns `create(authority)`.
- `ControllerInvocationManifestCompositionAuthorityFactoryInterface` owns construction of the composition authority from explicit dependencies.
- `ControllerInvocationManifest` is not a data-only union: each terminal carries `continueForDriftAudit(...)`.
- The upstream `ManifestBuilderJudgment` is adapted via its own `continueWith` operation; the CLI composition does not reclassify it using a second `switch`.
- The scan command no longer uses `undefined` as a success/rejection discriminator for manifest contract validation.

## Laravel/PHP source model

The official Laravel routing documentation describes both closure callbacks and controller-action routes, plus ordered route-parameter injection and dependency injection. The source model should preserve those distinct source facts in the upstream evidence; the CLI should consume the typed manifest judgment instead of inferring controller meaning from primitive route strings. See [Laravel Routing](https://laravel.com/framework/docs/routing) and [PHP type declarations](https://www.php.net/manual/en/language.types.declarations.php).

## Audit results and boundaries

Run from repository root:

```sh
node scripts/audits/audit-phase3004-cli-manifest-terminal-continuation.cjs
```

The audit is structural. It checks the real scan/composition path, interface-first exports, operational terminal ADT, elimination of the validation sentinel, and protected workspace constraints. It is not a substitute for typecheck, tests, or a CLI/Laravel E2E run.

Known boundaries:

- Full TypeScript typecheck remains unverified because the workspace's dependencies/toolchain are incomplete, as documented in Phase 3003.
- Vitest and CLI/Laravel end-to-end execution were not run in this phase.
- This phase does not claim all exported arrows in the entire repository have been migrated. The audit scope is the runtime path described above.
- Route-manifest to CLI invocation-manifest schema provenance still needs field-by-field closure; this change does not pretend that boundary is complete.
- No generic relation foundation was restored or introduced.

## Invariants preserved

- `packages/core/src/types/upstream/collections.ts` remains empty.
- `relationMembership.ts`, `relationalSequence.ts`, and `semanticRelations.ts` remain absent.
