import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OrderService } from "../services/order-service";
import { QueryKey } from "@/lib/core/query-key";
import { OrderFormValues } from "../contracts/api-schema";

export const useOrder = {
  useIndex() {
    return useQuery({
      queryKey: QueryKey.order.lists(),
      queryFn: () => OrderService.index(),
    });
  },

  useShow(id: number) {
    return useQuery({
      queryKey: QueryKey.order.detail(id),   // include id agar cache per-order
      queryFn: () => OrderService.show(id),
      enabled: id > 0,                        // jangan fetch jika id = 0
    });
  },

  useCreate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (data: OrderFormValues['Create']) => OrderService.create(data),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: QueryKey.order.lists() });
        qc.invalidateQueries({ queryKey: QueryKey.cart.summary() });
      },
    });
  },
};
