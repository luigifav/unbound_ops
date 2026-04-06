import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full min-h-screen">
      <MobileNav />
      <Sidebar />
      {/* pt-16 on mobile offsets the fixed h-14 top bar + a little breathing room */}
      <main className="flex-1 overflow-auto pt-16 px-4 pb-6 sm:px-6 lg:p-8 lg:pt-8">
        {children}
      </main>
    </div>
  )
}
