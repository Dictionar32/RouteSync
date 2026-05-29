// @ts-ignore TanStack Query is a peer dependency provided by consumers.
import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'

export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  invalidateKeys?: string[][],
  options?: Omit<UseMutationOptions<TData, unknown, TVariables>, 'mutationFn'>
) {
  const queryClient = useQueryClient()

  return useMutation<TData, unknown, TVariables>({
    ...options,
    mutationFn,
    onSuccess: (...args: any[]) => {
      if (invalidateKeys) {
        invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key })
        })
      }
      options?.onSuccess?.(...args)
    }
  })
}
