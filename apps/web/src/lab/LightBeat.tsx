import { useEffect, useMemo, useRef, useState } from 'react'
import { analyzeLight, LIGHT_PRESETS, type ShutterKind } from '@vtm/light'
import { Scope, useReduceMotion } from './Scope'
import { useLang } from '../i18n'

const PRESET_LABEL = {
  zh: {
    pal50: 'PAL · 50 Hz 灯',
    pal60: 'PAL · 60 Hz 灯',
    ntsc60: '60 场 · 60 Hz 灯',
    ntsc50: '60 场 · 50 Hz 灯',
    ntsc5994: '59.94 · 60 Hz 灯',
    p24eu: '24 fps · 50 Hz · 180°',
    p24eu172: '24 fps · 50 Hz · 172.8°',
    p24us: '24 fps · 60 Hz · 180°',
    p24us144: '24 fps · 60 Hz · 144°',
  },
  en: {
    pal50: 'PAL · 50 Hz lamps',
    pal60: 'PAL · 60 Hz lamps',
    ntsc60: '60 fields · 60 Hz lamps',
    ntsc50: '60 fields · 50 Hz lamps',
    ntsc5994: '59.94 · 60 Hz lamps',
    p24eu: '24 fps · 50 Hz · 180°',
    p24eu172: '24 fps · 50 Hz · 172.8°',
    p24us: '24 fps · 60 Hz · 180°',
    p24us144: '24 fps · 60 Hz · 144°',
  },
} as const

function level(fLamp: number, exposure: number, t0: number, integerExposure: boolean): number {
  if (integerExposure) return 0.7
  const w = 2 * Math.PI * fLamp
  const integral = (Math.sin(w * (t0 + exposure)) - Math.sin(w * t0)) / w
  return 0.7 + 0.28 * (integral / exposure)
}

export function LightBeat() {
  const lang = useLang()
  const labels = PRESET_LABEL[lang]
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mains, setMains] = useState(50)
  const [harmonic, setHarmonic] = useState(2)
  const [rate, setRate] = useState(50)
  const [shutter, setShutter] = useState(180)
  const [shutterKind, setShutterKind] = useState<ShutterKind>('global')
  const [playing, setPlaying] = useState(!useReduceMotion())
  const [viewSpeed, setViewSpeed] = useState(0.18)
  const clock = useRef(0)
  const picture = useRef<ImageData | null>(null)
  const result = useMemo(
    () => analyzeLight({ mains, harmonic, rate, shutter, shutterKind }),
    [harmonic, mains, rate, shutter, shutterKind],
  )

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
      if (playing) clock.current += dt * viewSpeed
      const { width: w, height: h } = canvas
      ctx.fillStyle = '#0c0e09'
      ctx.fillRect(0, 0, w, h)
      const frames = 24
      ctx.beginPath()
      for (let i = 0; i < frames; i += 1) {
        const y = h * 0.42 - (level(result.fLamp, result.exposure, i / rate, result.integerExposure) - 0.7) * h
        const x = 16 + (i / (frames - 1)) * (w * 0.42)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = '#c6f135'
      ctx.lineWidth = 2
      ctx.stroke()
      const bandX = Math.round(w * 0.52)
      const pictureW = w - bandX - 12
      if (!picture.current || picture.current.width !== pictureW || picture.current.height !== h) {
        const still = ctx.createImageData(pictureW, h)
        paintWall(still)
        picture.current = still
      }
      const still = picture.current
      const frame = ctx.createImageData(pictureW, h)
      for (let y = 0; y < h; y += 1) {
        const delay = shutterKind === 'rolling' ? (y / h) * (1 / rate) : 0
        const value = level(result.fLamp, result.exposure, clock.current + delay, result.integerExposure)
        const raw = value / 0.7
        const gain = result.verdict === 'stable' ? 1 : 1 + (raw - 1) * 5
        for (let x = 0; x < pictureW; x += 1) {
          const i = (y * pictureW + x) * 4
          frame.data[i] = clamp(still.data[i] * gain)
          frame.data[i + 1] = clamp(still.data[i + 1] * gain)
          frame.data[i + 2] = clamp(still.data[i + 2] * gain)
          frame.data[i + 3] = 255
        }
      }
      ctx.putImageData(frame, bandX, 0)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing, rate, result, shutterKind, viewSpeed])

  const verdict = verdictText(lang, result.verdict, result.post, result.alias, result.integerExposure)

  return (
    <Scope
      caveat="refresh"
      controls={
        <>
          {LIGHT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setMains(preset.mains)
                setHarmonic(preset.harmonic)
                setRate(preset.rate)
                setShutter(preset.shutter)
                setShutterKind(preset.shutterKind)
              }}
            >
              {labels[preset.id as keyof typeof labels]}
            </button>
          ))}
        </>
      }
    >
      <canvas ref={canvasRef} width={640} height={280} />
      <p className="note">
        {lang === 'zh'
          ? '右边是一块平的墙，小人只是参照。闪被放慢，明暗也拉开了，否则 20 Hz 的一成亮度看不出来。底下的拍频仍是这组数算出来的。'
          : 'The right side is a plain wall. The small figure is only a reference. The flicker is slowed and the swing is opened up, because a tenth of brightness at 20 Hz is hard to see. The alias below is still the real one for these numbers.'}
      </p>
      <div className="controls">
        <label>{lang === 'zh' ? '市电 Hz' : 'Mains Hz'} <input type="number" value={mains} min={1} onChange={(e) => setMains(Number(e.target.value))} /></label>
        <label>{lang === 'zh' ? '谐波' : 'Harmonic'} <input type="number" value={harmonic} min={1} step={1} onChange={(e) => setHarmonic(Number(e.target.value))} /></label>
        <label>{lang === 'zh' ? '采样 Hz' : 'Sample Hz'} <input type="number" value={Number(rate.toFixed(5))} step={0.001} onChange={(e) => setRate(Number(e.target.value))} /></label>
        <label>{lang === 'zh' ? '快门角' : 'Shutter °'} <input type="number" value={shutter} step={0.1} onChange={(e) => setShutter(Number(e.target.value))} /></label>
        <button type="button" aria-pressed={shutterKind === 'global'} onClick={() => setShutterKind('global')}>{lang === 'zh' ? '全局快门' : 'Global'}</button>
        <button type="button" aria-pressed={shutterKind === 'rolling'} onClick={() => setShutterKind('rolling')}>{lang === 'zh' ? '滚动快门' : 'Rolling'}</button>
        <button type="button" onClick={() => setPlaying((v) => !v)}>{playing ? (lang === 'zh' ? '暂停' : 'Pause') : lang === 'zh' ? '播放' : 'Play'}</button>
        <label>
          {lang === 'zh' ? '播放速度' : 'Playback'} {viewSpeed.toFixed(2)}
          <input type="range" min={0.05} max={1} step={0.01} value={viewSpeed} onChange={(e) => setViewSpeed(Number(e.target.value))} />
        </label>
      </div>
      <p className="equation">{verdict}</p>
    </Scope>
  )
}

function paintWall(image: ImageData) {
  const { width: w, height: h, data } = image
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4
      const fx = x - 28
      const fy = y - (h - 86)
      const head = (fx - 12) * (fx - 12) + (fy - 14) * (fy - 14) < 11 * 11
      const body = fx > 4 && fx < 22 && fy > 24 && fy < 52
      let r = 176
      let g = 164
      let b = 146
      if (head) {
        r = 228
        g = 184
        b = 150
      } else if (body) {
        r = 198
        g = 78
        b = 40
      }
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = 255
    }
  }
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function verdictText(lang: 'zh' | 'en', verdict: string, post: string, alias: number, integerExposure: boolean): string {
  const aliasBit = integerExposure
    ? (lang === 'zh' ? '曝光是整数个灯周期' : 'exposure covers whole lamp cycles')
    : (lang === 'zh' ? `拍频 ${alias.toFixed(3)} Hz` : `alias ${alias.toFixed(3)} Hz`)
  const postBit = lang === 'zh'
    ? { prevent: '成片不必修', attenuate: '成片只能减轻（deflicker）', baked: '横条已经写进样点' }[post]
    : { prevent: 'nothing to repair', attenuate: 'post can only attenuate (deflicker)', baked: 'bands are already in the samples' }[post]
  const name = lang === 'zh'
    ? { stable: '稳定', 'frozen-bands': '横条钉死', 'rolling-bands': '横条滚动', 'global-flicker': '整幅闪' }[verdict]
    : verdict
  return `${name} · ${aliasBit} · ${postBit}`
}
