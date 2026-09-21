import { createCrudHooks } from "@/lib/generic/generic-hooks";
import { QueryKey } from "@/lib/core/query-key";
import { PromoService } from "../services/promo-service";

export const usePromo = createCrudHooks({
    queryKey: {
        list: () => [QueryKey.promo.list],
        detail: (id: number) => [QueryKey.promo.detail, id]
    },
    service: {
        index: PromoService.index,
        show: PromoService.show,
        create: PromoService.create,
    }
})