import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ReviewService } from "../services/review-service"
import { QueryKey } from "@/lib/core/query-key"
import { ReviewFormValues } from "../contracts/api-schema"

export const useReview = {
  useIndex(produkId: number) {
    return useQuery({
      queryKey: QueryKey.produk.reviewList(produkId),
      queryFn: () => ReviewService.index(produkId),
      enabled: produkId > 0,
    })
  },

  useCreate(produkId: number) {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (form: ReviewFormValues['Create']) => ReviewService.create(produkId, form),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: QueryKey.produk.reviewList(produkId) })
        qc.invalidateQueries({ queryKey: QueryKey.produk.lists() })
      },
    })
  },
}
