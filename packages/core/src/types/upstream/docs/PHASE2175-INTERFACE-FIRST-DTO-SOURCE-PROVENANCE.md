# Phase 2175 — Interface-First DTO Source Provenance

## Trace finding

Phase 2174 correlated the request and inventory through a project generic, but individual declaration evidence and the resolved identity did not carry that same project identity. The enclosing inventory could therefore claim project provenance without each declaration explicitly retaining it. A positive judgment must not rely solely on its container to imply the provenance of a selected declaration.

## Change

- `LaravelDtoDeclarationSourceEvidence<Project>` now carries `sourceProject: Project`.
- `LaravelDtoDeclarationDiscoveryReceipt<Project>` retains declarations with the same project parameter.
- `LaravelDtoDeclarationResolvedSourceEvidence<Project>` preserves both resolved PHP class identity and project provenance.
- `LaravelControllerResponseDtoDeclarationIdentity<Project>` carries the same project parameter.
- Resolved and ambiguous judgments use source evidence parameterized by the request's `Project`.
- The existing resolution authority/runtime executor boundary and invocation semantic authority are unchanged.

## Architectural boundary

This strengthens the existing upstream contract only. It adds no relation/foundation layer, no subscanner, and no second invocation authority. It does not claim scanner discovery, PHP lexical-context production, or integrated response wiring is complete: the scanner still passes raw `readonly DtoAst[]` and the integrated response input still accepts that legacy inventory. Those are explicit next migration edges.

## Verification

Static source trace and ZIP integrity check only. No build, TypeScript typecheck, or full tests were run.
