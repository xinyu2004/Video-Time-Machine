import { Link, useParams } from 'react-router-dom'
import { RecipeBlock } from '../components/RecipeBlock'
import { recipe, recipeList } from '../content/load'
import { useLang } from '../i18n'

export function RecipeIndex() {
  const lang = useLang()
  return (
    <main className="page">
      <h1>{lang === 'zh' ? '配方' : 'Recipes'}</h1>
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
  const { id = '' } = useParams()
  if (!recipe(id)) return <main className="page"><p>missing recipe</p></main>
  return (
    <main className="page">
      <RecipeBlock id={id} />
    </main>
  )
}
