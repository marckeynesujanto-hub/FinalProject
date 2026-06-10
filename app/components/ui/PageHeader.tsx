import Link from 'next/link'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  children?: React.ReactNode
  variant?: 'green' | 'teal' | 'yellow'
}

const variants = {
  green: 'bg-green-600',
  teal: 'bg-teal-600',
  yellow: 'bg-gradient-to-br from-yellow-500 to-green-500',
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  children,
  variant = 'green',
}: PageHeaderProps) {
  return (
    <div className={`${variants[variant]} px-5 pt-14 pb-6 rounded-b-3xl`}>
      <div className="flex items-start gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0 pressable"
            aria-label="Kembali"
          >
            ‹
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-white text-xl font-bold">{title}</h1>
          {subtitle && (
            <p className="text-white/80 text-sm mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}
