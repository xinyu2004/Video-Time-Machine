import { useEffect, useRef, useState } from 'react'
import { Scope, useReduceMotion } from './Scope'
import { fieldTime, paintDoubledField, paintScene, sampleScene } from './scene'
import { useLang } from '../i18n'

type Split = 'psf' | 'adjacent'
type Panel = 'weave' | 'bob'

export function DisplayPath() {
  const lang = useLang()
  const crtRef = useRef<HTMLCanvasElement>(null)
  const panelRef = useRef<HTMLCanvasElement>(null)
  const [split, setSplit] = useState<Split>('adjacent')
  const [panel, setPanel] = useState<Panel>('weave')
  const [tff, setTff] = useState(true)
  const [playing, setPlaying] = useState(!useReduceMotion())
  const field = useRef(0)

  useEffect(() => {
    const crt = crtRef.current
    const board = panelRef.current
    if (!crt || !board) return
    const crtCtx = crt.getContext('2d')
    const panelCtx = board.getContext('2d')
    if (!crtCtx || !panelCtx) return
    const crtImage = crtCtx.createImageData(crt.width, crt.height)
    const panelImage = panelCtx.createImageData(board.width, board.height)
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (playing) field.current += dt * 50
      const index = Math.floor(field.current)
      const time = 2.2 + Math.floor(index / 2) / 25
      const showTop = tff ? index % 2 === 0 : index % 2 === 1
      paintDoubledField(crtImage, fieldTime(showTop ? 0 : 1, tff, time, split), showTop)
      if (panel === 'weave') {
        paintScene(panelImage, (y) => fieldTime(y, tff, time, split))
      } else {
        const { width: w, height: h, data } = panelImage
        for (let y = 0; y < h; y++) {
          const srcY = y % 2 === 0 ? y : y - 1
          const top = srcY % 2 === 0
          const visible = showTop ? top : !top
          const t = visible ? fieldTime(srcY, tff, time, split) : null
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4
            if (t == null) {
              data[i] = 8
              data[i + 1] = 10
              data[i + 2] = 8
            } else {
              const [r, g, b] = sampleScene(x, srcY, w, h, t)
              data[i] = r
              data[i + 1] = g
              data[i + 2] = b
            }
            data[i + 3] = 255
          }
        }
      }
      crtCtx.putImageData(crtImage, 0, 0)
      panelCtx.putImageData(panelImage, 0, 0)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [panel, playing, split, tff])

  const mistake = split === 'psf' && panel === 'bob'
  return (
    <Scope
      caveat="crt"
      controls={
        <>
          <button type="button" aria-pressed={split === 'psf'} onClick={() => setSplit('psf')}>PsF</button>
          <button type="button" aria-pressed={split === 'adjacent'} onClick={() => setSplit('adjacent')}>{lang === 'zh' ? '相邻帧' : 'Adjacent'}</button>
          <button type="button" aria-pressed={panel === 'weave'} onClick={() => setPanel('weave')}>weave</button>
          <button type="button" aria-pressed={panel === 'bob'} onClick={() => setPanel('bob')}>bob</button>
          <button type="button" aria-pressed={tff} onClick={() => setTff((v) => !v)}>{tff ? 'TFF' : 'BFF'}</button>
          <button type="button" onClick={() => setPlaying((v) => !v)}>{playing ? (lang === 'zh' ? '暂停' : 'Pause') : lang === 'zh' ? '播放' : 'Play'}</button>
        </>
      }
    >
      <div className="pair">
        <figure>
          <canvas ref={crtRef} width={480} height={270} />
          <figcaption>{lang === 'zh' ? '这一场拉成整幅' : 'This field, stretched to a frame'}</figcaption>
        </figure>
        <figure>
          <canvas ref={panelRef} width={480} height={270} />
          <figcaption>
            {mistake
              ? lang === 'zh' ? 'PsF 被送去 bob：窗上的细线发虚' : 'PsF sent through bob: the fine window lines soften'
              : lang === 'zh' ? '逐行面板' : 'Progressive panel'}
          </figcaption>
        </figure>
      </div>
      <p className="note">
        {lang === 'zh'
          ? '相邻帧把一场的位移拉开了，人身上的齿才看得清。PsF 两场是同一时刻，轮廓是齐的，窗上的细横线仍在。'
          : 'Adjacent frames stretch one field of motion so the teeth on the person can be seen. PsF is one instant, so the outline agrees and the fine window lines stay.'}
      </p>
    </Scope>
  )
}
