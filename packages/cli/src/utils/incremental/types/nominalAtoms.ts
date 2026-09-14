/**
 * nominalAtoms.ts
 *
 * Level 7 Nominal Branded Atoms for Incremental RouteSync Scanner.
 * Prevents unvalidated primitives and enforces compile-time semantic domains.
 *
 * @module cli/utils/incremental/types
 */

export type ScannedRouteMethod = string & { readonly __brand: unique symbol };
export type ScannedRoutePath = string & { readonly __brand: unique symbol };
export type ScannedRouteName = string & { readonly __brand: unique symbol };
export type ScannedStableHash = string & { readonly __brand: unique symbol };
export type SourceFilePath = string & { readonly __brand: unique symbol };
export type SourceLineNumber = number & { readonly __brand: unique symbol };

export class NominalAtomFactory {
  public static method(method: string): ScannedRouteMethod {
    const normalized = (method || 'GET').trim().toUpperCase();
    return normalized as ScannedRouteMethod;
  }

  public static path(path: string): ScannedRoutePath {
    const normalized = (path || '/').trim();
    const formatted = normalized.startsWith('/') ? normalized : `/${normalized}`;
    return formatted as ScannedRoutePath;
  }

  public static name(name: string): ScannedRouteName {
    return (name || '').trim() as ScannedRouteName;
  }

  public static stableHash(hash: string): ScannedStableHash {
    return (hash || '').trim() as ScannedStableHash;
  }

  public static sourceFile(file: string): SourceFilePath {
    return (file || '').trim() as SourceFilePath;
  }

  public static sourceLine(line: number | undefined): SourceLineNumber {
    const validLine = typeof line === 'number' && Number.isFinite(line) && line > 0 ? Math.floor(line) : 1;
    return validLine as SourceLineNumber;
  }
}
