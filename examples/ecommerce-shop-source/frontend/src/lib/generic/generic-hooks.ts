import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { requireValidId } from "@/lib/core/validation";

export const createCrudHooks = <
  ReadIndex,
  ReadShow,
  CreateForm,
  UpdateForm
>(config: {
  queryKey: {
    list: () => readonly unknown[];
    detail: (id: number) => readonly unknown[];
  };
  service: {
    index: () => Promise<ReadIndex[]>;
    show: (id: number) => Promise<ReadShow>;
    create?: (data: CreateForm) => Promise<ReadShow>;
    update?: (id: number, data: UpdateForm) => Promise<ReadShow>;
    delete?: (id: number) => Promise<void>;
  };
}) => {
  const { service, queryKey } = config;

  // Enterprise pattern: useIndex() - no params needed
  const useIndex = () => {
    return useQuery({
      queryKey: queryKey.list(),
      queryFn: service.index,
    });
  };

  // Enterprise pattern: useShow(id)
  const useShow = (id: number) => {
    const validId = requireValidId(id);
    return useQuery({
      queryKey: queryKey.detail(validId),
      enabled: Number.isFinite(id),
      queryFn: () => service.show(validId),
    });
  };

  // Enterprise pattern: useCreate()
  const useCreate = () => {
    const createService = service.create;
    if (!createService) {
      throw new Error("Create is not supported for this resource");
    }

    const qc = useQueryClient();

    return useMutation({
      mutationFn: createService,
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: queryKey.list() });
      },
    });
  };

  // Enterprise pattern: useUpdate()
  const useUpdate = () => {
    const updateService = service.update;
    if (!updateService) {
      throw new Error("Update is not supported for this resource");
    }

    const qc = useQueryClient();

    return useMutation({
      mutationFn: ({ id, data }: { id: number; data: UpdateForm }) => {
        const validId = requireValidId(id);
        return updateService(validId, data);
      },
      onSuccess: (_data: unknown, vars) => {
        qc.invalidateQueries({ queryKey: queryKey.list() });
        qc.invalidateQueries({ queryKey: queryKey.detail(vars.id) });
      },
    });
  };

  // Enterprise pattern: useRemove() (alias for delete)
  const useRemove = () => {
    const deleteService = service.delete;
    if (!deleteService) {
      throw new Error("Delete is not supported for this resource");
    }

    const qc = useQueryClient();

    return useMutation({
      mutationFn: (id: number) => {
        const validId = requireValidId(id);
        return deleteService(validId);
      },
      onSuccess: (_data: unknown, id: number) => {
        qc.invalidateQueries({ queryKey: queryKey.list() });
        qc.invalidateQueries({ queryKey: queryKey.detail(id) });
      },
    });
  };

  // Return hooks object directly - supports useProduk.index()
  // Also add legacy properties for backward compatibility: useProduk.useIndex()
  return {
    index: useIndex,
    show: useShow,
    create: useCreate,
    update: useUpdate,
    remove: useRemove,
    delete: useRemove, // alias for remove
    
    // Legacy patterns
    useIndex,
    useShow,
    useCreate,
    useUpdate,
    useDelete: useRemove,
    useRemove,
  };
};
