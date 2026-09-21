interface SectionHeaderProps {
  label?: string
  title: string
  subtitle?: string
}

export function SectionHeader({ label, title, subtitle }: SectionHeaderProps) {
  return (
    <div className="mb-8">
      {label && <p className="text-xs font-semibold text-gold-500 tracking-widest uppercase mb-2">{label}</p>}
      <h1 className="font-heading text-3xl text-obsidian-50">{title}</h1>
      {subtitle && <p className="text-obsidian-500 text-sm mt-1">{subtitle}</p>}
      <div className="gold-divider mt-4 w-24" />
    </div>
  )
}
