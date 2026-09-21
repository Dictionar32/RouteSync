/**
 * Order API Field - Field constants for API requests
 */
export const OrderApiField = {
  // Order shipping fields (with shipping_ prefix to match backend)
  NAMA: "shipping_nama",
  TELEPON: "shipping_telepon",
  ALAMAT: "shipping_alamat",
  KOTA: "shipping_kota",
  KODE_POS: "shipping_kode_pos",
  // List fields
  PAGE: "page",
  PER_PAGE: "per_page",
  STATUS: "status",
} as const;
