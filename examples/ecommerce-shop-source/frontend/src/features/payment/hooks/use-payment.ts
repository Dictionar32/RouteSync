import { useMutation, useQueryClient } from "@tanstack/react-query"
import { PaymentService } from "../services/payment-service"
import { QueryKey } from "@/lib/core/query-key"
import type { PaymentFormValues } from "../contracts/api-schema"

export const usePayment = {
  useCreate(orderId: number) {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (form: PaymentFormValues['Create']) => PaymentService.create(orderId, form),
      onSuccess: () => {
        // Invalidate order list supaya status terupdate
        qc.invalidateQueries({ queryKey: QueryKey.order.lists() })
        qc.invalidateQueries({ queryKey: QueryKey.cart.summary() })
      },
    })
  },
}
