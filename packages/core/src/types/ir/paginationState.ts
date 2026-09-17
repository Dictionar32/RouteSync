/** Canonical closed pagination state for endpoint IR. */
import type { ResponseMetaKey } from "../domain/semanticValues";

export type PaginationDescriptor =
    | { readonly kind: 'cursor'; readonly metaFields: readonly ResponseMetaKey[] }
    | { readonly kind: 'offset'; readonly metaFields: readonly ResponseMetaKey[] }
    | { readonly kind: 'simple'; readonly metaFields: readonly ResponseMetaKey[] };

export type PaginationState =
    | { readonly kind: 'none' }
    | { readonly kind: 'present'; readonly value: PaginationDescriptor };
