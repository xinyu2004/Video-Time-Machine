import { useMemo, useState, type CSSProperties, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../i18n'
import world from './world-110m.json'
import { JAPAN_CUT_LON, REGIONS, japanSide, type AnalogTv, type MainsHz, type RegionRow } from './mains-regions'

type Ring = number[][]
type Geom =
  | { type: 'Polygon'; coordinates: Ring[] }
  | { type: 'MultiPolygon'; coordinates: Ring[][] }
type Feature = { id: string; name: string; geometry: Geom }

const FEATURES = (world as { features: Feature[] }).features
const W = 960
const H = 460

const HZ_FILL: Record<MainsHz, string> = {
  50: '#e09a3e',
  60: '#3c7dd9',
  split: '#8d6bb5',
  mixed: '#8d6bb5',
}
const TV_FILL: Record<AnalogTv, string> = {
  ntsc: '#d4533a',
  pal: '#2f8f4e',
  secam: '#1f4e79',
  'pal-m': '#c45c28',
  'pal-n': '#6a8f2a',
  mixed: '#8d6bb5',
}
const UNLISTED = '#e4dccf'
const SNAP_KM = 160

type Layer = 'hz' | 'tv'
type Hit = { id: string; lon: number | null; lat: number | null }

const SAMPLES: { id: string; lon: number | null; zh: string; en: string }[] = [
  { id: 'CHN', lon: null, zh: '中国', en: 'China' },
  { id: 'JPN', lon: 139.7, zh: '日本东部', en: 'East Japan' },
  { id: 'JPN', lon: 135.5, zh: '日本西部', en: 'West Japan' },
  { id: 'BRA', lon: null, zh: '巴西', en: 'Brazil' },
  { id: 'ARG', lon: null, zh: '阿根廷', en: 'Argentina' },
  { id: 'CHL', lon: null, zh: '智利', en: 'Chile' },
  { id: 'FRA', lon: null, zh: '法国', en: 'France' },
  { id: 'RUS', lon: null, zh: '俄罗斯', en: 'Russia' },
  { id: 'USA', lon: null, zh: '美国', en: 'United States' },
]

export function MainsMap() {
  const lang = useLang()
  const [layer, setLayer] = useState<Layer>('hz')
  const [hit, setHit] = useState<Hit | null>({ id: 'CHN', lon: null, lat: null })
  const [query, setQuery] = useState('')
  const [geoNote, setGeoNote] = useState('')
  const paths = useMemo(() => FEATURES.map((feature) => ({ feature, d: pathOf(feature.geometry) })), [])
  const cutX = xOf(JAPAN_CUT_LON)
  const matches = query.trim()
    ? FEATURES.filter((feature) => {
        const row = REGIONS[feature.id]
        const hay = `${feature.name} ${row?.zh ?? ''} ${feature.id}`.toLowerCase()
        return hay.includes(query.trim().toLowerCase())
      }).slice(0, 8)
    : []

  function choose(id: string, lon: number | null, lat: number | null) {
    setHit({ id, lon, lat })
    setGeoNote('')
  }

  function locate(lon: number, lat: number) {
    const inside = FEATURES.find((item) => contains(item.geometry, lon, lat))
    if (inside) {
      choose(inside.id, lon, lat)
      return
    }
    let nearest: Feature | null = null
    let nearestKm = Infinity
    for (const item of FEATURES) {
      const km = kmToGeometry(lon, lat, item.geometry)
      if (km < nearestKm) {
        nearestKm = km
        nearest = item
      }
    }
    if (nearest && nearestKm <= SNAP_KM) {
      setHit({ id: nearest.id, lon, lat })
      setGeoNote(lang === 'zh'
        ? '这个点在国界外面，按最近的国界归到该地区。'
        : 'This point sits outside the border. It is assigned to the nearest outline.')
      return
    }
    setHit(null)
    setGeoNote(lang === 'zh' ? '这个点离最近的国界太远。' : 'This point is too far from the nearest border.')
  }

  function onPointer(event: MouseEvent<SVGSVGElement>) {
    const svg = event.currentTarget
    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY
    const matrix = svg.getScreenCTM()
    if (!matrix) return
    const local = point.matrixTransform(matrix.inverse())
    locate(local.x / W * 360 - 180, 90 - local.y / H * 180)
  }

  function geolocate() {
    if (!navigator.geolocation) {
      setGeoNote(lang === 'zh' ? '这只浏览器没有定位。' : 'This browser has no geolocation.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => locate(position.coords.longitude, position.coords.latitude),
      () => setGeoNote(lang === 'zh' ? '没有拿到定位。可以点地图，或搜国家。' : 'Location was not available. Click the map, or search a country.'),
    )
  }

  const feature = FEATURES.find((item) => item.id === hit?.id)

  return (
    <figure className="atlas">
      <p className="caveat">
        {lang === 'zh'
          ? '模拟时代的市电和彩色制式，不是现在的数字电视。点在国界里就选中该国。小岛往往比光标小，点在界外约 160 公里内按最近的国界算。市电层上的斜线是 SECAM。日本的分界是约 138.6°E 的一条经线，不是实测的富士川。'
          : 'Analog-era mains and color system, not today’s digital television. A click inside a border selects that country. Islands are often smaller than the pointer; a click within about 160 km outside is assigned to the nearest border. Diagonal marks on the mains layer are SECAM. Japan’s cut is a meridian near 138.6°E, not a survey of the Fuji River.'}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" onClick={onPointer}>
        <title>{lang === 'zh' ? '市电频率与模拟彩色制式' : 'Mains frequency and analog color system'}</title>
        <defs>
          <clipPath id="japan-east"><rect x={cutX} y={0} width={W - cutX} height={H} /></clipPath>
          <clipPath id="japan-west"><rect x={0} y={0} width={cutX} height={H} /></clipPath>
          <pattern id="secam-hatch" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(40)">
            <line x1="0" y1="0" x2="0" y2="7" stroke="#1f4e79" strokeWidth="2" />
          </pattern>
        </defs>
        {paths.map(({ feature: item, d }) => {
          if (layer === 'hz' && item.id === 'JPN') {
            return (
              <g key={item.id}>
                <path d={d} fill={HZ_FILL[60]} clipPath="url(#japan-west)" />
                <path d={d} fill={HZ_FILL[50]} clipPath="url(#japan-east)" />
                <path d={d} fill="none" stroke={hit?.id === 'JPN' ? '#241c14' : '#8a7d6d'} strokeWidth={hit?.id === 'JPN' ? 1.4 : 0.4} />
              </g>
            )
          }
          return (
            <path
              key={item.id}
              d={d}
              fill={fillOf(item.id, layer)}
              stroke={hit?.id === item.id ? '#241c14' : '#8a7d6d'}
              strokeWidth={hit?.id === item.id ? 1.4 : 0.4}
            />
          )
        })}
        {layer === 'hz'
          ? paths.filter(({ feature: item }) => REGIONS[item.id]?.tv === 'secam').map(({ feature: item, d }) => (
            <path key={`secam-${item.id}`} d={d} fill="url(#secam-hatch)" stroke="none" />
          ))
          : null}
        {layer === 'hz' ? <line x1={cutX} y1={yOf(45.5)} x2={cutX} y2={yOf(30)} stroke="#241c14" strokeDasharray="3 2" strokeWidth={1} /> : null}
      </svg>
      <div className="legend">
        {layer === 'hz' ? (
          <>
            <i style={{ background: HZ_FILL[50] }} /> 50 Hz
            <i style={{ background: HZ_FILL[60] }} /> 60 Hz
            <i style={{ background: HZ_FILL.mixed }} /> {lang === 'zh' ? '记载不一致' : 'Sources disagree'}
            <i style={{ background: 'repeating-linear-gradient(135deg, #1f4e79 0 2px, #e09a3e 2px 6px)' }} /> SECAM
            <i style={{ background: UNLISTED }} /> {lang === 'zh' ? '未列入' : 'Unlisted'}
          </>
        ) : (
          <>
            <i style={{ background: TV_FILL.ntsc }} /> NTSC
            <i style={{ background: TV_FILL.pal }} /> PAL
            <i style={{ background: TV_FILL.secam }} /> SECAM
            <i style={{ background: TV_FILL['pal-m'] }} /> PAL-M
            <i style={{ background: TV_FILL['pal-n'] }} /> PAL-N
            <i style={{ background: TV_FILL.mixed }} /> {lang === 'zh' ? '不止一种' : 'More than one'}
          </>
        )}
      </div>
      <div className="layers" role="group" aria-label={lang === 'zh' ? '涂色' : 'Coloring'}>
        <button type="button" aria-pressed={layer === 'hz'} onClick={() => setLayer('hz')}>
          <span className="chips" aria-hidden="true">
            <i style={{ background: HZ_FILL[50] }} />
            <i style={{ background: HZ_FILL[60] }} />
          </span>
          {lang === 'zh' ? '市电频率' : 'Mains frequency'}
        </button>
        <button type="button" aria-pressed={layer === 'tv'} onClick={() => setLayer('tv')}>
          <span className="chips" aria-hidden="true">
            <i style={{ background: TV_FILL.ntsc }} />
            <i style={{ background: TV_FILL.pal }} />
            <i style={{ background: TV_FILL.secam }} />
          </span>
          {lang === 'zh' ? '彩色制式' : 'Color system'}
        </button>
      </div>
      <p className="note">
        {lang === 'zh'
          ? '点其中一层，地图和下面的国家一起换颜色。'
          : 'Choose a layer. The map and the countries below change together.'}
      </p>
      <div className="controls">
        <button type="button" onClick={geolocate}>{lang === 'zh' ? '用我的位置' : 'Use my location'}</button>
        <label>
          {lang === 'zh' ? '国家' : 'Country'}
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={lang === 'zh' ? '中国 / Japan' : 'Japan / 中国'} />
        </label>
      </div>
      {matches.length > 0 ? (
        <div className="controls">
          {matches.map((item) => (
            <button key={item.id} type="button" style={paintFor(item.id, null, layer)} onClick={() => choose(item.id, null, null)}>
              {lang === 'zh' ? (REGIONS[item.id]?.zh ?? item.name) : item.name}
            </button>
          ))}
        </div>
      ) : null}
      <div className="samples">
        {SAMPLES.map((sample) => (
          <button
            key={`${sample.id}-${sample.lon}`}
            type="button"
            aria-pressed={sampleSelected(sample, hit)}
            style={paintFor(sample.id, sample.lon, layer)}
            onClick={() => choose(sample.id, sample.lon, sample.lon === null ? null : 36)}
          >
            {lang === 'zh' ? sample.zh : sample.en}
          </button>
        ))}
      </div>
      <Readout lang={lang} feature={feature} lon={hit?.lon ?? null} />
      {geoNote ? <p className="note">{geoNote}</p> : null}
    </figure>
  )
}

function Readout({ lang, feature, lon }: { lang: 'zh' | 'en'; feature: Feature | undefined; lon: number | null }) {
  if (!feature) return <p className="note">{lang === 'zh' ? '点一个国家。' : 'Click a country.'}</p>
  const row = REGIONS[feature.id]
  const name = lang === 'zh' ? (row?.zh ?? feature.name) : feature.name
  if (!row) return <p className="note">{lang === 'zh' ? `${name}：这张表没有写。` : `${name}: not in this table.`}</p>
  const pills: { key: string; text: string; style: CSSProperties }[] = []
  if (feature.id === 'JPN') {
    const side = lon === null ? null : japanSide(lon)
    if (side === 50 || side === 60) {
      pills.push({ key: 'hz', text: lang === 'zh' ? `市电大约 ${side} Hz` : `mains about ${side} Hz`, style: hzStyle(side, false) })
    } else if (side === null) {
      pills.push({ key: 'east', text: lang === 'zh' ? '东边大约 50 Hz' : 'east about 50 Hz', style: hzStyle(50, false) })
      pills.push({ key: 'west', text: lang === 'zh' ? '西边大约 60 Hz' : 'west about 60 Hz', style: hzStyle(60, false) })
    }
    pills.push({ key: 'tv', text: 'NTSC', style: tvStyle('ntsc') })
    const tail = side === 'edge'
      ? (lang === 'zh'
        ? '这个点靠近 138.6°E。东侧多半是 50 Hz，西侧多半是 60 Hz。不要把这条经线当成一个确定的赫兹。'
        : 'This point is near 138.6°E. East is mostly 50 Hz, west mostly 60 Hz. Do not treat the meridian as a single hertz.')
      : (lang === 'zh' ? '分界是近似的。' : 'The cut is approximate.')
    return (
      <div className="result">
        <span className="name">{name}</span>
        {pills.map((pill) => <span key={pill.key} className="pill" style={pill.style}>{pill.text}</span>)}
        <span className="name">{tail}</span>
      </div>
    )
  }
  pills.push({ key: 'hz', text: hzLabel(lang, row), style: hzStyle(row.hz, row.tv === 'secam') })
  pills.push({ key: 'tv', text: tvLabel(lang, row), style: tvStyle(row.tv) })
  return (
    <div className="result">
      <span className="name">{name}</span>
      {pills.map((pill) => <span key={pill.key} className="pill" style={pill.style}>{pill.text}</span>)}
      {row.tv === 'pal-m' || row.tv === 'pal-n' ? (
        <Link to={`/${lang}/timeline/pal`}>{lang === 'zh' ? '算法在 PAL 一章。' : 'The arithmetic is in the PAL chapter.'}</Link>
      ) : null}
    </div>
  )
}

function hzStyle(hz: MainsHz | undefined, secam: boolean): CSSProperties {
  const fill = hz === 50 || hz === 60 ? HZ_FILL[hz] : hz === 'mixed' || hz === 'split' ? HZ_FILL.mixed : UNLISTED
  return {
    background: secam && (hz === 50 || hz === 60)
      ? `repeating-linear-gradient(135deg, #1f4e79 0 2px, ${fill} 2px 6px)`
      : fill,
    color: inkFor(fill),
  }
}

function tvStyle(tv: AnalogTv | undefined): CSSProperties {
  const fill = tv ? TV_FILL[tv] : UNLISTED
  return { background: fill, color: inkFor(fill) }
}

function hzLabel(lang: 'zh' | 'en', row: RegionRow): string {
  if (row.hz === 50 || row.hz === 60) return lang === 'zh' ? `市电 ${row.hz} Hz` : `mains ${row.hz} Hz`
  if (row.hz === 'mixed') return lang === 'zh' ? '市电 50 Hz 和 60 Hz 都有记载' : 'both 50 Hz and 60 Hz are on record'
  if (row.hz === 'split') return lang === 'zh' ? '市电分成两块' : 'mains is split'
  return lang === 'zh' ? '市电未列入' : 'mains unlisted'
}

function tvLabel(lang: 'zh' | 'en', row: RegionRow): string {
  if (!row.tv) return lang === 'zh' ? '彩色制式未列入' : 'color system unlisted'
  if (row.tv === 'mixed') return lang === 'zh' ? '彩色制式不止一种' : 'more than one color system'
  if (row.tv === 'pal-m') {
    return lang === 'zh'
      ? 'PAL-M：525 行，(909/4)×彩色行频 ≈ 3.575612 MHz'
      : 'PAL-M: 525 lines, (909/4)×color line rate ≈ 3.575612 MHz'
  }
  if (row.tv === 'pal-n') {
    return lang === 'zh'
      ? 'PAL-N：625 行，(917/4 + 1/625)×15625 = 3.58205625 MHz'
      : 'PAL-N: 625 lines, (917/4 + 1/625)×15625 = 3.58205625 MHz'
  }
  return row.tv === 'ntsc' ? 'NTSC' : row.tv === 'pal' ? 'PAL' : 'SECAM'
}

function fillOf(id: string, layer: Layer): string {
  const row = REGIONS[id]
  if (!row) return UNLISTED
  if (layer === 'hz') return row.hz === undefined ? UNLISTED : HZ_FILL[row.hz]
  return row.tv === undefined ? UNLISTED : TV_FILL[row.tv]
}

function paintFor(id: string, lon: number | null, layer: Layer): CSSProperties {
  const row = REGIONS[id]
  if (!row) return { background: UNLISTED, color: '#241c14' }
  if (layer === 'hz') {
    const hz = id === 'JPN' && lon !== null ? (lon > JAPAN_CUT_LON ? 50 : 60) : row.hz
    const fill = hz === 50 || hz === 60 ? HZ_FILL[hz] : hz === 'mixed' || hz === 'split' ? HZ_FILL.mixed : UNLISTED
    return {
      background: row.tv === 'secam'
        ? `repeating-linear-gradient(135deg, #1f4e79 0 2px, ${fill} 2px 6px)`
        : fill,
      color: inkFor(fill),
    }
  }
  const fill = row.tv ? TV_FILL[row.tv] : UNLISTED
  return { background: fill, color: inkFor(fill) }
}

function inkFor(hex: string): string {
  const n = Number.parseInt(hex.slice(1), 16)
  const y = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)
  return y > 150 ? '#241c14' : '#f7f1e6'
}

function sampleSelected(sample: { id: string; lon: number | null }, hit: Hit | null): boolean {
  if (!hit || hit.id !== sample.id) return false
  if (sample.id !== 'JPN') return true
  if (sample.lon === null || hit.lon === null) return false
  const side = japanSide(hit.lon)
  const want = sample.lon > JAPAN_CUT_LON ? 50 : 60
  return side === want
}

function xOf(lon: number): number {
  return ((lon + 180) / 360) * W
}

function yOf(lat: number): number {
  return ((90 - lat) / 180) * H
}

function pathOf(geometry: Geom): string {
  let d = ''
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  for (const polygon of polygons) {
    for (const ring of polygon) {
      ring.forEach((point, index) => {
        const x = xOf(point[0])
        const y = yOf(point[1])
        d += `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `
      })
      d += 'Z '
    }
  }
  return d
}

function contains(geometry: Geom, lon: number, lat: number): boolean {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  return polygons.some((polygon) => {
    if (!inRing(lon, lat, polygon[0])) return false
    return !polygon.slice(1).some((hole) => inRing(lon, lat, hole))
  })
}

function kmToGeometry(lon: number, lat: number, geometry: Geom): number {
  let nearest = Infinity
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  for (const polygon of polygons) {
    for (const ring of polygon) nearest = Math.min(nearest, kmToRing(lon, lat, ring))
  }
  return nearest
}

function kmToRing(lon: number, lat: number, ring: Ring): number {
  let nearest = Infinity
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    if (Math.abs(ring[i][0] - ring[j][0]) > 30) continue
    nearest = Math.min(nearest, kmToSegment(lon, lat, ring[j], ring[i]))
  }
  return nearest
}

function kmToSegment(lon: number, lat: number, a: number[], b: number[]): number {
  const scale = Math.cos((lat * Math.PI) / 180) * 111
  const ax = (a[0] - lon) * scale
  const ay = (a[1] - lat) * 111
  const bx = (b[0] - lon) * scale
  const by = (b[1] - lat) * 111
  const abx = bx - ax
  const aby = by - ay
  const length2 = abx * abx + aby * aby
  if (length2 === 0) return Math.hypot(ax, ay)
  const t = Math.max(0, Math.min(1, (-ax * abx + -ay * aby) / length2))
  return Math.hypot(ax + abx * t, ay + aby * t)
}

function inRing(lon: number, lat: number, ring: Ring): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    const crosses = (yi > lat) !== (yj > lat)
    if (crosses && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
