# Phase 2163 Trace

`CLI scan/sync → invocation judgment → LaravelControllerScannerExecutor → ControllerProducer.projectMethodEvidence → ControllerDeclarationEvidence → existing LaravelControllerResponseSemanticPipeline → source binding → response semantic judgment → AST projection → manifest`.

Per-method response evidence now includes:

1. `observed_controller_return` when a return expression is observed;
2. `controller_action_response_reference_candidate` when the existing action descriptor has a response reference;
3. `response_attribute_source` for the parsed attribute declaration or explicit non-declaration.

The response attribute fact is independent of the descriptor candidate. It is also independent of resolved DTO fields and the canonical HTTP return judgment. DTO declaration evidence and full descriptor derivation remain open.
