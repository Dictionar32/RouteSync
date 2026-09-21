import { CategoryService } from "../services/category-service";
import { QueryKey } from "@/lib/core/query-key";
import { createCrudHooks } from "@/lib/generic/generic-hooks";

export const useCategory = createCrudHooks({
    queryKey: {
        list: () => [QueryKey.kategori.lists()],
        detail: (id: number) => [QueryKey.kategori.detail(id)]
    },
    service: {
        index: CategoryService.index,
        show: CategoryService.show,
        create: CategoryService.create,
        update: CategoryService.update,
        delete: CategoryService.delete,
    }
})
