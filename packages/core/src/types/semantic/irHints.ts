/**
 * irHints.ts
 *
 * IR hints, frameworks contexts, and raw code node descriptors.
 *
 * @module core/types/semantic
 */

import type { FieldNode } from '../field';

export type IRKind =
  | "raw_code"
  | "literal"
  | "property_access"
  | "method_call"
  | "binary_expression"
  | "ternary_expression"
  | "nullsafe_chain"
  | "type_cast"
  | "collection"
  | "model_reference"
  | "unknown";

export type IRHintPattern =
  | "property_access"
  | "method_call"
  | "binary_expression"
  | "type_cast"
  | "ternary"
  | "nullsafe_chain"
  | "collection"
  | "unknown";

export type IRFrameworkContext = "eloquent" | "resource" | "blade" | "unknown";

export interface IRHints {
  readonly pattern: IRHintPattern;
  readonly confidence: number;
  readonly nullable: boolean;
  readonly framework_context: IRFrameworkContext;
}

export class IRHintsFactory {
  public static create(
    pattern: IRHintPattern,
    confidence: number = 1.0,
    nullable: boolean = false,
    frameworkContext: IRFrameworkContext = 'unknown'
  ): IRHints {
    return Object.freeze({
      pattern,
      confidence,
      nullable,
      framework_context: frameworkContext
    });
  }

  public static default(pattern: IRHintPattern = 'unknown'): IRHints {
    return Object.freeze({
      pattern,
      confidence: 1.0,
      nullable: false,
      framework_context: 'unknown'
    });
  }

  public static empty(pattern: IRHintPattern = 'unknown'): IRHints {
    return this.default(pattern);
  }
}

export interface IRRawNode {
  readonly kind: "raw_code";
  readonly code: string;
  readonly hints: IRHints;
  readonly parsed_ast?: FieldNode;
}

export class IRRawNodeDescriptor implements IRRawNode {
  public readonly kind = "raw_code" as const;
  public readonly code: string;
  public readonly hints: IRHints;
  public readonly parsed_ast?: FieldNode;

  constructor(code: string, hints: IRHints, parsedAst?: FieldNode) {
    this.code = code;
    this.hints = hints;
    this.parsed_ast = parsedAst;
    Object.freeze(this);
  }

  public static fromRawCode(code: string, hints?: IRHints): IRRawNodeDescriptor {
    return new IRRawNodeDescriptor(code, hints ?? IRHintsFactory.default());
  }

  public static withAst(code: string, ast: FieldNode, hints?: IRHints): IRRawNodeDescriptor {
    return new IRRawNodeDescriptor(code, hints ?? IRHintsFactory.default(), ast);
  }
}
