import { useEffect, useId, useState } from 'react'
import { useLang } from '../i18n'
import { Scope, useReduceMotion } from './Scope'

const PX = 4.4
const STRIP_W = 35 * PX
const STRIP_X = 96
const FRAME_MM = 19.05
const PERF_MM = FRAME_MM / 4
const HOLE_ALONG_MM = 1.98
const HOLE_ACROSS_MM = 2.8
const SILENT_H_MM = 18.67
const ACADEMY_H_MM = 16.03

const STEPS = [
  { zh: '宽卷大约 70 毫米。', en: 'A roll about 70mm wide.' },
  { zh: '从中切开，得到两条 35 毫米。', en: 'Slit down the middle into two 35mm strips.' },
  { zh: '两边打孔。上下是两格的长度，中间剩下的是画面的宽。', en: 'Holes on both edges. Two frames show the length. The middle is the picture width.' },
  { zh: '一格四个齿孔。一个孔大约 2.0 × 2.8 毫米，两孔之间 2.76 毫米，齿距 4.76 毫米，四个齿距是 19 毫米。画面高 18.7 毫米落在这 19 里面，一条缝大约 0.4 毫米。', en: 'One frame is four perforations. A hole is about 2.0 × 2.8 mm, the space between holes is 2.76 mm, the pitch is 4.76 mm, and four pitches are 19 mm. The picture is 18.7 mm high inside that, and one gap is about 0.4 mm.' },
  { zh: '声带占掉画面旁边的一条，高度和这一格的画面相同。', en: 'The soundtrack takes a strip beside the picture, and it is the same height as that frame.' },
  { zh: '学院片窗大约 1.37:1。19 毫米没有变，画面从 18.7 毫米换成 16 毫米，这一条缝从 0.4 毫米变成大约 3 毫米。声带仍和画面一样高。', en: 'The Academy aperture is about 1.37:1. The 19 mm stays. The picture changes from 18.7 mm to 16 mm, so that one gap changes from 0.4 mm to about 3 mm. The track still matches the picture.' },
]

export function FilmGate() {
  const lang = useLang()
  const zh = lang === 'zh'
  const reduce = useReduceMotion()
  const [step, setStep] = useState(0)
  const [play, setPlay] = useState(!reduce)

  useEffect(() => {
    if (!play) return
    const id = window.setInterval(() => setStep((n) => (n + 1) % STEPS.length), 1400)
    return () => window.clearInterval(id)
  }, [play])

  const frame = step >= 3
  const sound = step >= 4
  const academy = step >= 5

  return (
    <Scope
      controls={
        <>
          <button type="button" aria-pressed={play} onClick={() => setPlay((on) => !on)}>
            {play ? (zh ? '暂停' : 'Pause') : (zh ? '播放' : 'Play')}
          </button>
          <button type="button" onClick={() => { setPlay(false); setStep((n) => (n + STEPS.length - 1) % STEPS.length) }}>
            {zh ? '上一步' : 'Back'}
          </button>
          <button type="button" onClick={() => { setPlay(false); setStep((n) => (n + 1) % STEPS.length) }}>
            {zh ? '下一步' : 'Next'}
          </button>
        </>
      }
    >
      <svg className="film-gate" viewBox="0 0 520 340" role="img">
        {step < 2 ? (
          <Roll cut={step === 1} />
        ) : (
          <Strip frame={frame} sound={sound} academy={academy} zh={zh} />
        )}
      </svg>
      <p className="equation">{zh ? STEPS[step].zh : STEPS[step].en}</p>
    </Scope>
  )
}

function measure(x: number, w: number, y: number, label: string) {
  return (
    <g>
      <line x1={x} x2={x + w} y1={y} y2={y} stroke="#c5d4a4" />
      <text x={x + w / 2} y={y - 4} textAnchor="middle" fill="#c5d4a4" fontSize="12">{label}</text>
    </g>
  )
}

function Roll({ cut }: { cut: boolean }) {
  const x = STRIP_X
  const y = 96
  const h = 64
  return (
    <g>
      <rect x={x} y={y} width={STRIP_W * 2} height={h} fill="#d7c4a1" />
      {cut ? <line x1={x + STRIP_W} x2={x + STRIP_W} y1={y} y2={y + h} stroke="#241c14" strokeWidth="2" strokeDasharray="4 3" /> : null}
      {cut ? (
        <>
          {measure(x, STRIP_W, y - 14, '35 mm')}
          {measure(x + STRIP_W, STRIP_W, y - 14, '35 mm')}
        </>
      ) : measure(x, STRIP_W * 2, y - 14, '70 mm')}
    </g>
  )
}

function Strip({ frame, sound, academy, zh }: { frame: boolean; sound: boolean; academy: boolean; zh: boolean }) {
  const uid = useId().replace(/:/g, '')
  const s = PX
  const filmW = STRIP_W
  const pitch = FRAME_MM * s
  const fade = pitch * 0.5
  const silentH = SILENT_H_MM * s
  const silentW = 24.89 * s
  const trackW = 2.54 * s
  const picH = academy ? ACADEMY_H_MM * s : silentH
  const picW = academy ? 22.05 * s : sound ? silentW - trackW : silentW
  const x0 = STRIP_X
  const filmTop = 30
  const filmH = pitch * 2 + fade * 2
  const holeW = HOLE_ACROSS_MM * s
  const holeH = HOLE_ALONG_MM * s
  const leftHole = x0 + 4
  const rightHole = x0 + filmW - 4 - holeW
  const innerL = leftHole + holeW + 3
  const innerR = rightHole - 3
  const innerW = innerR - innerL
  const groupW = (sound ? trackW : 0) + picW
  const groupX = innerL + (innerW - groupW) / 2
  const trackX = groupX
  const picX = sound ? groupX + trackW : groupX
  const perfPitch = pitch / 4
  const frames = [0, 1].map((i) => {
    const top = filmTop + fade + i * pitch
    return { top, picY: top + (pitch - picH) / 2 }
  })
  const holes = []
  const pics = []
  for (let i = -1; i <= 2; i += 1) {
    const top = filmTop + fade + i * pitch
    for (let p = 0; p < 4; p += 1) {
      const y = top + p * perfPitch + (perfPitch - holeH) / 2
      holes.push(
        <g key={`${i}-${p}`} fill="#12150e">
          <rect x={leftHole} y={y} width={holeW} height={holeH} />
          <rect x={rightHole} y={y} width={holeW} height={holeH} />
        </g>,
      )
    }
    if (frame) {
      const picY = top + (pitch - picH) / 2
      pics.push(
        <g key={i}>
          {sound ? <rect x={trackX} y={picY} width={trackW} height={picH} fill="#6a5340" /> : null}
          <rect x={picX} y={picY} width={picW} height={picH} fill="#1c2218" />
        </g>,
      )
    }
  }
  const fadeRatio = fade / filmH

  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-g`} gradientUnits="userSpaceOnUse" x1={x0} y1={filmTop} x2={x0} y2={filmTop + filmH}>
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset={fadeRatio * 0.08} stopColor="#fff" stopOpacity="0.38" />
          <stop offset={fadeRatio * 0.88} stopColor="#fff" stopOpacity="0.38" />
          <stop offset={fadeRatio} stopColor="#fff" stopOpacity="1" />
          <stop offset={1 - fadeRatio} stopColor="#fff" stopOpacity="1" />
          <stop offset={1 - fadeRatio * 0.88} stopColor="#fff" stopOpacity="0.38" />
          <stop offset={1 - fadeRatio * 0.08} stopColor="#fff" stopOpacity="0.38" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${uid}-m`} maskUnits="userSpaceOnUse" x={x0} y={filmTop} width={filmW} height={filmH}>
          <rect x={x0} y={filmTop} width={filmW} height={filmH} fill={`url(#${uid}-g)`} />
        </mask>
        <clipPath id={`${uid}-c`}>
          <rect x={x0} y={filmTop} width={filmW} height={filmH} />
        </clipPath>
      </defs>
      {measure(x0, filmW, 22, '35 mm')}
      <g mask={`url(#${uid}-m)`} clipPath={`url(#${uid}-c)`}>
        <rect x={x0} y={filmTop} width={filmW} height={filmH} fill="#d7c4a1" />
        {holes}
        {pics}
      </g>
      {frame ? null : (
        <line x1={picX} x2={picX + silentW} y1={frames[0].top + pitch / 2} y2={frames[0].top + pitch / 2} stroke="#c6f135" />
      )}
      <text x={picX + (frame ? picW : silentW) / 2} y={frame ? frames[0].picY + 18 : frames[0].top + pitch / 2 - 6} textAnchor="middle" fill="#c6f135" fontSize="12">
        {!sound ? '24.9 mm' : academy ? '22 mm' : ''}
      </text>
      {frame ? (
        <>
          <Along x={x0 - 18} y1={frames[0].picY} y2={frames[0].picY + picH} label={academy ? '16 mm' : '18.7 mm'} color="#c6f135" />
          <Along x={x0 - 46} y1={frames[0].top} y2={frames[0].top + pitch} label="19 mm" color="#e7c27a" />
          <Brace x={x0 + filmW + 12} y1={frames[0].top} y2={frames[0].top + pitch} color="#e7c27a" />
          <Loupe x={x0 + filmW + 72} y={frames[0].top + pitch / 2} zh={zh} academy={academy} sound={sound} />
        </>
      ) : null}
    </g>
  )
}

function Along({ x, y1, y2, label, color, size = 11 }: { x: number; y1: number; y2: number; label: string; color: string; size?: number }) {
  const y = (y1 + y2) / 2
  const tx = x - 6
  return (
    <g fill={color}>
      <g stroke={color}>
        <line x1={x} x2={x} y1={y1} y2={y2} />
        <line x1={x - 3} x2={x + 3} y1={y1} y2={y1} />
        <line x1={x - 3} x2={x + 3} y1={y2} y2={y2} />
      </g>
      <text x={tx} y={y} textAnchor="middle" fontSize={size} transform={`rotate(-90 ${tx} ${y})`}>{label}</text>
    </g>
  )
}

function Brace({ x, y1, y2, color }: { x: number; y1: number; y2: number; color: string }) {
  const mid = (y1 + y2) / 2
  const w = 14
  return (
    <path
      d={`M ${x} ${y1} Q ${x + w * 0.6} ${y1} ${x + w * 0.6} ${y1 + (mid - y1) * 0.42} Q ${x + w * 0.6} ${mid} ${x + w} ${mid} Q ${x + w * 0.6} ${mid} ${x + w * 0.6} ${y2 - (y2 - mid) * 0.42} Q ${x + w * 0.6} ${y2} ${x} ${y2}`}
      fill="none"
      stroke={color}
      strokeWidth="1.25"
    />
  )
}

function Loupe({ x, y, zh, academy, sound }: { x: number; y: number; zh: boolean; academy: boolean; sound: boolean }) {
  const k = 8.2
  const frame = FRAME_MM * k
  const perf = PERF_MM * k
  const holeL = HOLE_ALONG_MM * k
  const holeW = HOLE_ACROSS_MM * k
  const picH = (academy ? ACADEMY_H_MM : SILENT_H_MM) * k
  const trackW = sound ? 2.54 * k : 0
  const frameY = y - frame / 2
  const holeX = x + 56
  const trackX = holeX + holeW + 6
  const picX = trackX + trackW
  const picW = 26
  const filmX = holeX - 5
  const filmW = picX + picW + 5 - filmX
  const h0 = frameY + (perf - holeL) / 2
  const box = { x: x - 6, y: frameY - 22, w: filmX + filmW + 12 - (x - 6), h: frame + 32 }
  return (
    <g>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="#0c0e09" stroke="#445034" />
      <text x={box.x + box.w - 6} y={box.y + 14} textAnchor="end" fill="#c5d4a4" fontSize="11">{zh ? '放大' : 'larger'}</text>
      <line x1={holeX} x2={holeX} y1={h0} y2={box.y + 18} stroke="#c5d4a4" />
      <line x1={holeX + holeW} x2={holeX + holeW} y1={h0} y2={box.y + 18} stroke="#c5d4a4" />
      <line x1={holeX} x2={holeX + holeW} y1={box.y + 18} y2={box.y + 18} stroke="#c5d4a4" />
      <text x={holeX + holeW / 2} y={box.y + 14} textAnchor="middle" fill="#c5d4a4" fontSize="10">2.8</text>
      <rect x={filmX} y={frameY} width={filmW} height={frame} fill="#d7c4a1" />
      {Array.from({ length: 4 }, (_, i) => (
        <rect key={i} x={holeX} y={h0 + i * perf} width={holeW} height={holeL} fill="#12150e" />
      ))}
      {sound ? <rect x={trackX} y={frameY + (frame - picH) / 2} width={trackW} height={picH} fill="#6a5340" /> : null}
      <rect x={picX} y={frameY + (frame - picH) / 2} width={picW} height={picH} fill="#1c2218" />
      <Along x={holeX - 14} y1={h0} y2={h0 + holeL} label="2.0" color="#c5d4a4" size={9} />
      <Along x={holeX - 14} y1={h0 + holeL} y2={h0 + perf} label="2.76" color="#c5d4a4" size={9} />
      <Along x={holeX - 34} y1={h0} y2={h0 + perf} label="4.76" color="#c6f135" size={10} />
    </g>
  )
}
