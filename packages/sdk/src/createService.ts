import { HttpClient } from '@routesync/core'

export class GenericService {
  constructor(
    private client: HttpClient,
    private endpoint: string
  ) {}

  findAll(params?: Record<string, any>) {
    return this.client.get(this.endpoint, { params })
  }

  findById(id: string | number) {
    return this.client.get(`${this.endpoint}/${id}`)
  }

  create(payload: any) {
    return this.client.post(this.endpoint, payload)
  }

  update(id: string | number, payload: any) {
    return this.client.put(`${this.endpoint}/${id}`, payload)
  }

  patch(id: string | number, payload: any) {
    return this.client.patch(`${this.endpoint}/${id}`, payload)
  }

  delete(id: string | number) {
    return this.client.delete(`${this.endpoint}/${id}`)
  }

  upload(file: FormData) {
    return this.client.upload(`${this.endpoint}/upload`, file)
  }
}

export function createService(client: HttpClient, endpoint: string) {
  return new GenericService(client, endpoint)
}
