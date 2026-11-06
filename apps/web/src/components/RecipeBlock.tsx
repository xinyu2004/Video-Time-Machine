import { useState } from 'react'
import { recipe } from '../content/load'
import { useI18n, useLang } from '../i18n'

function Command({ label, text }: { label: string; text: string }) {
  const i18n = useI18n()
  const [done, setDone] = useState(false)
  if (!text.trim()) return null
  return (
    <section>
      <header>
        <h4>{label}</h4>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(text.trim()).then(() => {
              setDone(true)
              window.setTimeout(() => setDone(false), 1200)
            })
          }}
        >
          {done ? i18n.recipe.copied : i18n.recipe.copy}
        </button>
      </header>
      <pre><code>{text.trim()}</code></pre>
    </section>
  )
}

export function RecipeBlock({ id }: { id: string }) {
  const lang = useLang()
  const i18n = useI18n()
  const item = recipe(id)
  if (!item) return <p className="missing">missing recipe {id}</p>
  return (
    <article className="recipe" id={id}>
      <h3>{item.title[lang]}</h3>
      <p className="meta">
        {i18n.recipe.requires}: {item.requires.join(', ')}
        {item.minVersion ? ` ≥ ${item.minVersion}` : ''}
      </p>
      <Command label={i18n.recipe.diagnose} text={item.diagnose} />
      <Command label={i18n.recipe.fix} text={item.fix} />
      <Command label={i18n.recipe.avoid} text={item.avoid} />
    </article>
  )
}
