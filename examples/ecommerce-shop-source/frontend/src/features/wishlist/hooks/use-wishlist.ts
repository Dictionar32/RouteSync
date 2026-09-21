import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WishlistService } from "../services/wishlist-service";
import { QueryKey } from "@/lib/core/query-key";
import { WishlistFormValues } from "../contracts/api-schema";

export const useWishlist = {
  /** GET /wishlist */
  useIndex() {
    return useQuery({
      queryKey: QueryKey.wishlist.list(),
      queryFn: () => WishlistService.index(),
    });
  },

  /** POST /wishlist — mutationFn receives WishlistFormValues.Create { produkItemId } */
  useCreate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (form: WishlistFormValues['Create']) => WishlistService.create(form),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: QueryKey.wishlist.list() });
        qc.invalidateQueries({ queryKey: QueryKey.produk.lists() });
      },
    });
  },

  /** DELETE /wishlist/{produkItemId} */
  useRemove() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (produkItemId: number) => WishlistService.delete(produkItemId),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: QueryKey.wishlist.list() });
        qc.invalidateQueries({ queryKey: QueryKey.produk.lists() });
      },
    });
  },
};
