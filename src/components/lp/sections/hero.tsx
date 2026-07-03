'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { heroContent } from '@/data/lp-info'
import { LineShadowText } from '@/components/ui/line-shadow-text'

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

const { words, mainTitle, subtitle } = heroContent

export function Hero() {
  const [currentWord, setCurrentWord] = useState(0)
  const [sceneReady, setSceneReady] = useState(false)

  const onSceneReady = useCallback(() => setSceneReady(true), [])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>

    const start = () => {
      interval = setInterval(() => {
        setCurrentWord((prev) => (prev + 1) % words.length)
      }, 2000)
    }

    const onVisibility = () => {
      clearInterval(interval)
      if (!document.hidden) start()
    }

    start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <section className="bg-background overflow-x-hidden tracking-tight flex flex-col h-[100svh] md:block md:h-auto">
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

      {/* Hero Content */}
      <div className="px-2 md:px-4 py-8 md:py-12">
        <div className="font-sans font-bold leading-[0.97] uppercase">
          <div>
            <span className="block text-[8vw] md:text-[6vh] lg:text-[8vh] text-[#E6E6E6] tracking-tight">
              {mainTitle.line1}
            </span>
          </div>

          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.span
                key={words[currentWord]}
                className="block text-[8vw] md:text-[6vh] lg:text-[8vh] text-[#E6E6E6] my-0.5 tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <LineShadowText shadowColor="var(--primary)">{words[currentWord]}</LineShadowText>
              </motion.span>
            </AnimatePresence>
          </div>

          <div>
            <span className="block text-[8vw] md:text-[6vh] lg:text-[8vh] text-[#E6E6E6] tracking-tight">
              {mainTitle.line2}
            </span>
          </div>
        </div>

        <p className="mt-4 text-[#E6E6E6] text-[0.85rem] md:text-lg tracking-tight lg:max-w-[50%]">{subtitle}</p>
      </div>
    </section>
  )
}
