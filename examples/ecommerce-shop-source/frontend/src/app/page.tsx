import { Shield, Truck, RotateCcw, Star, ArrowRight, Gem } from "lucide-react";
import {
  PageContainer, HeroSection, RadialGlowWrapper, RadialGlow1, RadialGlow2, RadialGlow3, GridOverlay,
  HeroContentWrapper, LabelBox, LabelText, StyledGemIcon, HeroTitle, HeroTitleGradient, HeroDesc, HeroBtnGroup, PrimaryBtn, SecondaryBtn,
  StatsGrid, StatBox, StatValue, StatLabel, GoldDividerBox,
  FeaturesSection, FeaturesWrapper, FeaturesHeader, FeaturesSubtitle, FeaturesTitle, FeaturesGrid,
  FeatureCard, FeatureIconBox, FeatureTitle, FeatureDesc,
  CtaSection, CtaWrapper, CtaBox, CtaPattern, CtaSubtitle, CtaTitle, CtaDesc, CtaBtn
} from "./home.styles";

const features = [
  { icon: Shield,    title: "Kualitas Terjamin",    desc: "Setiap produk melewati seleksi ketat untuk memastikan standar premium." },
  { icon: Truck,     title: "Pengiriman Cepat",     desc: "Dikirim langsung ke pintumu dalam waktu tercepat dengan aman." },
  { icon: RotateCcw, title: "Garansi Pengembalian", desc: "Tidak puas? Kembalikan dalam 30 hari tanpa pertanyaan." },
  { icon: Star,      title: "Layanan Eksklusif",    desc: "Tim dukungan kami siap 24/7 untuk pengalaman terbaik Anda." },
];

export default function HomePage() {
  return (
    <PageContainer>
      {/* ── Hero ── */}
      <HeroSection>
        {/* Radial glow */}
        <RadialGlowWrapper>
          <RadialGlow1 />
          <RadialGlow2 />
          <RadialGlow3 />
        </RadialGlowWrapper>

        {/* Grid overlay */}
        <GridOverlay />

        <HeroContentWrapper>
          {/* Label */}
          <LabelBox>
            <StyledGemIcon>
              <Gem size={12} />
            </StyledGemIcon>
            <LabelText>Premium Collection 2025</LabelText>
          </LabelBox>

          <HeroTitle>
            Kemewahan<br/>
            <HeroTitleGradient>
              Ada di Sini
            </HeroTitleGradient>
          </HeroTitle>

          <HeroDesc>
            Temukan koleksi produk eksklusif yang dipilih dengan cermat untuk mereka yang menghargai kualitas tanpa kompromi.
          </HeroDesc>

          <HeroBtnGroup>
            <PrimaryBtn href="/produk">
              Jelajahi Koleksi <ArrowRight size={15} />
            </PrimaryBtn>
            <SecondaryBtn href="/register">
              Daftar Gratis
            </SecondaryBtn>
          </HeroBtnGroup>

          {/* Stats */}
          <StatsGrid>
            {[
              { val: "500+", label: "Produk Premium" },
              { val: "10K+", label: "Pelanggan Puas" },
              { val: "4.9★", label: "Rating Rata-rata" },
            ].map(({ val, label }) => (
              <StatBox key={label}>
                <StatValue>{val}</StatValue>
                <StatLabel>{label}</StatLabel>
              </StatBox>
            ))}
          </StatsGrid>
        </HeroContentWrapper>
      </HeroSection>

      {/* ── Gold divider ── */}
      <GoldDividerBox />

      {/* ── Features ── */}
      <FeaturesSection>
        <FeaturesWrapper>
          <FeaturesHeader>
            <FeaturesSubtitle>Mengapa KUNPULAN</FeaturesSubtitle>
            <FeaturesTitle>Pengalaman Belanja<br/>yang Berbeda</FeaturesTitle>
          </FeaturesHeader>
          <FeaturesGrid>
            {features.map(({ icon: Icon, title, desc }, i) => (
              <FeatureCard key={title} style={{ animationDelay: `${i * 100}ms` }}>
                <FeatureIconBox>
                  <Icon size={20} />
                </FeatureIconBox>
                <FeatureTitle>{title}</FeatureTitle>
                <FeatureDesc>{desc}</FeatureDesc>
              </FeatureCard>
            ))}
          </FeaturesGrid>
        </FeaturesWrapper>
      </FeaturesSection>

      {/* ── CTA Banner ── */}
      <CtaSection>
        <CtaWrapper>
          <CtaBox>
            <CtaPattern />
            <CtaSubtitle>Penawaran Eksklusif</CtaSubtitle>
            <CtaTitle>
              Mulai Koleksi Anda<br/>Hari Ini
            </CtaTitle>
            <CtaDesc>
              Daftar sekarang dan dapatkan akses eksklusif ke produk premium pilihan kami.
            </CtaDesc>
            <CtaBtn href="/produk">
              Lihat Semua Produk <ArrowRight size={15} />
            </CtaBtn>
          </CtaBox>
        </CtaWrapper>
      </CtaSection>
    </PageContainer>
  );
}
