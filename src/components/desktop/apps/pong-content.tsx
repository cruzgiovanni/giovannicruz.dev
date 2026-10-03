'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocale } from '@/components/locale-provider'

const copy = {
  en: {
    you: 'You',
    start: 'Start',
    pause: 'Pause',
    reset: 'Reset',
    pressStart: 'Press Start or tap',
    paused: 'Paused',
    keyboardHelp: 'Arrow keys or W/S to move | Space to pause',
    touchHelp: 'Touch & drag to move paddle',
  },
  pt: {
    you: 'Você',
    start: 'Iniciar',
    pause: 'Pausar',
    reset: 'Reiniciar',
    pressStart: 'Clique em Iniciar ou toque',
    paused: 'Pausado',
    keyboardHelp: 'Setas ou W/S para mover | Espaço para pausar',
    touchHelp: 'Toque e arraste para mover a raquete',
  },
}

const GAME_WIDTH = 240
const GAME_HEIGHT = 180
const PADDLE_HEIGHT = 40
const PADDLE_WIDTH = 8
const BALL_SIZE = 8
const PADDLE_SPEED = 4
const INITIAL_BALL_SPEED = 4

export function PongContent() {
  const t = copy[useLocale()]
  const [playerY, setPlayerY] = useState(GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2)
  const [cpuY, setCpuY] = useState(GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2)
  const [ballX, setBallX] = useState(GAME_WIDTH / 2 - BALL_SIZE / 2)
  const [ballY, setBallY] = useState(GAME_HEIGHT / 2 - BALL_SIZE / 2)
  const [ballVelX, setBallVelX] = useState(INITIAL_BALL_SPEED)
  const [ballVelY, setBallVelY] = useState(INITIAL_BALL_SPEED * 0.5)
  const [playerScore, setPlayerScore] = useState(0)
  const [cpuScore, setCpuScore] = useState(0)
  const [isPaused, setIsPaused] = useState(true)
  const [gameStarted, setGameStarted] = useState(false)

  const gameAreaRef = useRef<HTMLDivElement>(null)
  const keysRef = useRef<Set<string>>(new Set())
  const gameStateRef = useRef({ ballVelX, ballVelY, playerY, cpuY, ballY })

  const resetBall = useCallback((direction: number) => {
    setBallX(GAME_WIDTH / 2 - BALL_SIZE / 2)
    setBallY(GAME_HEIGHT / 2 - BALL_SIZE / 2)
    setBallVelX(INITIAL_BALL_SPEED * direction)
    setBallVelY((Math.random() - 0.5) * INITIAL_BALL_SPEED)
  }, [])

  const startGame = useCallback(() => {
    setIsPaused(false)
    setGameStarted(true)
    gameAreaRef.current?.focus()
  }, [])

  const resetGame = useCallback(() => {
    setPlayerScore(0)
    setCpuScore(0)
    setPlayerY(GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2)
    setCpuY(GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2)
    resetBall(1)
    setIsPaused(true)
    setGameStarted(false)
  }, [resetBall])

  // Sync game state ref
  useEffect(() => {
    gameStateRef.current = { ballVelX, ballVelY, playerY, cpuY, ballY }
  }, [ballVelX, ballVelY, playerY, cpuY, ballY])

  // Game loop - only recreated when paused state changes
  useEffect(() => {
    if (isPaused) return

    const gameLoop = setInterval(() => {
      const gs = gameStateRef.current

      // Player movement
      setPlayerY((y) => {
        if (keysRef.current.has('ArrowUp') || keysRef.current.has('w') || keysRef.current.has('W')) {
          return Math.max(0, y - PADDLE_SPEED)
        }
        if (keysRef.current.has('ArrowDown') || keysRef.current.has('s') || keysRef.current.has('S')) {
          return Math.min(GAME_HEIGHT - PADDLE_HEIGHT, y + PADDLE_SPEED)
        }
        return y
      })

      // CPU AI - follows ball with some delay
      setCpuY((y) => {
        const cpuCenter = y + PADDLE_HEIGHT / 2
        const targetY = gs.ballY + BALL_SIZE / 2
        const diff = targetY - cpuCenter
        const speed = PADDLE_SPEED * 0.5

        if (Math.abs(diff) > 5) {
          const newY = y + (diff > 0 ? speed : -speed)
          return Math.max(0, Math.min(GAME_HEIGHT - PADDLE_HEIGHT, newY))
        }
        return y
      })

      // Ball movement
      setBallX((x) => x + gs.ballVelX)

      setBallY((y) => {
        let newY = y + gs.ballVelY

        // Top/bottom wall collision
        if (newY <= 0) {
          newY = 0
          setBallVelY((v) => Math.abs(v))
        } else if (newY >= GAME_HEIGHT - BALL_SIZE) {
          newY = GAME_HEIGHT - BALL_SIZE
          setBallVelY((v) => -Math.abs(v))
        }

        return newY
      })

      // Check paddle collisions and scoring
      setBallX((x) => {
        // Player paddle collision (left side)
        if (x <= PADDLE_WIDTH + 10) {
          const paddleTop = gs.playerY
          const paddleBottom = gs.playerY + PADDLE_HEIGHT
          const ballCenter = gs.ballY + BALL_SIZE / 2

          if (ballCenter >= paddleTop && ballCenter <= paddleBottom && x > 0) {
            setBallVelX((v) => Math.abs(v) * 1.05) // Speed up slightly
            const hitPos = (ballCenter - paddleTop) / PADDLE_HEIGHT
            setBallVelY((hitPos - 0.5) * INITIAL_BALL_SPEED * 2)
            return PADDLE_WIDTH + 11
          }
        }

        // CPU paddle collision (right side)
        if (x >= GAME_WIDTH - PADDLE_WIDTH - BALL_SIZE - 10) {
          const paddleTop = gs.cpuY
          const paddleBottom = gs.cpuY + PADDLE_HEIGHT
          const ballCenter = gs.ballY + BALL_SIZE / 2

          if (ballCenter >= paddleTop && ballCenter <= paddleBottom && x < GAME_WIDTH - BALL_SIZE) {
            setBallVelX((v) => -Math.abs(v) * 1.05)
            const hitPos = (ballCenter - paddleTop) / PADDLE_HEIGHT
            setBallVelY((hitPos - 0.5) * INITIAL_BALL_SPEED * 2)
            return GAME_WIDTH - PADDLE_WIDTH - BALL_SIZE - 11
          }
        }

        // Scoring
        if (x <= 0) {
          setCpuScore((s) => s + 1)
          resetBall(1)
          return GAME_WIDTH / 2 - BALL_SIZE / 2
        }

        if (x >= GAME_WIDTH - BALL_SIZE) {
          setPlayerScore((s) => s + 1)
          resetBall(-1)
          return GAME_WIDTH / 2 - BALL_SIZE / 2
        }

        return x
      })
    }, 16) // ~60fps

    return () => clearInterval(gameLoop)
  }, [isPaused, resetBall])

  // Keyboard controls
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault()
        if (!gameStarted) {
          startGame()
        } else {
          setIsPaused((p) => !p)
        }
        return
      }
      keysRef.current.add(e.key)
    },
    [gameStarted, startGame],
  )

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    keysRef.current.delete(e.key)
  }, [])

  // Touch controls
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isPaused) return
      const touch = e.touches[0]
      const rect = gameAreaRef.current?.getBoundingClientRect()
      if (!rect) return

      const relativeY = touch.clientY - rect.top
      const gameY = (relativeY / rect.height) * GAME_HEIGHT
      setPlayerY(Math.max(0, Math.min(GAME_HEIGHT - PADDLE_HEIGHT, gameY - PADDLE_HEIGHT / 2)))
    },
    [isPaused],
  )

  const handleClick = useCallback(() => {
    if (!gameStarted) {
      startGame()
    }
  }, [gameStarted, startGame])

  return (
    <div className="h-full flex flex-col bg-[#c0c0c0] font-mono text-[11px] md:text-[12px]">
      {/* Header */}
      <div
        className="px-3 py-2 border-b border-[#888888] shrink-0 flex items-center justify-between"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #dddddd 100%)',
        }}
      >
        <div className="flex gap-4">
          <span className="text-black font-bold">
            {t.you}: {playerScore}
          </span>
          <span className="text-[#666666]">CPU: {cpuScore}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={gameStarted ? () => setIsPaused((p) => !p) : startGame}
            className="px-3 py-1 text-[10px] md:text-[11px] cursor-pointer active:brightness-90 text-black/90"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #cccccc 100%)',
              border: '1px solid #000000',
              boxShadow: 'inset -1px -1px 0 #888888, inset 1px 1px 0 #ffffff',
            }}
          >
            {isPaused ? t.start : t.pause}
          </button>

          <button
            onClick={resetGame}
            className="px-3 py-1 text-[10px] md:text-[11px] cursor-pointer active:brightness-90 text-black/90"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #cccccc 100%)',
              border: '1px solid #000000',
              boxShadow: 'inset -1px -1px 0 #888888, inset 1px 1px 0 #ffffff',
            }}
          >
            {t.reset}
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div
        ref={gameAreaRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onTouchMove={handleTouchMove}
        onClick={handleClick}
        className="flex-1 flex items-center justify-center outline-none p-2"
        style={{ touchAction: 'none' }}
      >
        <div
          className="relative overflow-hidden"
          style={{
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            background: '#1a1a1a',
            border: '2px solid #888888',
            boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          {/* Center line */}
          <div
            className="absolute inset-y-0"
            style={{
              left: GAME_WIDTH / 2 - 1,
              width: 2,
              background: 'repeating-linear-gradient(to bottom, #333 0px, #333 8px, transparent 8px, transparent 16px)',
            }}
          />

          {/* Player paddle (left) */}
          <div
            className="absolute"
            style={{
              left: 10,
              top: playerY,
              width: PADDLE_WIDTH,
              height: PADDLE_HEIGHT,
              background: '#ffffff',
            }}
          />

          {/* CPU paddle (right) */}
          <div
            className="absolute"
            style={{
              right: 10,
              top: cpuY,
              width: PADDLE_WIDTH,
              height: PADDLE_HEIGHT,
              background: '#ffffff',
            }}
          />

          {/* Ball */}
          <div
            className="absolute"
            style={{
              left: ballX,
              top: ballY,
              width: BALL_SIZE,
              height: BALL_SIZE,
              background: '#ffffff',
              borderRadius: '50%',
            }}
          />

          {/* Start overlay */}
          {isPaused && !gameStarted && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-center text-white">
                <p className="text-sm font-bold mb-1">Pong</p>
                <p className="text-[10px] opacity-80">{t.pressStart}</p>
              </div>
            </div>
          )}

          {/* Pause overlay */}
          {isPaused && gameStarted && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <p className="text-white text-sm font-bold">{t.paused}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-3 py-2 border-t border-[#888888] text-[10px] text-[#666666] shrink-0"
        style={{
          background: 'linear-gradient(180deg, #eeeeee 0%, #dddddd 100%)',
        }}
      >
        <p className="hidden sm:block">{t.keyboardHelp}</p>
        <p className="sm:hidden">{t.touchHelp}</p>
      </div>
    </div>
  )
}
