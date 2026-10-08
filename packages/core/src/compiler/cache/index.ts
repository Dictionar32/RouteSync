/**
 * Compiler cache public surface. Contracts are erased; cache implementations remain runtime values.
 */
export type { ArtifactCache, CacheDescriptor, CacheInputDescriptor } from './ArtifactCache';
export { LRUCache } from './LRUCache';
