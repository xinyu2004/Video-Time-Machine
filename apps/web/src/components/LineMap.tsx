import { useRef, useState } from 'react'
import { PRIMARIES } from '../content/standards'
import { useLang } from '../i18n'

const YEAR_MIN = 1924
const YEAR_MAX = 2026
const X0 = 118
const X1 = 980
const TOP = 42
const PITCH = 64
const VB_W = 1180
const GRAB = 28

type GamutId = keyof typeof PRIMARIES

type Station = {
  year: number
  zh: string
  en: string
  to: string
  gamut?: GamutId
  side?: 'up' | 'down'
  noteZh?: string
  noteEn?: string
  anchor?: 'start' | 'end'
  tipZh?: string
  tipEn?: string
}

type Thread = {
  zh: string
  en: string
  groupZh?: string
  groupEn?: string
  color: string
  from: number
  fromEdge?: boolean
  dashAfter?: number
  stations: Station[]
}

const THREADS: Thread[] = [
  {
    zh: '50 Hz', en: '50 Hz', groupZh: '节拍', groupEn: 'Clock', color: '#8a5a12', from: 1936,
    stations: [{ year: 1936, zh: '50 Hz', en: '50 Hz', to: 'timeline/mains' }],
  },
  {
    zh: '60 Hz', en: '60 Hz', color: '#8a5a12', from: 1941,
    stations: [
      { year: 1941, zh: '60 Hz', en: '60 Hz', to: 'timeline/mains' },
      { year: 1953, zh: '29.97', en: '29.97', to: 'timeline/ntsc', tipZh: '60/1.001', tipEn: '60/1.001' },
    ],
  },
  {
    zh: '525', en: '525', groupZh: '扫描', groupEn: 'Raster', color: '#1f4e79', from: 1936,
    stations: [
      { year: 1936, zh: '电子扫描', en: 'Electronic scan', to: 'timeline/mains' },
      { year: 1941, zh: '525', en: '525', to: 'timeline/raster', side: 'down', tipZh: '3×5×5×7', tipEn: '3×5×5×7' },
      { year: 1990, zh: '1080', en: '1080', to: 'timeline/hd-uhd', noteZh: '74.25 MHz', noteEn: '74.25 MHz' },
      { year: 1997, zh: '720p', en: '720p', to: 'timeline/hd-uhd', side: 'down', tipZh: 'SMPTE 296M', tipEn: 'SMPTE 296M' },
      { year: 2012, zh: '2160', en: '2160', to: 'timeline/hd-uhd', noteZh: '297 / 594', noteEn: '297 / 594', side: 'down' },
    ],
  },
  {
    zh: '625', en: '625', color: '#1f4e79', from: 1950,
    stations: [{ year: 1950, zh: '625', en: '625', to: 'timeline/raster', tipZh: '5×5×5×5', tipEn: '5×5×5×5' }],
  },
  {
    zh: 'NTSC', en: 'NTSC', groupZh: '模拟彩色', groupEn: 'Analog color', color: '#8d2f2f', from: 1953, dashAfter: 2009,
    stations: [{ year: 1953, zh: 'NTSC', en: 'NTSC', to: 'timeline/ntsc' }],
  },
  {
    zh: 'PAL', en: 'PAL', color: '#8d2f2f', from: 1967, dashAfter: 2009,
    stations: [{ year: 1967, zh: 'PAL', en: 'PAL', to: 'timeline/pal' }],
  },
  {
    zh: 'SECAM', en: 'SECAM', color: '#8d2f2f', from: 1967, dashAfter: 2009,
    stations: [{ year: 1967, zh: 'SECAM', en: 'SECAM', to: 'timeline/pal', side: 'down' }],
  },
  {
    zh: '色域', en: 'Gamut', groupZh: '色域', groupEn: 'Gamut', color: '#2f6b45', from: 1953,
    stations: [
      { year: 1953, zh: '1953', en: '1953', to: 'timeline/hd-uhd', gamut: 'ntsc1953', tipZh: '光源 C', tipEn: 'Illuminant C' },
      { year: 1975, zh: 'EBU', en: 'EBU', to: 'timeline/hd-uhd', gamut: 'ebu', side: 'down', tipZh: 'Tech. 3213', tipEn: 'Tech. 3213' },
      { year: 1987, zh: 'SMPTE-C', en: 'SMPTE-C', to: 'timeline/hd-uhd', gamut: 'smpteC', tipZh: 'RP 145', tipEn: 'RP 145' },
      { year: 2005, zh: 'DCI-P3', en: 'DCI-P3', to: 'timeline/hd-uhd' },
    ],
  },
  {
    zh: '规格', en: 'Spec', groupZh: '规格', groupEn: 'Spec', color: '#241c14', from: 1982,
    stations: [
      { year: 1982, zh: 'BT.601', en: 'BT.601', to: 'timeline/bt601', noteZh: '13.5 MHz', noteEn: '13.5 MHz', side: 'down', tipZh: 'CCIR 601', tipEn: 'CCIR 601' },
      { year: 1990, zh: 'BT.709', en: 'BT.709', to: 'timeline/hd-uhd', gamut: 'bt709', noteZh: '曲线', noteEn: 'curve' },
      { year: 2011, zh: 'BT.1886', en: 'BT.1886', to: 'phenomena/transfer-curves', anchor: 'end' },
      { year: 2012, zh: 'BT.2020', en: 'BT.2020', to: 'timeline/hd-uhd', gamut: 'bt2020', side: 'down', anchor: 'end' },
      { year: 2016, zh: 'BT.2100', en: 'BT.2100', to: 'phenomena/bt2100-boundary', noteZh: 'PQ / HLG', noteEn: 'PQ / HLG' },
    ],
  },
  {
    zh: '', en: '', groupZh: '压缩', groupEn: 'Compression', color: '#c45c28', from: 1995,
    stations: [
      { year: 1995, zh: 'MPEG-2', en: 'MPEG-2', to: 'timeline/compression', tipZh: 'MPEG-2 (H.262)', tipEn: 'MPEG-2 (H.262)' },
      { year: 2003, zh: 'H.264', en: 'H.264', to: 'timeline/compression', side: 'down', tipZh: 'H.264 (AVC)，MPEG-4 第 10 部分', tipEn: 'H.264 (AVC), MPEG-4 part 10' },
      { year: 2013, zh: 'H.265', en: 'H.265', to: 'timeline/compression', tipZh: 'H.265 (HEVC)，MPEG-H 第 2 部分', tipEn: 'H.265 (HEVC), MPEG-H part 2' },
      { year: 2018, zh: 'AV1', en: 'AV1', to: 'timeline/compression', side: 'down' },
      { year: 2020, zh: 'H.266', en: 'H.266', to: 'timeline/compression', tipZh: 'H.266 (VVC)', tipEn: 'H.266 (VVC)' },
      { year: 2026, zh: 'AV2', en: 'AV2', to: 'timeline/compression', side: 'down' },
    ],
  },
  {
    zh: 'AVS', en: 'AVS', color: '#c45c28', from: 2006,
    stations: [
      { year: 2006, zh: 'AVS', en: 'AVS', to: 'timeline/compression', side: 'down', tipZh: 'GB/T 20090.2', tipEn: 'GB/T 20090.2' },
      { year: 2016, zh: 'AVS2', en: 'AVS2', to: 'timeline/compression', anchor: 'end', tipZh: 'GB/T 33475.2', tipEn: 'GB/T 33475.2' },
      { year: 2020, zh: 'AVS3', en: 'AVS3', to: 'timeline/compression', side: 'down', tipZh: 'T/AI 109.2', tipEn: 'T/AI 109.2' },
    ],
  },
  {
    zh: '胶片', en: 'Film', groupZh: '胶片', groupEn: 'Film', color: '#1a2408', from: 1927, fromEdge: true,
    stations: [
      { year: 1927, zh: '24 格', en: '24 fps', to: 'timeline/film' },
      { year: 1967, zh: '3:2', en: '3:2', to: 'timeline/film', noteZh: '60 场', noteEn: '60 fields', side: 'down', tipZh: '含 23.976', tipEn: 'includes 23.976' },
      { year: 1967, zh: '2:2', en: '2:2', to: 'timeline/film', noteZh: '50 场', noteEn: '50 fields', tipZh: '24 拉成 25', tipEn: '24 pulled to 25' },
    ],
  },
]

const MARKS = [1936, 1953, 1982, 1990, 2012, 2016]
const LABEL_Y = TOP + THREADS.length * PITCH + 36
const VB_H = LABEL_Y + 8

function xOf(year: number): number {
  return X0 + ((year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (X1 - X0)
}

function triPoints(id: GamutId, cx: number, cy: number): string {
  const set = PRIMARIES[id]
  return [set.r, set.g, set.b].map(([x, y]) => {
    const px = cx + (x - 0.33) * 28
    const py = cy - (y - 0.33) * 28
    return `${px.toFixed(1)},${py.toFixed(1)}`
  }).join(' ')
}

function stationId(station: Station): string {
  return `st-${station.zh}-${station.year}`
}

type TipState = { id: string, left: number, top: number }

export function LineMap() {
  const lang = useLang()
  const zh = lang === 'zh'
  const svgRef = useRef<SVGSVGElement>(null)
  const closeTimer = useRef<number | null>(null)
  const [year, setYear] = useState(1996)
  const [tip, setTip] = useState<TipState | null>(null)
  const rows = THREADS.map((thread, index) => ({ ...thread, y: TOP + index * PITCH + 16 }))
  const open = tip ? rows.flatMap((row) => row.stations).find((station) => stationId(station) === tip.id) : undefined

  function placeTip(id: string, el: Element) {
    const rect = el.getBoundingClientRect()
    setTip({ id, left: rect.left + rect.width / 2, top: rect.top })
  }

  function cancelClose() {
    if (closeTimer.current != null) window.clearTimeout(closeTimer.current)
  }

  function scheduleClose() {
    cancelClose()
    closeTimer.current = window.setTimeout(() => setTip(null), 120)
  }

  function yearFromClient(clientX: number, clientY: number): number {
    const svg = svgRef.current
    if (!svg) return year
    const point = svg.createSVGPoint()
    point.x = clientX
    point.y = clientY
    const matrix = svg.getScreenCTM()
    if (!matrix) return year
    const local = point.matrixTransform(matrix.inverse())
    const next = YEAR_MIN + ((local.x - X0) / (X1 - X0)) * (YEAR_MAX - YEAR_MIN)
    return Math.round(Math.min(YEAR_MAX, Math.max(YEAR_MIN, next)))
  }

  function onHitDown(event: React.PointerEvent<SVGRectElement>) {
    setYear(yearFromClient(event.clientX, event.clientY))
    setTip(null)
  }

  function onGrabDown(event: React.PointerEvent<SVGRectElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    setYear(yearFromClient(event.clientX, event.clientY))
    setTip(null)
  }

  function onGrabMove(event: React.PointerEvent<SVGRectElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    setYear(yearFromClient(event.clientX, event.clientY))
  }

  function onHitKey(event: React.KeyboardEvent<SVGRectElement>) {
    if (event.key === 'ArrowLeft') setYear((value) => Math.max(YEAR_MIN, value - 1))
    if (event.key === 'ArrowRight') setYear((value) => Math.min(YEAR_MAX, value + 1))
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') event.preventDefault()
  }

  return (
    <figure className="linemap">
      <svg ref={svgRef} viewBox={`0 0 ${VB_W} ${VB_H}`} role="img">
        {MARKS.map((mark) => (
          <g key={mark}>
            <line x1={xOf(mark)} x2={xOf(mark)} y1={22} y2={LABEL_Y - 14} className="map-mark" />
            <text x={xOf(mark)} y={LABEL_Y} textAnchor="middle" className={mark <= year ? 'map-year on' : 'map-year'}>{mark}</text>
          </g>
        ))}
        {rows.map((thread) => {
          const y = thread.y
          const start = thread.fromEdge ? X0 : xOf(thread.from)
          const dashAt = thread.dashAfter ? xOf(thread.dashAfter) : X1
          return (
            <g key={`${thread.groupZh ?? ''}-${thread.zh}`}>
              {thread.groupZh ? (
                <text x={4} y={y + 4} className="map-group">{zh ? thread.groupZh : thread.groupEn}</text>
              ) : null}
              <line x1={start} y1={y} x2={Math.min(dashAt, X1)} y2={y} stroke={thread.color} strokeWidth={1.6} />
              {thread.dashAfter ? (
                <line x1={dashAt} y1={y} x2={X1} y2={y} stroke={thread.color} strokeWidth={1.6} strokeDasharray="2 3" />
              ) : null}
              {thread.zh ? <text x={X1 + 6} y={y + 3} className="map-lane">{zh ? thread.zh : thread.en}</text> : null}
            </g>
          )
        })}
        <text x={xOf(year)} y={14} textAnchor="middle" className="map-current">{year}</text>
        <line x1={xOf(year)} x2={xOf(year)} y1={20} y2={LABEL_Y - 14} className="map-now" />
        <rect
          className="map-hit"
          x={X0}
          y={0}
          width={X1 - X0}
          height={LABEL_Y}
          fill="transparent"
          onPointerDown={onHitDown}
        />
        <rect
          className="map-grab"
          x={xOf(year) - GRAB / 2}
          y={0}
          width={GRAB}
          height={LABEL_Y - 14}
          fill="transparent"
          tabIndex={0}
          role="slider"
          aria-valuemin={YEAR_MIN}
          aria-valuemax={YEAR_MAX}
          aria-valuenow={year}
          aria-label={zh ? '年份' : 'Year'}
          onPointerDown={onGrabDown}
          onPointerMove={onGrabMove}
          onKeyDown={onHitKey}
        />
        {rows.map((thread) => thread.stations.map((station) => {
          const cx = xOf(station.year)
          const cy = thread.y
          const up = station.side !== 'down'
          const labelY = up ? cy - 20 : cy + 22
          const noteY = up ? labelY - 16 : labelY + 16
          const anchor = station.anchor ?? 'start'
          const labelX = anchor === 'end' ? cx - 6 : cx + 6
          const dest = `/${lang}/${station.to}`
          const id = stationId(station)
          return (
            <a
              key={id}
              id={id}
              href={dest}
              className={station.year <= year ? 'map-station' : 'map-station ahead'}
              onMouseEnter={(event) => {
                if (!station.tipZh) return
                cancelClose()
                placeTip(id, event.currentTarget)
              }}
              onMouseLeave={() => {
                if (station.tipZh) scheduleClose()
              }}
            >
              {station.gamut ? <polygon points={triPoints(station.gamut, cx, cy)} className="map-tri" /> : null}
              <circle cx={cx} cy={cy} r={station.year <= year ? 4.5 : 3.2} className={station.year <= year ? 'on' : ''} />
              <text x={labelX} y={labelY} textAnchor={anchor} className="map-label">{zh ? station.zh : station.en}</text>
              {station.noteZh ? <text x={labelX} y={noteY} textAnchor={anchor} className="map-note">{zh ? station.noteZh : station.noteEn}</text> : null}
            </a>
          )
        }))}
      </svg>
      {tip && open?.tipZh ? (
        <div className="map-tip" style={{ left: tip.left, top: tip.top }}>
          {zh ? open.tipZh : open.tipEn}
        </div>
      ) : null}
    </figure>
  )
}
