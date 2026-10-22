# Phase 2007 — Response Output-Type Judgment, Interface First

## Trace result

Phase 2006 preserved `ResponseResult` in each `ResponseDefinition`, but every generated definition still received `TypeExpression { kind: 'mixed' }`. This conflated “output type not proven” with a deliberate semantic result of `mixed` and discarded type evidence already present in `ResponseResult` variants.

## Contract change

The existing `LaravelControllerResponseSemanticPipelineInterface` now owns a `LaravelControllerResponseOutputTypeJudgmentInterface`. It consumes the canonical `ResponseResult` ADT and returns one of:

- `controller_response_output_type_proven`, preserving an existing `TypeExpression` from `responsable`, `json_serializable`, or a supported explicit JSON payload;
- `controller_response_output_type_unresolved`, retaining the exact result and a reason when the canonical response does not prove a payload type.

For semantic scalar values and typed values, the judgment preserves the existing primitive or type expression. Domain references preserve their domain name, cardinality, and nullability. Collection JSON payloads are projected to arrays. A branch response gets a union only when every branch output type is proven.

Redirects, no-content responses, resource results without an explicit output-type mapping, expressions without a closed type, paginated payloads, and empty/unknown payload shapes remain unresolved. They do not receive invented output types.

## Runtime integration

The existing `LaravelControllerMethodResponseAstProjectionInterface` now asks the output-type judgment before constructing `ResponseDefinition` and `ResponseAst`. Proven output types are projected directly. Unresolved output types retain the existing `mixed` fallback in `ResponseDefinition.output`, while the attached output-type judgment explicitly records that the type was not proven. The response scanner and controller invocation judgment are not given a second classifier.

## Boundaries

- No `relation` or `foundation` subscanner was added.
- No controller PHP syntax is reparsed.
- No parallel response authority was added.
- Existing `ControllerReturnSemantic` and `ResponseResult` ADTs remain the semantic sources.
- The source scanner's production path continues to consume canonical method response products.

## Verification limits

The phase audit checks contract presence, supported mappings, conservative unresolved outcomes, integration into the existing AST projection, and no new relation/foundation subscanner. Syntax transpilation is checked separately. A passing audit or syntax check is not a claim that the full project typecheck/build passes.
