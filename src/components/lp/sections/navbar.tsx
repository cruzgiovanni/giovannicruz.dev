'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import React from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import art from '../../../../public/art.jpeg'
import { navbarContent } from '@/data/lp-info'

const { logo, navLinks: defaultNavLinks, menuLinks: defaultMenuLinks, socialLinks } = navbarContent

// Grid configuration
const COLS = 5
const ROWS = 8
const MAX_CELL_DELAY = 0.15

// Pre-calculate delay for each cell based on distance from top-right (hamburger position)
const cellDelays = Array.from({ length: COLS * ROWS }, (_, i) => {
  const col = i % COLS
  const row = Math.floor(i / COLS)
  const dist = Math.sqrt((col - (COLS - 1)) ** 2 + row ** 2)
  const maxDist = Math.sqrt((COLS - 1) ** 2 + (ROWS - 1) ** 2)
  return (dist / maxDist) * MAX_CELL_DELAY
})

const cellVariants: Variants = {
  closed: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
  open: (delay: number) => ({
    opacity: 1,
    transition: { delay, duration: 0.1, ease: 'easeOut' },
  }),
}

interface NavbarProps {
  navLinks?: { label: string; href: string }[]
}

export function Navbar({ navLinks: customNavLinks }: NavbarProps) {
  const navLinks = customNavLinks || defaultNavLinks
  const menuLinks = customNavLinks || defaultMenuLinks
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/70 border-b border-border/50">
        <div className="flex items-center justify-between px-2 md:px-4 py-2">
          <Link href={logo.href} className="flex items-center gap-2">
            <Image src={art} alt={logo.alt} width={22} height={22} loading="eager" priority />
            <span className="text-[10px] font-semibold text-muted-foreground tracking-tight">{logo.text}</span>
          </Link>

          <div className="flex items-center gap-4 md:gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                onClick={(e) => {
                  if (link.href.startsWith('#')) {
                    e.preventDefault()
                    document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
                className="text-[10px] font-semibold text-foreground hover:text-muted-foreground transition-colors hidden sm:inline"
              >
                {link.label}
              </a>
            ))}

            <button
              onClick={() => setIsOpen((v) => !v)}
              className="sm:hidden p-1"
              aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {isOpen ? (
                <svg width="18" height="18" viewBox="0 0 20 20" className="text-foreground">
                  <line x1="3" y1="3" x2="17" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="17" y1="3" x2="3" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 20 20" className="text-foreground">
                  <line x1="1" y1="6" x2="19" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="1" y1="10" x2="19" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="1" y1="14" x2="19" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu — grid materializing effect */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-40 sm:hidden">
            {/* Grid cells — wave from hamburger position */}
            <div
              className="absolute inset-0 grid"
              style={{
                gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                gridTemplateRows: `repeat(${ROWS}, 1fr)`,
              }}
            >
              {cellDelays.map((delay, i) => (
                <motion.div
                  key={i}
                  custom={delay}
                  variants={cellVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  className="bg-background border-[0.5px] border-border/10"
                />
              ))}
            </div>

            {/* Content — appears after grid has formed */}
            <div className="relative z-10 flex flex-col px-2 pt-20 pb-8 h-full">
              <nav className="flex-1">
                {menuLinks.map((link, index) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: {
                        delay: MAX_CELL_DELAY + 0.05 + index * 0.04,
                        duration: 0.25,
                        ease: 'easeOut',
                      },
                    }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  >
                    <a
                      href={link.href}
                      onClick={(e) => {
                        setIsOpen(false)
                        if (link.href.startsWith('#')) {
                          e.preventDefault()
                          setTimeout(() => {
                            document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' })
                          }, 200)
                        }
                      }}
                      className="block font-sans font-bold text-[2.8rem] text-foreground hover:text-muted-foreground transition-colors tracking-tight leading-[1.1]"
                    >
                      {link.label}
                    </a>
                  </motion.div>
                ))}
              </nav>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: MAX_CELL_DELAY + 0.25, duration: 0.2 } }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="flex items-center gap-2 text-[0.9rem] text-muted-foreground"
              >
                {socialLinks.map((link, index) => (
                  <React.Fragment key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsOpen(false)}
                      className="hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                    {index < socialLinks.length - 1 && <span>-</span>}
                  </React.Fragment>
                ))}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
