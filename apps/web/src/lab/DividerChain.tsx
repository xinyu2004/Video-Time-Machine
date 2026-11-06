import { useEffect, useState } from 'react'
import { Scope, useReduceMotion } from './Scope'
import { useLang } from '../i18n'

type System = {
  id: string
  lines: number
  factors: number[]
  fps: number
  color: 'ntsc' | 'pal' | 'none'
}

const SYSTEMS: System[] = [
  { id: '405', lines: 405, factors: [5, 3, 3, 3, 3], fps: 25, color: 'none' },
  { id: '525', lines: 525, factors: [3, 5, 5, 7], fps: 30, color: 'ntsc' },
  { id: '625', lines: 625, factors: [5, 5, 5, 5], fps: 25, color: 'pal' },
  { id: '819', lines: 819, factors: [3, 3, 7, 13], fps: 25, color: 'none' },
  { id: '1125', lines: 1125, factors: [3, 3, 5, 5, 5], fps: 30, color: 'none' },
]

export function DividerChain() {
  const lang = useLang()
  const [id, setId] = useState('625')
  const [colorOn, setColorOn] = useState(true)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(!useReduceMotion())
  const system = SYSTEMS.find((item) => item.id === id) ?? SYSTEMS[2]
  const color = colorOn && system.color !== 'none'
  const rate = color && system.color === 'ntsc' ? system.fps * (1000 / 1001) : system.fps
  const fh = system.lines * rate

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => setStep((n) => n + 1), 700)
    return () => window.clearInterval(timer)
  }, [playing, id])

  const active = step % (system.factors.length + 1)
  const divided = system.factors.slice(0, active).reduce((acc, n) => acc * n, 1)

  return (
    <Scope
      caveat="diagram"
      controls={
        <>
          {SYSTEMS.map((item) => (
            <button key={item.id} type="button" aria-pressed={item.id === id} onClick={() => { setId(item.id); setStep(0) }}>
              {item.lines}
            </button>
          ))}
          {system.color !== 'none' ? (
            <button type="button" aria-pressed={colorOn} onClick={() => setColorOn((v) => !v)}>
              {lang === 'zh' ? (colorOn ? '彩色钟' : '单色钟') : colorOn ? 'Color clock' : 'Mono clock'}
            </button>
          ) : null}
          <button type="button" onClick={() => setPlaying((v) => !v)}>{playing ? (lang === 'zh' ? '暂停' : 'Pause') : lang === 'zh' ? '分频' : 'Divide'}</button>
        </>
      }
    >
      <div className="chain">
        <div className="factors">
          <span className={active === 0 ? 'on' : ''}>{lang === 'zh' ? '主振' : 'Master'}</span>
          {system.factors.map((factor, index) => (
            <span key={`${factor}-${index}`} className={index < active ? 'on' : ''}>÷{factor}</span>
          ))}
        </div>
        <dl className="readout">
          <div><dt>{lang === 'zh' ? '已分出的乘积' : 'Product so far'}</dt><dd>{divided}</dd></div>
          <div><dt>fh</dt><dd>{fh.toFixed(system.color === 'ntsc' && color ? 3 : 0)} Hz</dd></div>
          <div><dt>{lang === 'zh' ? '每场' : 'Lines / field'}</dt><dd>{system.lines / 2}</dd></div>
        </dl>
        {system.color === 'ntsc' && color ? <NtscMath lang={lang} /> : null}
        {system.color === 'pal' && color ? <PalMath lang={lang} /> : null}
        {system.id === '1125' ? (
          <p className="note">
            {lang === 'zh'
              ? '有效行 1080 = 2³×3³×5，不能被 16 整除，编码高度常补到 1088。'
              : 'Active lines 1080 = 2³×3³×5, not divisible by 16, so coded height is often padded to 1088.'}
          </p>
        ) : null}
      </div>
    </Scope>
  )
}

function NtscMath({ lang }: { lang: 'zh' | 'en' }) {
  return (
    <p className="equation">
      {lang === 'zh' ? '彩色' : 'Color'}: 1001 = 7×11×13，fh = 15750 × 1000/1001。
      fsc = (455/2) × fh，455 = 5×7×13。4.5 MHz = 286 × fh，286 = 2×11×13。
    </p>
  )
}

function PalMath({ lang }: { lang: 'zh' | 'en' }) {
  return (
    <p className="equation">
      {lang === 'zh' ? '行频' : 'Line rate'} 625 × 25 = 15625 Hz。
      fsc = (1135/4 + 1/625) × fh = 4433618.75 Hz。
    </p>
  )
}
