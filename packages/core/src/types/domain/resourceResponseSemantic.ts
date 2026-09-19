export type ResourcePaginationDelivery =
  | { readonly kind: 'length_aware' }
  | { readonly kind: 'simple' }
  | { readonly kind: 'cursor' };
