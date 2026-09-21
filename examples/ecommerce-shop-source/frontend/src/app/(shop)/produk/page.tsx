"use client";

import { ProdukList } from "./produk-list";
import { PageLoader } from "@/components/shared/page-loader";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useProduk, useCategories, useWishlist } from '@/api/hooks';
import { ProdukItemResourceTransformed, CategoryTransformed } from "@/api/types";

export default function ProdukPage() {
  // Fetch all data at page level (Blueprint: Page composes data)
  const { data: resProduk, isLoading: produkLoading, isError: produkError } = useProduk.index();
  const { data: resCat, isLoading: categoryLoading } = useCategories.index();
  const { data: resWishlist } = useWishlist.index();

  const produk = resProduk;
  const categories = (resCat as unknown as { data?: CategoryTransformed[] })?.data;
  const wishlistData = resWishlist;

  // Show loading for initial data fetch
  if (produkLoading || categoryLoading) {
    return <PageLoader text="Memuat produk..." />;
  }

  // Handle error state
  if (produkError) {
    return <ErrorState title="Gagal memuat produk" />;
  }

  // Handle empty state
  if (!produk || produk.length === 0) {
    return (
      <EmptyState
        title="Tidak ada produk"
        description="Produk belum tersedia saat ini"
      />
    );
  }

  // Pass all data to component (UI only)
  return (
    <ProdukList 
      initialData={produk} 
      categories={categories ?? []}
      wishlistData={wishlistData}
    />
  );
}
