'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dumbbell, Plus, TrendingUp, LogOut, ClipboardList } from 'lucide-react'
import { logout } from '@/app/actions/auth'

export function Navbar() {
  const pathname = usePathname()

  const handleLogout = async () => {
    await logout()
  }

  const navItems = [
    { href: '/workouts', label: 'Treinos', icon: ClipboardList },
    { href: '/workouts/new', label: 'Novo Treino', icon: Plus },
    { href: '/progress', label: 'Progresso', icon: TrendingUp },
  ]

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <Dumbbell className="h-6 w-6" />
            <span className="hidden sm:inline">GymTracker</span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Button
                  key={item.href}
                  variant={isActive ? 'default' : 'ghost'}
                  asChild
                >
                  <Link href={item.href} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                </Button>
              )
            })}

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
