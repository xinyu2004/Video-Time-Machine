import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { phenomenon, type TimelineChapter } from '../content/load'
import type { Lang } from '../i18n'
import { tToYear, YEAR_MAX, yearToT } from './yearScale'

type Figure = { zh: string; en: string; noteZh: string; noteEn: string }
type Pin = {
  slug: string
  year: number
  lane: 'up' | 'down'
  zh: string
  en: string
  figures: Figure[]
  blurbZh?: string
  blurbEn?: string
  /** Chapter this pin's essay door opens. Defaults to slug when that chapter exists. */
  essay?: string
  /** Shown in the finder. Defaults from the shape. */
  kicker?: string
  /** Dial plate only. No essay link and no doors under the pin. */
  plate?: boolean
  phenomena?: string[]
}

/** Index-only. Drop a row to take that chapter off this dial; the essay stays. */
const PINS: Pin[] = [
  {
    slug: 'film', year: 1893, lane: 'down', zh: '四齿孔', en: '4-perf',
    essay: 'film',
    figures: [
      { zh: '24.9×18.7', en: '24.9×18.7', noteZh: '毫米，4:3', noteEn: 'mm, 4:3' },
      { zh: '4', en: '4', noteZh: '齿孔一格', noteEn: 'perfs a frame' },
    ],
    blurbZh: '宽卷对切成 35 毫米。两边打孔，中间剩下的是画面宽，大约 24.9 毫米。一格四个齿孔，高大约 18.7 毫米。这个格子是 4:3。',
    blurbEn: 'The roll was slit into 35mm. Holes on both edges leave a picture about 24.9 mm wide. Four perforations make one frame, about 18.7 mm high. That frame is 4:3.',
    phenomena: ['hand-crank'],
  },
  {
    slug: 'twenty-four', year: 1927, lane: 'up', zh: '24 格', en: '24 fps',
    kicker: '24',
    figures: [
      { zh: '24', en: '24', noteZh: '格', noteEn: 'fps' },
      { zh: '1.37:1', en: '1.37:1', noteZh: '学院片窗', noteEn: 'Academy' },
    ],
    blurbZh: '光学声带要恒定的线速度，格率锁在每秒 24 格。声带占掉旁边一条，学院片窗大约 1.37:1。宽银幕仍是这条四齿孔上的遮幅或压缩。',
    blurbEn: 'An optical track needs a constant speed, so the rate locked at 24 frames a second. The track takes a strip at the side. The Academy aperture is about 1.37:1. Widescreen is a mask or a squeeze on the same four-perf strip.',
    phenomena: ['twenty-four'],
  },
  {
    slug: 'mains', year: 1936, lane: 'down', zh: '场频', en: 'Fields',
    figures: [
      { zh: '50 Hz', en: '50 Hz', noteZh: '场频', noteEn: 'field rate' },
      { zh: '60 Hz', en: '60 Hz', noteZh: '场频', noteEn: 'field rate' },
    ],
    phenomena: ['light-beat', 'field-phase-lamps'],
  },
  {
    slug: 'raster', year: 1941, lane: 'up', zh: '黑白电视', en: 'B&W',
    figures: [
      { zh: '3×5×5×7', en: '3×5×5×7', noteZh: '525', noteEn: '525' },
      { zh: '5⁴', en: '5⁴', noteZh: '625', noteEn: '625' },
    ],
    phenomena: ['combing', 'psf-vs-adjacent', 'field-order', 'area-and-twitter', 'progressive-panel'],
  },
  {
    slug: 'ntsc', year: 1953, lane: 'up', zh: 'NTSC', en: 'NTSC',
    figures: [
      { zh: '455/2', en: '455/2', noteZh: '副载波', noteEn: 'subcarrier' },
      { zh: '30000/1001', en: '30000/1001', noteZh: '帧率', noteEn: 'frame rate' },
    ],
    phenomena: ['film-to-60', 'judder', 'ivtc-vs-deinterlace', 'mixed-cadence', 'slow-roll-5994'],
  },
  {
    slug: 'composite', year: 1953, lane: 'down', zh: 'CVBS', en: 'Composite',
    figures: [
      { zh: '点爬', en: 'Dot crawl', noteZh: '副载波留在亮度里', noteEn: 'subcarrier left in the luma' },
      { zh: '彩虹', en: 'Rainbow', noteZh: '副载波留在色边上', noteEn: 'subcarrier left on the edges' },
    ],
    blurbZh: '亮度和色度加在同一条线上，靠副载波错开。点爬和彩虹是这路载波留在画面上的痕迹。收成样点之后，两路已经拆不开。',
    blurbEn: 'Luma and chroma share one wire, set apart by a subcarrier. Dot crawl and rainbows are that carrier left in the picture. Once they are samples, the two signals no longer come apart.',
    phenomena: ['composite-leftovers'],
  },
  {
    slug: 'pal', year: 1967, lane: 'up', zh: 'PAL', en: 'PAL',
    figures: [{ zh: '15625 Hz', en: '15625 Hz', noteZh: '行频', noteEn: 'line rate' }],
    phenomena: ['film-to-50', 'mixed-cadence'],
  },
  {
    slug: 'imax', year: 1970, lane: 'down', zh: 'IMAX', en: 'IMAX',
    kicker: '1.43',
    figures: [
      { zh: '15/70', en: '15/70', noteZh: '横走', noteEn: 'horizontal' },
      { zh: '1.43:1', en: '1.43:1', noteZh: '69.6×48.5 mm', noteEn: '69.6×48.5 mm' },
    ],
    blurbZh: '拍摄用 65 毫米，拷贝用 70 毫米，片子横着走，一格 15 个齿孔。画幅大约 69.6 × 48.5 毫米。',
    blurbEn: 'Shot on 65mm, printed on 70mm, the strip runs sideways, fifteen perforations to a frame. The picture is about 69.6 × 48.5 mm.',
    phenomena: ['imax-film', 'imax-digital'],
  },
  {
    slug: 'bt601', year: 1982, lane: 'down', zh: 'BT.601', en: 'BT.601',
    figures: [
      { zh: '13.5 MHz', en: '13.5 MHz', noteZh: '亮度采样钟，525 与 625 共用', noteEn: 'luma clock, shared by 525 and 625' },
      { zh: '720', en: '720', noteZh: '每行有效亮度样点', noteEn: 'active luma samples on a line' },
      { zh: '0.299 / 0.587 / 0.114', en: '0.299 / 0.587 / 0.114', noteZh: '1953 年的系数，没有重算', noteEn: '1953 coefficients, not recomputed' },
    ],
    blurbZh: '这份文件规定演播室怎样把分量采成数字。它不规定压缩。荧光粉后来换了，亮度系数仍是 1953 年那一行。',
    blurbEn: 'This document says how a studio samples component video into digits. It does not specify compression. The phosphors changed later; the luma coefficients stayed the 1953 row.',
    phenomena: ['bt601-sampling', 'levels', 'pixel-aspect', 'chroma-siting', 'interlaced-chroma'],
  },
  {
    slug: 'hd-uhd', year: 1990, lane: 'up', zh: '高清', en: 'HD',
    figures: [
      { zh: '0.2126 / 0.7152 / 0.0722', en: '0.2126 / 0.7152 / 0.0722', noteZh: '709 重解', noteEn: '709, solved again' },
    ],
    phenomena: ['primaries', 'matrices', 'transfer-curves', 'tag-2020-content-709', 'bt2100-boundary'],
  },
  {
    slug: 'compression', year: 1995, lane: 'down', zh: '压缩', en: 'Codec',
    figures: [
      { zh: 'MPEG-2', en: 'MPEG-2', noteZh: '后来的留着它', noteEn: 'later ones leave it' },
    ],
    phenomena: ['parameter-sets', 'compression-artifacts'],
  },
]

function at(year: number) {
  return `calc(3.2rem + (100% - 6.4rem) * ${yearToT(year)})`
}

type Shape = 'film' | 'lamp' | 'raster' | 'ntsc' | 'pal' | 'composite' | 'both' | 'wide' | 'blocks'

function shapeOf(slug: string): Shape {
  if (slug === 'film' || slug === 'twenty-four' || slug === 'imax') return 'film'
  if (slug === 'mains') return 'lamp'
  if (slug === 'raster') return 'raster'
  if (slug === 'ntsc') return 'ntsc'
  if (slug === 'pal') return 'pal'
  if (slug === 'composite') return 'composite'
  if (slug === 'bt601') return 'both'
  if (slug === 'compression') return 'blocks'
  return 'wide'
}

function toneOf(slug: string) {
  if (slug === 'film' || slug === 'twenty-four' || slug === 'imax') return ' tone-film'
  if (slug === 'mains') return ' tone-lamp'
  if (slug === 'ntsc') return ' tone-ntsc'
  if (slug === 'pal') return ' tone-pal'
  if (slug === 'composite') return ' tone-fringe'
  if (slug === 'bt601' || slug === 'hd-uhd') return ' tone-sharp'
  return ''
}

function finderLeft(year: number) {
  return `clamp(4rem, calc(3.2rem + (100% - 6.4rem) * ${yearToT(year)}), calc(100% - 4rem))`
}

function pickLane(tied: Pin[], clientY: number, axisMid: number) {
  if (tied.length === 1) return tied[0]
  const above = clientY < axisMid
  return tied.find((pin) => pin.lane === (above ? 'up' : 'down')) ?? tied[0]
}

function chapterAt(pins: Pin[], year: number, clientY: number, axisMid: number) {
  const open = pins.filter((pin) => pin.year <= year)
  const pool = open.length > 0 ? open : pins.filter((pin) => pin.year === Math.min(...pins.map((item) => item.year)))
  const mark = open.length > 0 ? Math.max(...pool.map((pin) => pin.year)) : pool[0]?.year
  return pickLane(pool.filter((pin) => pin.year === mark), clientY, axisMid)
}

function RollYear({ year }: { year: number }) {
  const digits = String(year).padStart(4, '0').split('')
  return (
    <span className="roll-year" aria-label={String(year)}>
      {digits.map((digit, index) => (
        <span className="roll-window" key={index} aria-hidden="true">
          <span className="roll-strip" style={{ transform: `translateY(-${digit}em)` }}>
            {'0123456789'.split('').map((n) => <span key={n}>{n}</span>)}
          </span>
        </span>
      ))}
    </span>
  )
}

export function TimelineDial({ lang, chapters }: { lang: Lang; chapters: TimelineChapter[] }) {
  const zh = lang === 'zh'
  const bySlug = new Map(chapters.map((item) => [item.slug, item]))
  const pins = PINS.filter((pin) => bySlug.has(pin.essay ?? pin.slug) || (pin.phenomena?.length ?? 0) > 0)
  const axisRef = useRef<HTMLDivElement>(null)
  const playRef = useRef(1936)
  const frame = useRef(0)
  const [playYear, setPlayYear] = useState(1936)
  const [slug, setSlug] = useState('mains')

  useEffect(() => () => {
    if (frame.current) cancelAnimationFrame(frame.current)
  }, [])

  function commit(year: number) {
    playRef.current = year
    setPlayYear(year)
  }

  function stop() {
    if (frame.current) cancelAnimationFrame(frame.current)
    frame.current = 0
  }

  function scrub(clientX: number, clientY: number) {
    const axis = axisRef.current
    if (!axis || pins.length === 0) return
    stop()
    const box = axis.getBoundingClientRect()
    const t = Math.min(1, Math.max(0, (clientX - box.left) / box.width))
    const year = tToYear(t)
    const next = chapterAt(pins, year, clientY, box.top + box.height / 2)
    if (year !== playRef.current) commit(year)
    setSlug((current) => (current === next.slug ? current : next.slug))
  }

  function glide(to: number) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      commit(to)
      return
    }
    stop()
    const from = playRef.current
    const t0 = performance.now()
    const step = (now: number) => {
      const u = Math.min(1, (now - t0) / 520)
      const eased = 1 - (1 - u) ** 3
      commit(Math.round(from + (to - from) * eased))
      if (u < 1) frame.current = requestAnimationFrame(step)
    }
    frame.current = requestAnimationFrame(step)
  }

  const pin = pins.find((item) => item.slug === slug) ?? pins[0]
  if (!pin) return null
  const chapter = bySlug.get(pin.essay ?? pin.slug)
  const shared = (year: number) => pins.filter((item) => item.year === year).length > 1
  const blurb = zh ? pin.blurbZh : pin.blurbEn
  const shape = shapeOf(pin.slug)
  const ratio = pin.kicker ?? (shape === 'wide' ? '16:9' : shape === 'lamp' ? '×2' : shape === 'blocks' ? '' : '4:3')
  const doors = (pin.phenomena ?? []).flatMap((id) => {
    const item = phenomenon(lang, id)
    return item ? [item] : []
  })

  return (
    <div className="timeline-dial">
      <div
        className="dial-scale"
        role="tablist"
        aria-label={zh ? '年份' : 'Years'}
        onPointerMove={(event) => {
          if (event.pointerType === 'touch') return
          scrub(event.clientX, event.clientY)
        }}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest('.dial-pin')) return
          scrub(event.clientX, event.clientY)
        }}
      >
        <div className="dial-axis" ref={axisRef} />
        <span className="dial-end" style={{ left: at(YEAR_MAX) }}>{YEAR_MAX}</span>
        <div
          className={`finder shape-${shape}`}
          style={{ left: finderLeft(playYear) }}
        >
          {shape === 'film' ? (
            <span className="perf" aria-hidden="true"><i /><i /><i /><i /></span>
          ) : null}
          {shape === 'blocks' ? (
            <svg className="block-map" viewBox="0 0 160 90" aria-hidden="true">
              <rect className="b0" x="0" y="0" width="86" height="50" />
              <rect className="b1" x="86" y="0" width="44" height="28" />
              <rect className="b2" x="130" y="0" width="30" height="28" />
              <rect className="b1" x="86" y="28" width="74" height="22" />
              <rect className="b2" x="0" y="50" width="34" height="40" />
              <rect className="b0" x="34" y="50" width="78" height="40" />
              <rect className="b1" x="112" y="50" width="48" height="40" />
              <path className="cuts" d="M86 0 V50 M130 0 V28 M86 28 H160 M0 50 H160 M34 50 V90 M112 50 V90" />
              <path className="moves" d="M12 16 L31 21 L25.2 23 M31 21 L26 19.1 M146 86 L124 68 L129.3 69.4 M124 68 L126.4 73" />
            </svg>
          ) : null}
          <span className="gate">
            {shape === 'lamp' ? (
              <svg className="lamp-trace" viewBox="0 0 100 28" aria-hidden="true">
                <path d="M4 22 C14 22 16 4 26 4 C36 4 38 22 50 22 C62 22 64 4 74 4 C84 4 86 22 96 22" />
              </svg>
            ) : null}
            {ratio ? <span className="finder-kicker">{ratio}</span> : null}
            <span className="finder-name">{zh ? pin.zh : pin.en}</span>
          </span>
          {shape === 'film' ? (
            <span className="perf" aria-hidden="true"><i /><i /><i /><i /></span>
          ) : null}
        </div>
        {pins.map((item) => {
          const on = item.slug === pin.slug
          const past = item.year <= playYear
          return (
            <button
              key={item.slug}
              type="button"
              role="tab"
              aria-selected={on}
              className={`dial-pin ${item.lane}${toneOf(item.slug)}${on ? ' on' : ''}${past ? ' past' : ''}${shared(item.year) ? ' split' : ''}`}
              style={{ left: at(item.year) }}
              onClick={() => {
                setSlug(item.slug)
                glide(item.year)
              }}
            >
              <span className="dial-name" hidden={on}>{zh ? item.zh : item.en}</span>
              <span className="dial-year" hidden={on}>{item.year}</span>
              <span className="dial-dot" />
            </button>
          )
        })}
      </div>
      <div className="dial-plate" role="tabpanel">
        <RollYear year={playYear} />
        <div className="dial-slot">
          <div className="dial-read" key={pin.slug}>
            <div className="dial-figures">
              {pin.figures.map((figure) => (
                <p key={figure.zh}>
                  <b>{zh ? figure.zh : figure.en}</b>
                  <span>{zh ? figure.noteZh : figure.noteEn}</span>
                </p>
              ))}
            </div>
            {pin.plate ? (
              <div className="dial-notes">
                {(blurb ?? '').split(/\n\n/).map((text) => <p key={text}>{text}</p>)}
              </div>
            ) : (
              <>
                <h2>{zh ? pin.zh : pin.en}</h2>
                <p>{blurb ?? chapter?.summary}</p>
                <ul className="dial-doors">
                  {chapter ? (
                    <li>
                      <Link to={`/${lang}/timeline/${chapter.slug}`}>{chapter.title}</Link>
                    </li>
                  ) : null}
                  {doors.map((item) => (
                    <li key={item.meta.id}>
                      <Link to={`/${lang}/phenomena/${item.meta.id}`}>{item.title}</Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
