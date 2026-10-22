# Phase2466 — Model Relation Upstream Authority

## Root cause

The model relation path made semantic decisions inside `subscanners/model/eloquentProducer.ts`: relation method classification, cardinality projection, target shape, semantic type, traversal target, and canonical relation construction. `memberRelationsParser.ts` also depended directly on `semantic/relations` to fold and branch over the producer result. The method-name vocabulary authority alone was insufficient because the complete relation judgment remained scanner-owned.

## Changes

- Added upstream `EloquentRelationFactsAuthorityInterface` and closed evidence/judgment ADTs.
- Added `eloquentRelationFactsAuthority`, exported as `export const name: Interface`.
- The authority now constructs canonical `EloquentRelationAst` using the existing relation method authority, descriptor, multiplicity vocabulary, and AST constructor. It also owns foreign/local key strategy decisions; scanner evidence only records the second/third argument forms and literal-string values.
- Added `ModelRelationFactsProducerInterface` and `modelRelationFactsProducer` as a typed scanner-boundary operation. It extracts source-backed evidence from the compiler AST and delegates semantic judgment upstream.
- Wired `laravelModelScanner.ts` directly to `modelRelationFactsProducer.scan`.
- Updated relation-key regression tests to call the typed producer contract.
- Removed `memberRelationsParser.ts` and `eloquentProducer.ts` from the model subscanner directory.
- Exported the upstream contract and authority from the upstream barrel.

## Validation

The Phase2466 audit checks contract ownership, typed exports, AST-neutral upstream inputs, authority wiring, removal of old subscanner entry points, and absence of direct relation/foundation imports from the migrated producer. Full TypeScript typecheck, Vitest, package build, and CLI end-to-end checks remain separate validations and must not be inferred from this static audit.
