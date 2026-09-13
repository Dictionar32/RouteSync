/**
 * Passes Module.
 * Compiler passes for model graph building, semantic resolution, normalization, and validation.
 * Conforms to Rule 14: Active Consumer Orchestrator, 0 wildcard re-exports.
 *
 * @module cli/generators/passes
 */

import {
    ModelGraphBuilderPass,
    SemanticResolutionPass,
    NormalizationPass,
    ValidationPass
} from './passes/index';

export {
    ModelGraphBuilderPass,
    SemanticResolutionPass,
    NormalizationPass,
    ValidationPass
};
