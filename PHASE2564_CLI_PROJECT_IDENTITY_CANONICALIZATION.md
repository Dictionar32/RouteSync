# RouteSync Phase 2564 — CLI Project Identity Canonicalization

## Root cause

The CLI built `SourceProjectIdentity` from a resolved lexical path, but lexical path resolution does not collapse filesystem aliases such as a symlinked project root. The source identity relation upstream compares the identity root value, so two path spellings for the same project could be treated as different projects and inventory binding could reject or misrepresent the project boundary.

## Source change

- Added `ControllerSourceProjectIdentityCanonicalizationInterface` and a closed result ADT (`canonicalized` / `canonicalization_blocked`) to the CLI manifest composition contract.
- Added `controllerSourceProjectIdentityCanonicalization`, which resolves the requested root with `fs.realpath` and constructs the canonical identity through the existing upstream `createLaravelSourceProjectIdentity` factory.
- Preserved `dataflowQueryPolicyIntent` during canonical identity construction.
- Wired canonicalization before controller-root discovery and before source inventory/completeness witness creation.
- A failed canonicalization is preserved as `controller_invocation_manifest_source_project_identity_blocked`; composition does not continue discovery or invent an empty inventory.
- Updated `scan` and `sync` to exhaustively stop on the new terminal judgment.
- Evolved the existing composition reasoning contract to version 9 instead of introducing a duplicate contract.
- Added `audit:phase2564-cli-project-identity-canonicalization`.

## Intended path

`CLI requested identity → canonicalization operation → canonical SourceProjectIdentity → discovery judgment → source document acquisition → invocation semantic judgments → upstream inventory authority → validated receipt/rejection ADT → manifest builder → AST/IR projection`

## Verification

- Phase 2564 structural/syntax audit: 13/13.
- Phase 2563 discovery completeness audit: 11/11.
- Phase 2562 identity binding audit: 10/10 after updating its expected composition-contract version to 9.
- Related upstream request-resolution, evidence identity, authority wiring, composition, and CLI injection audits were also rerun.
- `package.json` parses as JSON and ZIP integrity is checked after packaging.

## Not claimed

No full TypeScript typecheck, package build, Vitest suite, or end-to-end CLI scan/sync was run. `realpath` establishes the canonical project root for this composition path; it does not by itself prove race-free filesystem access for every descendant file. Request-type production semantic composition (reasoning, complete verifier, decision, and authority) remains a separate unresolved host-wiring requirement and is not fabricated by this phase.
