import { useEffect, useRef, useState } from 'react'
import { Scope } from './Scope'
import { useLang } from '../i18n'

type Kind = 'sdr' | 'pq'

export function ToneMap({ kind = 'sdr' }: { kind?: Kind }) {
  const zh = useLang() === 'zh'
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gamma, setGamma] = useState(2.4)
  const [useSrgb, setUseSrgb] = useState(false)
  const [asPq, setAsPq] = useState(false)
  const [nits, setNits] = useState(1000)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const image = ctx.createImageData(canvas.width, canvas.height)
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const shown = kind === 'pq'
          ? pqShow(sceneSpot(x, y, canvas.width, canvas.height, nits), asPq)
          : sdrPixel(scene(x, y, canvas.width, canvas.height), gamma, useSrgb)
        const i = (y * canvas.width + x) * 4
        image.data[i] = shown[0]
        image.data[i + 1] = shown[1]
        image.data[i + 2] = shown[2]
        image.data[i + 3] = 255
      }
    }
    ctx.putImageData(image, 0, 0)
  }, [asPq, gamma, kind, nits, useSrgb])

  return (
    <Scope
      controls={
        kind === 'pq' ? (
          <>
            <button type="button" aria-pressed={!asPq} onClick={() => setAsPq(false)}>{zh ? '按伽马看' : 'View as gamma'}</button>
            <button type="button" aria-pressed={asPq} onClick={() => setAsPq(true)}>{zh ? '按 PQ 看' : 'View as PQ'}</button>
            {NITS_MARKS.map((mark) => (
              <button key={mark} type="button" aria-pressed={nits === mark} onClick={() => setNits(mark)}>{mark}</button>
            ))}
            <label>
              {nits} {zh ? '尼特' : 'nits'}
              <input type="range" min={100} max={4000} step={50} value={nits} onChange={(e) => setNits(Number(e.target.value))} />
            </label>
          </>
        ) : (
          <>
            <button type="button" aria-pressed={!useSrgb && Math.abs(gamma - 2.2) < 0.05} onClick={() => { setUseSrgb(false); setGamma(2.2) }}>2.2</button>
            <button type="button" aria-pressed={!useSrgb && Math.abs(gamma - 2.4) < 0.05} onClick={() => { setUseSrgb(false); setGamma(2.4) }}>2.4</button>
            <button type="button" aria-pressed={useSrgb} onClick={() => setUseSrgb(true)}>sRGB</button>
            <label>
              {useSrgb ? 'sRGB' : gamma.toFixed(2)}
              <input type="range" min={1.6} max={3} step={0.05} value={useSrgb ? 2.2 : gamma} disabled={useSrgb} onChange={(e) => { setUseSrgb(false); setGamma(Number(e.target.value)) }} />
            </label>
          </>
        )
      }
    >
      <canvas ref={canvasRef} width={480} height={280} />
      <p className="note">
        {kind === 'pq'
          ? (zh
            ? '看亮窗。滑块是这扇窗的尼特，100、1000、4000 是刻度，曲线不动。从 100 拉到 1000，按 PQ 看会顶满，按伽马看只是更白一点。PQ（Perceptual Quantizer，SMPTE ST 2084）不是伽马滑块上的一个点。HLG 不在这页。这里没有色调映射配方。'
            : 'Look at the bright window. The slider is that window in nits. 100, 1000, and 4000 are marks, and the curve stays put. From 100 to 1000, PQ view hits the top and gamma view only gets a little whiter. PQ (Perceptual Quantizer, SMPTE ST 2084) is not a point on the gamma slider. HLG is not on this page. There is no tone-map recipe here.')
          : (zh
            ? '看暗部。滑块是次数，2.2 和 2.4 是两个刻度：2.4 更闷，2.2 发灰。sRGB 在接近黑的地方是另一段，不在这根滑块上。'
            : 'Look at the shadows. The slider is a power. 2.2 and 2.4 are two marks: 2.4 goes dull, 2.2 goes gray. sRGB is a different piece near black, and it is not a point on this slider.')}
      </p>
    </Scope>
  )
}

function scene(x: number, y: number, w: number, h: number): [number, number, number] {
  const cx = w * 0.36
  const cy = h * 0.5
  const dx = (x - cx) / 46
  const dy = (y - cy) / 56
  if (dx * dx + dy * dy < 1) return dy < -0.25 ? [0.04, 0.025, 0.02] : [0.22, 0.13, 0.1]
  if (x > w * 0.62 && x < w * 0.9 && y > h * 0.12 && y < h * 0.5) return [0.92, 0.9, 0.82]
  if (y > h * 0.74) return [0.03, 0.025, 0.02]
  return [0.07, 0.06, 0.055]
}

function sdrPixel(linear: [number, number, number], gamma: number, useSrgb: boolean): [number, number, number] {
  return linear.map((v) => {
    if (useSrgb) return srgb(v)
    const code = Math.pow(Math.max(0, v), 1 / 2.4)
    const light = Math.pow(code, gamma)
    return encode(light, 2.2)
  }) as [number, number, number]
}

const NITS_MARKS = [100, 1000, 4000]

function sceneSpot(x: number, y: number, w: number, h: number, windowNits: number): { nits: number; chroma: [number, number, number] } {
  const cx = w * 0.36
  const cy = h * 0.5
  const dx = (x - cx) / 46
  const dy = (y - cy) / 56
  if (dx * dx + dy * dy < 1) return { nits: dy < -0.25 ? 6 : 36, chroma: [1, 0.62, 0.48] }
  if (x > w * 0.62 && x < w * 0.9 && y > h * 0.12 && y < h * 0.5) return { nits: windowNits, chroma: [1, 0.98, 0.9] }
  if (y > h * 0.74) return { nits: 3, chroma: [0.7, 0.55, 0.45] }
  return { nits: 16, chroma: [0.75, 0.72, 0.66] }
}

function pqShow(spot: { nits: number; chroma: [number, number, number] }, asPq: boolean): [number, number, number] {
  const code = pqEncode(spot.nits / 10000)
  if (!asPq) return spot.chroma.map((channel) => Math.round(Math.min(1, channel * code) * 255)) as [number, number, number]
  const light = Math.min(1, (pqDecode(code) * 10000) / 1000)
  return spot.chroma.map((channel) => encode(channel * light, 2.4)) as [number, number, number]
}

function encode(value: number, gamma: number): number {
  return Math.round(Math.pow(Math.max(0, Math.min(1, value)), 1 / gamma) * 255)
}

function srgb(value: number): number {
  const v = Math.max(0, value)
  const encoded = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055
  return Math.round(Math.min(1, encoded) * 255)
}

function pqEncode(l: number): number {
  const m1 = 2610 / 16384
  const m2 = 2523 / 32
  const c1 = 3424 / 4096
  const c2 = 2413 / 128
  const c3 = 2392 / 128
  const lm = Math.pow(Math.max(l, 0), m1)
  return Math.pow((c1 + c2 * lm) / (1 + c3 * lm), m2)
}

function pqDecode(n: number): number {
  const m1 = 2610 / 16384
  const m2 = 2523 / 32
  const c1 = 3424 / 4096
  const c2 = 2413 / 128
  const c3 = 2392 / 128
  const np = Math.pow(Math.max(n, 0), 1 / m2)
  const body = Math.max(0, np - c1) / (c2 - c3 * np)
  return Math.pow(body, 1 / m1)
}
