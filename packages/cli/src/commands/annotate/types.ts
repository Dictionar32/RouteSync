/**
 * types.ts
 *
 * Types and interfaces for Laravel controller response annotation.
 *
 * @module cli/commands/annotate/types
 */

export interface AnnotationResult {
  readonly method: string;
  readonly uri: string;
  readonly controllerFile: string;
  readonly controllerClass: string;
  readonly controllerNamespace: string;
  readonly methodName: string;
  readonly methodLine: number;
  readonly modelClass: string;
  readonly modelFull: string;
  readonly modelExists: boolean;
  readonly collection: boolean;
  readonly attrExists: boolean;
  readonly alreadyAnnotated: boolean;
}

export interface AnnotateOptions {
  readonly input: string;
  readonly dryRun?: boolean;
  readonly force?: boolean;
}
