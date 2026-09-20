'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Shell } from '@/wallet/components/Shell'
import { Baseline } from './Baseline'
import { Billboard } from './Billboard'
import { Suggest } from './Suggest'

const VARIANTS = [
  { name: 'Baseline', render: Baseline },
  { name: 'Billboard', render: Billboard },
  { name: 'Suggest', render: Suggest },
] as const

export default function UsernameProtoPage() {
  const [index, setIndex] = useState(0)
  const [mount, setMount] = useState(0)
  const pickerRef = useRef<HTMLElement>(null)
  const highlightRef = useRef<HTMLSpanElement>(null)
  const ready = useRef(false)

  useEffect(() => {
    const v = parseInt(new URLSearchParams(location.search).get('v') || '1', 10)
    if (v >= 1 && v <= VARIANTS.length) setIndex(v - 1)
  }, [])

  const moveHighlight = () => {
    const picker = pickerRef.current
    const highlight = highlightRef.current
    if (!picker || !highlight) return
    const items = [...picker.querySelectorAll<HTMLButtonElement>('.proto-picker-item:not(.proto-picker-replay)')]
    const el = items[index]
    if (!el) return
    highlight.style.width = `${el.offsetWidth}px`
    highlight.style.transform = `translateX(${el.offsetLeft}px)`
  }

  useLayoutEffect(() => {
    moveHighlight()
  }, [index])

  useEffect(() => {
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        pickerRef.current?.setAttribute('data-ready', '')
        ready.current = true
        moveHighlight()
      }),
    )
    window.addEventListener('resize', moveHighlight)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('resize', moveHighlight)
    }
  }, [])

  function setActive(i: number) {
    if (i < 0 || i >= VARIANTS.length) return
    setIndex(i)
    setMount((n) => n + 1)
    const url = new URL(location.href)
    url.searchParams.set('v', String(i + 1))
    history.replaceState(null, '', url)
  }

  function replay() {
    setMount((n) => n + 1)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (!t) return
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= VARIANTS.length) setActive(num - 1)
      else if (e.key === 'ArrowRight') setActive((index + 1) % VARIANTS.length)
      else if (e.key === 'ArrowLeft') setActive((index - 1 + VARIANTS.length) % VARIANTS.length)
      else if (e.key === 'r' || e.key === 'R') replay()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [index])

  const Variant = VARIANTS[index].render

  return (
    <>
      <style>{PICKER_CSS}</style>
      <Shell>
        <Variant key={`${index}-${mount}`} />
      </Shell>
      <nav ref={pickerRef} className="proto-picker" data-position="top" aria-label="Prototype variants">
        <span ref={highlightRef} className="proto-picker-highlight" aria-hidden="true" />
        {VARIANTS.map((v, i) => (
          <button
            key={v.name}
            className="proto-picker-item"
            data-active={i === index || undefined}
            aria-current={i === index ? 'true' : undefined}
            onClick={() => setActive(i)}
          >
            {v.name}
          </button>
        ))}
        <span className="proto-picker-divider" aria-hidden="true" />
        <button className="proto-picker-item proto-picker-replay" aria-label="Replay animation (R)" onClick={replay}>
          ↻
        </button>
      </nav>
    </>
  )
}

const PICKER_CSS = `
.proto-picker {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483647;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(10, 10, 10, 0.82);
  -webkit-backdrop-filter: blur(12px) saturate(1.4);
  backdrop-filter: blur(12px) saturate(1.4);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08) inset,
    0 8px 24px rgba(0, 0, 0, 0.24),
    0 2px 6px rgba(0, 0, 0, 0.12);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 13px;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  user-select: none;
  -webkit-user-select: none;
}

.proto-picker-highlight {
  position: absolute;
  top: 4px;
  left: 0;
  height: 28px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  will-change: transform;
}

.proto-picker[data-ready] .proto-picker-highlight {
  transition:
    transform 250ms cubic-bezier(0.23, 1, 0.32, 1),
    width 250ms cubic-bezier(0.23, 1, 0.32, 1);
}

@media (prefers-reduced-motion: reduce) {
  .proto-picker[data-ready] .proto-picker-highlight { transition: none; }
}

.proto-picker-item {
  position: relative;
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  font: inherit;
  cursor: pointer;
  transition: color 150ms ease-out;
}

.proto-picker-item:hover {
  color: rgba(255, 255, 255, 0.85);
}

.proto-picker-item:active {
  transform: scale(0.97);
}

.proto-picker-item:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.4);
  outline-offset: 2px;
}

.proto-picker-item[data-active] {
  color: #fff;
}

.proto-picker-divider {
  width: 1px;
  height: 16px;
  margin: 0 4px;
  background: rgba(255, 255, 255, 0.12);
}

.proto-picker-replay {
  padding: 0 10px;
  font-size: 14px;
}

.proto-picker[data-position="top"] {
  bottom: auto;
  top: 24px;
}
`
