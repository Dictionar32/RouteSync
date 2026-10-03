# Phase 734 — Model Relation Target Interface Elevation

## Build frontier

The latest local `npm run build` reached DTS and failed only at:

`packages/core/src/types/domain/modelEntityDefinition.ts(10,86)`

The failed import requested `RelationTargetShape` from `domain/eloquentTypes`, while the canonical upstream model already owns `ModelRelationTargetShape`.

## Structural correction

`ModelRelationDefinitionContract.targetShape` now consumes the canonical upstream `ModelRelationTargetShape` directly.

This keeps the data-flow direction:

`scanner evidence -> upstream ModelAst semantic vocabulary -> domain model contract -> lowering`

and prevents the domain layer from manufacturing a second relation-target vocabulary.

## Legacy descriptor trace

Active production `ParsedColumn` references remain zero from Phase 733. The active `ParsedField` family is still a migration frontier: its variants are consumed by the public `FieldNode` union. It must be migrated to a source/evidence-bearing AST carrier before the legacy name is removed. It is therefore not falsely declared retired in this phase.

## Inactive-file rule

Inactive-file vacuum audits did not provide a verified candidate to empty in this phase. No file was emptied merely because its name looked legacy.

## External architecture guidance

- MLIR PDLL/PDL separates declarative matching from rewrite application.
- Spoofax Statix models static semantics as constraints and scope-graph queries.
- Souffle treats typed relations as explicit semantic domains.
- K uses executable rewrite rules over structured configurations.
- Laravel e-commerce examples confirm concrete source ecosystems contain route, model, database, order, product, category, and relationship facts that should become typed semantic facts rather than remain ad-hoc parser payloads.

## Next frontier

1. eliminate active `ParsedField` as a public semantic carrier by introducing a canonical source/evidence AST carrier;
2. migrate scanner/lexer evidence to typed AST judgments;
3. migrate resolver graph to relation facts + fixed-point closure;
4. migrate analysis to proof-carrying semantic judgments;
5. migrate semantic type lowering to relation/rewrite rules;
6. keep grammar-host primitives quarantined at the scanner boundary;
7. use AST-aware construct audits rather than raw substring counts.
