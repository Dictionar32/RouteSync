/**
 * sourceProvenance.ts
 *
 * Traceability and source provenance nodes for semantic graph AST.
 *
 * @module core/types/semantic
 */

export type SourceContext =
  | "controller"
  | "resource"
  | "model"
  | "route"
  | "service";

export interface SourceRef {
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly context: SourceContext;
}

export class SourceRefFactory {
  public static create(
    file: string,
    context: SourceContext = 'route',
    line: number = 0,
    column: number = 0
  ): SourceRef {
    return Object.freeze({ file, line, column, context });
  }

  public static unknown(file: string = '', context: SourceContext = 'route'): SourceRef {
    return Object.freeze({ file, line: 0, column: 0, context });
  }
}

export interface RootASTNode {
  readonly kind: "root";
  readonly identifier: string;
  readonly source: SourceRef;
}

export class RootASTNodeFactory {
  public static create(
    identifier: string = '',
    source: SourceRef = SourceRefFactory.unknown()
  ): RootASTNode {
    return Object.freeze({
      kind: "root",
      identifier,
      source
    });
  }
}
