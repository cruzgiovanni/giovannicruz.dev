import type { Metadata } from 'next'
import { DesktopSection } from '@/components/desktop/desktop-section'

// The Macintosh's screen: framed by the 3D scene on the home page (see computer-screen.ts),
// and opened on its own on phones
export const metadata: Metadata = {
  title: 'CruzTosh',
  robots: { index: false, follow: false },
}

export default function CruzTosh() {
  return (
    <main className="h-dvh w-full overflow-hidden overscroll-none">
      <DesktopSection />
      <style>{'div::-webkit-scrollbar { display: none; }'}</style>
    </main>
  )
}
