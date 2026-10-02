'use client'

import { DesktopSection } from '@/components/desktop/desktop-section'
import { Navbar } from '@/components/lp/sections/navbar'
import { contactContent } from '@/data/lp-info'
import { useEffect, useState } from 'react'

const portfolioNavLinks = [
  { label: 'Home', href: '/' },
  { label: 'Contato', href: contactContent.whatsapp },
]

export default function Portfolio() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (isMobile) {
    return (
      <main className="relative w-full overflow-hidden bg-background" style={{ height: '100dvh' }}>
        <div className="absolute inset-0 z-0" style={{ background: '#191919' }} />
        <Navbar navLinks={portfolioNavLinks} />
        <div className="relative z-10 flex h-full w-full overflow-hidden pt-12">
          <DesktopSection isMobileFullscreen />
        </div>
      </main>
    )
  }

  return (
    <main className="relative h-screen w-full overflow-hidden bg-background">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0" />
      </div>

      <Navbar navLinks={portfolioNavLinks} />

      <div className="relative z-10 flex h-screen overflow-hidden">
        <DesktopSection />
      </div>

      <style jsx global>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </main>
  )
}
