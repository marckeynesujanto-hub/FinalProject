'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/home', label: 'Beranda', icon: '🏠' },
  { href: '/subscription', label: 'Jemput', icon: '🚛' },
  { href: '/map', label: 'Peta', icon: '🗺️' },
  { href: '/marketplace', label: 'Toko', icon: '♻️' },
  { href: '/leaderboard', label: 'Rank', icon: '🏆' },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-bottom"
      aria-label="Navigasi utama"
    >
      <div className="mx-auto max-w-lg flex items-stretch">
        {NAV_ITEMS.map(item => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 transition-colors pressable
                ${active ? 'text-green-600' : 'text-gray-400'}`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className={`text-[10px] mt-1 font-semibold ${active ? 'text-green-700' : ''}`}>
                {item.label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-green-600 rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
