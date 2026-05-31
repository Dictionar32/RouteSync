export function camelCase(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, p1) => p1.toUpperCase());
}

export function snakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function camelCaseKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => camelCaseKeys(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => {
        result[camelCase(key)] = camelCaseKeys(obj[key]);
        return result;
      },
      {} as any
    );
  }
  return obj;
}

export function snakeCaseKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => snakeCaseKeys(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => {
        result[snakeCase(key)] = snakeCaseKeys(obj[key]);
        return result;
      },
      {} as any
    );
  }
  return obj;
}
