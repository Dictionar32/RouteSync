"use client";

import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProdukCard } from "./produk-card";
import { CategoryTransformed, ProdukItemResourceTransformed } from "@/api/types";

import {
  PageContainer, HeaderArea, IconGem, ContentContainer, ToolbarCard, ToolbarRow, SearchWrapper, SearchInput, SearchClearBtn, IconSearch, IconX,
  SortDesktopWrapper, StyledSelectTrigger, StyledSelectContent, CatDesktopContainer, CatMobileContainer, CatPillBtn,
  ActiveFiltersContainer, ActiveFilterChipBtn, ActiveFiltersResetBtn, ResultsCountInfo, EmptySearchContainer, EmptySearchResetBtn, IconSearchLarge, GridContainer, GridItemWrapper,
  MobileFilterBtn, IconSliders, StyledSheetContent, StyledSheetTitle, SheetBody, SheetCatBtn, SheetSelectTrigger, SheetSelectContent
} from "./produk.styles"

type SortOption = "default" | "harga_asc" | "harga_desc" | "rating" | "nama_asc" | "nama_desc";

interface ProdukListProps {
  initialData: ProdukItemResourceTransformed[];
  categories: CategoryTransformed[];
  wishlistData?: { id: number }[];
}

function FilterSheet({
  categories,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
}: {
  categories: CategoryTransformed[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <MobileFilterBtn>
          <IconSliders size={14} />
          Filter
        </MobileFilterBtn>
      </SheetTrigger>
      <StyledSheetContent>
        <SheetHeader>
          <StyledSheetTitle>Filter & Urutkan</StyledSheetTitle>
        </SheetHeader>
        <SheetBody>
          <SheetBody.section>
            <SheetBody.label>Kategori</SheetBody.label>
            <SheetBody.list>
              <SheetCatBtn
                active={selectedCategory === "all" ? "true" : "false"}
                onClick={() => onCategoryChange("all")}
              >
                Semua Kategori
              </SheetCatBtn>
              {categories.map((cat) => (
                <SheetCatBtn
                  key={cat.id}
                  active={selectedCategory === String(cat.id) ? "true" : "false"}
                  onClick={() => onCategoryChange(String(cat.id))}
                >
                  {cat.nama}
                </SheetCatBtn>
              ))}
            </SheetBody.list>
          </SheetBody.section>
          <SheetBody.section>
            <SheetBody.label>Urutkan</SheetBody.label>
            <Select value={sortBy} onValueChange={(v: any) => onSortChange(v as SortOption)}>
              <SheetSelectTrigger>
                <SelectValue placeholder="Pilih urutan" />
              </SheetSelectTrigger>
              <SheetSelectContent>
                <SelectItem value="default">Terpopuler</SelectItem>
                <SelectItem value="rating">Rating Tertinggi</SelectItem>
                <SelectItem value="harga_asc">Harga: Rendah ke Tinggi</SelectItem>
                <SelectItem value="harga_desc">Harga: Tinggi ke Rendah</SelectItem>
                <SelectItem value="nama_asc">Nama: A–Z</SelectItem>
                <SelectItem value="nama_desc">Nama: Z–A</SelectItem>
              </SheetSelectContent>
            </Select>
          </SheetBody.section>
        </SheetBody>
      </StyledSheetContent>
    </Sheet>
  );
}

export function ProdukList({ initialData, categories = [], wishlistData = [] }: ProdukListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [products] = useState<ProdukItemResourceTransformed[]>(initialData);

  const wishlistProductIds = useMemo(() => {
    if (!wishlistData) return new Set<number>();
    return new Set(wishlistData.map((item) => item.id));
  }, [wishlistData]);

  const filteredProducts = useMemo((): ProdukItemResourceTransformed[] => {
    let result = [...(products || [])];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.nama?.toLowerCase().includes(query) ||
          p.deskripsi?.toLowerCase().includes(query) ||
          p.categoryName?.toLowerCase().includes(query)
      );
    }
    if (selectedCategory !== "all") {
      const catId = Number(selectedCategory);
      result = result.filter((p) => p.categoryId === catId);
    }
    switch (sortBy) {
      case "harga_asc":  result.sort((a, b) => a.harga - b.harga); break;
      case "harga_desc": result.sort((a, b) => b.harga - a.harga); break;
      case "rating":     result.sort((a, b) => b.rating - a.rating); break;
      case "nama_asc":   result.sort((a, b) => (a.nama || '').localeCompare(b.nama || '')); break;
      case "nama_desc":  result.sort((a, b) => (b.nama || '').localeCompare(a.nama || '')); break;
      default:           result.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
    }
    return result;
  }, [products, searchQuery, selectedCategory, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSortBy("default");
  };

  const hasActiveFilters = !!searchQuery.trim() || selectedCategory !== "all" || sortBy !== "default";

  return (
    <PageContainer>
      {/* Page Header */}
      <HeaderArea>
        <HeaderArea.container>
          <HeaderArea.badgeRow>
            <IconGem size={12} />
            <HeaderArea.badgeText>Koleksi Premium</HeaderArea.badgeText>
          </HeaderArea.badgeRow>
          <HeaderArea.title>Semua Produk</HeaderArea.title>
          <HeaderArea.subtitle>{products.length} produk pilihan tersedia</HeaderArea.subtitle>
        </HeaderArea.container>
      </HeaderArea>

      <ContentContainer>
        {/* Toolbar */}
        <ToolbarCard>
          <ToolbarRow>
            {/* Search */}
            <SearchWrapper>
              <IconSearch size={14} />
              <SearchInput
                type="search"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <SearchClearBtn onClick={() => setSearchQuery("")}>
                  <IconX size={13} />
                </SearchClearBtn>
              )}
            </SearchWrapper>

            {/* Sort — desktop */}
            <SortDesktopWrapper>
              <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
                <StyledSelectTrigger>
                  <SelectValue placeholder="Urutkan" />
                </StyledSelectTrigger>
                <StyledSelectContent>
                  <SelectItem value="default">Terpopuler</SelectItem>
                  <SelectItem value="rating">Rating Tertinggi</SelectItem>
                  <SelectItem value="harga_asc">Harga: Rendah ke Tinggi</SelectItem>
                  <SelectItem value="harga_desc">Harga: Tinggi ke Rendah</SelectItem>
                  <SelectItem value="nama_asc">Nama: A–Z</SelectItem>
                  <SelectItem value="nama_desc">Nama: Z–A</SelectItem>
                </StyledSelectContent>
              </Select>
            </SortDesktopWrapper>

            {/* Mobile filter sheet */}
            <FilterSheet
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </ToolbarRow>

          {/* Category pills */}
          {categories.length > 0 && (
            <>
              {/* Desktop */}
              <CatDesktopContainer>
                {[{ id: "all", nama: "Semua" }, ...categories.map(c => ({ id: String(c.id), nama: c.nama }))].map((cat) => (
                  <CatPillBtn
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    active={selectedCategory === cat.id ? "true" : "false"}
                  >
                    {cat.nama}
                  </CatPillBtn>
                ))}
              </CatDesktopContainer>
              {/* Mobile horizontal scroll */}
              <CatMobileContainer>
                {[{ id: "all", nama: "Semua" }, ...categories.map(c => ({ id: String(c.id), nama: c.nama }))].map((cat) => (
                  <CatPillBtn
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    active={selectedCategory === cat.id ? "true" : "false"}
                  >
                    {cat.nama}
                  </CatPillBtn>
                ))}
              </CatMobileContainer>
            </>
          )}

          {/* Active filter chips */}
          {hasActiveFilters && (
            <ActiveFiltersContainer>
              <ActiveFiltersContainer.label>Filter aktif:</ActiveFiltersContainer.label>
              {searchQuery && (
                <ActiveFiltersContainer.chip>
                  &ldquo;{searchQuery}&rdquo;
                  <ActiveFilterChipBtn onClick={() => setSearchQuery("")}><IconX size={10} /></ActiveFilterChipBtn>
                </ActiveFiltersContainer.chip>
              )}
              {selectedCategory !== "all" && (
                <ActiveFiltersContainer.chip>
                  {categories.find((c) => c.id === Number(selectedCategory))?.nama}
                  <ActiveFilterChipBtn onClick={() => setSelectedCategory("all")}><IconX size={10} /></ActiveFilterChipBtn>
                </ActiveFiltersContainer.chip>
              )}
              <ActiveFiltersResetBtn onClick={clearFilters}>
                Reset semua
              </ActiveFiltersResetBtn>
            </ActiveFiltersContainer>
          )}
        </ToolbarCard>

        {/* Results count */}
        <ResultsCountInfo>
          Menampilkan <ResultsCountInfo.count>{filteredProducts.length}</ResultsCountInfo.count> produk
        </ResultsCountInfo>

        {filteredProducts.length === 0 ? (
          <EmptySearchContainer>
            <IconSearchLarge size={40} />
            <EmptySearchContainer.title>Produk Tidak Ditemukan</EmptySearchContainer.title>
            <EmptySearchContainer.desc>Coba kata kunci lain atau ubah filter</EmptySearchContainer.desc>
            <EmptySearchResetBtn onClick={clearFilters}>Lihat Semua Produk</EmptySearchResetBtn>
          </EmptySearchContainer>
        ) : (
          <GridContainer>
            {filteredProducts.map((item, i) => (
              <GridItemWrapper
                key={item.id}
                style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
              >
                <ProdukCard item={item} isInWishlist={wishlistProductIds.has(item.id)} />
              </GridItemWrapper>
            ))}
          </GridContainer>
        )}
      </ContentContainer>
    </PageContainer>
  );
}
