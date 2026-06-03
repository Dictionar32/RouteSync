import { describe, it, expect } from 'vitest'
import { defineApi, endpoint } from '../src/index'

describe('EndpointCallable $queryKey', () => {
  it('should return a flat array without options', () => {
    const api = defineApi({
      produk: {
        show: endpoint({ method: 'GET', path: '/produk/{id}' })
      }
    })

    expect(api.produk.show.$queryKey()).toEqual(['produk', 'show'])
  })

  it('should return a flat array with options', () => {
    const api = defineApi({
      produk: {
        show: endpoint({ method: 'GET', path: '/produk/{id}' })
      }
    })

    const options = { params: { id: 1 } }
    
    expect(api.produk.show.$queryKey(options as any)).toEqual([
      'produk',
      'show',
      { params: { id: 1 } }
    ])
  })
})
