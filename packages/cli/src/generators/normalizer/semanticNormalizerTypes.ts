/**
 * semanticNormalizerTypes.ts
 *
 * Semantic node augmentation and resolution context types for compiler normalizer.
 * Conforms to Level 6/7 Correct-by-Construction: Closed semantic contracts.
 *
 * @module cli/generators/normalizer
 */

export interface SemanticNodeContract {
  readonly status: string;
  readonly type: string;
  readonly kind: string;
  readonly model: string;
  readonly resource: string;
  readonly collection: boolean;
  readonly paginated: boolean;
  readonly nullable: boolean;
  readonly fields: Readonly<Record<string, unknown>>;
  readonly items: unknown;
}

export type SemanticNode = {
  status: string;
  type: string;
  model?: string;
  resource?: string;
  collection?: boolean;
  paginated?: boolean;
  nullable?: boolean;
  fields?: Record<string, unknown>;
  items?: unknown;
  kind?: string;
};

export type RuntimeAugmented<T = unknown> = T & {
  resolved?: SemanticNode;
  semantic?: SemanticNode;
  parsed_ast?: unknown;
  node?: unknown;
  kind?: string;
  type?: string;
  /** Raw source text for literal AST nodes emitted by the PHP extractor. */
  code?: string;
  /** Nested field map for `kind: 'object'` shapes. */
  fields?: Record<string, unknown>;
  /** Present on accessor definitions carrying a parsed PHP expression AST. */
  expression?: unknown;
};

export interface ResolutionContext {
  readonly layer: "resource" | "route" | "model";
  readonly fileName: string;
  readonly modelMap: Readonly<Record<string, string>>;
  readonly relationMap: Readonly<Record<string, string>>;
  readonly assignments: Readonly<Record<string, unknown>>;
  readonly resolvedAssignments: Readonly<Record<string, SemanticNode>>;
}
