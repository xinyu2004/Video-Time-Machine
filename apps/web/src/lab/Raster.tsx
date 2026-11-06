import { useEffect, useRef, useState } from 'react'
import { Scope, useReduceMotion } from './Scope'
import { paintStill } from './scene'
import { useI18n, useLang } from '../i18n'

const SPEC = {
  525: { total: 525, active: 480, blank: 45, shown: 32 },
  625: { total: 625, active: 576, blank: 49, shown: 36 },
} as const

export function Raster() {
  const i18n = useI18n()
  const lang = useLang()
  const zh = lang === 'zh'
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [system, setSystem] = useState<525 | 625>(625)
  const [playing, setPlaying] = useState(!useReduceMotion())
  const scan = useRef(0)
  const seenEven = useRef(false)
  const seenOdd = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const still = document.createElement('canvas')
    still.width = canvas.width - 16
    still.height = canvas.height - 92
    const stillCtx = still.getContext('2d')
    if (!stillCtx) return
    const stillImage = stillCtx.createImageData(still.width, still.height)
    paintStill(stillImage, 2.8)
    stillCtx.putImageData(stillImage, 0, 0)
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const spec = SPEC[system]
      const span = spec.shown / 2 + 1
      const cycle = span * 2
      if (playing) scan.current = (scan.current + dt * cycle * 0.28) % cycle
      const onEven = scan.current < span
      const local = onEven ? scan.current : scan.current - span
      if (onEven && local >= spec.shown / 2) seenEven.current = true
      if (!onEven && local >= spec.shown / 2) seenOdd.current = true
      paint(ctx, canvas.width, canvas.height, spec, scan.current, still, zh, seenEven.current, seenOdd.current)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing, system, zh])

  return (
    <Scope
      caveat="crt"
      controls={
        <>
          <button type="button" onClick={() => { seenEven.current = false; seenOdd.current = false; scan.current = 0; setSystem(525) }} aria-pressed={system === 525}>525</button>
          <button type="button" onClick={() => { seenEven.current = false; seenOdd.current = false; scan.current = 0; setSystem(625) }} aria-pressed={system === 625}>625</button>
          <button type="button" onClick={() => setPlaying((v) => !v)}>{playing ? i18n.lab.pause : i18n.lab.play}</button>
        </>
      }
    >
      <canvas ref={canvasRef} width={640} height={360} />
      <p className="note">
        {zh
          ? '可见的行都是满的。625 里看到的是 576，525 里大约是 480。两场轮流，每一场都把自己的行先灭再画。另一场留着。半行在底下那条消隐里。'
          : 'Every visible line is complete. Of 625 you see 576. Of 525 you see about 480. The fields take turns. Each pass clears its own lines and draws them again. The other field stays. The half-line is in the blanking strip.'}
      </p>
    </Scope>
  )
}

function paint(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  spec: { total: number; active: number; blank: number; shown: number },
  scan: number,
  still: HTMLCanvasElement,
  zh: boolean,
  seenEven: boolean,
  seenOdd: boolean,
) {
  ctx.fillStyle = '#0c0e09'
  ctx.fillRect(0, 0, w, h)
  const inset = 8
  const innerW = w - 16
  const top = 12
  const blankH = 36
  const statusH = 28
  const pictureH = h - top - blankH - statusH - 8
  const lines = spec.shown
  const lh = pictureH / lines
  const half = lines / 2
  const span = half + 1
  const pos = scan % (span * 2)
  const onEven = pos < span
  const local = onEven ? pos : pos - span
  const inBlank = local >= half

  for (let i = 0; i < lines; i += 1) {
    const destY = top + i * lh
    const destH = Math.max(1, lh - 1.1)
    const index = Math.floor(i / 2)
    const even = i % 2 === 0
    const mine = even === onEven
    const lit = mine ? index <= Math.floor(local) : (even ? seenEven : seenOdd)
    if (!lit) {
      ctx.globalAlpha = 1
      ctx.fillStyle = '#14170f'
      ctx.fillRect(inset, destY, innerW, destH)
      continue
    }
    const fresh = even ? onEven && local < index + 1 : !onEven && local < index + 1
    const srcY = (i / lines) * still.height
    ctx.globalAlpha = fresh ? 1 : 0.8
    ctx.drawImage(still, 0, srcY, still.width, Math.max(1, still.height / lines), inset, destY, innerW, destH)
  }
  ctx.globalAlpha = 1

  const blankY = top + pictureH + 4
  ctx.fillStyle = '#1a140c'
  ctx.fillRect(inset, blankY, innerW, blankH)
  ctx.strokeStyle = '#8a5a32'
  ctx.strokeRect(inset, blankY, innerW, blankH)
  ctx.fillStyle = '#e0b080'
  ctx.font = '13px ui-monospace, monospace'
  ctx.fillText(zh ? '消隐 · 半行在这里' : 'Blanking · the half-line is here', inset + 8, blankY + 23)

  let bx = inset
  let by = top
  let showBeam = true
  if (!inBlank) {
    const idx = Math.min(half - 1, Math.floor(local))
    const frac = local - idx
    bx = inset + frac * innerW
    by = top + (evenRow(idx, onEven)) * lh
  } else {
    const u = Math.min(1, local - half)
    bx = inset + Math.min(1, u / 0.65) * (innerW * 0.5)
    by = blankY + blankH * 0.45
    if (u > 0.65) showBeam = false
  }
  if (showBeam) {
    ctx.fillStyle = '#fff7d6'
    ctx.fillRect(bx, by, 4, Math.max(3, inBlank ? 8 : lh))
  }

  ctx.fillStyle = '#1c2116'
  ctx.fillRect(inset, h - statusH - 4, innerW, statusH)
  ctx.fillStyle = '#d5e7a4'
  const field = inBlank
    ? (zh ? '消隐' : 'blanking')
    : onEven
      ? (zh ? '第 1 场 · 偶数行' : 'Field 1 · even lines')
      : (zh ? '第 2 场 · 奇数行' : 'Field 2 · odd lines')
  ctx.fillText(`${spec.total} · ${zh ? '可见' : 'active'} ${spec.active} · ${zh ? '消隐' : 'blank'} ${spec.blank} · ${field}`, 12, h - 12)
}

function evenRow(index: number, onEven: boolean): number {
  return onEven ? index * 2 : index * 2 + 1
}
