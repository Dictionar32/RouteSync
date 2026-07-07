export function camelCase(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, p1) => p1.toUpperCase());
}

export function snakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function camelCaseKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(v => camelCaseKeys(v));
  } else if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
    const rawObj = obj as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rawObj)) {
      result[camelCase(key)] = camelCaseKeys(value);
    }
    return result;
  }
  return obj;
}

export function snakeCaseKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(v => snakeCaseKeys(v));
  } else if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
    const rawObj = obj as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rawObj)) {
      result[snakeCase(key)] = snakeCaseKeys(value);
    }
    return result;
  }
  return obj;
}
