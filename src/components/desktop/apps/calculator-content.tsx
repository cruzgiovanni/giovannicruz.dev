'use client'

import { useState, useRef, useEffect } from 'react'
import { useLocale } from '@/components/locale-provider'

const title = { en: 'Calculator', pt: 'Calculadora' }

interface CalculatorWindowProps {
  isOpen: boolean
  position: { x: number; y: number }
  zIndex: number
  onClose: () => void
  onFocus: () => void
  onDrag: (x: number, y: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function CalculatorWindow({
  isOpen,
  position,
  zIndex,
  onClose,
  onFocus,
  onDrag,
  containerRef,
}: CalculatorWindowProps) {
  const locale = useLocale()
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operator, setOperator] = useState<string | null>(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)

  const isDragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(null)

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit)
      setWaitingForOperand(false)
    } else {
      setDisplay(display === '0' ? digit : display + digit)
    }
  }

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.')
      setWaitingForOperand(false)
      return
    }
    if (!display.includes('.')) {
      setDisplay(display + '.')
    }
  }

  const clear = () => {
    setDisplay('0')
    setPreviousValue(null)
    setOperator(null)
    setWaitingForOperand(false)
  }

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(inputValue)
    } else if (operator) {
      const currentValue = previousValue || 0
      let result = 0

      switch (operator) {
        case '+':
          result = currentValue + inputValue
          break
        case '-':
          result = currentValue - inputValue
          break
        case '*':
          result = currentValue * inputValue
          break
        case '/':
          result = inputValue !== 0 ? currentValue / inputValue : 0
          break
      }

      setDisplay(String(result))
      setPreviousValue(result)
    }

    setWaitingForOperand(true)
    setOperator(nextOperator)
  }

  const calculate = () => {
    if (operator && previousValue !== null) {
      const inputValue = parseFloat(display)
      let result = 0

      switch (operator) {
        case '+':
          result = previousValue + inputValue
          break
        case '-':
          result = previousValue - inputValue
          break
        case '*':
          result = previousValue * inputValue
          break
        case '/':
          result = inputValue !== 0 ? previousValue / inputValue : 0
          break
      }

      setDisplay(String(result))
      setPreviousValue(null)
      setOperator(null)
      setWaitingForOperand(true)
    }
  }

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    isDragging.current = true
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
    onFocus()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    isDragging.current = true
    dragOffset.current = {
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y,
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
        setGhostPosition({ x, y })
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging.current) {
        const container = containerRef.current
        if (!container) return
        const rect = container.getBoundingClientRect()
        const x = Math.max(0, Math.min(e.touches[0].clientX - dragOffset.current.x, rect.width - 100))
        const y = Math.max(0, Math.min(e.touches[0].clientY - dragOffset.current.y, rect.height - 50))
        setGhostPosition({ x, y })
      }
    }

    const handleEnd = () => {
      if (isDragging.current && ghostPosition) {
        onDrag(ghostPosition.x, ghostPosition.y)
      }
      isDragging.current = false
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
  }, [onDrag, containerRef, ghostPosition])

  // Mac OS 9 calculator button - square, brutalist style
  const CalcButton = ({ label, onClick, wide = false }: { label: string; onClick: () => void; wide?: boolean }) => (
    <button
      onClick={onClick}
      className="flex items-center justify-center text-black cursor-pointer select-none active:translate-y-px"
      style={{
        width: wide ? '41px' : '19px',
        height: '19px',
        background: '#fff',
        border: '1px solid #000000',
        boxShadow: '1px 1px 0 #000000',
        fontFamily: 'var(--font-geist-mono), monospace',
        fontSize: '10px',
        fontWeight: 'normal',
      }}
    >
      {label}
    </button>
  )

  if (!isOpen) return null

  return (
    <>
      {/* Ghost outline during drag */}
      {ghostPosition && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: ghostPosition.x,
            top: ghostPosition.y,
            width: '99px',
            height: '152px',
            zIndex: 99999,
            outline: '2px dashed #000000',
            outlineOffset: '-2px',
            border: '2px dashed #ffffff',
            borderRadius: '6px',
          }}
        />
      )}

      {/* Calculator window */}
      <div
        className="absolute select-none"
        style={{
          left: position.x,
          top: position.y,
          zIndex,
          fontFamily: 'var(--font-geist-mono), monospace',
        }}
        onClick={onFocus}
      >
        {/* Main body with checkered background and rounded top */}
        <div
          style={{
            background: `
              repeating-conic-gradient(
                #C9C9C9 0% 25%,
                #ffffff 0% 50%
              )
              50% / 4px 4px
            `,
            border: '2px solid #000000',
            borderRadius: '6px',
            boxShadow: '1px 1px 0 #000000',
          }}
        >
          {/* Black title bar inside the checkered body */}
          <div
            className="flex items-center justify-between h-4.5 px-1 cursor-grab active:cursor-grabbing"
            style={{
              background: '#030303',
              borderTopLeftRadius: '4px',
              borderTopRightRadius: '4px',
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="w-2.5 h-2.5 cursor-pointer hover:bg-[#cccccc] active:bg-[#999999]"
              style={{
                background: '#000000',
                border: '1px solid #FFFFFF',
              }}
            />
            {/* Title - aligned to end with display */}
            <span
              className="text-white text-[13px] font-bold"
              style={{
                fontFamily: 'var(--font-geist-mono), monospace',
              }}
            >
              {title[locale]}
            </span>
          </div>

          {/* Content area */}
          <div className="p-2">
            <div
              className="mb-1.5 px-1 py-0.5 text-right text-[12px] text-black"
              style={{
                width: '85px',
                background: '#ffffff',
                border: '1px solid #000000',
                fontFamily: 'var(--font-geist-mono), monospace',
                height: '20px',
                lineHeight: '16px',
                overflow: 'hidden',
              }}
            >
              {display.length > 9 ? parseFloat(display).toExponential(4) : display}
            </div>

            <div className="flex flex-col gap-0.75">
              {/* Row 1: C = / * */}
              <div className="flex gap-0.75">
                <CalcButton label="C" onClick={clear} />
                <CalcButton label="=" onClick={calculate} />
                <CalcButton label="/" onClick={() => performOperation('/')} />
                <CalcButton label="*" onClick={() => performOperation('*')} />
              </div>

              {/* Row 2: 7 8 9 - */}
              <div className="flex gap-0.75">
                <CalcButton label="7" onClick={() => inputDigit('7')} />
                <CalcButton label="8" onClick={() => inputDigit('8')} />
                <CalcButton label="9" onClick={() => inputDigit('9')} />
                <CalcButton label="-" onClick={() => performOperation('-')} />
              </div>

              {/* Row 3: 4 5 6 + */}
              <div className="flex gap-0.75">
                <CalcButton label="4" onClick={() => inputDigit('4')} />
                <CalcButton label="5" onClick={() => inputDigit('5')} />
                <CalcButton label="6" onClick={() => inputDigit('6')} />
                <CalcButton label="+" onClick={() => performOperation('+')} />
              </div>

              {/* Row 4: 1 2 3 = */}
              <div className="flex gap-0.75">
                <CalcButton label="1" onClick={() => inputDigit('1')} />
                <CalcButton label="2" onClick={() => inputDigit('2')} />
                <CalcButton label="3" onClick={() => inputDigit('3')} />
                <CalcButton label="=" onClick={calculate} />
              </div>

              {/* Row 5: 0 (wide) . = */}
              <div className="flex gap-0.75">
                <CalcButton label="0" onClick={() => inputDigit('0')} wide />
                <CalcButton label="." onClick={inputDecimal} />
                <CalcButton label="=" onClick={calculate} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export function CalculatorContent() {
  return null
}
