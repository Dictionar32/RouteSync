/**
 * crudNotifications.ts
 *
 * Toast and notification message extractors for CRUD actions.
 *
 * @module react/hooks/crud
 */

export const getToastMessage = (
  action: 'create' | 'update' | 'remove',
  status: 'success' | 'error',
  groupName: string
): string => {
  const displayName = groupName.charAt(0).toUpperCase() + groupName.slice(1)
  if (status === 'success') {
    if (action === 'create') return `Berhasil menambahkan ${displayName}`
    if (action === 'update') return `Berhasil memperbarui ${displayName}`
    if (action === 'remove') return `Berhasil menghapus ${displayName}`
  } else {
    if (action === 'create') return `Gagal menambahkan ${displayName}`
    if (action === 'update') return `Gagal memperbarui ${displayName}`
    if (action === 'remove') return `Gagal menghapus ${displayName}`
  }
  return ''
}

export const getSuccessMessage = (
  data: unknown,
  action: 'create' | 'update' | 'remove',
  groupName: string
): string => {
  if (
    data &&
    typeof data === 'object' &&
    'message' in data &&
    typeof (data as { message: unknown }).message === 'string'
  ) {
    return (data as { message: string }).message
  }
  return getToastMessage(action, 'success', groupName)
}

export const getErrorMessage = (
  error: unknown,
  action: 'create' | 'update' | 'remove',
  groupName: string
): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const resData = (error as { response?: { data?: unknown } }).response?.data
    if (
      resData &&
      typeof resData === 'object' &&
      'message' in resData &&
      typeof (resData as { message: unknown }).message === 'string'
    ) {
      return (resData as { message: string }).message
    }
  }
  return getToastMessage(action, 'error', groupName)
}
