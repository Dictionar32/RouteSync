export type PaginationMeta = {
  current_page: number
  from?: number
  last_page: number
  per_page: number
  to?: number
  total: number
}

export type Search = {
  page?: number
  per_page?: number
  search?: string
  kategori_id?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}