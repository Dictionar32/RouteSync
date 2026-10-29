import { HttpClient } from '@routesync/core'
import { type SchemaLike, parseWithSchema } from './mappers/schema'
import { toCamelCase, toSnakeCase } from './mappers/case'

export type Id = string | number
export type QueryParams = Record<string, unknown>

export interface GenericServiceOptions<
  TEntity,
  TCreateInput = Partial<TEntity>,
  TUpdateInput = Partial<TCreateInput>,
  TBackendEntity = unknown
> {
  /** Validate one backend entity before it is mapped to frontend shape. Works with Zod schemas. */
  entitySchema?: SchemaLike<TBackendEntity>
  /** Validate backend list responses before each item is mapped to frontend shape. Works with Zod arrays. */
  listSchema?: SchemaLike<TBackendEntity[]>
  /** Validate frontend create payloads before they are mapped to backend snake_case. Works with Zod schemas. */
  createSchema?: SchemaLike<TCreateInput>
  /** Validate frontend update/patch payloads before they are mapped to backend snake_case. Works with Zod schemas. */
  updateSchema?: SchemaLike<TUpdateInput>
  /** Override backend -> frontend mapping. Defaults to deep snake_case -> camelCase. */
  fromBackend?: (value: TBackendEntity) => TEntity
  /** Override frontend -> backend mapping. Defaults to deep camelCase -> snake_case. */
  toBackend?: (value: TCreateInput | TUpdateInput | QueryParams) => unknown
  /** Disable if your backend already returns camelCase. Defaults to true. */
  mapResponseKeys?: boolean
  /** Disable if your backend accepts camelCase. Defaults to true. */
  mapRequestKeys?: boolean
}

export class GenericService<
  TEntity = unknown,
  TCreateInput = Partial<TEntity>,
  TUpdateInput = Partial<TCreateInput>,
  TBackendEntity = unknown
> {
  constructor(
    private client: HttpClient,
    private endpoint: string,
    private options: GenericServiceOptions<
      TEntity,
      TCreateInput,
      TUpdateInput,
      TBackendEntity
    > = {}
  ) {}

  async findAll(params?: QueryParams): Promise<TEntity[]> {
    const response = await this.client.get<unknown>(this.endpoint, {
      params: this.mapRequest(params)
    })
    const extracted = this.extractData(response)
    if (this.options.listSchema) {
      const items = parseWithSchema(this.options.listSchema, extracted)
      if (!Array.isArray(items)) {
        throw new Error('RouteSync list schema must parse to an array')
      }
      return items.map((item) => this.mapEntity(item))
    }

    // If only an entity schema is configured, validate each list item through
    // that canonical parser instead of treating the whole raw response as T[].
    return this.requireArray(extracted).map((item) => this.mapEntity(this.parseEntity(item)))
  }

  async findById(id: Id, params?: QueryParams): Promise<TEntity> {
    const response = await this.client.get<unknown>(`${this.endpoint}/${id}`, {
      params: this.mapRequest(params)
    })
    return this.mapEntity(this.parseEntity(this.extractData(response)))
  }

  async create(payload: TCreateInput): Promise<TEntity> {
    const validated = this.options.createSchema
      ? parseWithSchema(this.options.createSchema, payload)
      : payload
    const response = await this.client.post<unknown>(this.endpoint, this.mapRequest(validated))
    return this.mapEntity(this.parseEntity(this.extractData(response)))
  }

  async update(id: Id, payload: TUpdateInput): Promise<TEntity> {
    const validated = this.options.updateSchema
      ? parseWithSchema(this.options.updateSchema, payload)
      : payload
    const response = await this.client.put<unknown>(
      `${this.endpoint}/${id}`,
      this.mapRequest(validated)
    )
    return this.mapEntity(this.parseEntity(this.extractData(response)))
  }

  async patch(id: Id, payload: TUpdateInput): Promise<TEntity> {
    const validated = this.options.updateSchema
      ? parseWithSchema(this.options.updateSchema, payload)
      : payload
    const response = await this.client.patch<unknown>(
      `${this.endpoint}/${id}`,
      this.mapRequest(validated)
    )
    return this.mapEntity(this.parseEntity(this.extractData(response)))
  }

  async delete<TDeleteResponse = unknown>(id: Id): Promise<TDeleteResponse> {
    const response = await this.client.delete<unknown>(`${this.endpoint}/${id}`)
    return this.extractData(response) as TDeleteResponse
  }

  async upload(file: FormData): Promise<TEntity> {
    const response = await this.client.upload<unknown>(`${this.endpoint}/upload`, file)
    return this.mapEntity(this.parseEntity(this.extractData(response)))
  }

  private requireArray(value: unknown): readonly unknown[] {
    if (!Array.isArray(value)) {
      throw new Error('RouteSync list response must be an array when no list schema is configured')
    }
    return value
  }

  private extractData(response: unknown): unknown {
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as { data: unknown }).data
    }

    return response
  }

  private parseEntity(value: unknown): TBackendEntity {
    return this.options.entitySchema
      ? parseWithSchema(this.options.entitySchema, value)
      : value as TBackendEntity
  }

  private mapEntity(value: TBackendEntity): TEntity {
    if (this.options.fromBackend) {
      return this.options.fromBackend(value)
    }

    if (this.options.mapResponseKeys === false) {
      return value as unknown as TEntity
    }

    return toCamelCase(value) as unknown as TEntity
  }

  private mapRequest<T>(value: T): unknown {
    if (value === undefined) return undefined

    if (this.options.toBackend) {
      return this.options.toBackend(value as TCreateInput | TUpdateInput | QueryParams)
    }

    if (this.options.mapRequestKeys === false) {
      return value
    }

    return toSnakeCase(value)
  }
}

export interface CreateService {
  <
    TEntity = unknown,
    TCreateInput = Partial<TEntity>,
    TUpdateInput = Partial<TCreateInput>,
    TBackendEntity = unknown
  >(
    client: HttpClient,
    endpoint: string,
    options?: GenericServiceOptions<TEntity, TCreateInput, TUpdateInput, TBackendEntity>
  ): GenericService<TEntity, TCreateInput, TUpdateInput, TBackendEntity>
}

export const createService: CreateService = <
  TEntity = unknown,
  TCreateInput = Partial<TEntity>,
  TUpdateInput = Partial<TCreateInput>,
  TBackendEntity = unknown
>(
  client: HttpClient,
  endpoint: string,
  options?: GenericServiceOptions<TEntity, TCreateInput, TUpdateInput, TBackendEntity>
): GenericService<TEntity, TCreateInput, TUpdateInput, TBackendEntity> => {
  return new GenericService<TEntity, TCreateInput, TUpdateInput, TBackendEntity>(
    client,
    endpoint,
    options
  )
}
