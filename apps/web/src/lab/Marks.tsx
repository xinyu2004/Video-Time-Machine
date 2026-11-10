import { useEffect, useState } from 'react'
import { Scope, useReduceMotion } from './Scope'
import { useLang } from '../i18n'

const ink = '#c5d4a4'
const amber = '#e6c07a'
const paper = '#141810'
const light = '#d7d2c4'
const dark = '#12140e'

function Caption({ x, y, children }: { x: number | string; y: number | string; children: string }) {
  return (
    <text x={x} y={y} fill={amber} fontSize="15">
      {children}
    </text>
  )
}

const FOCUS = 3
const LINES = 8

function carrierPath(phase: number) {
  const x0 = 168
  const x1 = 332
  const base = 86
  const cycles = 3
  let d = ''
  let mark: { x: number; y: number } | null = null
  for (let i = 0; i <= 72; i += 1) {
    const u = i / 72
    const x = x0 + (x1 - x0) * u
    const wave = Math.sin(u * cycles * Math.PI * 2 + phase)
    const env = Math.exp(-2.1 * u)
    const y = base - 26 * env * wave
    d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
    if (!mark && wave > 0.92 && env > 0.55) mark = { x, y }
  }
  return { d, mark }
}

export function EdgeLeftover() {
  const zh = useLang() === 'zh'
  const [mode, setMode] = useState<'crawl' | 'rainbow'>('crawl')
  const [frame, setFrame] = useState(0)
  const [playing, setPlaying] = useState(!useReduceMotion())
  const crawl = mode === 'crawl'
  const phase = frame * Math.PI
  const carrier = carrierPath(phase + FOCUS * Math.PI)

  useEffect(() => {
    if (!crawl || !playing) return
    const timer = window.setInterval(() => setFrame((n) => (n + 1) % LINES), 700)
    return () => window.clearInterval(timer)
  }, [crawl, playing])

  return (
    <Scope
      controls={
        <>
          <button type="button" aria-pressed={crawl} onClick={() => setMode('crawl')}>{zh ? '点爬' : 'Dot crawl'}</button>
          <button type="button" aria-pressed={!crawl} onClick={() => setMode('rainbow')}>{zh ? '彩虹' : 'Rainbow'}</button>
          {crawl ? (
            <>
              <button type="button" onClick={() => setPlaying((on) => !on)}>{playing ? (zh ? '暂停' : 'Pause') : (zh ? '播放' : 'Play')}</button>
              <button type="button" onClick={() => { setPlaying(false); setFrame((n) => (n + LINES - 1) % LINES) }}>{zh ? '上一帧' : 'Previous'}</button>
              <button type="button" onClick={() => { setPlaying(false); setFrame((n) => (n + 1) % LINES) }}>{zh ? '下一帧' : 'Next'}</button>
            </>
          ) : null}
        </>
      }
    >
      <svg viewBox="0 0 720 230" role="img" aria-label={zh ? '一行电压和拆剩的样子' : 'One line of voltage and what the split leaves'}>
        <rect width="720" height="230" fill={dark} />
        <Caption x={16} y={28}>{zh ? '这一行的电压' : 'This line’s voltage'}</Caption>
        <Caption x={372} y={28}>{zh ? '拆剩的样子' : 'What the split leaves'}</Caption>
        <rect x="16" y="40" width="340" height="176" fill={paper} />
        <rect x="372" y="40" width="332" height="176" fill={paper} />
        {crawl ? (
          <>
            <path d="M40 150 H156 V86 H332" fill="none" stroke={light} strokeWidth="3" />
            <path d={carrier.d} fill="none" stroke={amber} strokeWidth="2.5" />
            {carrier.mark ? <circle cx={carrier.mark.x} cy={carrier.mark.y} r="5" fill={Math.sin(phase + FOCUS * Math.PI) > 0 ? '#e23b3b' : '#3c74e6'} /> : null}
            {Array.from({ length: LINES }, (_, i) => {
              const y = 52 + i * 20
              const positive = Math.sin(phase + i * Math.PI) > 0
              const on = i === FOCUS
              return (
                <g key={i}>
                  <rect x="388" y={y} width="150" height="16" fill={light} stroke={on ? amber : 'none'} strokeWidth="2" />
                  <rect x="538" y={y} width="150" height="16" fill="#1c2116" />
                  <circle cx={positive ? 552 : 570} cy={y + 8} r={on ? 5.5 : 4} fill={positive ? '#e23b3b' : '#3c74e6'} />
                </g>
              )
            })}
          </>
        ) : (
          <>
            {Array.from({ length: 16 }, (_, i) => (
              <rect key={i} x={40 + i * 18} y={i % 2 ? 78 : 118} width="14" height="40" fill={i % 2 ? light : '#2a3122'} />
            ))}
            {Array.from({ length: 16 }, (_, i) => (
              <rect key={i} x={388 + i * 19} y="58" width="16" height="140" fill={['#e23b3b', '#e6c07a', '#c6f135', '#3c74e6'][i % 4]} opacity="0.9" />
            ))}
          </>
        )}
      </svg>
      <p className="equation">
        {zh ? '左是这一行的电压，右是拆剩的样子。' : 'The left side is this line’s voltage. The right side is what the split leaves.'}
        {crawl
          ? (zh ? ' 边没有动。相位走一帧，点子才爬。亮框是左边画出的那一行。' : ' The edge stays put. The dots crawl when the phase steps one frame. The lit row is the line drawn on the left.')
          : (zh ? ' 细条纹本来是亮度，没有另加色度。解码器把它读成颜色。这一态不爬。' : ' The fine stripes are luma. No chroma was added. The decoder reads them as color. This state does not crawl.')}
      </p>
    </Scope>
  )
}

export function HanoverBars() {
  const zh = useLang() === 'zh'
  return (
    <Scope>
      <svg viewBox="0 0 640 96" role="img" aria-label={zh ? '汉诺威条' : 'Hanover bars'}>
        <rect width="640" height="96" fill={dark} />
        {Array.from({ length: 14 }, (_, i) => (
          <rect key={i} x="16" y={12 + i * 4} width="608" height="3" fill={i % 2 ? '#3c74e6' : '#e23b3b'} />
        ))}
        <Caption x={16} y={82}>{zh ? '汉诺威条：相邻行色相相反，停在原处' : 'Hanover bars: adjacent lines take opposite hues and stay put'}</Caption>
      </svg>
    </Scope>
  )
}

export function ChromaEdge({ view }: { view: 'still' | 'motion' }) {
  const zh = useLang() === 'zh'
  const still = view === 'still'
  return (
    <Scope>
      <svg viewBox="0 0 640 200" role="img" aria-label={still ? (zh ? '静止竖边上的色边' : 'A fringe on a still edge') : (zh ? '运动处错开的色度' : 'Chroma offset where the picture moved')}>
        <rect width="640" height="200" fill={dark} />
        {still ? (
          <>
            <rect x="180" y="24" width="120" height="130" fill={light} />
            <rect x="300" y="24" width="14" height="130" fill="#e23b3b" />
            <rect x="314" y="24" width="8" height="130" fill="#3c74e6" />
            <Caption x="24" y="184">{zh ? '静止的竖边就有这条色边' : 'The fringe is there on a still edge'}</Caption>
          </>
        ) : (
          <>
            {Array.from({ length: 16 }, (_, i) => {
              const shift = i % 2 ? 28 : 0
              return (
                <g key={i}>
                  <rect x={160 + shift} y={20 + i * 8} width="140" height="7" fill={light} />
                  <rect x={300 + shift} y={20 + i * 8} width="16" height="7" fill={i % 2 ? '#e23b3b' : '#3c74e6'} />
                </g>
              )
            })}
            <Caption x="24" y="184">{zh ? '只在运动处，彩色边和亮度边错开' : 'Only where it moved: color and luma edges split'}</Caption>
          </>
        )}
      </svg>
    </Scope>
  )
}

export function FrameBars() {
  const zh = useLang() === 'zh'
  return (
    <Scope>
      <svg viewBox="0 0 640 220" role="img" aria-label={zh ? '黑带写在画面样点里' : 'Black bars stored in the picture samples'}>
        <rect width="640" height="220" fill={dark} />
        <rect x="80" y="16" width="480" height="160" fill="#070806" stroke="#667356" />
        <rect x="80" y="52" width="480" height="88" fill="#c4b48a" />
        <Caption x="80" y="204">{zh ? '黑带和画面在同一幅样点里。窗口拉大，带的行数不变。' : 'Same samples. Resizing the window does not change the line count.'}</Caption>
      </svg>
    </Scope>
  )
}

export function PixelShape() {
  const zh = useLang() === 'zh'
  return (
    <Scope>
      <svg viewBox="0 0 680 230" role="img" aria-label={zh ? '样点里的椭圆，和播放器另垫的黑边' : 'An ellipse in the samples, and bars the player adds'}>
        <rect width="680" height="230" fill={dark} />
        <rect x="24" y="16" width="200" height="150" fill={paper} stroke="#667356" />
        <ellipse cx="124" cy="91" rx="36" ry="58" fill="none" stroke={light} strokeWidth="3" />
        <Caption x="24" y="190">{zh ? '样点网格里，圆被拉高' : 'In the sample grid the circle is tall'}</Caption>
        <rect x="280" y="8" width="360" height="168" fill="#070806" stroke="#8a7d6d" />
        <rect x="340" y="28" width="240" height="128" fill={paper} />
        <circle cx="460" cy="92" r="40" fill="none" stroke={light} strokeWidth="3" />
        <Caption x="280" y="204">{zh ? '播放器把圆放正，黑边垫在窗口上，不在样点里' : 'The circle stays round. Bars are in the window.'}</Caption>
      </svg>
    </Scope>
  )
}

export function BandRamp() {
  const zh = useLang() === 'zh'
  const steps = 10
  return (
    <Scope>
      <svg viewBox="0 0 640 180" role="img" aria-label={zh ? '渐变上的台阶' : 'Steps on a ramp'}>
        <rect width="640" height="180" fill={dark} />
        {Array.from({ length: steps }, (_, i) => {
          const v = 28 + i * 18
          return <rect key={i} x={24 + i * 58} y="20" width="58" height="110" fill={`rgb(${v},${v},${v + 6})`} />
        })}
        <Caption x="24" y="160">{zh ? '渐变被收成能数得清的台阶，不是方块' : 'The ramp is a countable set of steps, not blocks'}</Caption>
      </svg>
    </Scope>
  )
}

export function CodecMarks() {
  const zh = useLang() === 'zh'
  return (
    <Scope>
      <svg viewBox="0 0 720 230" role="img" aria-label={zh ? '方块、蚊噪、振铃，以及点爬不是蚊噪' : 'Blocks, mosquitoes, ringing, and crawl is not mosquitoes'}>
        <rect width="720" height="230" fill={dark} />
        <g>
          {Array.from({ length: 16 }, (_, i) => {
            const col = i % 4
            const row = Math.floor(i / 4)
            const v = 40 + ((col + row) % 3) * 18
            return <rect key={i} x={24 + col * 36} y={20 + row * 28} width="34" height="26" fill={`rgb(${v},${v - 4},${v - 8})`} />
          })}
          <Caption x="24" y="160">{zh ? '方块' : 'Blocks'}</Caption>
        </g>
        <g>
          <rect x="200" y="20" width="70" height="120" fill={light} />
          <rect x="270" y="20" width="90" height="120" fill={paper} />
          {[40, 62, 88, 110].map((y) => (
            <circle key={y} cx={278} cy={y} r="3" fill="#9aab78" />
          ))}
          <Caption x="200" y="160">{zh ? '蚊噪' : 'Mosquitoes'}</Caption>
        </g>
        <g>
          <rect x="400" y="20" width="80" height="120" fill={light} />
          <rect x="480" y="20" width="8" height="120" fill="#f4efe6" />
          <rect x="488" y="20" width="10" height="120" fill="#2a2418" />
          <rect x="498" y="20" width="70" height="120" fill={paper} />
          <Caption x="400" y="160">{zh ? '振铃' : 'Ringing'}</Caption>
        </g>
        <g>
          <rect x="600" y="36" width="8" height="88" fill={light} />
          {[48, 70, 92].map((y, i) => (
            <circle key={y} cx="616" cy={y} r="5" fill={i % 2 ? '#3c74e6' : '#e23b3b'} />
          ))}
          <Caption x="560" y="160">{zh ? '点爬' : 'Crawl'}</Caption>
        </g>
        <text x="24" y="208" fill={ink} fontSize="15">
          {zh ? '蚊噪是灰点。点爬是沿着边爬的彩色点。这张图只用于辨认，不是修好压缩。' : 'Gray specks are mosquitoes. Colored dots on an edge are crawl. Recognition only.'}
        </text>
      </svg>
    </Scope>
  )
}
