// Feature exports - Barrel pattern for clean imports
export { useWishlist } from "./hooks/use-wishlist";
export { WishlistService } from "./services/wishlist-service";
export { toApiRead, toApiReadList, toApiCreate } from "./mappers/wishlist-mapper";
export { Schema, CreateSchema, WishlishttIndexSchema, validateSchema, validateIndex, validateCreate } from "./contracts/api-contract";
export type { WishlistApiResponse, WishlistApiIndex, WishlistApiCreate } from "./contracts/api-contract";
export type { WishlistItem, WishlistIndex, WishlistShow } from "./types/wishlist-read";
export type { WishlistFormValues } from "./contracts/api-schema";
export { WishlistApiSchema, WishlistDefaultValues } from "./contracts/api-schema";

// Components
export { WishlistList } from "./components/wishlist-list";
