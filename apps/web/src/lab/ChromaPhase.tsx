import { useEffect, useRef, useState } from 'react'
import { Scope } from './Scope'
import { useLang } from '../i18n'

const SWATCHES = [0, 60, 120, 180, 240, 300]

type Wave = { phase: number; amp: number; color: string; width: number; ghost?: boolean }
type Chip = { phase: number; sat: number }
type Row = { name: string; note: string; band: 'ntsc' | 'pal'; waves: Wave[]; chips: Chip[] }

export function ChromaPhase() {
  const lang = useLang()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hue, setHue] = useState(120)
  const [errorDeg, setErrorDeg] = useState(30)
  const factor = Math.cos((errorDeg * Math.PI) / 180)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    paint(ctx, canvas.width, canvas.height, hue, errorDeg, factor, lang)
  }, [errorDeg, factor, hue, lang])

  const equation = lang === 'zh'
    ? `所选颜色 ${hue}°。φ = ${errorDeg}° 时，NTSC 收到 ${wrap(hue + errorDeg)}°。PAL 这一行是 ${wrap(hue + errorDeg)}°，倒回后的下一行是 ${wrap(hue - errorDeg)}°，平均后仍是 ${hue}°，幅度 × cos ${errorDeg}° = ${factor.toFixed(3)}。`
    : `Chosen color ${hue}°. At φ = ${errorDeg}°, NTSC receives ${wrap(hue + errorDeg)}°. This PAL line is ${wrap(hue + errorDeg)}°, the next line after the flip is ${wrap(hue - errorDeg)}°, and the average stays at ${hue}°. Amplitude × cos ${errorDeg}° = ${factor.toFixed(3)}.`

  return (
    <Scope
      caveat="phase"
      controls={
        <>
          {SWATCHES.map((swatch) => (
            <button
              key={swatch}
              type="button"
              aria-label={`${swatch}°`}
              aria-pressed={hue === swatch}
              style={{
                width: '1.5rem',
                height: '1.5rem',
                padding: 0,
                background: `hsl(${swatch}, 70%, 46%)`,
                boxShadow: hue === swatch ? '0 0 0 2px #c6f135' : undefined,
              }}
              onClick={() => setHue(swatch)}
            />
          ))}
          <label>
            {lang === 'zh' ? '颜色' : 'Color'}
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={hue}
              style={{ width: '10rem' }}
              onChange={(e) => setHue(Number(e.target.value))}
            />
            {hue}°
          </label>
          {[0, 30, 60].map((deg) => (
            <button key={deg} type="button" aria-pressed={errorDeg === deg} onClick={() => setErrorDeg(deg)}>
              {deg}°
            </button>
          ))}
          <label>
            {lang === 'zh' ? '相位偏了' : 'Phase error'}
            <input
              type="range"
              min={0}
              max={60}
              step={1}
              value={errorDeg}
              style={{ width: '10rem' }}
              onChange={(e) => setErrorDeg(Number(e.target.value))}
            />
            {errorDeg}°
          </label>
        </>
      }
    >
      <canvas ref={canvasRef} width={760} height={420} role="img" aria-label={equation} />
      <p className="equation">{equation}</p>
    </Scope>
  )
}

function paint(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  hue: number,
  errorDeg: number,
  factor: number,
  lang: 'zh' | 'en',
) {
  const rows = figureRows(hue, errorDeg, factor, lang)
  const step = h / rows.length
  rows.forEach((row, index) => {
    const top = step * index
    const mid = top + step / 2
    ctx.fillStyle = row.band === 'ntsc' ? '#1a120c' : '#0c141c'
    ctx.fillRect(0, top, w, step)
    ctx.strokeStyle = row.band === 'ntsc' ? '#6a5344' : '#3d5566'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(168, mid)
    ctx.lineTo(640, mid)
    ctx.stroke()
    for (const wave of row.waves) {
      strokeWave(ctx, mid, wave)
      if (!wave.ghost) peakTick(ctx, mid, wave)
    }
    ctx.fillStyle = '#e5f0c4'
    ctx.font = '14px "Iowan Old Style", Palatino, Georgia, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(row.name, 16, mid - 12)
    ctx.fillStyle = row.band === 'ntsc' ? '#e7c27a' : '#9ecbff'
    ctx.font = '13px ui-monospace, monospace'
    ctx.fillText(row.note, 16, mid + 10)
    row.chips.forEach((item, chipIndex) => chip(ctx, 668 + chipIndex * 38, mid, item.phase, item.sat))
  })
}

function figureRows(hue: number, errorDeg: number, factor: number, lang: 'zh' | 'en'): Row[] {
  const ghost = 'rgba(229,240,196,0.35)'
  return [
    {
      name: 'NTSC',
      note: `+${errorDeg}°`,
      band: 'ntsc',
      waves: [wave(hue, 1, ghost, 1.5, true), wave(hue + errorDeg, 1, '#e07a3d', 2)],
      chips: [{ phase: hue, sat: 78 }, { phase: hue + errorDeg, sat: 78 }],
    },
    {
      name: lang === 'zh' ? 'PAL 这一行' : 'PAL line n',
      note: `+${errorDeg}°`,
      band: 'pal',
      waves: [wave(hue, 1, ghost, 1.5, true), wave(hue + errorDeg, 1, '#9ecbff', 2)],
      chips: [{ phase: hue, sat: 78 }, { phase: hue + errorDeg, sat: 78 }],
    },
    {
      name: lang === 'zh' ? 'PAL 下一行' : 'PAL next line',
      note: `−${errorDeg}°`,
      band: 'pal',
      waves: [wave(hue, 1, ghost, 1.5, true), wave(hue - errorDeg, 1, '#e7c27a', 2)],
      chips: [{ phase: hue, sat: 78 }, { phase: hue - errorDeg, sat: 78 }],
    },
    {
      name: lang === 'zh' ? '两行平均' : 'Average',
      note: `× ${factor.toFixed(3)}`,
      band: 'pal',
      waves: [wave(hue, 1, ghost, 1.5, true), wave(hue, factor, '#c6f135', 2)],
      chips: [{ phase: hue, sat: 78 }, { phase: hue, sat: Math.round(78 * factor) }],
    },
  ]
}

function wave(phase: number, amp: number, color: string, width: number, ghost = false): Wave {
  return { phase, amp, color, width, ghost }
}

function strokeWave(ctx: CanvasRenderingContext2D, mid: number, item: Wave) {
  ctx.beginPath()
  ctx.strokeStyle = item.color
  ctx.lineWidth = item.width
  for (let i = 0; i <= 200; i += 1) {
    const u = i / 200
    const rad = u * 4 * Math.PI + (item.phase * Math.PI) / 180
    const x = 168 + u * (640 - 168)
    const y = mid - Math.sin(rad) * item.amp * 26
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
}

function peakTick(ctx: CanvasRenderingContext2D, mid: number, item: Wave) {
  let u = (90 - item.phase) / 720
  while (u < 0.12) u += 0.5
  while (u > 0.88) u -= 0.5
  const x = 168 + u * (640 - 168)
  ctx.strokeStyle = item.color
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x, mid)
  ctx.lineTo(x, mid - item.amp * 26)
  ctx.stroke()
}

function chip(ctx: CanvasRenderingContext2D, x: number, y: number, phase: number, sat: number) {
  ctx.fillStyle = `hsl(${wrap(phase)}, ${Math.max(0, sat)}%, 46%)`
  ctx.fillRect(x, y - 16, 28, 28)
  ctx.strokeStyle = '#e5f0c4'
  ctx.lineWidth = 1
  ctx.strokeRect(x + 0.5, y - 15.5, 27, 27)
}

function wrap(deg: number): number {
  return (deg % 360 + 360) % 360
}
