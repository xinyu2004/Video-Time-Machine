import { Navigate, useParams } from 'react-router-dom'
import { TimelineDial } from '../components/TimelineDial'
import { TimelinePager } from '../components/TimelinePager'
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
  if (slug === 'composite') return <Navigate to={`/${lang}/timeline/ntsc`} replace />
  const item = chapter(lang, slug)
  if (!item) return <main className="page"><p>missing chapter</p></main>
  const Body = item.Component
  return (
    <main className="page prose">
      <h1>{item.title}</h1>
      <p className="lede">{item.summary}</p>
      <Body />
      <TimelinePager here={`timeline/${slug}`} />
    </main>
  )
}
