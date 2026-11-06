import { useEffect, useRef, useState } from 'react'
import { Scope, useReduceMotion } from './Scope'
import { useLang } from '../i18n'

const PRESETS = [
  { poles: 4, rpm: 1500, zh: '4 极 · 1500 转/分', en: '4 poles · 1500 rpm' },
  { poles: 4, rpm: 1800, zh: '4 极 · 1800 转/分', en: '4 poles · 1800 rpm' },
  { poles: 2, rpm: 3000, zh: '2 极 · 3000 转/分', en: '2 poles · 3000 rpm' },
  { poles: 2, rpm: 3600, zh: '2 极 · 3600 转/分', en: '2 poles · 3600 rpm' },
] as const

export function Alternator() {
  const lang = useLang()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [poles, setPoles] = useState(4)
  const [rpm, setRpm] = useState(1500)
  const [playing, setPlaying] = useState(!useReduceMotion())
  const angle = useRef(0.4)
  const frequency = (poles * rpm) / 120

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (playing) angle.current += (rpm / 60) * Math.PI * 2 * dt
      paint(ctx, canvas.width, canvas.height, poles, angle.current, frequency, lang)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [frequency, lang, playing, poles, rpm])

  return (
    <Scope
      caveat="mechanism"
      controls={
        <>
          {PRESETS.map((preset) => (
            <button
              key={preset.en}
              type="button"
              aria-pressed={poles === preset.poles && rpm === preset.rpm}
              onClick={() => {
                setPoles(preset.poles)
                setRpm(preset.rpm)
              }}
            >
              {lang === 'zh' ? preset.zh : preset.en}
            </button>
          ))}
          <label>
            {lang === 'zh' ? '极数' : 'Poles'}
            <select value={poles} onChange={(e) => setPoles(Number(e.target.value))}>
              <option value={2}>2</option>
              <option value={4}>4</option>
              <option value={6}>6</option>
            </select>
          </label>
          <label>
            {lang === 'zh' ? '转/分' : 'rpm'}
            <input type="number" min={0} max={4000} step={10} value={rpm} onChange={(e) => setRpm(Number(e.target.value) || 0)} />
          </label>
          <button type="button" onClick={() => setPlaying((v) => !v)}>
            {playing ? (lang === 'zh' ? '暂停' : 'Pause') : (lang === 'zh' ? '播放' : 'Play')}
          </button>
        </>
      }
    >
      <canvas ref={canvasRef} width={720} height={300} />
      <p className="equation">
        f = {poles} × {rpm} / 120 = {Number.isInteger(frequency) ? frequency : frequency.toFixed(2)} Hz
      </p>
    </Scope>
  )
}

function paint(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  poles: number,
  rotation: number,
  frequency: number,
  lang: 'zh' | 'en',
) {
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#0c0e09'
  ctx.fillRect(0, 0, w, h)
  const cx = 168
  const cy = 150
  const magnetR = 108
  for (let i = 0; i < poles; i += 1) {
    const a0 = (i / poles) * Math.PI * 2 - Math.PI / poles
    const a1 = ((i + 0.72) / poles) * Math.PI * 2 - Math.PI / poles
    ctx.beginPath()
    ctx.arc(cx, cy, magnetR, a0, a1)
    ctx.arc(cx, cy, magnetR - 28, a1, a0, true)
    ctx.closePath()
    const north = i % 2 === 0
    ctx.fillStyle = north ? '#c45c26' : '#3c6fbf'
    ctx.fill()
    const mid = (a0 + a1) / 2
    ctx.fillStyle = '#f3ecdf'
    ctx.font = '16px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(north ? 'N' : 'S', cx + Math.cos(mid) * (magnetR - 14), cy + Math.sin(mid) * (magnetR - 14))
  }
  ctx.strokeStyle = '#667356'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(cx, cy, 46, 0, Math.PI * 2)
  ctx.stroke()
  const arm = 62
  ctx.strokeStyle = '#c6f135'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(cx + Math.cos(rotation) * arm, cy + Math.sin(rotation) * arm)
  ctx.lineTo(cx - Math.cos(rotation) * arm, cy - Math.sin(rotation) * arm)
  ctx.stroke()
  ctx.fillStyle = '#c6f135'
  ctx.beginPath()
  ctx.arc(cx, cy, 4, 0, Math.PI * 2)
  ctx.fill()

  const plotX = 340
  const plotW = w - plotX - 24
  const midY = 150
  ctx.strokeStyle = '#445034'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(plotX, midY)
  ctx.lineTo(plotX + plotW, midY)
  ctx.stroke()
  ctx.beginPath()
  ctx.strokeStyle = '#c6f135'
  ctx.lineWidth = 2
  const span = 0.08
  for (let i = 0; i <= 240; i += 1) {
    const t = (i / 240) * span
    const y = Math.sin(2 * Math.PI * frequency * t + rotation * (poles / 2))
    const x = plotX + (i / 240) * plotW
    const py = midY - y * 78
    if (i === 0) ctx.moveTo(x, py)
    else ctx.lineTo(x, py)
  }
  ctx.stroke()
  ctx.fillStyle = '#e7c27a'
  ctx.font = '13px ui-monospace, monospace'
  ctx.textAlign = 'left'
  ctx.fillText(lang === 'zh' ? '线圈在切磁感线' : 'Coil cutting the field', 24, 28)
  ctx.fillText(lang === 'zh' ? '感应电压' : 'Induced voltage', plotX, 28)
}
