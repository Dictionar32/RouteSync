// lib/core/query-key.ts

/* =========================
   ENTITY CONSTANTS
========================= */
export const Entity = {
  AUTH: "auth",
  KATEGORI: "kategori",
  PRODUK: "produk",
  CART: "cart",
  ORDER: "order",
  WISHLIST: "wishlist",
  PAYMENT: "payment",
  PROFILE: "profile",
  PROMO: "promo",
  REVIEW: "review",
} as const;

type EntityValue = (typeof Entity)[keyof typeof Entity];

/* =========================
   BASE FACTORY (GENERIC)
========================= */
const createBaseQueryKey = <T extends EntityValue>(entity: T) => ({
  all: () => [entity] as const,
  lists: () => [entity, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [entity, "list", filters] as const,
  details: () => [entity, "detail"] as const,
  detail: (id: string | number) =>
    [entity, "detail", id] as const,
});

/* =========================
   QUERY KEY REGISTRY
========================= */
export const QueryKey = {
  /* ===== AUTH (CUSTOM — ALWAYS SPECIAL) ===== */
  auth: {
    all: () => [Entity.AUTH] as const,
    me: () => [Entity.AUTH, "me"] as const,
    profile: () => [Entity.AUTH, "profile"] as const,
    permissions: () => [Entity.AUTH, "permissions"] as const,
  },

  /* ===== SIMPLE ENTITIES ===== */
  kategori: createBaseQueryKey(Entity.KATEGORI),
  payment: createBaseQueryKey(Entity.PAYMENT),
  promo: createBaseQueryKey(Entity.PROMO),
  review: createBaseQueryKey(Entity.REVIEW),

  /* ===== PRODUK (HAS NESTED RESOURCE) ===== */
  produk: {
    ...createBaseQueryKey(Entity.PRODUK),

    reviews: () => [Entity.PRODUK, "reviews"] as const,
    reviewList: (produkId: string | number) =>
      [Entity.PRODUK, "reviews", "list", produkId] as const,
  },

  /* ===== CART (SINGLETON RESOURCE) ===== */
  cart: {
    all: () => [Entity.CART] as const,
    list: () => [Entity.CART, "list"] as const,
    summary: () => [Entity.CART, "summary"] as const,
  },

  /* ===== ORDER (COMPLEX DOMAIN) ===== */
  order: {
    ...createBaseQueryKey(Entity.ORDER),

    promo: () => [Entity.ORDER, "promo"] as const,
    items: (orderId: string | number) =>
      [Entity.ORDER, "items", orderId] as const,
    tracking: (orderId: string | number) =>
      [Entity.ORDER, "tracking", orderId] as const,
  },

  /* ===== WISHLIST (CUSTOM BEHAVIOR) ===== */
  wishlist: {
    all: () => [Entity.WISHLIST] as const,
    list: () => [Entity.WISHLIST, "list"] as const,
    check: (produkId: string | number) =>
      [Entity.WISHLIST, "check", produkId] as const,
  },

  /* ===== PROFILE ===== */
  profile: {
    all: () => [Entity.PROFILE] as const,
    me: () => [Entity.PROFILE, "me"] as const,
    addresses: () => [Entity.PROFILE, "addresses"] as const,
  },
} as const;

/* =========================
   BACKWARD COMPATIBLE EXPORTS
========================= */
export const authKeys = QueryKey.auth;
export const kategoriKeys = QueryKey.kategori;
export const produkKeys = QueryKey.produk;
export const cartKeys = QueryKey.cart;
export const orderKeys = QueryKey.order;
export const wishlistKeys = QueryKey.wishlist;
export const paymentKeys = QueryKey.payment;
export const profileKeys = QueryKey.profile;
export const promoKeys = QueryKey.promo;
export const reviewKeys = QueryKey.review;
