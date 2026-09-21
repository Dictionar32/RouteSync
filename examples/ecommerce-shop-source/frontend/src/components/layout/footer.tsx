import {
  FooterContainer, GoldAccentLine, FooterContent, FooterGrid,
  BrandSection, BrandTitle, BrandDivider, BrandDesc,
  NavSection, NavTitle, NavList, NavItemLink,
  BottomBar, CopyrightText, TechText
} from './footer.styles'

export function Footer() {
  return (
    <FooterContainer>
      {/* Gold accent line */}
      <GoldAccentLine />

      <FooterContent>
        <FooterGrid>
          {/* Brand */}
          <BrandSection>
            <BrandTitle>KUNPULAN</BrandTitle>
            <BrandDivider />
            <BrandDesc>
              Destinasi belanja online terpercaya Anda untuk produk berkualitas tinggi dengan pengalaman berbelanja yang elegan.
            </BrandDesc>
          </BrandSection>

          {/* Navigation */}
          <NavSection>
            <NavTitle>Navigasi</NavTitle>
            <NavList>
              {[
                { href: '/produk', label: 'Produk' },
                { href: '/wishlist', label: 'Wishlist' },
                { href: '/orders', label: 'Pesanan' },
                { href: '/profile', label: 'Profil' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <NavItemLink href={href}>
                    {label}
                  </NavItemLink>
                </li>
              ))}
            </NavList>
          </NavSection>

          {/* Auth */}
          <NavSection>
            <NavTitle>Akun</NavTitle>
            <NavList>
              {[
                { href: '/login', label: 'Masuk' },
                { href: '/register', label: 'Daftar' },
                { href: '/forgot-password', label: 'Lupa Password' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <NavItemLink href={href}>
                    {label}
                  </NavItemLink>
                </li>
              ))}
            </NavList>
          </NavSection>
        </FooterGrid>

        <BottomBar>
          <CopyrightText>
            © {new Date().getFullYear()} KUNPULAN. Hak cipta dilindungi.
          </CopyrightText>
          <TechText>
            Dibangun dengan Next.js & Laravel
          </TechText>
        </BottomBar>
      </FooterContent>
    </FooterContainer>
  )
}

export default Footer
