/**
 * Retired in Phase 2230. Response-attribute semantics are owned by the existing
 * LaravelControllerResponseSemanticPipelineInterface and its source-correlated
 * method response products. Action contracts no longer construct ResponseDescriptor
 * values from DTO filesystem lookup or observed-return merging.
 *
 * This module intentionally exports no resolver. Keep the path temporarily so
 * downstream branches receive a clear compile-time failure if they still import it.
 */
