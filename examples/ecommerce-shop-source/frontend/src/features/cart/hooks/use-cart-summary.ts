import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CartSummaryService } from "../services/cart-summary-service";
import { QueryKey } from "@/lib/core/query-key";
import useAuthStore from "@/lib/stores/auth-store";
import { CartFormValues } from "../contracts/api-schema";

export const useCartSummary = {
  /** GET /keranjang — only when authenticated */
  useGet() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    return useQuery({
      queryKey: QueryKey.cart.summary(),
      queryFn: () => CartSummaryService.get(),
      enabled: isAuthenticated,
      staleTime: 30_000,
    });
  },

  /** POST /cart/items — form: CartFormValues.Create { produkItemId, qty } */
  useAddItem() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (form: CartFormValues['Create']) => CartSummaryService.addItem(form),
      onSuccess: (data) => {
        qc.setQueryData(QueryKey.cart.summary(), data);
      },
    });
  },

  /** PATCH /cart/items/:id — form: CartFormValues.Update { qty } */
  useUpdateItem() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ produkItemId, qty }: { produkItemId: number; qty: number }) =>
        CartSummaryService.updateItem(produkItemId, { qty }),
      onSuccess: (data) => {
        qc.setQueryData(QueryKey.cart.summary(), data);
      },
    });
  },

  /** DELETE /cart/items/:id */
  useRemoveItem() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (produkItemId: number) => CartSummaryService.removeItem(produkItemId),
      onSuccess: (data) => {
        qc.setQueryData(QueryKey.cart.summary(), data);
        qc.invalidateQueries({ queryKey: QueryKey.cart.summary() });
      },
    });
  },

  /** POST /cart/promo */
  useApplyPromo() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (code: string) => CartSummaryService.applyPromo(code),
      onSuccess: (data) => {
        qc.setQueryData(QueryKey.cart.summary(), data);
      },
    });
  },

  /** DELETE /cart/promo */
  useRemovePromo() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: () => CartSummaryService.removePromo(),
      onSuccess: (data) => {
        qc.setQueryData(QueryKey.cart.summary(), data);
        qc.invalidateQueries({ queryKey: QueryKey.cart.summary() });
      },
    });
  },
};
