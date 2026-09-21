import { Http } from "../core/api-client";
import { requireValidId } from "../core/validation";

// Wrapper type API standar
interface ApiResponseWrapper<T> {
  success: boolean;
  message: string;
  data: T;
}

export const createBaseCrudService = <
  ApiResponse,
  ReadIndex,
  ReadShow,
  CreateForm,
  UpdateForm,
  CreatePayload,
  UpdatePayload
>(config: {
  basePath: string;

  // ✅ API CONTRACT VALIDATORS (WAJIB)
  validateIndex: (data: unknown) => ApiResponse[];
  validateShow: (data: unknown) => ApiResponse;
  validateCreate?: (data: unknown) => CreatePayload;
  validateUpdate?: (data: unknown) => UpdatePayload;

  // ✅ MAPPERS
  mapIndex: (api: ApiResponse[]) => ReadIndex[];
  mapShow: (api: ApiResponse) => ReadShow;
  mapCreate?: (data: CreateForm) => CreatePayload;
  mapUpdate?: (data: UpdateForm) => UpdatePayload;
}) => {
  const { basePath } = config;

  return {
    async index(): Promise<ReadIndex[]> {
      const res = await Http.get<ApiResponseWrapper<unknown>>(basePath);
      const validated = config.validateIndex(res.data);
      return config.mapIndex(validated);
    },

    async show(id: number): Promise<ReadShow> {
      const validId = requireValidId(id);
      const res = await Http.get<ApiResponseWrapper<unknown>>(`${basePath}/${validId}`);
      const validated = config.validateShow(res.data);
      return config.mapShow(validated);
    },

    async create(data: CreateForm): Promise<ReadShow> {
        if (!config.mapCreate || !config.validateCreate) {
            throw new Error("Create is not supported for this resource");
        }

      const payload = config.mapCreate(data);
      const validatedPayload = config.validateCreate(payload);
      const res = await Http.post<ApiResponseWrapper<unknown>>(basePath,validatedPayload);
      const validatedResponse = config.validateShow(res.data);
      return config.mapShow(validatedResponse);
    },

    async update(id: number, data: UpdateForm): Promise<ReadShow> {
        if (!config.mapUpdate || !config.validateUpdate) {
            throw new Error("Update is not supported for this resource");
        }

      const validId = requireValidId(id);
      const payload = config.mapUpdate(data);
      const validatedPayload = config.validateUpdate(payload);
      const res = await Http.put<ApiResponseWrapper<unknown>>(`${basePath}/${validId}`,validatedPayload);
      const validatedResponse = config.validateShow(res.data);
      return config.mapShow(validatedResponse);
    },

    async delete(id: number): Promise<void> {
      const validId = requireValidId(id);
      await Http.delete(`${basePath}/${validId}`);
    },
  };
};
