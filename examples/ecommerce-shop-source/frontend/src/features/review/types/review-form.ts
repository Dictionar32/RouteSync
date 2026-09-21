export type ReviewForm = {
  Index: {
    page?: number
    per_page?: number
  }

  Create: {
    rating: number
    title?: string
    comment: string
  }

  Update: {
    rating?: number
    title?: string
    comment?: string
  }
}
