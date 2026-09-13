/**
 * crudTypes.ts
 *
 * Type definitions for CRUD query keys, services, caching, and extra endpoints.
 *
 * @module react/hooks/crud
 */

export type InvalidateList = Array<((...args: never[]) => readonly unknown[]) | readonly unknown[]>

export type ExtraEndpoint = {
  service: unknown
  method?: string
  queryKey?: (...args: never[]) => readonly unknown[]
  invalidate?: InvalidateList
}

export interface CrudHooksConfig<
  ReadIndexList,
  ReadShow,
  CreateForm,
  UpdateForm
> {
  groupName?: string
  domain?: string
  queryKey: {
    list: () => readonly unknown[]
    detail: (id: number) => readonly unknown[]
  }
  service: {
    index?: () => Promise<ReadIndexList>
    show?: (id: number) => Promise<ReadShow>
    create?: (data: CreateForm) => Promise<ReadShow>
    update?: (id: number, data: UpdateForm) => Promise<ReadShow>
    updateSelf?: (data: UpdateForm) => Promise<ReadShow>
    delete?: (id: number) => Promise<void>
    deleteSelf?: () => Promise<void>
  }
  cache?: {
    create?: { invalidate?: InvalidateList }
    update?: { invalidate?: InvalidateList }
    updateSelf?: { invalidate?: InvalidateList }
    delete?: { invalidate?: InvalidateList }
    deleteSelf?: { invalidate?: InvalidateList }
  }
  extras?: Record<string, ExtraEndpoint>
}
