/**
 * formDataTransformer.ts
 *
 * FormData conversion and file/blob detection utilities.
 *
 * @module core/client/http
 */

export function isFileOrBlob(val: unknown): boolean {
  return (
    (typeof File !== 'undefined' && val instanceof File) ||
    (typeof Blob !== 'undefined' && val instanceof Blob)
  );
}

export function hasFiles(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;

  if (isFileOrBlob(body)) return true;

  if (Array.isArray(body)) {
    return body.some(item => hasFiles(item));
  }

  for (const key of Object.keys(body as Record<string, unknown>)) {
    if (hasFiles((body as Record<string, unknown>)[key])) return true;
  }

  return false;
}

export function toFormData(body: unknown, formData = new FormData(), parentKey = ''): FormData {
  if (body === null || body === undefined) return formData;

  if (isFileOrBlob(body)) {
    formData.append(parentKey, body as Blob);
  } else if (Array.isArray(body)) {
    body.forEach((item, index) => {
      toFormData(item, formData, `${parentKey}[${index}]`);
    });
  } else if (typeof body === 'object') {
    Object.keys(body as Record<string, unknown>).forEach((key) => {
      const propName = parentKey ? `${parentKey}[${key}]` : key;
      toFormData((body as Record<string, unknown>)[key], formData, propName);
    });
  } else {
    formData.append(parentKey, String(body));
  }

  return formData;
}
