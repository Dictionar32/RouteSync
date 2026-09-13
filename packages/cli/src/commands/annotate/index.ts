/**
 * cli/commands/annotate/index.ts
 *
 * Explicit Sub-Domain Exports for Annotate Command.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module cli/commands/annotate
 */

export {
    type AnnotationResult,
    type AnnotateOptions
} from "./types";

export {
    buildPhpDiscoveryScript
} from "./scriptTemplate";

export {
    ensureResponseAttributeClass,
    applyAnnotationsToFile
} from "./annotationWriter";
