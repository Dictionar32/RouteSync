import { useForm } from 'react-hook-form'
import type { UseFormReturn, FieldValues, DefaultValues } from 'react-hook-form'
import { useApiMutation, type ApiMutationOptions } from './useMutation'
import type { EndpointCallable, EndpointCallableOptions, ApiError } from '@routesync/sdk'

export interface UseApiFormConfig<
  TResponse,
  TParams,
  TBody extends FieldValues,
> {
  schema: object
  defaultValues: TBody
  mutation: EndpointCallable<TResponse, TParams, TBody>
  mutationOptions?: Omit<
    ApiMutationOptions<TResponse, ApiError, EndpointCallableOptions<TParams, TBody>>,
    'onSuccess' | 'onError'
  >
  onSubmitSuccess?: (data: TResponse) => void
  onSubmitError?: (error: ApiError) => void
}

export interface UseApiFormReturn<
  TResponse,
  TParams,
  TBody extends FieldValues,
> {
  form: UseFormReturn<TBody>
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
  isSubmitting: boolean
  isSubmitSuccessful: boolean
  submitError: ApiError | null
}

function serverErrorToFieldErrors(
  error: unknown,
  setError: (field: string, err: { type: string; message: string }) => void
): void {
  if (error && typeof error === 'object' && 'status' in error && (error as ApiError).status === 422) {
    const apiError = error as ApiError
    const errs = apiError.errors
    if (errs && typeof errs === 'object') {
      for (const [field, messages] of Object.entries(errs)) {
        const message = Array.isArray(messages) && messages.length > 0
          ? String(messages[0])
          : typeof messages === 'string' ? messages : undefined
        if (message) setError(field, { type: 'server', message })
      }
    }
  }
}

export function useApiForm<
  TResponse,
  TParams,
  TBody extends FieldValues,
>(
  config: UseApiFormConfig<TResponse, TParams, TBody>
): UseApiFormReturn<TResponse, TParams, TBody> {
  const { schema, defaultValues, mutation: endpoint, mutationOptions, onSubmitSuccess, onSubmitError } = config

  const { zodResolver } = require('@hookform/resolvers/zod')

  const form = useForm<TBody>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<TBody>,
  })

  const apiMutation = useApiMutation<TResponse, TParams, TBody>(endpoint, {
    ...mutationOptions,
    onSuccess: (data, variables, context) => {
      form.reset()
      onSubmitSuccess?.(data)
    },
    onError: (error, variables, context) => {
      serverErrorToFieldErrors(error, (field, err) => { ;(form.setError as (name: string, err: { type: string; message?: string }) => void)(field, err) })
      if (onSubmitError && error && typeof error === 'object' && 'status' in error) {
        onSubmitError(error as ApiError)
      }
    },
  } as ApiMutationOptions<TResponse, ApiError, EndpointCallableOptions<TParams, TBody>>)

  const handleSubmit = form.handleSubmit((formData: TBody) => {
    return apiMutation.mutate({ body: formData } as EndpointCallableOptions<TParams, TBody>)
  })

  return {
    form,
    handleSubmit,
    isSubmitting: apiMutation.isPending,
    isSubmitSuccessful: apiMutation.isSuccess,
    submitError: (apiMutation.error as ApiError | null) ?? null,
  }
}
