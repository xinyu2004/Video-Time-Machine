import { useEffect, useRef, useState } from 'react'
import { Scope } from './Scope'
import { paintTrail } from './scene'
import { useLang } from '../i18n'

const LAMP_FRAME = 11

function flickerAt(i: number): number {
  return 0.55 + 0.35 * Math.sin((i / 25) * Math.PI * 8)
}

function meanEnding(size: number, frame: number): number {
  let sum = 0
  for (let k = 0; k < size; k += 1) sum += flickerAt(frame - k)
  return sum / size
}

export function TemporalWindow() {
  const lang = useLang()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState(5)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    const frames = 60
    const raw = Array.from({ length: frames }, (_, i) => flickerAt(i))
    const avg = raw.map((_, i) => meanEnding(size, i))
    ctx.fillStyle = '#0c0e09'
    ctx.fillRect(0, 0, w, h)
    const plot = (series: number[], color: string) => {
      ctx.beginPath()
      series.forEach((value, i) => {
        const x = 16 + (i / (frames - 1)) * (w - 32)
        const y = 16 + (1 - value) * (h * 0.26)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.stroke()
    }
    plot(raw, '#8d927c')
    plot(avg, '#c6f135')
    const stripH = 188
    const strip = ctx.createImageData(w, stripH)
    const now = LAMP_FRAME
    const rawNow = flickerAt(now)
    const mean = avg[now]
    const gain = Math.min(1.85, mean / rawNow)
    const poses = []
    for (let k = size - 1; k >= 0; k -= 1) {
      poses.push({
        cx: 48 + (now - k) * 14,
        swing: Math.sin((now - k) * 0.65),
        gain: k === 0 ? 1 : 0.55,
      })
    }
    paintTrail(strip, poses)
    for (let i = 0; i < strip.data.length; i += 4) {
      strip.data[i] = Math.min(255, Math.round(strip.data[i] * gain))
      strip.data[i + 1] = Math.min(255, Math.round(strip.data[i + 1] * gain))
      strip.data[i + 2] = Math.min(255, Math.round(strip.data[i + 2] * gain))
    }
    for (let y = 0; y < stripH; y += 1) {
      const band = 0.72 + 0.28 * Math.sin(y / 7)
      for (let x = 0; x < w; x += 1) {
        const i = (y * w + x) * 4
        strip.data[i] = Math.round(strip.data[i] * band)
        strip.data[i + 1] = Math.round(strip.data[i + 1] * band)
        strip.data[i + 2] = Math.round(strip.data[i + 2] * band)
      }
    }
    ctx.putImageData(strip, 0, h - stripH)
    const lamp = Math.round(mean * 255)
    ctx.fillStyle = `rgb(${lamp} ${lamp} ${lamp})`
    ctx.fillRect(w - 92, h - stripH + 18, 64, 78)
    ctx.strokeStyle = '#e0b080'
    ctx.strokeRect(w - 92, h - stripH + 18, 64, 78)
    ctx.fillStyle = '#e0b080'
    ctx.font = '12px ui-monospace, monospace'
    ctx.fillText(lang === 'zh' ? '灯' : 'lamp', w - 78, h - stripH + 112)
  }, [lang, size])

  return (
    <Scope
      controls={
        <label>
          tmix / deflicker {lang === 'zh' ? '窗长' : 'window'} {size}
          <input type="range" min={1} max={15} value={size} onChange={(e) => setSize(Number(e.target.value))} />
        </label>
      }
    >
      <canvas ref={canvasRef} width={640} height={300} />
      <p className="note">
        {lang === 'zh'
          ? `停在灯最暗的一帧。这一帧本身 ${flickerAt(LAMP_FRAME).toFixed(2)}，窗里 ${meanEnding(size, LAMP_FRAME).toFixed(2)}。窗越长，灯和屋子越靠近平均，人影越多。横条还在。`
          : `Held on the lamp’s darkest frame. The frame itself is ${flickerAt(LAMP_FRAME).toFixed(2)}. The window mean is ${meanEnding(size, LAMP_FRAME).toFixed(2)}. A longer window pulls the lamp and the room toward the average and leaves more ghosts. The bands stay.`}
      </p>
    </Scope>
  )
}
