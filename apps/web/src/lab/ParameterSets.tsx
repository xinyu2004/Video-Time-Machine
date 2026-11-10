import { useEffect, useRef, useState } from 'react'
import { useLang } from '../i18n'
import { Scope, useReduceMotion } from './Scope'

type Codec = 'mpeg2' | 'h264' | 'h265'
type Phase = 'flow' | 'drop' | 'ask' | 'resend' | 'on'

const CODEC: { id: Codec; zh: string; en: string }[] = [
  { id: 'mpeg2', zh: 'MPEG-2', en: 'MPEG-2' },
  { id: 'h264', zh: 'H.264', en: 'H.264' },
  { id: 'h265', zh: 'H.265', en: 'H.265' },
]

const PHASES: Phase[] = ['flow', 'drop', 'ask', 'resend', 'on']
const DUR: Record<Phase, number> = { flow: 4200, drop: 2600, ask: 2600, resend: 3000, on: 2400 }
const GAP = 0.22

const X0 = 148
const X1 = 568
const WIRE = 108
const BACK = 168
const GAP_L = 338
const GAP_R = 392

export function ParameterSets() {
  const lang = useLang()
  const zh = lang === 'zh'
  const reduce = useReduceMotion()
  const [codec, setCodec] = useState<Codec>('h264')
  const [playing, setPlaying] = useState(!reduce)
  const [over, setOver] = useState(false)
  const [tick, setTick] = useState(0)
  const clock = useRef<{ phase: Phase; t: number }>({ phase: 'flow', t: DUR.flow * 0.42 })

  useEffect(() => {
    if (!playing || over) return
    if (reduce) {
      const id = window.setInterval(() => {
        const i = PHASES.indexOf(clock.current.phase)
        const phase = PHASES[(i + 1) % PHASES.length]
        clock.current = { phase, t: DUR[phase] * 0.62 }
        setTick((n) => n + 1)
      }, 1600)
      return () => window.clearInterval(id)
    }
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(40, now - last)
      last = now
      let { phase, t } = clock.current
      t += dt
      if (t >= DUR[phase]) {
        phase = PHASES[(PHASES.indexOf(phase) + 1) % PHASES.length]
        t = 0
      }
      clock.current = { phase, t }
      setTick((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [over, playing, reduce])

  const step = (dir: number) => {
    setPlaying(false)
    setOver(false)
    const i = PHASES.indexOf(clock.current.phase)
    const phase = PHASES[(i + dir + PHASES.length) % PHASES.length]
    clock.current = { phase, t: DUR[phase] * 0.62 }
    setTick((n) => n + 1)
  }

  const phase = clock.current.phase
  const u = over ? 0.5 : clock.current.t / DUR[phase]
  const shown = over ? 'flow' : phase
  const cap = caption(codec, shown, over, zh)

  return (
    <Scope
      controls={
        <>
          {CODEC.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={codec === item.id && !over}
              onClick={() => {
                clock.current = { phase: 'flow', t: DUR.flow * 0.42 }
                setCodec(item.id)
                setOver(false)
                setTick((n) => n + 1)
              }}
            >
              {zh ? item.zh : item.en}
            </button>
          ))}
          <button type="button" onClick={() => setPlaying((on) => !on)}>{playing && !over ? (zh ? '暂停' : 'Pause') : (zh ? '播放' : 'Play')}</button>
          <button type="button" onClick={() => step(-1)}>{zh ? '上一步' : 'Back'}</button>
          <button type="button" onClick={() => step(1)}>{zh ? '下一步' : 'Next'}</button>
          <button type="button" aria-pressed={over} onClick={() => { setOver((on) => !on); setPlaying(false) }}>
            {zh ? '超出 profile / level' : 'Profile / level too high'}
          </button>
        </>
      }
    >
      <Wire codec={codec} phase={shown} u={u} over={over} zh={zh} label={cap} stamp={tick} />
      <p className="equation">{cap}</p>
    </Scope>
  )
}

function stream(codec: Codec): string[] {
  const slices = ['SLICE', 'SLICE', 'SLICE', 'SLICE']
  if (codec === 'mpeg2') return ['SEQ', ...slices]
  if (codec === 'h265') return ['VPS', 'SPS', ...slices]
  return ['SPS', 'PPS', ...slices]
}

function resume(codec: Codec): string[] {
  if (codec === 'mpeg2') return ['SEQ', 'SLICE', 'SLICE', 'SLICE', 'SLICE']
  if (codec === 'h265') return ['VPS', 'SPS', 'SLICE', 'SLICE', 'SLICE']
  return ['SPS', 'PPS', 'SLICE', 'SLICE', 'SLICE']
}

function askFor(codec: Codec): string | null {
  if (codec === 'mpeg2') return null
  if (codec === 'h265') return 'VPS SPS'
  return 'SPS PPS'
}

type Pkt = { label: string; x: number; y: number; fade: number; back?: boolean }

function Wire({ codec, phase, u, over, zh, label, stamp }: { codec: Codec; phase: Phase; u: number; over: boolean; zh: boolean; label: string; stamp: number }) {
  const broken = phase === 'drop' || phase === 'ask'
  const packets = layout(codec, phase, u)
  const lit = picture(codec, phase, u, over)
  return (
    <svg className="nodes" viewBox="0 0 720 248" role="img" aria-label={label} data-tick={stamp}>
      <rect className="node" x="16" y="68" width="116" height="80" />
      <text className="node-name" x="74" y="112" textAnchor="middle" dominantBaseline="central">{zh ? '发送端' : 'Sender'}</text>
      <rect className="node" x="588" y="28" width="116" height="192" />
      <text className="node-name" x="646" y="52" textAnchor="middle" dominantBaseline="central">{zh ? '接收端' : 'Client'}</text>
      {codec === 'h265' ? (
        <>
          <Screen x={602} y={68} w={88} h={64} on={lit === 'both'} text={zh ? '大' : 'Large'} />
          <Screen x={616} y={146} w={60} h={46} on={lit === 'both' || lit === 'small'} text={zh ? '小' : 'Small'} />
        </>
      ) : (
        <Screen x={602} y={78} w={88} h={96} on={lit === 'on'} text="" />
      )}
      {broken ? (
        <>
          <line className="wire" x1={X0} y1={WIRE} x2={GAP_L} y2={WIRE} />
          <line className="wire gap-end" x1={GAP_L} y1={WIRE - 10} x2={GAP_L} y2={WIRE + 10} />
          <line className="wire gap-end" x1={GAP_R} y1={WIRE - 10} x2={GAP_R} y2={WIRE + 10} />
          <line className="wire" x1={GAP_R} y1={WIRE} x2={X1} y2={WIRE} />
        </>
      ) : (
        <line className="wire" x1={X0} y1={WIRE} x2={X1} y2={WIRE} />
      )}
      {phase === 'ask' ? <line className="wire faint" x1={X0} y1={BACK} x2={X1} y2={BACK} /> : null}
      {packets.map((pkt, index) => (
        <Packet key={`${pkt.label}-${index}-${Math.round(pkt.x)}`} pkt={pkt} />
      ))}
    </svg>
  )
}

function Screen({ x, y, w, h, on, text }: { x: number; y: number; w: number; h: number; on: boolean; text: string }) {
  return (
    <g className={on ? 'scr on' : 'scr'}>
      <rect x={x} y={y} width={w} height={h} />
      {text ? <text x={x + w / 2} y={y + h / 2} textAnchor="middle" dominantBaseline="central">{text}</text> : null}
    </g>
  )
}

function Packet({ pkt }: { pkt: Pkt }) {
  const w = Math.max(48, pkt.label.length * 8 + 16)
  const h = 28
  const x = pkt.x - w / 2
  const y = pkt.y - h / 2
  return (
    <g className={pkt.back ? 'pkt back' : pkt.label === 'SLICE' ? 'pkt slice' : 'pkt'} opacity={pkt.fade}>
      {pkt.back ? <polygon points={`${x - 9},${pkt.y} ${x},${pkt.y - 7} ${x},${pkt.y + 7}`} /> : null}
      <rect x={x} y={y} width={w} height={h} />
      <text x={pkt.x} y={pkt.y} textAnchor="middle" dominantBaseline="central">{pkt.label}</text>
    </g>
  )
}

function picture(codec: Codec, phase: Phase, u: number, over: boolean): 'on' | 'off' | 'both' | 'small' {
  if (over) return 'off'
  if (phase === 'flow') return codec === 'h265' ? 'both' : 'on'
  if (phase === 'on' && sliceArrived(codec, u)) return codec === 'h265' ? 'small' : 'on'
  return 'off'
}

function onTravel(u: number): number {
  return 1.23 + u * 0.38
}

function sliceArrived(codec: Codec, u: number): boolean {
  const index = resume(codec).indexOf('SLICE')
  return onTravel(u) - index * GAP >= 1
}

function layout(codec: Codec, phase: Phase, u: number): Pkt[] {
  if (phase === 'flow') {
    const seq = stream(codec)
    const at = 0.86 + seq.length * GAP
    return convey(seq, at - 0.62 * 2.2 + u * 2.2, GAP, false, 0.92)
  }
  if (phase === 'drop' || phase === 'ask') {
    const travel = phase === 'drop' ? 1 + u * 1.5 : 2.5 + u * 1.3
    const packets = convey(['SLICE'], travel, GAP, true, 1)
    const label = phase === 'ask' ? askFor(codec) : null
    if (label) packets.push({ label, x: X1 - u * (X1 - X0), y: BACK, fade: 1, back: true })
    return packets
  }
  const travel = phase === 'resend' ? 0.28 + u * 0.95 : onTravel(u)
  return burst(resume(codec), travel, GAP)
}

function convey(seq: string[], travel: number, spacing: number, broken: boolean, limit: number): Pkt[] {
  const out: Pkt[] = []
  const first = Math.max(0, Math.floor((travel - limit) / spacing) - 1)
  const last = Math.ceil(travel / spacing) + 1
  for (let n = first; n <= last; n++) {
    const placed = forward(travel - n * spacing, broken, limit)
    if (!placed) continue
    out.push({ label: seq[n % seq.length], x: placed.x, y: WIRE, fade: placed.fade })
  }
  return out
}

function burst(seq: string[], travel: number, spacing: number): Pkt[] {
  const out: Pkt[] = []
  let parked = false
  seq.forEach((label, i) => {
    const progress = travel - i * spacing
    if (progress < 0) return
    if (progress >= 1) {
      if (label === 'SLICE' && !parked && progress < 1.12) {
        out.push({ label, x: X1, y: WIRE, fade: 1 })
        parked = true
      }
      return
    }
    out.push({ label, x: X0 + progress * (X1 - X0), y: WIRE, fade: 1 })
  })
  return out
}

function forward(progress: number, broken: boolean, limit: number): { x: number; fade: number } | null {
  if (progress < 0 || progress > limit) return null
  const x = X0 + progress * (X1 - X0)
  if (!broken || x < GAP_L) return { x, fade: 1 }
  const past = x - GAP_L
  if (past > 36) return null
  return { x: GAP_L - 4, fade: 1 - past / 36 }
}

function caption(codec: Codec, phase: Phase, over: boolean, zh: boolean): string {
  if (over) {
    return zh
      ? '头是齐的，SPS、PPS、SLICE 都到了。profile 或 level 超出这台解码器，画面仍不亮。'
      : 'The headers are complete: SPS, PPS, and SLICE all arrive. Above this decoder’s profile or level, the picture stays dark.'
  }
  if (phase === 'flow') {
    if (codec === 'h265') return zh ? '一套 VPS、SPS 后面跟着多幅 SLICE，两层都亮。' : 'One VPS and one SPS, then several SLICEs. Both layers stay lit.'
    if (codec === 'mpeg2') return zh ? '一个 sequence header 后面跟着多幅 SLICE，画面亮着。' : 'One sequence header, then several SLICEs. The picture stays lit.'
    return zh ? '一套 SPS、PPS 后面跟着多幅 SLICE，画面亮着。' : 'One SPS and one PPS, then several SLICEs. The picture stays lit.'
  }
  if (phase === 'drop') {
    return zh ? '发送没有停。SLICE 还在往外走，断口过不去，画面不亮。' : 'Sending does not stop. SLICEs keep leaving, they do not cross the break, and the picture stays dark.'
  }
  if (phase === 'ask') {
    if (codec === 'mpeg2') return zh ? '没有请求送回去。SLICE 仍在发，过不了断口。' : 'Nothing is sent back. SLICEs are still going out, and they still cannot cross.'
    if (codec === 'h265') return zh ? '接收端要 VPS 和底层 SPS。SLICE 仍在发，过不了断口。' : 'The client asks for the VPS and the base SPS. SLICEs are still going out, and they still cannot cross.'
    return zh ? '接收端要 SPS 和 PPS。SLICE 仍在发，过不了断口。' : 'The client asks for the SPS and the PPS. SLICEs are still going out, and they still cannot cross.'
  }
  if (phase === 'resend') {
    if (codec === 'mpeg2') return zh ? '没有人重发。流里自己又出现下一个头，后面跟着多幅 SLICE。' : 'Nobody resends. The next header shows up in the stream on its own, then several SLICEs.'
    if (codec === 'h265') return zh ? '发送端把 VPS、底层 SPS 再送出来，后面跟着多幅 SLICE。' : 'The sender puts the VPS and the base SPS out again, then several SLICEs.'
    return zh ? '发送端把 SPS、PPS 再送出来，后面跟着多幅 SLICE。' : 'The sender puts the SPS and the PPS out again, then several SLICEs.'
  }
  if (codec === 'h265') return zh ? '新的 SLICE 到达，小的那层亮。后面的 SLICE 还在来，大的仍在等自己的 SPS。' : 'A new SLICE arrives and the small layer lights. More SLICEs are still coming. The large one is still waiting for its own SPS.'
  if (codec === 'mpeg2') return zh ? '新的 SLICE 到达，下一幅解出。后面的还在来，断掉的那一段不补。' : 'A new SLICE arrives and the next picture decodes. More are still coming. The broken stretch is not filled in.'
  return zh ? '新的 SLICE 到达，这一幅解出。后面的 SLICE 还在来，中间丢掉的不补。' : 'A new SLICE arrives and this picture decodes. More SLICEs are still coming. The lost pictures in between are not filled in.'
}
