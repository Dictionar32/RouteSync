# Phase 606 — Scanner Descriptor Algebra

## Goal

Continue the declarative compiler cutover of RouteSync by removing constructor/class authority from scanner descriptors and replacing it with immutable structural witnesses and relation-backed descriptor catalogs.

## Research basis

The design follows the same separation emphasized by MLIR PDLL/PDL and WebAssembly validation: describe match/constraints and transformations declaratively, then execute them through a separate engine. RouteSync applies that distinction to scanner semantic descriptors.

## Cutover

Converted scanner descriptor surfaces:

- `ScannedModelAccessorDescriptor`
- `ScannedModelCastDescriptor`
- `ScannedModelColumnDescriptor`
- `ScannedModelRelationDescriptor`
- `ScannedRouteQueryParameterDescriptor`
- `ScannedRouteParameterDescriptor`

Classes and constructors were replaced by:

- structural descriptor interfaces;
- immutable `Object.freeze` witnesses;
- frozen descriptor catalogs;
- relation-driven projections already present in the descriptor computations.

No consumer-side `new Scanned...` construction remains under `packages/core/src`.

## Unused-file hygiene

The production source tree contains no zero-byte TypeScript files, backup/archive residue, or empty descriptor files identified as safe deletion candidates. No active file was emptied merely by filename or assumption.

## Validation

All 1,224 production TypeScript source files under `packages/core/src` transpile with TypeScript `transpileModule` and report zero syntax diagnostics.

Full repository type-check remains separately constrained by the existing environment-level missing type definitions for Node and Vitest globals.

## Architecture

Laravel source evidence -> syntax relations -> upstream relations -> scanner descriptor witnesses -> resolver candidate relations -> fixed-point constraints -> rewrite/equality saturation -> Route Contract Semantic IR -> analysis relations -> target lowering -> Next.js projection.
