import { useEffect, useRef, useState } from 'react'
import { Scope, useReduceMotion } from './Scope'
import { FIELD_DT, paintDoubledField, paintLamp, paintWeavePoses, poseAt } from './scene'
import { useLang } from '../i18n'

const PLAY_HZ = 5
const ORIGIN = 2.2
const LAMP_TIME = 2.8
const TOOTH = 0.42
const CROP_W = 48
const CROP_H = 72
const CROP_SCALE = 4

export function FieldLoom({ view = 'order' }: { view?: 'order' | 'lamp' }) {
  const lang = useLang()
  const zh = lang === 'zh'
  const tffRef = useRef<HTMLCanvasElement>(null)
  const bffRef = useRef<HTMLCanvasElement>(null)
  const stillRef = useRef<HTMLCanvasElement>(null)
  const stepRef = useRef<HTMLCanvasElement>(null)
  const beforeRef = useRef<HTMLCanvasElement>(null)
  const afterRef = useRef<HTMLCanvasElement>(null)
  const lampRef = useRef<HTMLCanvasElement>(null)
  const [materialTff, setMaterialTff] = useState(true)
  const [alternate, setAlternate] = useState(false)
  const [playing, setPlaying] = useState(!useReduceMotion())
  const clock = useRef(0)

  useEffect(() => {
    if (view === 'lamp') {
      const canvas = lampRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const image = ctx.createImageData(canvas.width, canvas.height)
      let raf = 0
      const loop = () => {
        paintLamp(image, LAMP_TIME, alternate)
        ctx.putImageData(image, 0, 0)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
      return () => cancelAnimationFrame(raf)
    }

    const canvases = [tffRef.current, bffRef.current, stillRef.current, stepRef.current, beforeRef.current, afterRef.current]
    if (canvases.some((canvas) => !canvas)) return
    const contexts = canvases.map((canvas) => canvas!.getContext('2d'))
    if (contexts.some((ctx) => !ctx)) return
    const images = canvases.map((canvas, index) => contexts[index]!.createImageData(canvas!.width, canvas!.height))
    const held = contexts[2]!.createImageData(canvases[2]!.width, canvases[2]!.height)
    const flipped = contexts[2]!.createImageData(canvases[2]!.width, canvases[2]!.height)
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (playing) clock.current += dt
      const step = playing ? Math.floor(clock.current * PLAY_HZ) : 0
      paintSide(images[0], step, true, materialTff, playing)
      paintSide(images[1], step, false, materialTff, playing)
      const earlier = poseAt(ORIGIN, held.width)
      const later = poseAt(ORIGIN + TOOTH, held.width)
      paintWeavePoses(held, earlier, later)
      paintWeavePoses(flipped, later, earlier)
      images[2].data.set(held.data)
      paintSide(images[3], step, true, materialTff, playing)
      const origin = cropOrigin(held.width, held.height)
      paintCrop(images[4], held, origin.x, origin.y)
      paintCrop(images[5], flipped, origin.x, origin.y)
      contexts.forEach((ctx, i) => ctx!.putImageData(images[i], 0, 0))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [alternate, materialTff, playing, view])

  if (view === 'lamp') {
    return (
      <Scope
        caveat="crt"
        controls={
          <button type="button" aria-pressed={alternate} onClick={() => setAlternate((v) => !v)}>
            {alternate ? (zh ? '奇偶行交替' : 'Lines alternate') : (zh ? '两场同亮' : 'Fields match')}
          </button>
        }
      >
        <figure>
          <canvas ref={lampRef} width={480} height={270} />
          <figcaption>
            {alternate
              ? (zh ? '奇偶行一明一暗。人没有挪地方' : 'Odd and even lines change brightness. The person has not moved')
              : (zh ? '两场一样亮。这还不是灯的相位' : 'Both fields match. This is not a lamp phase yet')}
          </figcaption>
        </figure>
        <p className="note">
          {zh
            ? '人停着。交替的时候只看行的明暗，轮廓不错开。这是灯的相位，不是场序。'
            : 'The person is still. Alternating lines only change brightness, and the outline does not split. This is lamp phase, not field order.'}
        </p>
      </Scope>
    )
  }

  const playCaption = (asTff: boolean) => {
    const smooth = asTff === materialTff
    const flag = asTff ? 'setfield=tff' : 'setfield=bff'
    if (!playing) return zh ? `暂停：${flag}，和另一边同一场` : `Paused: ${flag}, the same field as the other side`
    if (zh) return `按 ${flag} 播：${smooth ? '往前走' : '每场退一下'}`
    return `Play ${flag}: ${smooth ? 'walks forward' : 'steps back each field'}`
  }
  const stepCaption = !playing
    ? (zh ? '暂停' : 'Paused')
    : materialTff
      ? (zh ? '改成 TFF：往前走' : 'Set to TFF: walks forward')
      : (zh ? '改成 TFF：每场退一下' : 'Set to TFF: steps back each field')

  return (
    <Scope
      caveat="crt"
      controls={
        <>
          <button type="button" aria-pressed={materialTff} onClick={() => setMaterialTff(true)}>{zh ? '素材是 TFF' : 'File is TFF'}</button>
          <button type="button" aria-pressed={!materialTff} onClick={() => setMaterialTff(false)}>{zh ? '素材是 BFF' : 'File is BFF'}</button>
          <button type="button" onClick={() => setPlaying((v) => !v)}>{playing ? (zh ? '暂停' : 'Pause') : (zh ? '播放' : 'Play')}</button>
        </>
      }
    >
      <div className="loom">
        <figure>
          <canvas ref={tffRef} width={480} height={270} />
          <figcaption>{playCaption(true)}</figcaption>
        </figure>
        <figure>
          <canvas ref={bffRef} width={480} height={270} />
          <figcaption>{playCaption(false)}</figcaption>
        </figure>
      </div>
      <div className="order-pair">
        <section>
          <h3>setfield · {zh ? '改成 TFF' : 'set to TFF'}</h3>
          <figure>
            <canvas ref={stillRef} width={480} height={270} />
            <figcaption>{zh ? '静止画面和原来是同一张。齿不动。' : 'The still is the same picture. The teeth do not move.'}</figcaption>
          </figure>
          <figure>
            <canvas ref={stepRef} width={400} height={180} />
            <figcaption>{stepCaption}</figcaption>
          </figure>
          <p className="note">
            {zh
              ? 'setfield 改的是码流里的场序标签 field_order。TFF 和 BFF 都是这个标签。标签写错、扫描行没存错，改对之后播放才顺着走。样点不动，所以这张静止画面不变。对上就往前走，对不上就每场退一下。'
              : 'setfield rewrites field_order in the bitstream. TFF and BFF are that flag. When the flag is wrong and the lines are stored correctly, fixing the flag makes playback walk forward. The samples do not move, so this still stays. A match walks forward. A mismatch steps back each field.'}
          </p>
        </section>
        <section>
          <h3>fieldorder · {zh ? '改的是行' : 'this changes the lines'}</h3>
          <div className="crops">
            <figure>
              <canvas ref={beforeRef} width={CROP_W * CROP_SCALE} height={CROP_H * CROP_SCALE} />
              <figcaption>{zh ? '原来的行' : 'Stored lines'}</figcaption>
            </figure>
            <figure>
              <canvas ref={afterRef} width={CROP_W * CROP_SCALE} height={CROP_H * CROP_SCALE} />
              <figcaption>{zh ? '行对调之后' : 'After the lines swap'}</figcaption>
            </figure>
          </div>
          <p className="note">
            {zh
              ? '放大四倍的是衣服竖边。齿是一条一条的色带，对调之后翻过去。窗子两场一样，放大了也看不出。'
              : 'The shirt edge is at four times. The teeth are stripes, and they flip when the lines swap. The window matches in both fields, so a zoom there shows nothing.'}
          </p>
        </section>
      </div>
    </Scope>
  )
}

function paintSide(image: ImageData, step: number, playAsTff: boolean, materialTff: boolean, playing: boolean) {
  const wrong = playing && playAsTff !== materialTff
  const index = wrong ? (step ^ 1) : step
  paintDoubledField(image, ORIGIN + index * FIELD_DT, index % 2 === 0)
}

function cropOrigin(w: number, h: number) {
  const earlier = poseAt(ORIGIN, w)
  const later = poseAt(ORIGIN + TOOTH, w)
  const ground = Math.floor(h * 0.74)
  const x = Math.round(Math.min(earlier.cx, later.cx) + 8)
  const y = ground - 108
  return {
    x: Math.max(0, Math.min(w - CROP_W, x)),
    y: Math.max(0, Math.min(h - CROP_H, y)),
  }
}

function paintCrop(dest: ImageData, src: ImageData, ox: number, oy: number) {
  for (let y = 0; y < dest.height; y += 1) {
    const sy = Math.min(src.height - 1, oy + Math.floor(y / CROP_SCALE))
    for (let x = 0; x < dest.width; x += 1) {
      const sx = Math.min(src.width - 1, ox + Math.floor(x / CROP_SCALE))
      const si = (sy * src.width + sx) * 4
      const di = (y * dest.width + x) * 4
      dest.data[di] = src.data[si]
      dest.data[di + 1] = src.data[si + 1]
      dest.data[di + 2] = src.data[si + 2]
      dest.data[di + 3] = 255
    }
  }
}
