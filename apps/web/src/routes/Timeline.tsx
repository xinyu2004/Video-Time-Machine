import { Link, useParams } from 'react-router-dom'
import { TimelineDial } from '../components/TimelineDial'
import { chapter, chapters } from '../content/load'
import { useI18n, useLang } from '../i18n'

export function TimelineIndex() {
  const lang = useLang()
  const i18n = useI18n()
  return (
    <main className="page wide">
      <h1>{i18n.nav.timeline}</h1>
      <TimelineDial lang={lang} chapters={chapters(lang)} />
    </main>
  )
}

export function TimelineChapter() {
  const lang = useLang()
  const { slug = '' } = useParams()
  const item = chapter(lang, slug)
  if (!item) return <main className="page"><p>missing chapter</p></main>
  const Body = item.Component
  const list = chapters(lang)
  const index = list.findIndex((entry) => entry.slug === slug)
  const prev = list[index - 1]
  const next = list[index + 1]
  return (
    <main className="page prose">
      <p className="kicker">{String(item.order).padStart(2, '0')}</p>
      <h1>{item.title}</h1>
      <p className="lede">{item.summary}</p>
      <Body />
      <nav className="pager">
        {prev ? <Link to={`/${lang}/timeline/${prev.slug}`}>{prev.title}</Link> : <span />}
        {next ? <Link to={`/${lang}/timeline/${next.slug}`}>{next.title}</Link> : <span />}
      </nav>
    </main>
  )
}
