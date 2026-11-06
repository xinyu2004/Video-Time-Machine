import { glossary } from '../content/load'
import { useI18n, useLang } from '../i18n'

export function Glossary() {
  const lang = useLang()
  const i18n = useI18n()
  const page = glossary(lang)
  if (!page) return <main className="page"><p>missing glossary</p></main>
  const Body = page.default
  return (
    <main className="page prose glossary">
      <h1>{i18n.nav.glossary}</h1>
      <Body />
    </main>
  )
}
