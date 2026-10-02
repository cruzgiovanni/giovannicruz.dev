'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ReadmeContent } from '@/components/desktop/apps/readme-content'
import { TerminalContent } from '@/components/desktop/apps/terminal-content'
import { MusicPlayerContent } from '@/components/desktop/apps/music-player-content'
import { TrashContent } from '@/components/desktop/apps/trash-content'
import { AboutContent } from '@/components/desktop/apps/about-content'
import { PongContent } from '@/components/desktop/apps/pong-content'
import { CalculatorWindow } from '@/components/desktop/apps/calculator-content'
import Image from 'next/image'
import finderIcon from '../../../public/mac-icons/finder.png'
import readmeIcon from '../../../public/mac-icons/readme.png'
import trashIcon from '../../../public/mac-icons/trash.png'
import terminalIcon from '../../../public/mac-icons/terminal.png'
import musicPlayerIcon from '../../../public/mac-icons/music-player.png'
import pongIcon from '../../../public/mac-icons/ping-pong.png'

interface WindowState {
  id: string
  title: string
  icon: string
  content: React.ReactNode
  isOpen: boolean
  isMaximized: boolean
  zIndex: number
  position: { x: number; y: number }
  size: { width: number; height: number }
}

// Default window sizes - used to reset on close
const DEFAULT_WINDOW_SIZES: Record<string, { width: number; height: number }> = {
  readme: { width: 620, height: 420 },
  terminal: { width: 500, height: 350 },
  'music-player': { width: 320, height: 380 },
  trash: { width: 450, height: 320 },
  about: { width: 400, height: 320 },
  pong: { width: 300, height: 320 },
  calculator: { width: 148, height: 195 },
}

// Windows that should not be resizable
const NON_RESIZABLE_WINDOWS = ['calculator']

// Sound utilities - pre-loaded audio for instant playback
let clickAudio: HTMLAudioElement | null = null
let audioUnlocked = false

const getClickAudio = () => {
  if (typeof window === 'undefined') return null
  if (!clickAudio) {
    clickAudio = new Audio('/sounds/click.wav')
    clickAudio.volume = 0.5
    clickAudio.preload = 'auto'
  }
  return clickAudio
}

// Unlock audio on first user interaction (browser autoplay policy)
const unlockAudio = () => {
  if (audioUnlocked) return
  const audio = getClickAudio()
  if (audio) {
    audio.volume = 0
    audio
      .play()
      .then(() => {
        audio.pause()
        audio.currentTime = 0
        audio.volume = 0.5
        audioUnlocked = true
      })
      .catch(() => {})
  }
}

// Initialize audio unlock listeners
if (typeof window !== 'undefined') {
  const events = ['click', 'touchstart', 'keydown']
  const handleFirstInteraction = () => {
    unlockAudio()
    events.forEach((e) => window.removeEventListener(e, handleFirstInteraction))
  }
  events.forEach((e) => window.addEventListener(e, handleFirstInteraction, { once: true }))
}

const playClickSound = () => {
  const audio = getClickAudio()
  if (audio) {
    audio.currentTime = 0
    audio.play().catch(() => {})
  }
}

// Mac OS 9 Platinum Window Component
function MacWindow({
  window: win,
  onClose,
  onMaximize,
  onFocus,
  onDrag,
  onResize,
  isMobile,
  containerRef,
  isActive,
}: {
  window: WindowState
  onClose: () => void
  onMaximize: () => void
  onFocus: () => void
  onDrag: (x: number, y: number) => void
  onResize: (width: number, height: number) => void
  isMobile: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
  isActive: boolean
}) {
  const isDragging = useRef(false)
  const isResizing = useRef<string | null>(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 })
  const contentRef = useRef<HTMLDivElement>(null)

  // Mac OS 9 style: ghost outline position during drag
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const content = contentRef.current
    if (!content || !win.isOpen) return

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation()
      const scrollableElement = content.querySelector('main') || content
      if (scrollableElement) {
        const { scrollTop, scrollHeight, clientHeight } = scrollableElement as HTMLElement
        const isAtTop = scrollTop <= 0
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1
        if ((e.deltaY < 0 && isAtTop) || (e.deltaY > 0 && isAtBottom)) {
          e.preventDefault()
        }
      }
    }

    content.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      content.removeEventListener('wheel', handleWheel)
    }
  }, [win.isOpen])

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    if (win.isMaximized || isMobile) return
    isDragging.current = true
    dragOffset.current = {
      x: e.clientX - win.position.x,
      y: e.clientY - win.position.y,
    }
    onFocus()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    if (win.isMaximized || isMobile) return
    isDragging.current = true
    dragOffset.current = {
      x: e.touches[0].clientX - win.position.x,
      y: e.touches[0].clientY - win.position.y,
    }
    onFocus()
  }

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    if (isMobile || win.isMaximized) return
    e.preventDefault()
    e.stopPropagation()
    isResizing.current = direction
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: win.size.width,
      height: win.size.height,
    }
    onFocus()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const container = containerRef.current
        if (!container) return
        const rect = container.getBoundingClientRect()
        const x = Math.max(0, Math.min(e.clientX - dragOffset.current.x, rect.width - 100))
        const y = Math.max(0, Math.min(e.clientY - dragOffset.current.y, rect.height - 50))
        // Mac OS 9 style: only update ghost position, not the actual window
        setGhostPosition({ x, y })
      }

      if (isResizing.current) {
        const deltaX = e.clientX - resizeStart.current.x
        const deltaY = e.clientY - resizeStart.current.y
        const dir = isResizing.current
        let newWidth = resizeStart.current.width
        let newHeight = resizeStart.current.height

        if (dir.includes('e')) newWidth = Math.max(300, resizeStart.current.width + deltaX)
        if (dir.includes('s')) newHeight = Math.max(200, resizeStart.current.height + deltaY)

        onResize(newWidth, newHeight)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging.current) {
        const container = containerRef.current
        if (!container) return
        const rect = container.getBoundingClientRect()
        const x = Math.max(0, Math.min(e.touches[0].clientX - dragOffset.current.x, rect.width - 100))
        const y = Math.max(0, Math.min(e.touches[0].clientY - dragOffset.current.y, rect.height - 50))
        // Mac OS 9 style: only update ghost position, not the actual window
        setGhostPosition({ x, y })
      }
    }

    const handleEnd = () => {
      // Mac OS 9 style: apply the final position when mouse is released
      if (isDragging.current && ghostPosition) {
        onDrag(ghostPosition.x, ghostPosition.y)
      }
      isDragging.current = false
      isResizing.current = null
      setGhostPosition(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleEnd)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [onDrag, onResize, containerRef, ghostPosition])

  // Button click handlers with sound
  const handleClose = () => {
    playClickSound()
    onClose()
  }

  const handleMaximize = () => {
    playClickSound()
    onMaximize()
  }

  const isFullscreen = isMobile || win.isMaximized

  const windowStyle = isFullscreen
    ? { left: 0, top: 0, width: '100%', height: '100%' }
    : {
        left: win.position.x,
        top: win.position.y,
        width: win.size.width,
        height: win.size.height,
      }

  return (
    <>
      {/* Mac OS 9 style drag ghost outline - marching ants pattern */}
      {ghostPosition && !isFullscreen && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: ghostPosition.x,
            top: ghostPosition.y,
            width: win.size.width,
            height: win.size.height,
            zIndex: 99999,
            background: 'transparent',
            boxSizing: 'border-box',
            outline: '2px dashed #000000',
            outlineOffset: '-2px',
            border: '2px dashed #ffffff',
          }}
        />
      )}
      <div
        className="absolute flex flex-col"
        style={{
          ...windowStyle,
          zIndex: win.zIndex,
          background: '#dddddd',
          border: '1px solid #000000',
          boxShadow: '1px 1px 0 #000000',
          transition: 'none',
        }}
        onClick={onFocus}
      >
        {/* Mac OS 9 Title Bar - active vs inactive styling */}
        <div
          className="flex items-center h-6 md:h-5 px-1 md:px-0.75 select-none shrink-0"
          style={{
            background: isActive
              ? `linear-gradient(180deg,
                #ffffff 0%,
                #dddddd 45%,
                #bbbbbb 50%,
                #dddddd 55%,
                #cccccc 100%
              )`
              : '#cccccc',
            borderBottom: '1px solid #888888',
            cursor: !isMobile && !win.isMaximized ? 'grab' : 'default',
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Close Box */}
          <button
            onClick={handleClose}
            className="w-[18px] h-[18px] md:w-[13px] md:h-[13px] flex items-center justify-center cursor-pointer transition-colors group"
            style={{
              background: isActive ? 'linear-gradient(180deg, #ffffff 0%, #cccccc 100%)' : '#bbbbbb',
              border: '1px solid #000000',
              boxShadow: isActive ? 'inset -1px -1px 0 #888888, inset 1px 1px 0 #ffffff' : 'none',
            }}
          >
            <div
              className="w-full h-full group-hover:bg-[#ff6666]/50 group-active:bg-[#ff0000]/70"
              style={{ transition: 'background 0.1s' }}
            />
          </button>

          {/* Title Bar Stripes - only show when active */}
          <div className="flex-1 mx-[6px] md:mx-[8px] h-[16px] md:h-[13px] flex items-center justify-center relative overflow-hidden">
            {isActive && (
              <div
                className="absolute inset-y-[1px] left-0 right-0"
                style={{
                  background: `repeating-linear-gradient(
                  180deg,
                  #ffffff 0px,
                  #ffffff 1px,
                  #aaaaaa 1px,
                  #aaaaaa 2px
                )`,
                }}
              />
            )}
            <span
              className="relative px-[6px] md:px-[8px] text-[11px] md:text-[12px] font-normal"
              style={{
                fontFamily: 'Chicago, Charcoal, sans-serif',
                background: isActive
                  ? 'linear-gradient(180deg, #ffffff 0%, #dddddd 45%, #bbbbbb 50%, #dddddd 55%, #cccccc 100%)'
                  : '#cccccc',
                color: isActive ? '#000000' : '#666666',
              }}
            >
              {win.title}
            </span>
          </div>

          {/* Window Controls */}
          <div className="flex">
            <button
              onClick={handleMaximize}
              className="w-[18px] h-[18px] md:w-[13px] md:h-[13px] flex items-center justify-center cursor-pointer hover:brightness-90 active:brightness-75 transition-all"
              style={{
                background: isActive ? 'linear-gradient(180deg, #ffffff 0%, #cccccc 100%)' : '#bbbbbb',
                border: '1px solid #000000',
                boxShadow: isActive ? 'inset -1px -1px 0 #888888, inset 1px 1px 0 #ffffff' : 'none',
              }}
            >
              <div
                className="w-[10px] h-[10px] md:w-[7px] md:h-[7px]"
                style={{
                  border: isActive ? '1px solid #000000' : '1px solid #666666',
                  background: win.isMaximized ? '#888888' : 'transparent',
                }}
              />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div
          ref={contentRef}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
          style={{
            margin: '1px',
            background: '#ffffff',
            border: '1px solid #000000',
            boxShadow: 'inset 1px 1px 0 #888888',
          }}
        >
          <div className="flex-1 min-h-0 overflow-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            {win.content}
          </div>
        </div>

        {/* Resize Handle - more visible */}
        {!isMobile && !win.isMaximized && !NON_RESIZABLE_WINDOWS.includes(win.id) && (
          <div
            className="absolute bottom-0 right-0 w-[18px] h-[18px] cursor-se-resize group"
            onMouseDown={(e) => handleResizeStart(e, 'se')}
            style={{
              background: 'linear-gradient(135deg, transparent 50%, #cccccc 50%)',
            }}
          >
            <svg viewBox="0 0 18 18" className="w-full h-full">
              {/* Shadow lines */}
              <line x1="17" y1="5" x2="5" y2="17" stroke="#666666" strokeWidth="1.5" />
              <line x1="17" y1="9" x2="9" y2="17" stroke="#666666" strokeWidth="1.5" />
              <line x1="17" y1="13" x2="13" y2="17" stroke="#666666" strokeWidth="1.5" />
              {/* Highlight lines */}
              <line x1="16" y1="4" x2="4" y2="16" stroke="#ffffff" strokeWidth="1" />
              <line x1="16" y1="8" x2="8" y2="16" stroke="#ffffff" strokeWidth="1" />
              <line x1="16" y1="12" x2="12" y2="16" stroke="#ffffff" strokeWidth="1" />
            </svg>
          </div>
        )}
      </div>
    </>
  )
}

// Mac OS 9 Desktop Icon
function MacDesktopIcon({
  icon,
  label,
  onDoubleClick,
  selected,
  onSelect,
}: {
  icon: React.ReactNode
  label: string
  onDoubleClick: () => void
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      className="flex flex-col items-center gap-[2px] p-[2px] w-[54px] min-[400px]:w-[68px] md:w-[74px] focus:outline-none"
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onDoubleClick={onDoubleClick}
    >
      {/* Icon - darker when selected */}
      <div
        style={{
          filter: selected ? 'brightness(0.5)' : 'none',
          transition: 'filter 0.1s',
        }}
      >
        {icon}
      </div>
      {/* Label - Mac OS 9 style: translucent white bg when not selected, black bg when selected */}
      <span
        className="text-[9px] min-[400px]:text-[10px] md:text-[11px] text-center leading-tight px-[3px] py-[1px]"
        style={{
          fontFamily: 'Chicago, Charcoal, Geneva, sans-serif',
          color: selected ? '#ffffff' : '#000000',
          background: selected ? '#000000' : 'rgba(255, 255, 255, 0.7)',
          textShadow: 'none',
        }}
      >
        {label}
      </span>
    </button>
  )
}

// Mac OS 9 Menu Bar
function MacMenuBar({
  currentTime,
  onAppleMenuClick,
  appleMenuOpen,
  onOpenWindow,
  onShutdown,
}: {
  currentTime: string
  onAppleMenuClick: () => void
  appleMenuOpen: boolean
  onOpenWindow: (id: string) => void
  onShutdown: () => void
}) {
  const menuItems = ['File', 'Edit', 'View', 'Special', 'Help']

  // Pixelated font style for menu bar
  const pixelFontStyle = {
    fontFamily: '"Chicago", "Geneva", "Charcoal", monospace',
    fontWeight: 700,
    fontSize: '12px',
    WebkitFontSmoothing: 'none' as const,
    MozOsxFontSmoothing: 'grayscale' as const,
    textRendering: 'optimizeSpeed' as const,
  }

  return (
    <>
      <div
        className="h-4.5 md:h-5 flex items-center justify-between px-1 md:px-2 select-none shrink-0 relative"
        style={{
          zIndex: 10000,
          background: 'linear-gradient(180deg, #ffffff 0%, #cccccc 100%)',
          borderBottom: '1px solid #000000',
        }}
      >
        {/* Left: Apple Menu + Menu Items */}
        <div className="flex items-center">
          {/* Apple Logo Menu */}
          <button
            onClick={onAppleMenuClick}
            className={`flex items-center justify-center w-4 h-3.5 md:w-4.5 md:h-4 cursor-pointer ${appleMenuOpen ? 'bg-[#000080]/80 p-1' : ''}`}
          >
            <svg viewBox="0 0 18 20" className="w-[12px] h-[14px] md:w-[14px] md:h-[16px]">
              <defs>
                <path
                  id="applePath"
                  d="M15.2 10.6c0-2.8 2.3-4.2 2.4-4.3-1.3-1.9-3.3-2.2-4-2.2-1.7-.2-3.3 1-4.2 1s-2.2-1-3.6-1c-1.9 0-3.6 1.1-4.5 2.7-1.9 3.3-.5 8.3 1.4 11 .9 1.3 2 2.8 3.5 2.8 1.4 0 1.9-.9 3.6-.9s2.2.9 3.6.9 2.5-1.4 3.4-2.7c1.1-1.5 1.5-3 1.5-3.1-.1 0-2.9-1.1-2.9-4.2zM12.5 2.8c.8-.9 1.3-2.2 1.1-3.5-1.1 0-2.4.7-3.2 1.6-.7.8-1.3 2.1-1.2 3.4 1.2.1 2.5-.6 3.3-1.5z"
                />

                <clipPath id="appleClip">
                  <use href="#applePath" />
                </clipPath>
              </defs>

              <use href="#applePath" fill="none" stroke="#000" strokeWidth="0.9" strokeLinejoin="round" />

              <g clipPath="url(#appleClip)">
                <rect y="0" width="18" height="3.3" fill="#61BB46" />
                <rect y="3.3" width="18" height="3.3" fill="#FDB827" />
                <rect y="6.6" width="18" height="3.3" fill="#F5821F" />
                <rect y="9.9" width="18" height="3.3" fill="#E03A3E" />
                <rect y="13.2" width="18" height="3.3" fill="#963D97" />
                <rect y="16.5" width="18" height="3.5" fill="#009DDC" />
              </g>
            </svg>
          </button>

          {/* Menu Items with pixelated bold font */}
          {menuItems.map((item) => (
            <span
              key={item}
              className="text-[11px] md:text-[12px] text-black cursor-default hidden md:inline px-[8px] md:px-[10px] py-[1px]"
              style={pixelFontStyle}
            >
              {item}
            </span>
          ))}
        </div>

        {/* Right: Clock and Finder */}
        <div className="flex items-center gap-[4px] md:gap-[8px]">
          <span className="text-[11px] md:text-[12px] text-black" style={pixelFontStyle}>
            {currentTime}
          </span>

          {/* Finder icon */}
          <div className="flex items-center gap-[2px] md:gap-[4px]">
            <Image
              src={finderIcon}
              alt="Finder"
              width={14}
              height={14}
              className="w-[12px] h-[12px] md:w-[14px] md:h-[14px]"
            />
            <span className="text-[11px] md:text-[12px] text-black hidden sm:inline" style={pixelFontStyle}>
              Finder
            </span>
          </div>
        </div>
      </div>

      {/* Apple Menu Dropdown */}
      {appleMenuOpen && (
        <>
          <div className="fixed inset-0" style={{ zIndex: 10001 }} onClick={onAppleMenuClick} />
          <div
            className="absolute top-[18px] md:top-[20px] left-[2px] w-[180px] md:w-[200px] py-[2px]"
            style={{
              zIndex: 10002,
              background: '#ffffff',
              border: '1px solid #000000',
              boxShadow: '2px 2px 0 rgba(0,0,0,0.3)',
            }}
          >
            <div
              className="flex items-center gap-[6px] px-[12px] py-[3px] hover:bg-[#000080]/80 hover:text-white cursor-pointer text-black text-[11px] md:text-[12px]"
              style={pixelFontStyle}
              onClick={() => {
                onOpenWindow('about')
                onAppleMenuClick()
              }}
            >
              <span className="w-[16px] text-center">
                <svg viewBox="0 0 16 16" className="w-[14px] h-[14px] inline">
                  <rect x="2" y="2" width="12" height="10" fill="#dddddd" stroke="#000" strokeWidth="1" />
                  <rect x="6" y="12" width="4" height="2" fill="#888888" />
                  <rect x="4" y="14" width="8" height="1" fill="#666666" />
                </svg>
              </span>
              <span>About This Computer</span>
            </div>

            <div className="mx-[4px] my-[3px] border-t border-[#888888]" />

            <div
              className="flex items-center gap-[6px] px-[12px] py-[3px] hover:bg-[#000080]/80 hover:text-white cursor-pointer text-black text-[11px] md:text-[12px]"
              style={pixelFontStyle}
              onClick={() => {
                onOpenWindow('calculator')
                onAppleMenuClick()
              }}
            >
              <span className="w-[16px] text-center">
                <svg viewBox="0 0 16 16" className="w-[14px] h-[14px] inline">
                  <rect x="2" y="1" width="12" height="14" rx="1" fill="#dddddd" stroke="#000" strokeWidth="1" />
                  <rect x="4" y="3" width="8" height="3" fill="#ffffff" stroke="#888" strokeWidth="0.5" />
                  <rect x="4" y="7" width="2" height="2" fill="#cccccc" stroke="#888" strokeWidth="0.3" />
                  <rect x="7" y="7" width="2" height="2" fill="#cccccc" stroke="#888" strokeWidth="0.3" />
                  <rect x="10" y="7" width="2" height="2" fill="#cccccc" stroke="#888" strokeWidth="0.3" />
                  <rect x="4" y="10" width="2" height="2" fill="#cccccc" stroke="#888" strokeWidth="0.3" />
                  <rect x="7" y="10" width="2" height="2" fill="#cccccc" stroke="#888" strokeWidth="0.3" />
                  <rect x="10" y="10" width="2" height="2" fill="#cccccc" stroke="#888" strokeWidth="0.3" />
                </svg>
              </span>
              <span>Calculator</span>
            </div>

            <div className="mx-[4px] my-[3px] border-t border-[#888888]" />

            <div
              className="flex items-center gap-[6px] px-[12px] py-[3px] hover:bg-[#000080]/80 hover:text-white cursor-pointer text-black text-[11px] md:text-[12px]"
              style={pixelFontStyle}
              onClick={() => {
                onOpenWindow('readme')
                onAppleMenuClick()
              }}
            >
              <span className="w-[16px] text-center">
                <svg viewBox="0 0 16 16" className="w-[14px] h-[14px] inline">
                  <path d="M3 1 L3 15 L13 15 L13 4 L10 1 Z" fill="#ffffff" stroke="#000" strokeWidth="1" />
                  <path d="M10 1 L10 4 L13 4" fill="#cccccc" stroke="#000" strokeWidth="1" />
                  <line x1="5" y1="7" x2="11" y2="7" stroke="#000" strokeWidth="0.5" />
                  <line x1="5" y1="9" x2="11" y2="9" stroke="#000" strokeWidth="0.5" />
                  <line x1="5" y1="11" x2="9" y2="11" stroke="#000" strokeWidth="0.5" />
                </svg>
              </span>
              <span>ReadMe</span>
            </div>

            <div className="mx-[4px] my-[3px] border-t border-[#888888]" />

            <div
              className="flex items-center gap-[6px] px-[12px] py-[3px] hover:bg-[#000080]/80 hover:text-white cursor-pointer text-black text-[11px] md:text-[12px]"
              style={pixelFontStyle}
              onClick={() => {
                onShutdown()
                onAppleMenuClick()
              }}
            >
              <span className="w-[16px] text-center">
                <svg viewBox="0 0 16 16" className="w-[14px] h-[14px] inline">
                  <circle cx="8" cy="8" r="6" fill="none" stroke="#000" strokeWidth="1.5" />
                  <line x1="8" y1="3" x2="8" y2="8" stroke="#000" strokeWidth="1.5" />
                </svg>
              </span>
              <span>Shut Down</span>
            </div>
          </div>
        </>
      )}
    </>
  )
}

// Mac OS 9 Boot Screen
function MacBootScreen({ stage }: { stage: 'happy' | 'loading' | 'extensions' }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#c0c0c0]">
      {stage === 'happy' && (
        <div className="animate-in fade-in duration-300">
          <svg viewBox="0 0 64 64" className="w-[48px] h-[48px] md:w-[64px] md:h-[64px]">
            <rect x="12" y="4" width="40" height="48" rx="4" fill="#ffffff" stroke="#000000" strokeWidth="2" />
            <rect x="16" y="8" width="32" height="24" fill="#000000" />
            <circle cx="26" cy="17" r="2" fill="#00ff00" />
            <circle cx="38" cy="17" r="2" fill="#00ff00" />
            <path d="M24 24 Q32 30 40 24" fill="none" stroke="#00ff00" strokeWidth="2" />
            <rect x="24" y="36" width="16" height="3" fill="#888888" />
            <rect x="16" y="52" width="32" height="4" fill="#c0c0c0" stroke="#000000" strokeWidth="1" />
            <rect x="8" y="56" width="48" height="4" fill="#888888" />
          </svg>
        </div>
      )}

      {stage === 'loading' && (
        <div className="flex flex-col items-center animate-in fade-in duration-300">
          <div className="mb-[16px] md:mb-[24px]">
            <svg viewBox="0 0 160 55" className="w-[140px] h-[48px] md:w-[180px] md:h-[62px]">
              <defs>
                <clipPath id="bootApple">
                  <path d="M28 25c0-5.5 4.5-8.2 4.7-8.4-2.5-3.7-6.5-4.3-7.9-4.3-3.3-.3-6.5 2-8.2 2s-4.3-2-7-2c-3.7 0-7 2.1-8.9 5.3-3.8 6.5-1 16.3 2.7 21.7 1.8 2.6 4 5.5 6.8 5.4 2.7 0 3.8-1.8 7-1.8s4.2 1.8 7 1.8 4.9-2.7 6.7-5.3c2.1-3 3-6 3-6.1-.1 0-5.8-2.2-5.9-8.3zM22.6 9.5c1.5-1.8 2.5-4.3 2.2-6.8-2.1.1-4.7 1.4-6.3 3.2-1.4 1.6-2.6 4.1-2.3 6.6 2.4.1 4.9-1.2 6.4-3z" />
                </clipPath>
              </defs>
              <g clipPath="url(#bootApple)">
                <rect x="0" y="0" width="40" height="8" fill="#61BB46" />
                <rect x="0" y="8" width="40" height="8" fill="#FDB827" />
                <rect x="0" y="16" width="40" height="8" fill="#F5821F" />
                <rect x="0" y="24" width="40" height="8" fill="#E03A3E" />
                <rect x="0" y="32" width="40" height="8" fill="#963D97" />
                <rect x="0" y="40" width="40" height="10" fill="#009DDC" />
              </g>
              <text x="48" y="35" fill="#000000" fontSize="18" fontFamily="Chicago, sans-serif" fontWeight="bold">
                Cruz OS 9
              </text>
            </svg>
          </div>

          <p
            className="text-[11px] md:text-[12px] text-black"
            style={{ fontFamily: 'Chicago, Charcoal, Geneva, sans-serif' }}
          >
            Starting up...
          </p>

          <div
            className="w-[180px] md:w-[240px] h-[12px] md:h-[14px] mt-[8px] relative"
            style={{
              background: '#ffffff',
              border: '1px solid #000000',
              boxShadow: 'inset 1px 1px 0 #888888',
            }}
          >
            <div className="absolute inset-[2px] bg-[#000080] animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}
    </div>
  )
}

// Mac OS 9 Shutdown Screen
function MacShutdownScreen({ onPowerOn }: { onPowerOn: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
      <div className="text-center animate-in fade-in duration-500">
        {/* Classic Mac "power off" icon - old Macintosh silhouette */}
        <div className="mb-6 flex justify-center">
          <svg viewBox="0 0 64 80" className="w-12 h-16 md:w-16 md:h-20">
            {/* Classic Mac silhouette */}
            <rect x="8" y="4" width="48" height="56" rx="4" fill="none" stroke="#ff6600" strokeWidth="2" />
            <rect x="12" y="8" width="40" height="32" fill="none" stroke="#ff6600" strokeWidth="2" />
            {/* Screen content - off */}
            <rect x="16" y="12" width="32" height="24" fill="#1a1a1a" stroke="#ff6600" strokeWidth="1" />
            {/* Base/foot */}
            <rect x="20" y="60" width="24" height="4" fill="#ff6600" />
            <rect x="12" y="64" width="40" height="6" rx="1" fill="none" stroke="#ff6600" strokeWidth="2" />
            {/* Floppy slot */}
            <rect x="16" y="44" width="12" height="3" fill="#ff6600" />
          </svg>
        </div>

        <p
          className="text-[#ff6600] text-[14px] md:text-[18px] mb-6"
          style={{ fontFamily: 'Chicago, Geneva, Charcoal, sans-serif' }}
        >
          Computer is off
        </p>

        {/* Mac OS 9 style button */}
        <button
          onClick={onPowerOn}
          className="cursor-pointer active:brightness-90"
          style={{
            background: 'linear-gradient(180deg, #dddddd 0%, #bbbbbb 45%, #999999 55%, #aaaaaa 100%)',
            border: '2px solid #000000',
            boxShadow: 'inset -1px -1px 0 #666666, inset 1px 1px 0 #ffffff',
            padding: '6px 20px',
          }}
        >
          <span
            className="text-[12px] md:text-[14px] text-black"
            style={{ fontFamily: 'Chicago, Geneva, Charcoal, sans-serif' }}
          >
            Restart
          </span>
        </button>
      </div>
    </div>
  )
}

// Mac OS 9 Icon Component
function MacIcon({ src, alt }: { src: typeof readmeIcon; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={48}
      height={48}
      className="w-[26px] h-[26px] min-[400px]:w-[32px] min-[400px]:h-[32px] md:w-[48px] md:h-[48px]"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}

function EmojiIcon({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div
      className="w-[26px] h-[26px] min-[400px]:w-[32px] min-[400px]:h-[32px] md:w-[48px] md:h-[48px] flex items-center justify-center text-xl min-[400px]:text-2xl md:text-4xl"
      role="img"
      aria-label={label}
    >
      {emoji}
    </div>
  )
}

interface DesktopSectionProps {
  isMobileFullscreen?: boolean
  screenOnly?: boolean
}

export function DesktopSection({ isMobileFullscreen = false, screenOnly = false }: DesktopSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [bootStage, setBootStage] = useState<'off' | 'happy' | 'loading' | 'desktop'>('off')
  const [currentTime, setCurrentTime] = useState('')
  const [appleMenuOpen, setAppleMenuOpen] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [highestZIndex, setHighestZIndex] = useState(100)
  const [isShutdown, setIsShutdown] = useState(false)

  const desktopRef = useRef<HTMLDivElement>(null)

  // Windows State
  const [windows, setWindows] = useState<WindowState[]>([
    {
      id: 'readme',
      title: 'ReadMe',
      icon: '📄',
      content: null,
      isOpen: false,
      isMaximized: false,
      zIndex: 100,
      position: { x: 30, y: 30 },
      size: { width: 620, height: 420 },
    },
    {
      id: 'terminal',
      title: 'Terminal',
      icon: '💻',
      content: null,
      isOpen: false,
      isMaximized: false,
      zIndex: 100,
      position: { x: 60, y: 60 },
      size: { width: 500, height: 350 },
    },
    {
      id: 'music-player',
      title: 'Music Player',
      icon: '🎵',
      content: null,
      isOpen: false,
      isMaximized: false,
      zIndex: 100,
      position: { x: 90, y: 90 },
      size: { width: 320, height: 380 },
    },
    {
      id: 'trash',
      title: 'Trash',
      icon: '🗑️',
      content: null,
      isOpen: false,
      isMaximized: false,
      zIndex: 100,
      position: { x: 120, y: 120 },
      size: { width: 450, height: 320 },
    },
    {
      id: 'about',
      title: 'About This Computer',
      icon: '🖥️',
      content: null,
      isOpen: false,
      isMaximized: false,
      zIndex: 100,
      position: { x: 50, y: 40 },
      size: { width: 400, height: 320 },
    },
    {
      id: 'pong',
      title: 'Pong',
      icon: '🏓',
      content: null,
      isOpen: false,
      isMaximized: false,
      zIndex: 100,
      position: { x: 80, y: 50 },
      size: { width: 280, height: 320 },
    },
    {
      id: 'calculator',
      title: 'Calculator',
      icon: '🧮',
      content: null,
      isOpen: false,
      isMaximized: false,
      zIndex: 100,
      position: { x: 100, y: 60 },
      size: { width: 148, height: 195 },
    },
  ])

  // Check mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const openWindows = windows.filter((w) => w.isOpen)
        if (openWindows.length > 0) {
          const topWindow = openWindows.reduce((a, b) => (a.zIndex > b.zIndex ? a : b))
          closeWindow(topWindow.id)
        } else if (window.self !== window.top) {
          // Embedded in the home page's 3D scene: Esc on an empty desktop leaves the computer
          window.parent.postMessage({ type: 'cruztosh:exit' }, window.location.origin)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [windows])

  // Boot sequence
  useEffect(() => {
    if (isShutdown) return

    setBootStage('happy')
    const timer1 = setTimeout(() => setBootStage('loading'), 1200)
    const timer2 = setTimeout(() => {
      setBootStage('desktop')
      // Auto-open ReadMe centered after a short delay for the desktop to render
      setTimeout(() => {
        const container = desktopRef.current
        if (!container) return

        const rect = container.getBoundingClientRect()
        // ReadMe window size: 620x420
        const winWidth = 620
        const winHeight = 420
        const centerX = Math.max(0, (rect.width - winWidth) / 2)
        const centerY = Math.max(0, (rect.height - winHeight) / 2 - 10)

        setWindows((prev) =>
          prev.map((w) =>
            w.id === 'readme'
              ? { ...w, isOpen: true, position: { x: centerX, y: centerY }, content: <ReadmeContent /> }
              : w,
          ),
        )
      }, 150)
    }, 3000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [isShutdown])

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const time = now.toLocaleTimeString('en-US', {
        hour12: true,
        hour: 'numeric',
        minute: '2-digit',
      })
      setCurrentTime(time)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const getWindowContent = useCallback((id: string) => {
    switch (id) {
      case 'readme':
        return <ReadmeContent />
      case 'terminal':
        return <TerminalContent />
      case 'music-player':
        return <MusicPlayerContent />
      case 'trash':
        return <TrashContent />
      case 'about':
        return <AboutContent />
      case 'pong':
        return <PongContent />
      default:
        return null
    }
  }, [])

  // Window handlers
  const openWindow = useCallback(
    (id: string) => {
      const newZIndex = highestZIndex + 1
      setHighestZIndex(newZIndex)
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, isOpen: true, zIndex: newZIndex, content: getWindowContent(id) } : w)),
      )
      setSelectedIcon(null)
    },
    [highestZIndex, getWindowContent],
  )

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              isOpen: false,
              isMaximized: false,
              size: DEFAULT_WINDOW_SIZES[id] || w.size,
            }
          : w,
      ),
    )
  }, [])

  const maximizeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w)))
  }, [])

  const focusWindow = useCallback(
    (id: string) => {
      const newZIndex = highestZIndex + 1
      setHighestZIndex(newZIndex)
      setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, zIndex: newZIndex } : w)))
    },
    [highestZIndex],
  )

  const dragWindow = useCallback((id: string, x: number, y: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, position: { x, y } } : w)))
  }, [])

  const resizeWindow = useCallback((id: string, width: number, height: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, size: { width, height } } : w)))
  }, [])

  const handleShutdown = useCallback(() => {
    setWindows((prev) => prev.map((w) => ({ ...w, isOpen: false, isMaximized: false })))
    setIsShutdown(true)
  }, [])

  const handlePowerOn = useCallback(() => {
    setIsShutdown(false)
    setBootStage('off')
  }, [])

  const desktopIcons = [
    { id: 'readme', icon: <MacIcon src={readmeIcon} alt="ReadMe" />, label: 'ReadMe' },
    { id: 'terminal', icon: <MacIcon src={terminalIcon} alt="Terminal" />, label: 'Terminal' },
    { id: 'music-player', icon: <MacIcon src={musicPlayerIcon} alt="Music Player" />, label: 'Music Player' },
    { id: 'pong', icon: <MacIcon src={pongIcon} alt="Pong" />, label: 'Pong' },
  ]

  const currentYear = new Date().getFullYear()

  // Mobile fullscreen: remove all padding, max constraints, and snap behavior
  if (isMobileFullscreen) {
    return (
      <section ref={ref} className="flex h-full w-full items-center justify-center relative">
        <div className="w-full h-full relative flex items-center justify-center">
          {/* Macintosh Classic Style Monitor - Fullscreen on mobile */}
          <div className="relative w-full h-full">
            {/* Monitor outer shell - simplified for mobile fullscreen */}
            <div
              className="relative w-full h-full overflow-hidden flex flex-col"
              style={{
                background: '#d4d0c8',
              }}
            >
              {/* Screen area - takes most space */}
              <div className="flex-1 flex flex-col pt-[2%] px-[2%]">
                {/* Screen bezel */}
                <div
                  className="flex-1 relative"
                  style={{
                    background: 'linear-gradient(145deg, #c8c4bc 0%, #d4d0c8 50%, #ccc8c0 100%)',
                    boxShadow: 'inset 2px 2px 8px rgba(0,0,0,0.25), inset -1px -1px 2px rgba(255,255,255,0.4)',
                    padding: '2%',
                  }}
                >
                  {/* Inner screen border */}
                  <div
                    className="w-full h-full relative"
                    style={{
                      background: '#1a1a1a',
                      boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)',
                      padding: '3px',
                    }}
                  >
                    {/* Screen area */}
                    <div
                      ref={desktopRef}
                      className="relative w-full h-full overflow-hidden"
                      style={{ background: '#4477aa' }}
                    >
                      {/* Shutdown Screen */}
                      {isShutdown && <MacShutdownScreen onPowerOn={handlePowerOn} />}

                      {/* Boot Stages */}
                      {!isShutdown && (bootStage === 'happy' || bootStage === 'loading') && (
                        <MacBootScreen stage={bootStage} />
                      )}

                      {/* Desktop */}
                      {!isShutdown && bootStage === 'desktop' && (
                        <div className="absolute inset-0 flex flex-col animate-in fade-in duration-300">
                          {/* Menu Bar */}
                          <MacMenuBar
                            currentTime={currentTime}
                            onAppleMenuClick={() => setAppleMenuOpen(!appleMenuOpen)}
                            appleMenuOpen={appleMenuOpen}
                            onOpenWindow={openWindow}
                            onShutdown={handleShutdown}
                          />

                          {/* Desktop Area */}
                          <div
                            className="flex-1 relative overflow-hidden"
                            onClick={() => {
                              setSelectedIcon(null)
                              setAppleMenuOpen(false)
                            }}
                          >
                            {/* Wallpaper Background */}
                            <div
                              className="absolute inset-0 overflow-hidden"
                              style={{
                                background:
                                  'linear-gradient(180deg, #4a7ab5 0%, #3d6ca8 30%, #2d5a96 60%, #1e4a85 100%)',
                              }}
                            >
                              <div
                                className="absolute"
                                style={{
                                  width: '200%',
                                  height: '120%',
                                  left: '-80%',
                                  bottom: '-60%',
                                  background:
                                    'radial-gradient(ellipse at center, rgba(120, 180, 220, 0.4) 0%, transparent 70%)',
                                  borderRadius: '50%',
                                }}
                              />
                              <div
                                className="absolute"
                                style={{
                                  width: '180%',
                                  height: '100%',
                                  left: '-40%',
                                  top: '-50%',
                                  background:
                                    'radial-gradient(ellipse at center, rgba(100, 160, 210, 0.3) 0%, transparent 60%)',
                                  borderRadius: '50%',
                                }}
                              />
                              <div
                                className="absolute"
                                style={{
                                  width: '150%',
                                  height: '80%',
                                  left: '-20%',
                                  top: '10%',
                                  background:
                                    'radial-gradient(ellipse at 30% 50%, rgba(140, 190, 230, 0.25) 0%, transparent 50%)',
                                  borderRadius: '50%',
                                  transform: 'rotate(-15deg)',
                                }}
                              />
                            </div>

                            {/* Desktop Icons - top right */}
                            <div className="absolute top-[4px] right-[4px] min-[400px]:top-[8px] min-[400px]:right-[8px] flex flex-col gap-1 min-[400px]:gap-2">
                              {desktopIcons.map((icon, i) => (
                                <div
                                  key={icon.id}
                                  className="animate-in fade-in slide-in-from-right-2 duration-300"
                                  style={{ animationDelay: `${i * 100}ms` }}
                                >
                                  <MacDesktopIcon
                                    icon={icon.icon}
                                    label={icon.label}
                                    selected={selectedIcon === icon.id}
                                    onSelect={() => setSelectedIcon(icon.id)}
                                    onDoubleClick={() => openWindow(icon.id)}
                                  />
                                </div>
                              ))}
                            </div>

                            {/* Trash Icon - bottom right */}
                            <div className="absolute bottom-[4px] right-[4px] min-[400px]:bottom-[8px] min-[400px]:right-[8px] animate-in fade-in slide-in-from-right-2 duration-300 delay-200">
                              <MacDesktopIcon
                                icon={<MacIcon src={trashIcon} alt="Trash" />}
                                label="Trash"
                                selected={selectedIcon === 'trash'}
                                onSelect={() => setSelectedIcon('trash')}
                                onDoubleClick={() => openWindow('trash')}
                              />
                            </div>

                            {/* Hint */}
                            {windows.filter((w) => w.isOpen).length === 0 && (
                              <div className="absolute bottom-[8px] left-[8px] animate-in fade-in duration-1000 delay-500">
                                <p
                                  className="text-[10px] text-white/80"
                                  style={{
                                    fontFamily: 'Chicago, Charcoal, Geneva, sans-serif',
                                    textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
                                  }}
                                >
                                  Double-click icon to open
                                </p>
                              </div>
                            )}

                            {/* Windows */}
                            {(() => {
                              const openWindows = windows.filter((w) => w.isOpen)
                              const maxZIndex = Math.max(...openWindows.map((w) => w.zIndex), 0)
                              return windows
                                .filter((w) => w.isOpen && w.id !== 'calculator')
                                .map((win) => (
                                  <MacWindow
                                    key={win.id}
                                    window={win}
                                    onClose={() => closeWindow(win.id)}
                                    onMaximize={() => maximizeWindow(win.id)}
                                    onFocus={() => focusWindow(win.id)}
                                    onDrag={(x, y) => dragWindow(win.id, x, y)}
                                    onResize={(w, h) => resizeWindow(win.id, w, h)}
                                    isMobile={isMobile}
                                    containerRef={desktopRef}
                                    isActive={win.zIndex === maxZIndex}
                                  />
                                ))
                            })()}

                            {/* Calculator - custom window */}
                            {(() => {
                              const calcWindow = windows.find((w) => w.id === 'calculator')
                              if (!calcWindow) return null
                              return (
                                <CalculatorWindow
                                  isOpen={calcWindow.isOpen}
                                  position={calcWindow.position}
                                  zIndex={calcWindow.zIndex}
                                  onClose={() => closeWindow('calculator')}
                                  onFocus={() => focusWindow('calculator')}
                                  onDrag={(x, y) => dragWindow('calculator', x, y)}
                                  containerRef={desktopRef}
                                />
                              )
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom section - Macintosh Classic style base */}
              <div
                className="h-[72px] flex flex-col shrink-0"
                style={{
                  background: '#d4d0c8',
                }}
              >
                {/* Spacer */}
                <div className="h-[8px]" />

                {/* Recessed drive bay area */}
                <div
                  className="w-full h-[20px] flex items-center justify-end px-[6%]"
                  style={{
                    background: 'linear-gradient(180deg, #a8a498 0%, #b8b4a8 30%, #c4c0b4 70%, #ccc8bc 100%)',
                    boxShadow:
                      'inset 0 4px 8px rgba(0,0,0,0.25), inset 0 2px 3px rgba(0,0,0,0.2), inset 0 -2px 2px rgba(255,255,255,0.3)',
                  }}
                >
                  {/* Floppy slot */}
                  <div
                    className="w-[80px] h-[6px]"
                    style={{
                      background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 50%, #333333 100%)',
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.3)',
                      borderRadius: '1px',
                      border: '0.5px solid #555555',
                    }}
                  />
                  {/* Power LED */}
                  <div className="ml-[10px]">
                    <div
                      className={`w-[5px] h-[5px] rounded-full transition-all duration-500 ${
                        !isShutdown && bootStage === 'desktop'
                          ? 'bg-[#00cc00]'
                          : isShutdown
                            ? 'bg-[#333333]'
                            : 'bg-[#ffaa00]'
                      }`}
                      style={{
                        boxShadow:
                          !isShutdown && bootStage === 'desktop'
                            ? '0 0 6px #00cc00, inset 0 -1px 2px rgba(0,0,0,0.3)'
                            : isShutdown
                              ? 'inset 0 1px 2px rgba(0,0,0,0.5)'
                              : '0 0 4px #ffaa00, inset 0 -1px 2px rgba(0,0,0,0.3)',
                        border: '1px solid #2a2a2a',
                      }}
                    />
                  </div>
                </div>

                {/* Apple logo and brand area */}
                <div className="flex-1 flex items-center px-[4%]">
                  <div className="flex items-center gap-2">
                    {/* Rainbow Apple Logo */}
                    <svg viewBox="0 0 18 22" className="w-[14px] h-[17px]">
                      <defs>
                        <clipPath id="mobileApple">
                          <path d="M15.2 11.6c0-2.8 2.3-4.2 2.4-4.3-1.3-1.9-3.3-2.2-4-2.2-1.7-.2-3.3 1-4.2 1s-2.2-1-3.6-1c-1.9 0-3.6 1.1-4.5 2.7-1.9 3.3-.5 8.3 1.4 11 .9 1.3 2 2.8 3.5 2.8 1.4 0 1.9-.9 3.6-.9s2.2.9 3.6.9 2.5-1.4 3.4-2.7c1.1-1.5 1.5-3 1.5-3.1-.1 0-2.9-1.1-2.9-4.2zM12.5 3.8c.8-.9 1.3-2.2 1.1-3.5-1.1 0-2.4.7-3.2 1.6-.7.8-1.3 2.1-1.2 3.4 1.2.1 2.5-.6 3.3-1.5z" />
                        </clipPath>
                      </defs>
                      <g clipPath="url(#mobileApple)">
                        <rect x="0" y="0" width="20" height="3.6" fill="#61BB46" />
                        <rect x="0" y="3.6" width="20" height="3.6" fill="#FDB827" />
                        <rect x="0" y="7.2" width="20" height="3.6" fill="#F5821F" />
                        <rect x="0" y="10.8" width="20" height="3.6" fill="#E03A3E" />
                        <rect x="0" y="14.4" width="20" height="3.6" fill="#963D97" />
                        <rect x="0" y="18" width="20" height="4" fill="#009DDC" />
                      </g>
                    </svg>
                    {/* Brand text */}
                    <span
                      className="text-[1rem] tracking-wide"
                      style={{
                        fontFamily: 'Garamond, Georgia, serif',
                        color: '#5a5a5a',
                        fontWeight: 400,
                      }}
                    >
                      Cruztosh Classic
                    </span>
                  </div>
                </div>

                {/* Copyright - engraved at the very bottom */}
                <div
                  className="text-left pb-[6px] px-[4%]"
                  style={{
                    fontFamily: 'Geneva, Helvetica, sans-serif',
                    fontSize: '9px',
                    color: '#a09a90',
                    textShadow: '0 1px 0 rgba(255,255,255,0.5)',
                    letterSpacing: '0.3px',
                  }}
                >
                  © {currentYear} - Giovanni Cruz
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // The screen itself: shutdown, boot and the desktop
  const desktopScreen = (
    <div
      ref={desktopRef}
      className="relative w-full h-full overflow-hidden"
      style={{ background: '#4477aa' }}
    >
      {/* Shutdown Screen */}
      {isShutdown && <MacShutdownScreen onPowerOn={handlePowerOn} />}

      {/* Boot Stages */}
      {!isShutdown && (bootStage === 'happy' || bootStage === 'loading') && (
        <MacBootScreen stage={bootStage} />
      )}

      {/* Desktop */}
      {!isShutdown && bootStage === 'desktop' && (
        <div className="absolute inset-0 flex flex-col animate-in fade-in duration-300">
          {/* Menu Bar */}
          <MacMenuBar
            currentTime={currentTime}
            onAppleMenuClick={() => setAppleMenuOpen(!appleMenuOpen)}
            appleMenuOpen={appleMenuOpen}
            onOpenWindow={openWindow}
            onShutdown={handleShutdown}
          />

          {/* Desktop Area */}
          <div
            className="flex-1 relative overflow-hidden"
            onClick={() => {
              setSelectedIcon(null)
              setAppleMenuOpen(false)
            }}
          >
            {/* Wallpaper Background  */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, #4a7ab5 0%, #3d6ca8 30%, #2d5a96 60%, #1e4a85 100%)',
              }}
            >
              {/* Large sweeping curve from bottom-left */}
              <div
                className="absolute"
                style={{
                  width: '200%',
                  height: '120%',
                  left: '-80%',
                  bottom: '-60%',
                  background:
                    'radial-gradient(ellipse at center, rgba(120, 180, 220, 0.4) 0%, transparent 70%)',
                  borderRadius: '50%',
                }}
              />
              {/* Upper curve sweeping right */}
              <div
                className="absolute"
                style={{
                  width: '180%',
                  height: '100%',
                  left: '-40%',
                  top: '-50%',
                  background:
                    'radial-gradient(ellipse at center, rgba(100, 160, 210, 0.3) 0%, transparent 60%)',
                  borderRadius: '50%',
                }}
              />
              {/* Middle accent curve */}
              <div
                className="absolute"
                style={{
                  width: '150%',
                  height: '80%',
                  left: '-20%',
                  top: '10%',
                  background:
                    'radial-gradient(ellipse at 30% 50%, rgba(140, 190, 230, 0.25) 0%, transparent 50%)',
                  borderRadius: '50%',
                  transform: 'rotate(-15deg)',
                }}
              />
              {/* Subtle highlight curve top-left */}
              <div
                className="absolute"
                style={{
                  width: '120%',
                  height: '60%',
                  left: '-30%',
                  top: '-20%',
                  background:
                    'radial-gradient(ellipse at 40% 60%, rgba(160, 200, 240, 0.2) 0%, transparent 50%)',
                  borderRadius: '50%',
                  transform: 'rotate(-25deg)',
                }}
              />
              {/* Bottom-right glow */}
              <div
                className="absolute"
                style={{
                  width: '100%',
                  height: '80%',
                  right: '-30%',
                  bottom: '-20%',
                  background:
                    'radial-gradient(ellipse at center, rgba(90, 150, 200, 0.3) 0%, transparent 60%)',
                  borderRadius: '50%',
                }}
              />
              {/* Crossing arc from bottom */}
              <div
                className="absolute"
                style={{
                  width: '250%',
                  height: '100%',
                  left: '-75%',
                  bottom: '-70%',
                  background:
                    'radial-gradient(ellipse at 50% 30%, rgba(130, 185, 225, 0.35) 0%, transparent 45%)',
                  borderRadius: '50%',
                }}
              />
            </div>

            {/* Desktop Icons - top right */}
            <div className="absolute top-[8px] right-[8px] md:top-[12px] md:right-[12px] flex flex-col gap-2 md:gap-4">
              {desktopIcons.map((icon, i) => (
                <div
                  key={icon.id}
                  className="animate-in fade-in slide-in-from-right-2 duration-300"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <MacDesktopIcon
                    icon={icon.icon}
                    label={icon.label}
                    selected={selectedIcon === icon.id}
                    onSelect={() => setSelectedIcon(icon.id)}
                    onDoubleClick={() => openWindow(icon.id)}
                  />
                </div>
              ))}
            </div>

            {/* Trash Icon - bottom right */}
            <div className="absolute bottom-[8px] right-[8px] md:bottom-[12px] md:right-[12px] animate-in fade-in slide-in-from-right-2 duration-300 delay-200">
              <MacDesktopIcon
                icon={<MacIcon src={trashIcon} alt="Trash" />}
                label="Trash"
                selected={selectedIcon === 'trash'}
                onSelect={() => setSelectedIcon('trash')}
                onDoubleClick={() => openWindow('trash')}
              />
            </div>

            {/* Hint */}
            {windows.filter((w) => w.isOpen).length === 0 && (
              <div className="absolute bottom-[8px] left-[8px] md:bottom-[12px] md:left-[12px] animate-in fade-in duration-1000 delay-500">
                <p
                  className="text-[10px] md:text-[11px] text-white/80"
                  style={{
                    fontFamily: 'Chicago, Charcoal, Geneva, sans-serif',
                    textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
                  }}
                >
                  Double-click icon to open
                </p>
              </div>
            )}

            {/* Windows */}
            {(() => {
              const openWindows = windows.filter((w) => w.isOpen)
              const maxZIndex = Math.max(...openWindows.map((w) => w.zIndex), 0)
              return windows
                .filter((w) => w.isOpen && w.id !== 'calculator')
                .map((win) => (
                  <MacWindow
                    key={win.id}
                    window={win}
                    onClose={() => closeWindow(win.id)}
                    onMaximize={() => maximizeWindow(win.id)}
                    onFocus={() => focusWindow(win.id)}
                    onDrag={(x, y) => dragWindow(win.id, x, y)}
                    onResize={(w, h) => resizeWindow(win.id, w, h)}
                    isMobile={isMobile}
                    containerRef={desktopRef}
                    isActive={win.zIndex === maxZIndex}
                  />
                ))
            })()}

            {/* Calculator - custom window */}
            {(() => {
              const calcWindow = windows.find((w) => w.id === 'calculator')
              if (!calcWindow) return null
              return (
                <CalculatorWindow
                  isOpen={calcWindow.isOpen}
                  position={calcWindow.position}
                  zIndex={calcWindow.zIndex}
                  onClose={() => closeWindow('calculator')}
                  onFocus={() => focusWindow('calculator')}
                  onDrag={(x, y) => dragWindow('calculator', x, y)}
                  containerRef={desktopRef}
                />
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )

  // Only the screen, for when the 3D scene provides the Macintosh around it
  if (screenOnly) {
    return (
      <section ref={ref} className="relative h-full w-full">
        {desktopScreen}
      </section>
    )
  }

  // Desktop
  return (
    <section
      ref={ref}
      className="flex h-screen w-screen shrink-0 snap-start items-center justify-center px-3 md:px-8 lg:px-16 relative"
    >
      <div className="w-full h-full max-w-6xl max-h-[90vh] md:max-h-[85vh] relative flex items-center justify-center">
        {/* Macintosh Classic Style Monitor */}
        <div className="relative w-full h-full">
          <div
            className="relative w-full h-full overflow-hidden flex flex-col"
            style={{
              background: '#d4d0c8',
              borderRadius: '12px 12px 8px 8px',
              boxShadow:
                '0 8px 32px rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.5), inset 0 -2px 4px rgba(0,0,0,0.1)',
              border: '1px solid #a0a098',
            }}
          >
            {/* Top bezel with screen */}
            <div className="flex-1 flex flex-col px-[5%] pt-[3%]">
              {/* Screen bezel - the recessed area around the screen */}
              <div
                className="flex-1 relative"
                style={{
                  background: 'linear-gradient(145deg, #c8c4bc 0%, #d4d0c8 50%, #ccc8c0 100%)',
                  borderRadius: '4px',
                  boxShadow: 'inset 2px 2px 8px rgba(0,0,0,0.25), inset -1px -1px 2px rgba(255,255,255,0.4)',
                  padding: '3%',
                }}
              >
                {/* Inner screen border */}
                <div
                  className="w-full h-full relative"
                  style={{
                    background: '#1a1a1a',
                    borderRadius: '2px',
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)',
                    padding: '4px',
                  }}
                >
                  {/* Screen area */}
                  {desktopScreen}
                </div>
              </div>
            </div>

            {/* Bottom section - Macintosh Classic style - same color as shell */}
            <div
              className="h-[18%] md:h-[20%] flex flex-col"
              style={{
                background: '#d4d0c8',
              }}
            >
              {/* Spacer to push drive bay down */}
              <div className="h-[25%]" />

              {/* Recessed drive bay area - edge to edge, deeply inset */}
              <div
                className="w-full h-[28px] md:h-[20px] flex items-center justify-end px-[8%]"
                style={{
                  background: 'linear-gradient(180deg, #a8a498 0%, #b8b4a8 30%, #c4c0b4 70%, #ccc8bc 100%)',
                  boxShadow:
                    'inset 0 4px 8px rgba(0,0,0,0.25), inset 0 2px 3px rgba(0,0,0,0.2), inset 0 -2px 2px rgba(255,255,255,0.3)',
                }}
              >
                {/* Floppy slot - on the RIGHT side */}
                <div
                  className="w-[55px] md:w-[250px] h-[4px] md:h-[19px]"
                  style={{
                    background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 50%, #333333 100%)',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.3)',
                    borderRadius: '1px',
                    border: '0.5px solid #555555',
                  }}
                />
                {/* Power LED - to the right of the slot */}
                <div className="ml-[10px] md:ml-[14px]">
                  <div
                    className={`w-[4px] h-[4px] md:w-[5px] md:h-[5px] rounded-full transition-all duration-500 ${
                      !isShutdown && bootStage === 'desktop'
                        ? 'bg-[#00cc00]'
                        : isShutdown
                          ? 'bg-[#333333]'
                          : 'bg-[#ffaa00]'
                    }`}
                    style={{
                      boxShadow:
                        !isShutdown && bootStage === 'desktop'
                          ? '0 0 6px #00cc00, inset 0 -1px 2px rgba(0,0,0,0.3)'
                          : isShutdown
                            ? 'inset 0 1px 2px rgba(0,0,0,0.5)'
                            : '0 0 4px #ffaa00, inset 0 -1px 2px rgba(0,0,0,0.3)',
                      border: '1px solid #2a2a2a',
                    }}
                  />
                </div>
              </div>

              {/* Apple logo and brand area - below drive bay */}
              <div className="flex-1 flex items-center px-[5%]">
                <div className="flex items-center gap-2 md:gap-3">
                  {/* Rainbow Apple Logo */}
                  <svg viewBox="0 0 18 22" className="w-[14px] h-[17px] md:w-[20px] md:h-[24px]">
                    <defs>
                      <clipPath id="classicApple">
                        <path d="M15.2 11.6c0-2.8 2.3-4.2 2.4-4.3-1.3-1.9-3.3-2.2-4-2.2-1.7-.2-3.3 1-4.2 1s-2.2-1-3.6-1c-1.9 0-3.6 1.1-4.5 2.7-1.9 3.3-.5 8.3 1.4 11 .9 1.3 2 2.8 3.5 2.8 1.4 0 1.9-.9 3.6-.9s2.2.9 3.6.9 2.5-1.4 3.4-2.7c1.1-1.5 1.5-3 1.5-3.1-.1 0-2.9-1.1-2.9-4.2zM12.5 3.8c.8-.9 1.3-2.2 1.1-3.5-1.1 0-2.4.7-3.2 1.6-.7.8-1.3 2.1-1.2 3.4 1.2.1 2.5-.6 3.3-1.5z" />
                      </clipPath>
                    </defs>
                    <g clipPath="url(#classicApple)">
                      <rect x="0" y="0" width="20" height="3.6" fill="#61BB46" />
                      <rect x="0" y="3.6" width="20" height="3.6" fill="#FDB827" />
                      <rect x="0" y="7.2" width="20" height="3.6" fill="#F5821F" />
                      <rect x="0" y="10.8" width="20" height="3.6" fill="#E03A3E" />
                      <rect x="0" y="14.4" width="20" height="3.6" fill="#963D97" />
                      <rect x="0" y="18" width="20" height="4" fill="#009DDC" />
                    </g>
                  </svg>
                  {/* Brand text */}
                  <span
                    className="mt-1 text-[1.25rem] md:text-[1.5rem] tracking-wide"
                    style={{
                      fontFamily: 'Garamond, Georgia, serif',
                      color: '#5a5a5a',
                      fontWeight: 400,
                    }}
                  >
                    Cruztosh Classic
                  </span>
                </div>
              </div>

              {/* Copyright - engraved at the very bottom */}
              <div
                className="text-left pb-[6px] px-[5%]"
                style={{
                  fontFamily: 'Geneva, Helvetica, sans-serif',
                  fontSize: '10px',
                  color: '#a09a90',
                  textShadow: '0 1px 0 rgba(255,255,255,0.5)',
                  letterSpacing: '0.3px',
                }}
              >
                © {currentYear} - Giovanni Cruz
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
