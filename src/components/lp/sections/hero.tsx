'use client'

import { useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import { heroContent } from '@/data/lp-info'

const sceneHeight = 'flex-1 min-h-[45svh] md:flex-none md:h-[65vh]'

// Preload Three.js chunk immediately (don't wait for hydration)
const sceneModule = typeof window !== 'undefined' ? import('./computer-scene-canvas') : null

const ComputerSceneCanvas = dynamic(
  () =>
    (sceneModule ?? import('./computer-scene-canvas')).then((mod) => ({
      default: mod.ComputerSceneCanvas,
    })),
  { ssr: false },
)

const { greeting, role } = heroContent

export function Hero() {
  const [sceneReady, setSceneReady] = useState(false)

  const onSceneReady = useCallback(() => setSceneReady(true), [])

  return (
    <section className="bg-background overflow-x-hidden flex flex-col h-[100svh] md:h-auto md:min-h-[100svh]">
      {/* 3D Scene with reveal overlay */}
      <div className={`relative w-full ${sceneHeight} bg-background cursor-grab active:cursor-grabbing border`}>
        <ComputerSceneCanvas onReadyAction={onSceneReady} />

        {/* Reveal overlay - two layers for staged dissolve */}
        {/* Layer 1: Grid lines - fade out first */}
        <div
          className={`absolute inset-0 z-20 pointer-events-none transition-opacity ${sceneReady ? 'opacity-0 `duration-800 ease-out' : 'opacity-100 duration-0'}`}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(205,214,244,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(205,214,244,0.18) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              animation: sceneReady ? 'none' : 'grid-breathe 3s ease-in-out infinite',
            }}
          />
        </div>

        {/* Layer 2: Solid background - fade out slower with delay */}
        <div
          className={`absolute inset-0 z-10 pointer-events-none bg-background ${sceneReady ? 'opacity-0' : 'opacity-100'}`}
          style={{
            transition: sceneReady ? 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.3s' : 'none',
          }}
        />

        {/* Bottom edge separator */}
        <div className="absolute bottom-0 left-0 right-0 z-5 h-px bg-border pointer-events-none" />

        <style>{`
          @keyframes grid-breathe {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>

      {/* Hero content */}
      <div className="flex shrink-0 flex-col justify-end px-2 pt-10 pb-6 md:flex-1 md:px-4 md:pb-8">
        <h1 className="font-sans text-[clamp(1.75rem,4vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          <span className="block text-foreground">{greeting}</span>
          <span className="block text-neutral-500">{role}</span>
        </h1>
      </div>
    </section>
  )
}
