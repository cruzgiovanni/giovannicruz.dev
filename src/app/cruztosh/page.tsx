import type { Metadata } from 'next'
import { DesktopSection } from '@/components/desktop/desktop-section'

// Rendered inside the Macintosh on the home page (see computer-screen.ts), so it's only the screen
export const metadata: Metadata = {
  title: 'CruzTosh',
  robots: { index: false, follow: false },
}

export default function CruzTosh() {
  return (
    <main className="h-dvh w-full overflow-hidden overscroll-none">
      <DesktopSection screenOnly />
      <style>{'div::-webkit-scrollbar { display: none; }'}</style>
    </main>
  )
}
