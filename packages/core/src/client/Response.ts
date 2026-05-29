import { ApiResponse } from '../types/response'

export class Response<T = any> {
  constructor(private raw: ApiResponse<T>) {}

  get data(): T {
    return this.raw.data
  }

  get success(): boolean {
    return this.raw.success
  }

  get message(): string | undefined {
    return this.raw.message
  }

  isOk(): boolean {
    return this.raw.success === true
  }

  unwrap(): T {
    if (!this.isOk()) {
      throw new Error(this.raw.message ?? 'Response failed')
    }
    return this.raw.data
  }
}
