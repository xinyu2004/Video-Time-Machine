import { useEffect, useRef, useState } from 'react'
import { CIE_LOCUS, cssColor, D65, ILLUMINANT_C, MATRICES, PRIMARIES, reinterpret, type MatrixId, type RGB } from '../content/standards'
import { Scope } from './Scope'
import { useLang } from '../i18n'

const SHIRT: RGB = { r: 0.82, g: 0.08, b: 0.07 }
const SKIN: RGB = { r: 0.74, g: 0.5, b: 0.38 }
const WALL: RGB = { r: 0.08, g: 0.16, b: 0.62 }
const IDS: MatrixId[] = ['bt601', 'bt709', 'bt2020']
type PrimaryId = 'ntsc1953' | 'bt709' | 'bt2020' | 'ebu' | 'smpteC'
type GamutView = 'history' | 'primaries' | 'matrix'

const LUMA_ROWS: Array<{ id: PrimaryId; zh: string; en: string; white: string; solved: string; used: string }> = [
  { id: 'ntsc1953', zh: '1953 NTSC', en: '1953 NTSC', white: 'C', solved: '0.299 / 0.587 / 0.114', used: '0.299 / 0.587 / 0.114' },
  { id: 'smpteC', zh: 'SMPTE-C', en: 'SMPTE-C', white: 'D65', solved: '0.2124 / 0.7011 / 0.0866', used: '0.299 / 0.587 / 0.114' },
  { id: 'ebu', zh: 'EBU', en: 'EBU', white: 'D65', solved: '0.2220 / 0.7067 / 0.0713', used: '0.299 / 0.587 / 0.114' },
  { id: 'bt709', zh: 'BT.709', en: 'BT.709', white: 'D65', solved: '0.2126 / 0.7152 / 0.0722', used: '0.2126 / 0.7152 / 0.0722' },
  { id: 'bt2020', zh: 'BT.2020', en: 'BT.2020', white: 'D65', solved: '0.2627 / 0.6780 / 0.0593', used: '0.2627 / 0.6780 / 0.0593' },
]
const MODEL: Array<{ id: string; zh: string; en: string; rgb: RGB }> = [
  { id: 'green', zh: '绿', en: 'Green', rgb: { r: 0.05, g: 0.82, b: 0.08 } },
  { id: 'red', zh: '红', en: 'Red', rgb: { r: 0.9, g: 0.05, b: 0.04 } },
  { id: 'skin', zh: '肤色', en: 'Skin', rgb: { r: 0.62, g: 0.48, b: 0.4 } },
]
const WIDE = [
  { id: 'red', zh: '2020 的红', en: '2020 red', xy: PRIMARIES.bt2020.r },
  { id: 'green', zh: '2020 的绿', en: '2020 green', xy: PRIMARIES.bt2020.g },
] as const

export function GamutStack({ view = 'primaries' }: { view?: GamutView }) {
  const zh = useLang() === 'zh'
  const [from, setFrom] = useState<MatrixId>('bt601')
  const [to, setTo] = useState<MatrixId>('bt709')
  const [tagOnly, setTagOnly] = useState(false)
  const [primary, setPrimary] = useState<PrimaryId>('bt2020')
  const faceRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const map = tagOnly || from === to ? (rgb: RGB) => rgb : (rgb: RGB) => reinterpret(rgb, from, to)
    paint(faceRef.current, map)
  }, [from, tagOnly, to])

  const locus = [...CIE_LOCUS.map((p) => xy(p)), xy(CIE_LOCUS[0])].join(' ')
  const poly = (key: keyof typeof PRIMARIES) =>
    [PRIMARIES[key].r, PRIMARIES[key].g, PRIMARIES[key].b].map((p) => xy(p as [number, number])).join(' ')
  const same = tagOnly || from === to
  const decode = (rgb: RGB) => (same ? rgb : reinterpret(rgb, from, to))
  const chips = [
    { id: 'shirt', name: zh ? '红衣服' : 'Red shirt', rgb: SHIRT, weight: 'kr' as const },
    { id: 'skin', name: zh ? '肤色' : 'Skin', rgb: SKIN, weight: null },
    { id: 'wall', name: zh ? '蓝墙' : 'Blue wall', rgb: WALL, weight: 'kb' as const },
  ]

  return (
    <Scope
      controls={
        view === 'matrix' ? (
          <>
            <span>{zh ? '输入' : 'In'}</span>
            {IDS.map((id) => (
              <button key={`in-${id}`} type="button" aria-pressed={from === id} onClick={() => setFrom(id)}>{MATRICES[id].label.replace('BT.', '')}</button>
            ))}
            <span>{zh ? '输出' : 'Out'}</span>
            {IDS.map((id) => (
              <button key={`out-${id}`} type="button" aria-pressed={to === id} onClick={() => setTo(id)}>{MATRICES[id].label.replace('BT.', '')}</button>
            ))}
            <button type="button" aria-pressed={tagOnly} onClick={() => setTagOnly((v) => !v)}>{zh ? '只改标签' : 'Retag only'}</button>
          </>
        ) : undefined
      }
    >
      {view === 'matrix' ? (
      <>
      <figure>
        <canvas ref={faceRef} width={480} height={280} />
        <figcaption>
          {tagOnly
            ? (zh ? `${MATRICES[from].label} 的样点，标签写成 ${MATRICES[to].label}。三块色不动` : `${MATRICES[from].label} samples, tag says ${MATRICES[to].label}. The three chips stay`)
            : same
              ? (zh ? `${MATRICES[from].label} 进，${MATRICES[to].label} 出。同一套，左右一样` : `${MATRICES[from].label} in, ${MATRICES[to].label} out. Same matrix, both sides match`)
              : (zh ? `${MATRICES[from].label} 进，${MATRICES[to].label} 出。看三块色的 R、G、B` : `${MATRICES[from].label} in, ${MATRICES[to].label} out. Read R, G, and B on the three chips`)}
        </figcaption>
      </figure>
      <div className="swatches">
        {chips.map((chip) => {
          const right = decode(chip.rgb)
          return (
            <div key={chip.id}>
              <span>{chip.name}。{zh ? '左是写入，右是显示。' : 'Left is as stored, right is as shown.'}</span>
              <span>{chip.weight ? weightLine(zh, chip.weight, from, to, same) : (zh ? (same ? '左右一样' : '三路权重都在变') : (same ? 'Both sides match' : 'All three weights move'))}</span>
              <span>{channels(chip.rgb, right)}</span>
              <i style={{ background: cssColor(chip.rgb) }} />
              <i style={{ background: cssColor(right) }} />
            </div>
          )
        })}
      </div>
      <p className="note">
        {zh
          ? '左是按输入那一行编码的结果，右是用输出那一行解出来。只改标签时样点不动。基色和白点在时间线里。'
          : 'Left is encoded with the input row. Right is decoded with the output row. A retag leaves the samples still. Primaries and the white point are on the timeline.'}
      </p>
      </>
      ) : null}
      {view !== 'matrix' ? (
      <svg className="gamut" viewBox="0 0 600 640" role="img">
        <polygon points={locus} className="locus" />
        <polygon points={poly('bt2020')} className={primary === 'bt2020' ? 'g2020 on' : 'g2020'} onClick={() => setPrimary('bt2020')} />
        <polygon points={poly('ntsc1953')} className={primary === 'ntsc1953' ? 'g1953 on' : 'g1953'} onClick={() => setPrimary('ntsc1953')} />
        <polygon points={poly('bt709')} className={primary === 'bt709' ? 'g709 on' : 'g709'} onClick={() => setPrimary('bt709')} />
        <polygon points={poly('ebu')} className={primary === 'ebu' ? 'gebu on' : 'gebu'} onClick={() => setPrimary('ebu')} />
        <polygon points={poly('smpteC')} className={primary === 'smpteC' ? 'gsmpte on' : 'gsmpte'} onClick={() => setPrimary('smpteC')} />
        <GamutName id="bt2020" label="2020" selected={primary === 'bt2020'} onPick={setPrimary} />
        <GamutName id="ntsc1953" label="1953" selected={primary === 'ntsc1953'} onPick={setPrimary} />
        <GamutName id="bt709" label="709" selected={primary === 'bt709'} onPick={setPrimary} />
        <GamutName id="ebu" label="EBU" selected={primary === 'ebu'} onPick={setPrimary} />
        <GamutName id="smpteC" label="SMPTE-C" selected={primary === 'smpteC'} onPick={setPrimary} />
        <Nm point={PRIMARIES.bt2020.r} label="630 nm" dx={10} dy={4} />
        <Nm point={PRIMARIES.bt2020.g} label="532 nm" dx={8} dy={18} />
        <Nm point={PRIMARIES.bt2020.b} label="467 nm" dx={-62} dy={16} />
        {view === 'primaries' ? WIDE.map((item) => {
          const hit = reach(item.xy)
          const [x1, y1] = xy(item.xy).split(',')
          const [x2, y2] = xy(hit.edge).split(',')
          return (
            <g key={item.id}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} className="ray" />
              <circle cx={x1} cy={y1} r="5" className="sample" />
              <circle cx={x2} cy={y2} r="4" className="clipdot" />
            </g>
          )
        }) : null}
        <circle cx={xy(D65).split(',')[0]} cy={xy(D65).split(',')[1]} r="4" className="d65" />
        <circle cx={xy(ILLUMINANT_C).split(',')[0]} cy={xy(ILLUMINANT_C).split(',')[1]} r="6" className="illuminant-c" />
        <Nm point={D65} label="D65" dx={8} dy={-8} />
        <Nm point={ILLUMINANT_C} label="C" dx={-22} dy={18} />
      </svg>
      ) : null}
      {view === 'history' ? (
        <table className="luma">
          <thead>
            <tr>
              <th>{zh ? '基色' : 'Primaries'}</th>
              <th>{zh ? '白点' : 'White'}</th>
              <th>{zh ? '按基色和白点重解' : 'Solved from primaries and white'}</th>
              <th>{zh ? '接口使用' : 'Used on the interface'}</th>
            </tr>
          </thead>
          <tbody>
            {LUMA_ROWS.map((row) => (
              <tr key={row.id} className={primary === row.id ? 'on' : ''} onClick={() => setPrimary(row.id)}>
                <td>{zh ? row.zh : row.en}</td>
                <td>{row.white}</td>
                <td>{row.solved}</td>
                <td>{row.used}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {view === 'primaries' ? (
      <div className="model">
        <span />
        <span>{zh ? '宽的这边' : 'Wide side'}</span>
        <span>{zh ? '按 709 的比例缩小' : 'Shrunk to the 709 proportion'}</span>
        {MODEL.map((item) => {
          const narrow = showNarrow(item.rgb)
          return (
            <div key={item.id} style={{ display: 'contents' }}>
              <span>{zh ? item.zh : item.en}</span>
              <i style={{ background: cssColor(item.rgb) }} />
              <i style={{ background: cssColor(narrow) }} />
            </div>
          )
        })}
      </div>
      ) : null}
      {view === 'history' ? (
        <p className="note">
          {zh
            ? '点一行，对应的三角形加粗。重解是 P·(kr, kg, kb) 等于白点，P 的三列是各基色在自身亮度等于 1 时的 XYZ。接口是演播数字里实际使用的那一行。SMPTE-C 与 EBU 的重解不同，接口都还用 1953 年的 0.299 / 0.587 / 0.114。709 和 2020 的接口就是自己的重解。D65 是 (0.3127, 0.3290)，光源 C 是 (0.310, 0.316)。'
            : 'Select a row and that triangle thickens. The solved row is P·(kr, kg, kb) = white, where the columns of P are each primary’s XYZ at luminance 1. The interface column is the row the digital plant actually used. SMPTE-C and EBU solve to different rows, and both interfaces still use the 1953 row 0.299 / 0.587 / 0.114. The 709 and 2020 interfaces are their own solutions. D65 is (0.3127, 0.3290). Illuminant C is (0.310, 0.316).'}
        </p>
      ) : null}
      {view === 'primaries' ? (
        <p className="note">
          {zh
            ? '宽列用屏幕原色代替 2020 的顶点，窄列按 709 原色在 2020 坐标里能走到的比例缩回去。绿会收回来，肤色两边都落在三角形里。点名字只加粗。五套基色和亮度表在时间线里。'
            : 'The wide column uses this screen’s primaries in place of the 2020 vertices. The narrow column is pulled back by how far the 709 primaries reach inside 2020. Green comes back in. Skin lands inside both triangles. A name only thickens that triangle. The five primary sets and the luma table are on the timeline.'}
        </p>
      ) : null}
    </Scope>
  )
}

function GamutName({ id, label, selected, onPick }: { id: PrimaryId; label: string; selected: boolean; onPick: (id: PrimaryId) => void }) {
  const anchor = id === 'ebu' ? PRIMARIES.ebu.b : id === 'smpteC' ? PRIMARIES.smpteC.r : PRIMARIES[id].g
  const [x, y] = xy(anchor).split(',').map(Number)
  const dx = id === 'bt2020' ? -58 : id === 'ntsc1953' ? -58 : id === 'ebu' ? 12 : id === 'smpteC' ? -78 : 14
  const dy = id === 'ebu' ? 22 : id === 'smpteC' ? 22 : id === 'ntsc1953' ? 6 : id === 'bt2020' ? -16 : 10
  return (
    <text x={x + dx} y={y + dy} className={selected ? 'on' : ''} onClick={() => onPick(id)}>{label}</text>
  )
}

function Nm({ point, label, dx, dy }: { point: readonly [number, number]; label: string; dx: number; dy: number }) {
  const [x, y] = xy(point).split(',').map(Number)
  return <text className="nm" x={x + dx} y={y + dy}>{label}</text>
}

function paint(canvas: HTMLCanvasElement | null, map: (rgb: RGB) => RGB) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const image = ctx.createImageData(canvas.width, canvas.height)
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const rgb = map(scenePixel(x, y, canvas.width, canvas.height))
      const i = (y * canvas.width + x) * 4
      image.data[i] = clamp(rgb.r)
      image.data[i + 1] = clamp(rgb.g)
      image.data[i + 2] = clamp(rgb.b)
      image.data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
}

function scenePixel(x: number, y: number, w: number, h: number): RGB {
  const cx = w * 0.42
  const cy = h * 0.38
  const dx = (x - cx) / (w * 0.16)
  const dy = (y - cy) / (h * 0.24)
  if (dx * dx + dy * dy < 1) {
    return dy < -0.2 ? { r: 0.22, g: 0.14, b: 0.1 } : { r: 0.74, g: 0.5, b: 0.38 }
  }
  if (y > h * 0.56 && y < h * 0.92 && Math.abs(x - cx) < w * 0.28) return SHIRT
  return WALL
}

function weightLine(zh: boolean, key: 'kr' | 'kb', from: MatrixId, to: MatrixId, same: boolean): string {
  const name = key === 'kr' ? (zh ? '红的权重' : 'Red weight') : (zh ? '蓝的权重' : 'Blue weight')
  const a = MATRICES[from][key].toFixed(4)
  const b = MATRICES[to][key].toFixed(4)
  return same || a === b ? `${name} ${a}` : `${name} ${a} → ${b}`
}

function channels(left: RGB, right: RGB): string {
  const one = (name: string, a: number, b: number) => `${name} ${a.toFixed(3)} → ${b.toFixed(3)}`
  return `${one('R', left.r, right.r)}　${one('G', left.g, right.g)}　${one('B', left.b, right.b)}`
}

const TO_709 = [
  [3.2404542, -1.5371385, -0.4985314],
  [-0.969266, 1.8760108, 0.041556],
  [0.0556434, -0.2040259, 1.0572252],
] as const

function xyTo709(point: readonly [number, number]): RGB {
  const y = Math.max(point[1], 1e-4)
  const Y = 0.4
  const X = (point[0] * Y) / y
  const Z = ((1 - point[0] - y) * Y) / y
  const rgb = TO_709.map((row) => row[0] * X + row[1] * Y + row[2] * Z)
  const peak = Math.max(rgb[0], rgb[1], rgb[2], 1e-4)
  const scale = 0.92 / peak
  return { r: rgb[0] * scale, g: rgb[1] * scale, b: rgb[2] * scale }
}

function inside(point: readonly [number, number], tri: readonly [readonly [number, number], readonly [number, number], readonly [number, number]]): boolean {
  const [a, b, c] = tri
  const v0x = c[0] - a[0]
  const v0y = c[1] - a[1]
  const v1x = b[0] - a[0]
  const v1y = b[1] - a[1]
  const v2x = point[0] - a[0]
  const v2y = point[1] - a[1]
  const dot00 = v0x * v0x + v0y * v0y
  const dot01 = v0x * v1x + v0y * v1y
  const dot02 = v0x * v2x + v0y * v2y
  const dot11 = v1x * v1x + v1y * v1y
  const dot12 = v1x * v2x + v1y * v2y
  const inv = 1 / (dot00 * dot11 - dot01 * dot01)
  const u = (dot11 * dot02 - dot01 * dot12) * inv
  const v = (dot00 * dot12 - dot01 * dot02) * inv
  return u >= -1e-4 && v >= -1e-4 && u + v <= 1 + 1e-4
}

function reach(point: readonly [number, number]): { t: number; edge: [number, number] } {
  const tri = [PRIMARIES.bt709.r, PRIMARIES.bt709.g, PRIMARIES.bt709.b] as const
  if (inside(point, tri)) return { t: 1, edge: [point[0], point[1]] }
  let lo = 0
  let hi = 1
  for (let i = 0; i < 28; i += 1) {
    const mid = (lo + hi) / 2
    const sample: [number, number] = [D65[0] + (point[0] - D65[0]) * mid, D65[1] + (point[1] - D65[1]) * mid]
    if (inside(sample, tri)) lo = mid
    else hi = mid
  }
  return { t: lo, edge: [D65[0] + (point[0] - D65[0]) * lo, D65[1] + (point[1] - D65[1]) * lo] }
}

const FROM_709 = [
  [0.4124564, 0.3575761, 0.1804375],
  [0.2126729, 0.7151522, 0.072175],
  [0.0193339, 0.119192, 0.9503041],
] as const

function rgbToXy(rgb: RGB): [number, number] {
  const X = FROM_709[0][0] * rgb.r + FROM_709[0][1] * rgb.g + FROM_709[0][2] * rgb.b
  const Y = FROM_709[1][0] * rgb.r + FROM_709[1][1] * rgb.g + FROM_709[1][2] * rgb.b
  const Z = FROM_709[2][0] * rgb.r + FROM_709[2][1] * rgb.g + FROM_709[2][2] * rgb.b
  const sum = X + Y + Z || 1
  return [X / sum, Y / sum]
}

function showNarrow(rgb: RGB): RGB {
  const point = rgbToXy(rgb)
  const tri = [
    pullPrimary(PRIMARIES.bt709.r, 0.704),
    pullPrimary(PRIMARIES.bt709.g, 0.323),
    pullPrimary(PRIMARIES.bt709.b, 0.854),
  ] as const
  if (inside(point, tri)) return rgb
  let lo = 0
  let hi = 1
  for (let i = 0; i < 28; i += 1) {
    const mid = (lo + hi) / 2
    const sample: [number, number] = [D65[0] + (point[0] - D65[0]) * mid, D65[1] + (point[1] - D65[1]) * mid]
    if (inside(sample, tri)) lo = mid
    else hi = mid
  }
  return xyTo709([D65[0] + (point[0] - D65[0]) * lo, D65[1] + (point[1] - D65[1]) * lo])
}

function pullPrimary(point: readonly [number, number], t: number): [number, number] {
  return [D65[0] + (point[0] - D65[0]) * t, D65[1] + (point[1] - D65[1]) * t]
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value * 255)))
}

function xy(point: readonly [number, number]): string {
  const x = 36 + (point[0] / 0.8) * 520
  const y = 560 - (point[1] / 0.9) * 520
  return `${x},${y}`
}
