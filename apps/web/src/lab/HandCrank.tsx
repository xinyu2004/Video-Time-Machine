import { useEffect, useState } from 'react'
import { useLang } from '../i18n'
import { Scope, useReduceMotion } from './Scope'

const SPAN = 4

function shotTimes() {
  const times: number[] = []
  let t = 0.04
  while (t < SPAN) {
    times.push(t)
    t += t < 1.5 ? 0.16 : t < 2.8 ? 0.05 : 0.1
  }
  return times
}

const SHOTS = shotTimes()

export function HandCrank() {
  const lang = useLang()
  const zh = lang === 'zh'
  const reduce = useReduceMotion()
  const [fps, setFps] = useState<16 | 24>(24)
  const [play, setPlay] = useState(!reduce)
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (!play) return
    const id = window.setInterval(() => setFrame((n) => (n + 1) % SHOTS.length), 1000 / fps)
    return () => window.clearInterval(id)
  }, [play, fps])

  const real = SHOTS[frame]
  const gap = frame === 0 ? SHOTS[1] - SHOTS[0] : real - SHOTS[frame - 1]
  const rushed = gap > 0.12
  const dragged = gap < 0.07
  const pose = real / SPAN

  return (
    <Scope
      controls={
        <>
          <button type="button" aria-pressed={play} onClick={() => setPlay((on) => !on)}>
            {play ? (zh ? '暂停' : 'Pause') : (zh ? '放映' : 'Project')}
          </button>
          <button type="button" aria-pressed={fps === 16} onClick={() => setFps(16)}>{zh ? '按 16 格放' : 'Project at 16'}</button>
          <button type="button" aria-pressed={fps === 24} onClick={() => setFps(24)}>{zh ? '按 24 格放' : 'Project at 24'}</button>
        </>
      }
    >
      <svg className="crank" viewBox="0 0 520 168" role="img">
        <rect x="16" y="16" width="200" height="112" fill="#0c0e09" stroke="#445034" />
        <Walker x={28 + pose * 150} />
        <text x="16" y="148" fill="#9aab78">{zh ? '放映着的这一格' : 'The frame on screen'}</text>
        <Track y={28} label={zh ? '拍摄' : 'Shot'} marks={SHOTS.map((t) => t / SPAN)} cursor={pose} />
        <Track y={92} label={zh ? '放映' : 'Show'} marks={SHOTS.map((_, i) => i / SHOTS.length)} cursor={frame / SHOTS.length} even />
      </svg>
      <p className="equation">
        {zh
          ? `这一格拍摄间隔 ${gap.toFixed(2)} 秒，放映间隔 ${(1 / fps).toFixed(3)} 秒。`
          : `This frame was shot ${gap.toFixed(2)} s apart and is shown ${(1 / fps).toFixed(3)} s apart.`}
        {rushed
          ? zh ? ' 摇得慢，格少，按固定格数放就被挤短，人走得快。' : ' A slow crank leaves fewer frames, so a steady projector squeezes the action and the walk looks fast.'
          : dragged
            ? zh ? ' 摇得快，格多，同一段动作被拉长。' : ' A fast crank leaves more frames, so the same action is stretched.'
            : zh ? ' 这一段接近匀速。' : ' This stretch is close to even.'}
        {zh
          ? ` 整段 ${SHOTS.length} 格记下 ${SPAN} 秒。按 ${fps} 格放，放映时长大约 ${(SHOTS.length / fps).toFixed(1)} 秒。`
          : ` ${SHOTS.length} frames record ${SPAN} s. At ${fps} fps the show runs about ${(SHOTS.length / fps).toFixed(1)} s.`}
      </p>
    </Scope>
  )
}

function Walker({ x }: { x: number }) {
  const swing = Math.sin(x * 0.45)
  return (
    <g fill="none" stroke="#e7f6b8" strokeWidth="2" strokeLinecap="round">
      <circle cx={x} cy="46" r="7" />
      <path d={`M${x} 54 L${x} 82`} />
      <path d={`M${x} 64 L${x - 12} ${78 + swing * 6}`} />
      <path d={`M${x} 64 L${x + 12} ${78 - swing * 6}`} />
      <path d={`M${x} 82 L${x - 8} ${104 + swing * 10}`} />
      <path d={`M${x} 82 L${x + 8} ${104 - swing * 10}`} />
    </g>
  )
}

function Track({ y, label, marks, cursor, even }: { y: number; label: string; marks: number[]; cursor: number; even?: boolean }) {
  return (
    <g>
      <text x="240" y={y + 4} fill="#9aab78" fontSize="11">{label}</text>
      <line x1="280" y1={y} x2="500" y2={y} stroke="#445034" />
      {marks.map((t, i) => (
        <line key={i} x1={280 + t * 220} x2={280 + t * 220} y1={y - 8} y2={y + 8} stroke={even ? '#c5d4a4' : '#e7c27a'} />
      ))}
      <circle cx={280 + cursor * 220} cy={y} r="4" fill="#c45c28" />
    </g>
  )
}
