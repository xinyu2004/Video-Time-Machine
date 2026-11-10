import { useId, useState } from 'react'
import { useLang } from '../i18n'
import { Scope } from './Scope'

export function ImaxGauge({ view = 'film' }: { view?: 'film' | 'digital' }) {
  const lang = useLang()
  const zh = lang === 'zh'
  const [mode, setMode] = useState(view)
  const [laser, setLaser] = useState(false)

  return (
    <Scope
      controls={
        <>
          <button type="button" aria-pressed={mode === 'film'} onClick={() => setMode('film')}>{zh ? '胶片' : 'Film'}</button>
          <button type="button" aria-pressed={mode === 'digital'} onClick={() => setMode('digital')}>{zh ? '数字' : 'Digital'}</button>
          {mode === 'digital' ? (
            <button type="button" aria-pressed={laser} onClick={() => setLaser((on) => !on)}>
              {laser ? (zh ? '2015 激光双 4K' : '2015 dual 4K laser') : (zh ? '2008 双 2K' : '2008 dual 2K')}
            </button>
          ) : null}
        </>
      }
    >
      {mode === 'film' ? <FilmPair zh={zh} /> : <DigitalPair zh={zh} laser={laser} />}
    </Scope>
  )
}

const S = 2.3
const PERF = 4.7625 * S
const FADE = 0.6
const STOCK = '#c5d4a4'
const FRAME = '#c6f135'

function FilmPair({ zh }: { zh: boolean }) {
  const uid = useId().replace(/:/g, '')
  const y70 = 52
  const h70 = 70 * S
  const pitch35 = PERF * 4
  const pitch70 = PERF * 15
  const fade35 = pitch35 * FADE
  const fade70 = pitch70 * FADE
  const h35 = pitch35 * 2 + fade35 * 2
  const w35 = 35 * S
  const w70 = pitch70 * 2 + fade70 * 2
  const x35 = 36
  const y35 = y70 + (h70 - h35) / 2
  const x70 = x35 + w35 + 44
  const pic35w = 24.89 * S
  const pic35h = 18.67 * S
  const pic70w = 69.6 * S
  const pic70h = 48.5 * S
  const right = x70 + w70
  const viewW = Math.ceil(right + 78)
  const viewH = Math.ceil(y70 + h70 + 44)

  return (
    <>
      <svg className="gauge" viewBox={`0 0 ${viewW} ${viewH}`} role="img">
        <Strip id={`${uid}a`} x={x35} y={y35} travel="vertical" frames={2} perfs={4} gauge={w35} pitch={pitch35} fade={fade35} picture={{ along: pic35h, across: pic35w }} />
        <HMeasure x={x35} y={y35 - 36} w={w35} label="35 mm" color={STOCK} />
        <HMeasure x={x35 + (w35 - pic35w) / 2} y={y35 - 14} w={pic35w} label="24.9 mm" color={FRAME} />
        <VMeasure x={x35 - 12} y={y35 + fade35 + (pitch35 - pic35h) / 2} h={pic35h} label="18.7 mm" color={FRAME} side="left" />
        <text x={x35 + w35 / 2} y={y70 + h70 + 28} textAnchor="middle" fill={STOCK} fontSize="12">{zh ? '竖走，四齿孔' : 'vertical, 4 perfs'}</text>

        <Strip id={`${uid}b`} x={x70} y={y70} travel="horizontal" frames={2} perfs={15} gauge={h70} pitch={pitch70} fade={fade70} picture={{ along: pic70w, across: pic70h }} />
        <HMeasure x={x70 + fade70 + (pitch70 - pic70w) / 2} y={y70 - 16} w={pic70w} label="69.6 mm" color={FRAME} />
        <VMeasure x={right + 14} y={y70 + (h70 - pic70h) / 2} h={pic70h} label="48.5 mm" color={FRAME} side="right" />
        <VMeasure x={right + 46} y={y70} h={h70} label="70 mm" color={STOCK} side="right" />
        <text x={x70 + w70 / 2} y={y70 + h70 + 28} textAnchor="middle" fill={STOCK} fontSize="12">{zh ? '横走，十五齿孔' : 'horizontal, 15 perfs'}</text>
      </svg>
      <p className="equation">
        {zh
          ? '同一比例尺，标出的是毫米。两端淡下去的是相邻的格子，片子还在继续。片子上没有样点。'
          : 'One scale. The marks are millimetres. The faded ends are the neighboring frames; the film continues. The film has no samples.'}
      </p>
    </>
  )
}

function Strip({
  id, x, y, travel, frames, perfs, gauge, pitch, fade, picture,
}: {
  id: string
  x: number
  y: number
  travel: 'vertical' | 'horizontal'
  frames: number
  perfs: number
  gauge: number
  pitch: number
  fade: number
  picture: { along: number; across: number }
}) {
  const total = pitch * frames + fade * 2
  const vertical = travel === 'vertical'
  const w = vertical ? gauge : total
  const h = vertical ? total : gauge
  const holeAlong = 1.98 * S
  const holeAcross = 2.8 * S
  const edge = 0.9 * S
  const perfPitch = pitch / perfs
  const holes = []
  const pics = []
  for (let frame = -1; frame <= frames; frame += 1) {
    const frameAt = fade + frame * pitch
    for (let i = 0; i < perfs; i += 1) {
      const at = frameAt + i * perfPitch + (perfPitch - holeAlong) / 2
      holes.push(vertical ? (
        <g key={`${frame}-${i}`}>
          <rect x={x + edge} y={y + at} width={holeAcross} height={holeAlong} fill="#12150e" />
          <rect x={x + w - edge - holeAcross} y={y + at} width={holeAcross} height={holeAlong} fill="#12150e" />
        </g>
      ) : (
        <g key={`${frame}-${i}`}>
          <rect x={x + at} y={y + edge} width={holeAlong} height={holeAcross} fill="#12150e" />
          <rect x={x + at} y={y + h - edge - holeAcross} width={holeAlong} height={holeAcross} fill="#12150e" />
        </g>
      ))
    }
    const pad = (pitch - picture.along) / 2
    pics.push(vertical ? (
      <rect key={frame} x={x + (gauge - picture.across) / 2} y={y + frameAt + pad} width={picture.across} height={picture.along} fill="#1c2218" />
    ) : (
      <rect key={frame} x={x + frameAt + pad} y={y + (gauge - picture.across) / 2} width={picture.along} height={picture.across} fill="#1c2218" />
    ))
  }
  const fadeRatio = fade / total
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={x} y1={y} x2={vertical ? x : x + w} y2={vertical ? y + h : y}>
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset={fadeRatio * 0.12} stopColor="#fff" stopOpacity="0.5" />
          <stop offset={fadeRatio * 0.82} stopColor="#fff" stopOpacity="0.5" />
          <stop offset={fadeRatio} stopColor="#fff" stopOpacity="1" />
          <stop offset={1 - fadeRatio} stopColor="#fff" stopOpacity="1" />
          <stop offset={1 - fadeRatio * 0.82} stopColor="#fff" stopOpacity="0.5" />
          <stop offset={1 - fadeRatio * 0.12} stopColor="#fff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={x} y={y} width={w} height={h}>
          <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-g)`} />
        </mask>
        <clipPath id={`${id}-c`}>
          <rect x={x} y={y} width={w} height={h} />
        </clipPath>
      </defs>
      <g mask={`url(#${id}-m)`} clipPath={`url(#${id}-c)`}>
        <rect x={x} y={y} width={w} height={h} fill="#d7c4a1" />
        {holes}
        {pics}
      </g>
    </g>
  )
}

function HMeasure({ x, y, w, label, color }: { x: number; y: number; w: number; label: string; color: string }) {
  return (
    <g>
      <line x1={x} x2={x + w} y1={y} y2={y} stroke={color} />
      <line x1={x} x2={x} y1={y - 3} y2={y + 3} stroke={color} />
      <line x1={x + w} x2={x + w} y1={y - 3} y2={y + 3} stroke={color} />
      <text x={x + w / 2} y={y - 5} textAnchor="middle" fill={color} fontSize="11">{label}</text>
    </g>
  )
}

function VMeasure({ x, y, h, label, color, side }: { x: number; y: number; h: number; label: string; color: string; side: 'left' | 'right' }) {
  const tx = side === 'left' ? x - 9 : x + 9
  return (
    <g>
      <line x1={x} x2={x} y1={y} y2={y + h} stroke={color} />
      <line x1={x - 3} x2={x + 3} y1={y} y2={y} stroke={color} />
      <line x1={x - 3} x2={x + 3} y1={y + h} y2={y + h} stroke={color} />
      <text x={tx} y={y + h / 2} textAnchor="middle" fill={color} fontSize="11" transform={`rotate(-90 ${tx} ${y + h / 2})`}>{label}</text>
    </g>
  )
}

function DigitalPair({ zh, laser }: { zh: boolean; laser: boolean }) {
  const fill = laser
  return (
    <>
      <svg className="gauge" viewBox="0 0 520 200" role="img">
        <rect x="24" y="24" width="150" height="105" fill="#10140c" stroke="#c6f135" />
        <text x="24" y="154" fill="#c6f135" fontSize="12">1.43:1</text>
        <text x="24" y="172" fill="#9aab78" fontSize="11">{zh ? '胶片的整格' : 'the whole film frame'}</text>
        <g>
          <rect x="230" y="24" width="200" height="140" fill="#0c0e09" stroke="#445034" />
          <rect x="230" y={fill ? 24 : 41} width="200" height={fill ? 140 : 105} fill="#1c2218" stroke="#e7c27a" />
          {fill ? <Grid x={230} y={24} w={200} h={140} step={10} /> : <Grid x={230} y={41} w={200} h={105} step={21} />}
        </g>
        <text x="230" y="186" fill="#e7c27a" fontSize="12">{fill ? '1.43:1 · 4K' : '1.90:1 · 2K'}</text>
      </svg>
      <p className="equation">
        {fill
          ? zh
            ? '2015 年的激光巨幕是两台 4K，可以铺满 1.43:1。4K 是放映机的样点，不是胶片的分辨率。'
            : 'The 2015 laser theatre is two 4K projectors and can fill 1.43:1. 4K is the projector’s sample grid, not a resolution of the film.'
          : zh
            ? '2008 年是两台 2K，幕大约 1.90:1，会切掉 1.43:1 的上下。2K 是放映机的样点。'
            : '2008 is two 2K projectors. The screen is about 1.90:1 and crops the top and bottom of 1.43:1. 2K is the projector’s sample grid.'}
      </p>
    </>
  )
}

function Grid({ x, y, w, h, step }: { x: number; y: number; w: number; h: number; step: number }) {
  const lines = []
  for (let px = x; px <= x + w; px += step) lines.push(<line key={`v${px}`} x1={px} x2={px} y1={y} y2={y + h} stroke="#445034" strokeWidth="0.6" />)
  for (let py = y; py <= y + h; py += step) lines.push(<line key={`h${py}`} x1={x} x2={x + w} y1={py} y2={py} stroke="#445034" strokeWidth="0.6" />)
  return <g>{lines}</g>
}
