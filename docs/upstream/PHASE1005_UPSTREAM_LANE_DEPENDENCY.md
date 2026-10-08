# Phase 1005 — Upstream Lane Dependency Closure

Phase 1005 hardens the upstream boundary without introducing another semantic or dataflow interface.

## Structural lane

`MigrationInterface → SchemaInterface → SchemaRelationIndexInterface → ModelSemanticRelation → GraphSemanticRelation → GraphEdgeRelationSink → ServiceGraph`

Migration/schema evidence is structural semantic evidence. Graph is a projection of canonical relations and must not become a second reconciliation authority.

## Runtime dataflow lane

`SemanticDataflowInput → SemanticDataflowJudgment → SemanticDataflowInterface → SemanticDataflowIRProjection`

Dataflow owns value/reachability closure. It must not import migration interfaces or graph implementation types.

## Manifest

Manifest surfaces compose already-produced semantic facts and dataflow inputs. They do not solve migration/schema relations and do not compute dataflow closure.

## Audit invariant

Phase 1005 checks actual source imports/references in addition to forbidden solver names. The goal is dependency direction, not merely naming hygiene.

Forbidden duplicate authorities remain:

- `MigrationDataflowInterface`
- `MigrationDataflowSolver`
- `SchemaDataflowSolver`
- `GraphDataflowSolver`
- `ManifestDataflowSolver`
- `ModelRelationDataflowSolver`

`packages/core/src/compiler/scanner/subscanners/model/migrationScanner.ts` remains physically present and empty.
