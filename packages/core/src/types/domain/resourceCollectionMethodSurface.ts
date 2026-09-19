import type { MethodName, PropertyName } from './semanticValues';

export type ResourceCollectionMethod =
  | { readonly kind: 'pluck'; readonly method: MethodName; readonly property: PropertyName }
  | { readonly kind: 'filter'; readonly method: MethodName }
  | { readonly kind: 'values'; readonly method: MethodName }
  | { readonly kind: 'group_by'; readonly method: MethodName; readonly property: PropertyName }
  | { readonly kind: 'map'; readonly method: MethodName }
  | { readonly kind: 'through'; readonly method: MethodName }
  | { readonly kind: 'unsupported'; readonly method: MethodName };

export function classifyResourceCollectionMethod(method: MethodName): ResourceCollectionMethod['kind'] {
  switch (method.value) {
    case 'pluck': return 'pluck';
    case 'filter': return 'filter';
    case 'values': return 'values';
    case 'groupBy': return 'group_by';
    case 'map': return 'map';
    case 'through': return 'through';
    default: return 'unsupported';
  }
}
