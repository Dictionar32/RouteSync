/**
 * reactQueryEmitter.ts
 *
 * Emits ReactQueryHooks metadata from SemanticIRNode.
 *
 * @module sdk/generator
 */

import type { SemanticIRNode, ReactQueryHooks } from '@routesync/core';

export class ReactQueryEmitter {
  static from(node: SemanticIRNode, routeName: string, pathParams: string[]): ReactQueryHooks {
    const key = [routeName, ...pathParams];
    const isGet = node.meta?.tags?.includes('GET') ?? true;

    return {
      key,
      useQuery: isGet ? `use${this.capitalize(routeName)}` : undefined,
      useMutation: !isGet ? `use${this.capitalize(routeName)}Mutation` : undefined,
    };
  }

  private static capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
