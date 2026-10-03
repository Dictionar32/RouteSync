/** Syntax-level route-model binding facts extracted from a Laravel route URI. */
export interface RouteBindingDeclarationAst {
  readonly parameter: string;
  /** Laravel's {parameter:key} custom implicit-binding key, when present. */
  readonly customKey: string | undefined;
}

export const createRouteBindingDeclarationAst = (
  parameter: string,
  customKey?: string,
): RouteBindingDeclarationAst => Object.freeze({ parameter, customKey });

export function parseRouteBindingDeclarations(path: string): readonly RouteBindingDeclarationAst[] {
  const bindings: RouteBindingDeclarationAst[] = [];
  const parameterPattern = /\{([A-Za-z_][A-Za-z0-9_]*)(?::([A-Za-z_][A-Za-z0-9_]*))?(\?)?\}/g;
  for (const match of path.matchAll(parameterPattern)) {
    bindings.push(createRouteBindingDeclarationAst(match[1], match[2]));
  }
  return Object.freeze(bindings);
}
