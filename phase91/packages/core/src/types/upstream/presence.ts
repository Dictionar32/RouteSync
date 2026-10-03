/** Explicit presence ADT. Absence is data, never represented by undefined/null. */
export type Presence<T> =
  | { readonly kind: 'absent' }
  | { readonly kind: 'present'; readonly value: T };

export const absent = <T>(): Presence<T> => ({ kind: 'absent' });
export const present = <T>(value: T): Presence<T> => ({ kind: 'present', value });

/** Convert parser optionality into semantic presence exactly once. */
export const fromOptional = <T>(value: T | undefined): Presence<T> => {
  if (typeof value === 'undefined') return absent();
  return present(value);
};

/** Map parser optionality once, before semantic ADTs are exposed. */
export const mapOptional = <T, U>(value: T | undefined, map: (value: T) => U): Presence<U> => {
  const source = fromOptional(value);
  switch (source.kind) {
    case 'absent': return source;
    case 'present': return present(map(source.value));
  }
};

export const mapPresence = <T, U>(value: Presence<T>, map: (value: T) => U): Presence<U> => {
  switch (value.kind) {
    case 'absent': return absent();
    case 'present': return present(map(value.value));
  }
};

export const flatMapPresence = <T, U>(value: Presence<T>, map: (value: T) => Presence<U>): Presence<U> => {
  switch (value.kind) {
    case 'absent': return absent();
    case 'present': return map(value.value);
  }
};
