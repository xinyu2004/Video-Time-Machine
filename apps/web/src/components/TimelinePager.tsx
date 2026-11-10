import { Link } from 'react-router-dom'
import { timelineStops } from '../content/load'
import { useLang } from '../i18n'

export function TimelinePager({ here }: { here: string }) {
  const lang = useLang()
  const stops = timelineStops(lang)
  const index = stops.findIndex((stop) => stop.key === here)
  if (index < 0) return null
  const prev = stops[index - 1]
  const next = stops[index + 1]
  return (
    <nav className="pager">
      {prev ? <Link className="prev" to={prev.href}>← {prev.title}</Link> : <span />}
      {next ? <Link className="next" to={next.href}>{next.title} →</Link> : <span />}
    </nav>
  )
}
