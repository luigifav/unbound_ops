'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navLinks = [
  { href: '/', label: 'Overview', icon: '◈' },
  { href: '/transactions', label: 'Transações', icon: '↔' },
  { href: '/agencies', label: 'Clientes', icon: '⊞' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className="hidden lg:flex h-screen w-56 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center px-5 border-b border-gray-100">
        <span className="text-lg font-bold" style={{ color: '#7C3AED' }}>
          Unbound Ops
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navLinks.map(({ href, label, icon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              style={isActive ? { backgroundColor: '#7C3AED' } : undefined}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-100 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <span>→</span>
          Sair
        </button>
      </div>
    </aside>
  )
}
