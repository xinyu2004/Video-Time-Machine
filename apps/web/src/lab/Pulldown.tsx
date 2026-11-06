import { useEffect, useRef, useState } from 'react'
import { Scope } from './Scope'
import { paintWeavePoses } from './scene'
import { useLang } from '../i18n'

const HOLDS = [2, 3, 2, 3]
const FILM = ['A', 'B', 'C', 'D']
const PLACE: Record<string, number> = { A: 0.18, B: 0.38, C: 0.58, D: 0.78 }
const SWING: Record<string, number> = { A: 0.35, B: -0.9, C: 0.85, D: -0.4 }

function expand() {
  const fields: string[] = []
  FILM.forEach((frame, index) => {
    for (let n = 0; n < HOLDS[index]; n += 1) fields.push(frame)
  })
  const frames: Array<[string, string]> = []
  for (let i = 0; i < fields.length; i += 2) frames.push([fields[i], fields[i + 1]])
  return { fields, frames }
}

export function Pulldown() {
  const lang = useLang()
  const { fields, frames } = expand()
  const [index, setIndex] = useState(0)
  const pair = frames[index]
  const mixed = pair[0] !== pair[1]
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const image = ctx.createImageData(canvas.width, canvas.height)
    paintWeavePoses(
      image,
      { cx: canvas.width * PLACE[pair[0]], swing: SWING[pair[0]] },
      { cx: canvas.width * PLACE[pair[1]], swing: SWING[pair[1]] },
    )
    ctx.putImageData(image, 0, 0)
  }, [index, pair[0], pair[1]])
  return (
    <Scope
      caveat="diagram"
      controls={
        <>
          <button type="button" onClick={() => setIndex((n) => (n + frames.length - 1) % frames.length)}>{lang === 'zh' ? '上一帧' : 'Previous'}</button>
          <button type="button" onClick={() => setIndex((n) => (n + 1) % frames.length)}>{lang === 'zh' ? '下一帧' : 'Next'}</button>
        </>
      }
    >
      <div className="cadence">
        <div className="field-row">
          {fields.map((name, fieldIndex) => (
            <span key={`${name}${fieldIndex}`} className={Math.floor(fieldIndex / 2) === index ? 'on' : ''}>{name}</span>
          ))}
        </div>
        <div className="frame-row">
          {frames.map(([a, b], frameIndex) => (
            <b key={`${a}${b}${frameIndex}`} className={frameIndex === index ? 'on' : ''}>{a}{b}</b>
          ))}
        </div>
      </div>
      <canvas ref={canvasRef} width={480} height={270} />
      <p className="equation">
        {lang === 'zh' ? '场序' : 'Fields'}: {fields.join(' ')}. {lang === 'zh' ? '视频帧' : 'Video frames'}: {frames.map(([a, b]) => a + b).join(' ')}.
        {mixed
          ? lang === 'zh' ? ' 这两格各占一场，拼成这一视频帧，编织后会梳。这不是 PsF。' : ' These two film frames each take one field of this video frame, so a weave combs. This is not PsF.'
          : lang === 'zh' ? ' 当前帧两场来自同一格。' : ' Both fields of this frame come from one film frame.'}
        {lang === 'zh'
          ? ' BB 是 B 那三场里靠前的两场，第三场 B 进了 BC。DD 是 D 那三场里靠后的两场，第一场 D 在 CD 里。人的位置从 A 走到 D。'
          : ' BB is the earlier pair of B’s three fields; the third B falls into BC. DD is the later pair of D’s three fields; the first D is in CD. The person walks from A to D.'}
      </p>
    </Scope>
  )
}
