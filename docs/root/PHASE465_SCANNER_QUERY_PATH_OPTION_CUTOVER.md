# Phase 465 — Scanner Query Path Option Relational Cutover

- Query path parsing now returns `RelationOption<RelationPath>`.
- Query path collections now return `RelationOption<readonly RelationPath[]>`.
- Path selection uses relational lookup/fold rather than absence sentinels.
- `with` static operation consumes the option through `relationOptionFold`.
- Path sequence consumers consume candidates through `relationOptionFold`.
- Source-language literals/operators remain data; this cutover removes host absence authority for the path boundary.
- Remaining query producer frontier: property/relation argument options, grouping, relation count, and legacy expression evidence.
- TypeScript compiler was not available in the workspace, so no compile-pass claim is made.
