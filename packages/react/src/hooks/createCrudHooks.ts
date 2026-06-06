// @ts-ignore TanStack Query is a peer dependency provided by consumers.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const requireValidId = (id: unknown): number => {
  const parsed = Number(id)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ID: ${id}`)
  }
  return parsed
}

// Detect endpoint callable from api.ts ($def metadata present)
// and adapt call signature accordingly
const isEndpoint = (fn: any): boolean => typeof fn === 'function' && !!fn.$def

const callIndex = (svc: any): Promise<any> =>
  isEndpoint(svc) ? svc() : svc()

const callShow = (svc: any, id: number): Promise<any> =>
  isEndpoint(svc) ? svc({ params: { id } }) : svc(id)

const callCreate = (svc: any, data: any): Promise<any> =>
  isEndpoint(svc) ? svc({ body: data }) : svc(data)

const callUpdate = (svc: any, id: number, data: any): Promise<any> =>
  isEndpoint(svc) ? svc({ params: { id }, body: data }) : svc(id, data)

const callDelete = (svc: any, id: number): Promise<any> =>
  isEndpoint(svc) ? svc({ params: { id } }) : svc(id)

export const createCrudHooks = <
  ReadIndexList,
  ReadShow,
  CreateForm,
  UpdateForm
>(config: {
  queryKey: {
    list: () => readonly unknown[];
    detail: (id: number) => readonly unknown[];
  };
  service: {
    index?: () => Promise<ReadIndexList>;
    show?: (id: number) => Promise<ReadShow>;
    create?: (data: CreateForm) => Promise<ReadShow>;
    update?: (id: number, data: UpdateForm) => Promise<ReadShow>;
    delete?: (id: number) => Promise<void>;
  };
  cache?: {
    create?: {
      invalidate?: Array<((...args: any[]) => readonly unknown[]) | readonly unknown[]>;
    };
    update?: {
      invalidate?: Array<((...args: any[]) => readonly unknown[]) | readonly unknown[]>;
    };
    delete?: {
      invalidate?: Array<((...args: any[]) => readonly unknown[]) | readonly unknown[]>;
    };
  };
}) => {
  const { service, queryKey } = config;

  // Enterprise pattern: useIndex() - no params needed
  const useIndex = () => {
     if (!service.index) {
      throw new Error('Index is not supported for this resource')
    }
    return useQuery({
      queryKey: queryKey.list(),
      queryFn: () => callIndex(service.index),
    });
  };

  // Enterprise pattern: useShow(id)
  const useShow = (id: number) => {
    if (!service.show) {
      throw new Error('Show is not supported for this resource')
    }
    const validId = requireValidId(id);
    return useQuery({
      queryKey: queryKey.detail(validId),
      enabled: Number.isFinite(id),
      queryFn: () => callShow(service.show, validId),
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
      mutationFn: (data: CreateForm) => callCreate(createService, data),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: queryKey.list() });
        if (config.cache?.create?.invalidate) {
          config.cache.create.invalidate.forEach(inv => {
            const key = typeof inv === 'function' ? inv() : inv;
            qc.invalidateQueries({ queryKey: key });
          });
        }
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
        return callUpdate(updateService, validId, data);
      },
      onSuccess: (_data: unknown, vars) => {
        qc.invalidateQueries({ queryKey: queryKey.list() });
        qc.invalidateQueries({ queryKey: queryKey.detail(vars.id) });
        if (config.cache?.update?.invalidate) {
          config.cache.update.invalidate.forEach(inv => {
            const key = typeof inv === 'function' ? inv(vars.id) : inv;
            qc.invalidateQueries({ queryKey: key });
          });
        }
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
        return callDelete(deleteService, validId);
      },
      onSuccess: (_data: unknown, id: number) => {
        qc.invalidateQueries({ queryKey: queryKey.list() });
        qc.invalidateQueries({ queryKey: queryKey.detail(id) });
        if (config.cache?.delete?.invalidate) {
          config.cache.delete.invalidate.forEach(inv => {
            const key = typeof inv === 'function' ? inv(id) : inv;
            qc.invalidateQueries({ queryKey: key });
          });
        }
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