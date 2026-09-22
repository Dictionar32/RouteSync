# Interface Trace Audit Phase 79

## Finding

`responseDescriptors.ts` still exposed several bare strings at the canonical response boundary: route identity, resource/model identity, inline response type identity, domain/base identity, and provenance class/source-file identity.

These values have semantic roles and therefore must not remain indistinguishable `string` values in the domain interface.

## Repair

Added closed semantic value objects:

- `RouteName`
- `DomainName`
- `ClassName`
- `SourceFilePath`

Reused existing:

- `ResourceName`
- `ModelName`
- `ResponseTypeName`

Applied them to response descriptor and response analysis contracts without changing producer/consumer flow.

## Generator boundary

Artifact names such as `to{Resource}Read` remain derivable naming rules. The semantic input needed to derive them is `ResourceName`, not a stored `mapperName` field.

## Intentional breakage

Existing factories and consumers may still construct/read primitive strings. That is intentionally left for a later flow migration. This phase repairs the interface contract first.
