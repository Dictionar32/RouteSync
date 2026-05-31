import { useApiQuery, useApiMutation } from '../../src/index'
import { EndpointCallable } from '@routesync/sdk'

// Dummy setup for type inference testing
type DummyProduct = { id: number; nama: string }

const getProductEndpoint = {} as EndpointCallable<
  DummyProduct,
  { id: string },
  unknown
>

const createProductEndpoint = {} as EndpointCallable<
  DummyProduct,
  unknown,
  { nama: string; harga: number }
>

export async function testTypeAudit() {
  // 1. Query Inference tests
  const query = useApiQuery(getProductEndpoint, { params: { id: '1' } })
  
  // @ts-expect-error (Missing required params)
  useApiQuery(getProductEndpoint, {})

  // @ts-expect-error (Unknown property in params)
  useApiQuery(getProductEndpoint, { params: { xyz: 1 } })

  // Data inference
  query.data?.nama
  // @ts-expect-error
  query.data?.notExist

  // Select inference
  const selectedQuery = useApiQuery(
    getProductEndpoint,
    { params: { id: '1' } },
    { select: (data) => data.nama }
  )
  selectedQuery.data?.toUpperCase()
  // @ts-expect-error
  selectedQuery.data?.nama // data is now string, not DummyProduct

  // Error Inference
  query.error?.message
  query.error?.status
  query.error?.errors

  // 2. Mutation Inference tests
  const mutation = useApiMutation(createProductEndpoint)
  
  // @ts-expect-error (Missing required body)
  mutation.mutate({})

  // @ts-expect-error (Unknown property in body)
  mutation.mutate({ body: { xyz: 1 } })

  // Should succeed
  mutation.mutate({ body: { nama: 'Test', harga: 100 } })

  // Data inference
  mutation.data?.nama
  // @ts-expect-error
  mutation.data?.notExist

  // Error Inference
  mutation.error?.message
  mutation.error?.status
  mutation.error?.errors
}
