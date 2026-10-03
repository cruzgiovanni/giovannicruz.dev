'use client'

import { useState, useRef, useEffect } from 'react'
import { useLocale } from '@/components/locale-provider'

const copy = {
  en: { nowPlaying: 'NOW PLAYING', playlist: 'PLAYLIST', noDriver: '⚠ Audio driver not found. Running in silent mode.' },
  pt: {
    nowPlaying: 'TOCANDO AGORA',
    playlist: 'PLAYLIST',
    noDriver: '⚠ Driver de áudio não encontrado. Rodando em modo silencioso.',
  },
}

interface Track {
  id: number
  title: string
  artist: string
}

type RepeatMode = 'off' | 'one' | 'all'

const playlist: Track[] = [
  { id: 1, title: 'Baker Street', artist: 'Gerry Rafferty' },
  { id: 2, title: 'Upside Down', artist: 'Diana Ross' },
  { id: 3, title: 'Easy Days', artist: 'The Pointer Sisters' },
  { id: 4, title: 'Show me Love', artist: 'Robin S' },
  { id: 5, title: 'Hung Up On My Baby', artist: 'Isaac Hayes' },
]

export function MusicPlayerContent() {
  const t = copy[useLocale()]
  const [currentTrack, setCurrentTrack] = useState<Track>(playlist[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(100)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all')
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false))
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, currentTrack])

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleEnded = () => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => setIsPlaying(false))
      }
    } else if (repeatMode === 'all') {
      const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id)
      const nextIndex = (currentIndex + 1) % playlist.length
      setCurrentTrack(playlist[nextIndex])
      setCurrentTime(0)
    } else {
      const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id)
      if (currentIndex < playlist.length - 1) {
        setCurrentTrack(playlist[currentIndex + 1])
        setCurrentTime(0)
      } else {
        setIsPlaying(false)
        setCurrentTime(0)
      }
    }
  }

  const cycleRepeatMode = () => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all'
      if (prev === 'all') return 'one'
      return 'off'
    })
  }

  const getRepeatIcon = () => {
    if (repeatMode === 'one') return '🔂'
    if (repeatMode === 'all') return '🔁'
    return '➡️'
  }

  const handleTrackSelect = (track: Track) => {
    setCurrentTrack(track)
    setCurrentTime(0)
    setIsPlaying(true)
  }

  const handlePrevious = () => {
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id)
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1
    handleTrackSelect(playlist[prevIndex])
  }

  const handleNext = () => {
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id)
    const nextIndex = currentIndex < playlist.length - 1 ? currentIndex + 1 : 0
    handleTrackSelect(playlist[nextIndex])
  }

  const handleStop = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect()
      const percent = (e.clientX - rect.left) / rect.width
      audioRef.current.currentTime = percent * duration
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      className="h-full flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #c0c0c0 0%, #a0a0a0 100%)',
        fontFamily: 'var(--font-geist-mono), monospace',
      }}
    >
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Display */}
      <div
        className="mx-3 mt-3 p-3 text-center"
        style={{
          background: '#2a2a2a',
          border: '2px inset #888888',
          color: '#00ff00',
          fontFamily: 'monospace',
        }}
      >
        <div className="text-xs text-[#888888] mb-1">{t.nowPlaying}</div>
        <div className="text-sm truncate">{currentTrack.title}</div>
        <div className="text-xs text-[#00aa00] truncate">{currentTrack.artist}</div>
        <div className="text-xs mt-2 text-[#888888]">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mx-3 mt-3">
        <div
          className="h-2 w-full cursor-pointer"
          style={{
            background: '#ffffff',
            border: '1px solid #000000',
            boxShadow: 'inset 1px 1px 0 #888888',
          }}
          onClick={handleProgressClick}
        >
          <div className="h-full bg-[#000080]" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mt-4 px-3">
        <ControlButton label="⏮" onClick={handlePrevious} />
        <ControlButton label="⏹" onClick={handleStop} />
        <ControlButton label={isPlaying ? '⏸' : '▶'} onClick={() => setIsPlaying(!isPlaying)} primary />
        <ControlButton label="⏭" onClick={handleNext} />
        <ControlButton label={getRepeatIcon()} onClick={cycleRepeatMode} active={repeatMode !== 'off'} />
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 mx-3 mt-4">
        <span className="text-xs">🔈</span>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="flex-1 h-2 appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #000080 ${volume}%, #ffffff ${volume}%)`,
            border: '1px solid #000000',
          }}
        />
        <span className="text-xs">🔊</span>
      </div>

      {/* Playlist */}
      <main
        className="flex-1 mx-3 mt-4 mb-3 min-h-0"
        style={{
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        <div className="text-xs font-bold mb-1 px-1" style={{ color: '#000000' }}>
          {t.playlist}
        </div>
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #000000',
            boxShadow: 'inset 1px 1px 0 #888888',
          }}
        >
          {playlist.map((track) => (
            <div
              key={track.id}
              onClick={() => handleTrackSelect(track)}
              className={`px-2 py-1 text-xs cursor-pointer flex justify-between ${
                currentTrack.id === track.id ? 'bg-[#000080] text-white' : 'text-black hover:bg-[#cccccc]'
              }`}
            >
              <span className="truncate">{track.title}</span>
              <span className={currentTrack.id === track.id ? 'text-white/70' : 'text-[#888888]'}>{track.artist}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Status bar */}
      <div className="px-3 py-1 text-xs border-t border-[#888888] shrink-0" style={{ background: '#c0c0c0' }}>
        <span className="text-[#666666]">{t.noDriver}</span>
      </div>
    </div>
  )
}

function ControlButton({
  label,
  onClick,
  primary = false,
  active = false,
}: {
  label: string
  onClick: () => void
  primary?: boolean
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center text-sm cursor-pointer active:translate-y-px text-black"
      style={{
        background: active
          ? 'linear-gradient(180deg, #aaaaaa 0%, #888888 100%)'
          : primary
            ? 'linear-gradient(180deg, #ffffff 0%, #cccccc 100%)'
            : 'linear-gradient(180deg, #eeeeee 0%, #aaaaaa 100%)',
        border: '1px solid #000000',
        boxShadow: active
          ? 'inset 1px 1px 0 #666666, inset -1px -1px 0 #cccccc'
          : 'inset -1px -1px 0 #888888, inset 1px 1px 0 #ffffff',
      }}
    >
      {label}
    </button>
  )
}
