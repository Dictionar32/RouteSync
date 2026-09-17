# Interface Trace Audit — Phase 58

## Scope

Interface/ADT only. Consumer flow, scanner construction, lowerers, and emitters were intentionally not migrated.

## Changes

### 1. `ResourceFieldDescriptor`
- Removed duplicated `nullable` field.
- `semanticType: SemanticType` remains the sole semantic type carrier.

### 2. `ResourceFieldExpression`
- Replaced `UnknownResourceExpression` with `UnsupportedResourceExpression`.
- Unsupported state carries a closed `UnsupportedResourceExpressionReason` ADT.
- Property access targets are recursive `ResourceFieldExpression`, preventing flattened member paths.
- Method calls now carry recursive target and ordered argument expressions.
- Literal payloads use a closed `ResourceLiteralValue` ADT instead of `unknown`.

### 3. `ResponseDescriptorBase`
- `kind: string` tightened to the closed `ResponseKind` ADT.

## Dataflow rule

The interface now requires upstream producers to provide structure that downstream consumers can use directly. Missing structure must surface as a compile-time contract failure rather than being reconstructed through fallback logic.

## Deliberately not changed

- Existing factories and scanner consumers of `ResourceFieldExpression`.
- Existing lowerers/generators.
- Runtime flow.
- Manifest conversion.

Those consumers are expected to fail type-checking until the next migration phase. This is intentional: interface-first refactoring exposes incomplete producers instead of hiding them with fallback values.

## Validation

A full build/test run was not performed because the source snapshot does not contain `node_modules`.
