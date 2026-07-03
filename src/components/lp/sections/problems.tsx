'use client'

import { Fragment, useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { problemsContent } from '@/data/lp-info'

const { sectionLabel, cards } = problemsContent

function StackCard({
  card,
  index,
  totalCards,
  scrollYProgress,
}: {
  card: (typeof cards)[number]
  index: number
  totalCards: number
  scrollYProgress: MotionValue<number>
}) {
  const isLast = index === totalCards - 1
  const targetScale = 1 - (totalCards - 1 - index) * 0.04
  const scaleStart = (index + 1) / totalCards

  const scale = useTransform(
    scrollYProgress,
    isLast ? [0, 1] : [0, scaleStart, 1],
    isLast ? [1, 1] : [1, 1, targetScale]
  )

  return (
    <motion.div
      className="sticky origin-top bg-background border border-border p-8 md:p-12 lg:p-16"
      style={{
        scale,
        top: `calc(6rem + ${index * 2.5}rem)`,
        zIndex: index + 1,
      }}
    >
      <p className="font-sans font-bold text-3xl md:text-4xl lg:text-5xl tracking-tight leading-[1.1] text-foreground">
        {card.text}
      </p>
      {card.subtext && (
        <p className="mt-4 text-[0.9rem] md:text-xl tracking-tight max-w-md text-muted-foreground">
          {card.subtext}
        </p>
      )}
    </motion.div>
  )
}

function MobileCard({ card, index }: { card: (typeof cards)[number]; index: number }) {
  const num = String(index + 1).padStart(2, '0')
  return (
    <div className="border-t border-border px-2 py-12">
      <p
        className="font-sans font-bold text-[6rem] leading-none tracking-tighter text-foreground/15 mb-10"
        style={{ fontFeatureSettings: '"tnum"' }}
      >
        {num}
      </p>
      <p className="font-sans font-bold text-3xl tracking-tight leading-[1.1] text-foreground">
        {card.text}
      </p>
      {card.subtext && (
        <p className="mt-4 text-[0.9rem] tracking-tight max-w-md text-muted-foreground">
          {card.subtext}
        </p>
      )}
    </div>
  )
}

export function Problems() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  return (
    <>
      {/* Desktop: stacking sticky scroll cards */}
      <section
        ref={containerRef}
        className="relative hidden md:block bg-background"
        style={{ paddingBottom: '5dvh' }}
      >
        <div className="px-2 md:px-4 pt-20 md:pt-32">
          <div className="mb-12">
            <span className="text-[1.5rem] text-[#757575] tracking-tight ml-[15vw]">
              {sectionLabel}
            </span>
          </div>
          {cards.map((card, index) => (
            <Fragment key={index}>
              <StackCard
                card={card}
                index={index}
                totalCards={cards.length}
                scrollYProgress={scrollYProgress}
              />
              {index < cards.length - 1 && <div className="h-[35dvh]" />}
            </Fragment>
          ))}
        </div>
      </section>

      {/* Mobile: numbered manifesto + free-floating answer */}
      <section className="md:hidden bg-background pt-20 pb-20">
        <div className="px-2 mb-8">
          <span className="text-[1.5rem] text-[#757575] tracking-tight">
            {sectionLabel}
          </span>
        </div>
        {cards.slice(0, -1).map((card, index) => (
          <MobileCard key={index} card={card} index={index} />
        ))}
        <div className="border-t border-border" />
        {(() => {
          const answer = cards[cards.length - 1]
          return (
            <div className="px-2 pt-32 pb-8">
              <p className="font-sans font-bold text-3xl tracking-tight leading-[1.1] text-foreground">
                {answer.text}
              </p>
              {answer.subtext && (
                <p className="bg-accent mt-8 text-[0.9rem] tracking-tight text-muted-foreground">
                  {answer.subtext}
                </p>
              )}
            </div>
          )
        })()}
      </section>
    </>
  )
}
