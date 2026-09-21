export interface ReviewDetail {
  id: number
  rating: number
  title: string | null
  comment: string
  isVerifiedPurchase: boolean
  createdAt: string
}

export type ReviewIndex = ReviewDetail;
export type ReviewShow = ReviewDetail;