import { Link, useParams } from 'react-router-dom'
import { RecipeBlock } from '../components/RecipeBlock'
import { FrameCompare } from '../lab/FrameCompare'
import { phenomenonList, recipe, recipeList } from '../content/load'
import { useI18n, useLang } from '../i18n'

export function RecipeIndex() {
  const lang = useLang()
  const i18n = useI18n()
  return (
    <main className="page">
      <h1>{i18n.nav.recipes}</h1>
      <p className="lede">{i18n.recipe.pipeline}</p>
      <ul className="index plain">
        {recipeList().map((item) => (
          <li key={item.id}>
            <Link to={`/${lang}/recipes/${item.id}`}>
              <strong>{item.title[lang]}</strong>
              <small>{item.id}</small>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}

export function RecipePage() {
  const lang = useLang()
  const i18n = useI18n()
  const { id = '' } = useParams()
  const item = recipe(id)
  if (!item) return <main className="page"><p>missing recipe</p></main>
  const owners = phenomenonList(lang).filter((entry) => entry.meta.recipeIds.includes(id))
  const samples = (item.samples ?? []).map((sample) => sample.id).join(',')
  return (
    <main className="page">
      <p className="kicker">{i18n.nav.recipes}</p>
      <p className="lede">{i18n.recipe.step}</p>
      <RecipeBlock id={id} />
      {samples ? <FrameCompare samples={samples} /> : null}
      {owners.length > 0 ? (
        <>
          <h2>{i18n.recipe.usedBy}</h2>
          <ul>
            {owners.map((entry) => (
              <li key={entry.meta.id}>
                <Link to={`/${lang}/phenomena/${entry.meta.id}`}>{entry.title}</Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </main>
  )
}
