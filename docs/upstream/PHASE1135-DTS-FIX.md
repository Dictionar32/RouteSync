# Phase 1135 — semantic dataflow route projection DTS fix

`RouteParameterBinding.model` is already the closed `ModelReference` semantic type. Its `kind` is `model_reference`, so comparing it with `model_class` is an impossible-union comparison (TS2367).

The projection now reads the canonical model name directly from `binding.model.name.value.value`. No cast or duplicate semantic authority is introduced.
