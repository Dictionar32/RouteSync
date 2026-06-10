import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import type { ZodType } from 'zod'
import { useMutation, useQueryClient, type UseMutationReturnType } from '@tanstack/vue-query'
import type { EndpointCallable, EndpointCallableOptions, ApiError } from '@routesync/sdk'

// ─── Configuration ─────────────────────────────────────────────────────────

export interface UseApiFormConfig<
  TResponse,
  TParams,
  TBody extends Record<string, unknown>,
> {
  /** Zod schema that validates form input AND matches the API body type */
  schema: ZodType<TBody>
  /** Initial form values — typed against TBody */
  initialValues: TBody
  /** The endpoint callable that will receive the form data as its body */
  mutation: EndpointCallable<TResponse, TParams, TBody>
  /** Called after a successful mutation with the typed response data */
  onSuccess?: (data: TResponse) => void
}

// ─── Return type ───────────────────────────────────────────────────────────

export interface UseApiFormReturn<
  TResponse,
  TParams,
  TBody extends Record<string, unknown>,
> {
  /** Submit handler — validates with Zod, mutates, handles errors */
  handleSubmit: (e?: Event) => Promise<void>
  /** Reactive form values — typed against TBody */
  values: Readonly<ReturnType<typeof useForm>['values']>
  /** Reactive form field errors */
  errors: ReturnType<typeof useForm>['errors']
  /** True while the mutation is in flight */
  isSubmitting: ReturnType<typeof useMutation>['isPending']
  /** The TanStack mutation for advanced usage */
  mutation: UseMutationReturnType<TResponse, ApiError, EndpointCallableOptions<TParams, TBody>, unknown>
  /** Reset form fields to initial values */
  resetForm: () => void
}

// ─── Composable ────────────────────────────────────────────────────────────

export function useApiForm<
  TResponse,
  TParams,
  TBody extends Record<string, unknown>,
>(
  config: UseApiFormConfig<TResponse, TParams, TBody>
): UseApiFormReturn<TResponse, TParams, TBody> {
  const { schema, initialValues, mutation: endpoint, onSuccess } = config

  // vee-validate useForm — schema-driven, types inferred from the Zod schema
  const form = useForm({
    validationSchema: toTypedSchema(schema),
    initialValues,
  })

  const queryClient = useQueryClient()
  const [group] = endpoint.$key

  const apiMutation = useMutation<
    TResponse,
    ApiError,
    EndpointCallableOptions<TParams, TBody>,
    unknown
  >({
    mutationFn: (variables: EndpointCallableOptions<TParams, TBody>) =>
      endpoint(variables),
    onSuccess: (data: TResponse) => {
      form.resetForm()
      queryClient.invalidateQueries({ queryKey: [group] })
      onSuccess?.(data)
    },
    onError: (error: unknown) => {
      // Pipe 422 validation errors to form fields
      if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        (error as ApiError).status === 422
      ) {
        const apiError = error as ApiError
        const errs = apiError.errors
        if (errs && typeof errs === 'object') {
          for (const [field, messages] of Object.entries(errs)) {
            const message = Array.isArray(messages) && messages.length > 0
              ? String(messages[0])
              : typeof messages === 'string'
                ? messages
                : undefined
            if (message) {
              form.setFieldError(field, message)
            }
          }
        }
      }
    },
  })

  const handleSubmit = (e?: Event): Promise<void> => {
    return form.handleSubmit((formData: Record<string, unknown>) => {
      // formData sudah tervalidasi oleh Zod schema via toTypedSchema
      return apiMutation.mutate({
        body: formData,
      } as EndpointCallableOptions<TParams, TBody>)
    })(e)
  }

  return {
    handleSubmit,
    values: form.values,
    errors: form.errors,
    isSubmitting: apiMutation.isPending,
    mutation: apiMutation,
    resetForm: form.resetForm,
  }
}
