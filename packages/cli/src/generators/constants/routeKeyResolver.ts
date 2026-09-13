/**
 * routeKeyResolver.ts
 *
 * Computes deterministic screaming-snake-case route keys from paths.
 *
 * @module cli/generators/constants
 */

export function resolveRouteKey(routePath: string): string {
  const cleanPath = routePath.replace(/^\/|\/$/g, '');
  const segments = cleanPath.split('/');

  const keySegments: string[] = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if ((seg.startsWith('{') && seg.endsWith('}')) || seg.startsWith(':')) {
      const paramName = seg.startsWith(':') ? seg.slice(1) : seg.slice(1, -1);
      if (paramName.toLowerCase() === 'id') {
        keySegments.push('DETAIL');
      } else {
        let processed = false;
        if (keySegments.length > 0) {
          const lastIdx = keySegments.length - 1;
          if (keySegments[lastIdx].endsWith('S')) {
            keySegments[lastIdx] = keySegments[lastIdx].slice(0, -1);
            processed = true;
          }
        }
        if (!processed) {
          const cleanParam = paramName.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
          keySegments.push(cleanParam);
        }
      }
    } else {
      keySegments.push(seg.toUpperCase().replace(/[^A-Z0-9]/g, '_'));
    }
  }
  return keySegments.filter(Boolean).join('_');
}
