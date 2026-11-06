import { Link, useParams } from 'react-router-dom'
import { RecipeBlock } from '../components/RecipeBlock'
import { chapters, phenomenon, phenomenonList, recipe } from '../content/load'
import type { Group, Removability } from '../content/types'
import { useI18n, useLang } from '../i18n'

const ORDER: Group[] = ['interlace', 'progressive', 'flicker', 'color', 'clean']
const BASIC = ['mains', 'raster']

function Track({
  to,
  title,
  summary,
  commands,
  mark,
}: {
  to: string
  title: string
  summary: string
  commands?: string
  mark?: { kind: Removability; label: string }
}) {
  return (
    <li>
      <Link to={to} className="track">
        <span className="track-line">
          <strong>{title}</strong>
          <small>{summary}</small>
        </span>
      </Link>
      <span className="track-peek" aria-hidden="true">
        <strong>{title}</strong>
        <small>{summary}</small>
        {commands ? <span className="track-cmd">{commands}</span> : null}
        {mark ? <em className={`badge ${mark.kind}`}>{mark.label}</em> : null}
      </span>
    </li>
  )
}

export function PhenomenonIndex() {
  const lang = useLang()
  const i18n = useI18n()
  const items = phenomenonList(lang)
  const basics = chapters(lang).filter((item) => BASIC.includes(item.slug))
  return (
    <main className="page phenomenon-index">
      <h1>{i18n.nav.phenomena}</h1>
      <section>
        <h2>{i18n.groups.basic}</h2>
        <ul className="tracks">
          {basics.map((item) => (
            <Track
              key={item.slug}
              to={`/${lang}/timeline/${item.slug}`}
              title={item.title}
              summary={item.summary}
            />
          ))}
        </ul>
      </section>
      {ORDER.map((group) => (
        <section key={group}>
          <h2>{i18n.groups[group]}</h2>
          <ul className="tracks">
            {items.filter((item) => item.meta.group === group).map((item) => {
              const commands = item.meta.recipeIds.map((id) => recipe(id)?.title[lang] ?? id).join(' · ')
              return (
                <Track
                  key={item.meta.id}
                  to={`/${lang}/phenomena/${item.meta.id}`}
                  title={item.title}
                  summary={item.summary}
                  commands={commands}
                  mark={{ kind: item.meta.removability, label: i18n.removability[item.meta.removability] }}
                />
              )
            })}
          </ul>
        </section>
      ))}
    </main>
  )
}

export function PhenomenonPage() {
  const lang = useLang()
  const i18n = useI18n()
  const { id = '' } = useParams()
  const item = phenomenon(lang, id)
  if (!item) return <main className="page"><p>missing phenomenon</p></main>
  const Body = item.Component
  return (
    <main className="page prose">
      <p className="kicker">{i18n.groups[item.meta.group]}</p>
      <h1>{item.title}</h1>
      <p className={`badge ${item.meta.removability}`}>{i18n.removability[item.meta.removability]}</p>
      <p className="lede">{item.summary}</p>
      {item.meta.displayCaveat ? <p className="caveat">{i18n.caveat[item.meta.displayCaveat]}</p> : null}
      <Body />
      <h2>{i18n.related}</h2>
      <ul>
        {item.meta.related.map((related) => (
          <li key={related}><Link to={`/${lang}/phenomena/${related}`}>{phenomenon(lang, related)?.title ?? related}</Link></li>
        ))}
      </ul>
      {item.meta.recipeIds.length === 0 ? <p>{item.meta.noRecipeReason?.[lang] ?? i18n.recipe.none}</p> : null}
      {item.meta.recipeIds.map((recipeId) => <RecipeBlock key={recipeId} id={recipeId} />)}
    </main>
  )
}
