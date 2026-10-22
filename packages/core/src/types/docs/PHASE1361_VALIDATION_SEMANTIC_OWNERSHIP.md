# Phase 1361 — Validation Semantic Ownership

## Finding

The upstream `ValidationRuleDefinition` is a source-level contract carrying a rule name, arguments, condition, and source span. It has no producer/consumer path in the current core scanner pipeline and must not be adapted into the active pipeline by guessing its semantics.

The active FormRequest path is:

```text
Laravel FormRequest rules()
  -> PHP AST / rule evidence
  -> ValidationRuleParser
  -> CanonicalRouteValidationRuleEntry
  -> RouteSemanticFlowValidationRuleSet
  -> RequestField.validation (closed ValidationRuleNode ADT)
  -> RouteSchemaPayload
  -> CLI projection
```

`ValidationRuleParser` is the rule-string parser at the scanner boundary. `CanonicalRouteValidationRuleEntry` resolves field identity, location, shape, semantic type, presence, and source span. `RouteSemanticFlowValidationRuleSet` merges canonical entries into request fields. The target generator must consume those results rather than parsing Laravel rule strings again.

## Change made

`packages/cli/src/generators/constants/enumConstantsBuilder.ts` previously had two paths:

- canonical array branch reading an `ast` property using `any`;
- legacy branch coercing a rule to string, splitting on `|`, and invoking `ValidationRuleParser` in the CLI.

The legacy branch duplicated Laravel validation interpretation downstream and relied on a schema shape not declared by `RouteSchemaPayload`. It has been removed. The generator now walks `RouteSchemaPayload.fields`, reads each field's typed `validation` ADT, selects `in` rules by discriminant, and projects their typed values into enum constants. Model database enum projection is unchanged.

## Compatibility decision

The CLI no longer attempts to recover enum values from noncanonical `schema.rules` string maps. Those maps must be normalized upstream into `RouteSchemaPayload.fields[].validation`; silently reparsing them in the generator would reintroduce a second semantic owner. `ValidationRuleDefinition` remains intact as a public type and is not deleted or artificially wired.

## Preserved architecture

- Laravel source and scanner evidence own source meaning and provenance.
- Domain validation ADTs own canonical rule semantics.
- Manifest/wiring transports canonical facts.
- CLI emits target constants without classifying Laravel rule strings.
- Zod remains a target validation schema, not the Laravel semantic authority.
- Operation identity remains upstream-owned and projected by CLI/SDK/React.
- Semantic dataflow and structural graph projections remain separate.

## Validation status

Run `npm run audit:phase1361-validation-semantic-ownership` for the source-contract audit. This audit is static. Full build/runtime validation requires the project's dependencies; `tsdown` is unavailable in the supplied workspace, so TypeScript 7.0.2 build compatibility is not claimed.
