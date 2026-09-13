/**
 * index.ts
 *
 * Sub-domain exports for cart intent resolution.
 *
 * @module cli/resolvers/intent
 */

export {
  type CartModelInfo,
  resolveCartModelInfo
} from './cartModelResolver';
export {
  type CartGroupInfo,
  detectCartGroups
} from './cartGroupDetector';
