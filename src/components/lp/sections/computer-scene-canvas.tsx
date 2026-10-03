'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/components/locale-provider'
import { initScene } from './computer-scene'

export function ComputerSceneCanvas({ onReadyAction }: { onReadyAction?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const locale = useLocale()

  // Phones: CruzTosh on its own, full screen, until there's a mobile take on the scene
  const handleScreenClick = useCallback(() => {
    router.push('/cruztosh')
  }, [router])

  useEffect(() => {
    if (!containerRef.current) return
    const cleanup = initScene(containerRef.current, locale, onReadyAction, handleScreenClick)
    return cleanup
  }, [locale, onReadyAction, handleScreenClick])

  return <div ref={containerRef} className="absolute inset-0" />
}
