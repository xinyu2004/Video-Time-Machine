import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

export const root = path.resolve(import.meta.dirname, '..')
const H = {
  zh: ['你看到什么', '信号链上的哪一层', '如何确认', '实验室', '能否消除', '处理原则', '不要做的事'],
  en: ['What you see', 'Where on the chain', 'How to tell', 'Lab', 'Can it be removed', 'What to do', 'What not to do'],
}

function body(lang, parts, widget) {
  return H[lang].map((heading, i) => {
    const extra = i === 3 && widget ? `\n\n${widget}` : ''
    return `## ${heading}\n\n${parts[i]}${extra}`
  }).join('\n\n')
}

export function writePhenomenon(entry) {
  const dir = path.join(root, 'content/phenomena', entry.id)
  fs.mkdirSync(dir, { recursive: true })
  for (const lang of ['zh', 'en']) {
    const copy = entry[lang]
    const text = `---\ntitle: ${JSON.stringify(copy.title)}\nsummary: ${JSON.stringify(copy.summary)}\n---\n\n${body(lang, copy.parts, entry.widget || '')}\n`
    fs.writeFileSync(path.join(dir, `${lang}.mdx`), text)
  }
  const meta = {
    id: entry.id,
    group: entry.group,
    era: entry.era,
    removability: entry.removability,
    tags: entry.tags,
    related: entry.related,
    labWidgets: entry.labWidgets,
    recipeIds: entry.recipeIds,
  }
  if (entry.displayCaveat) meta.displayCaveat = entry.displayCaveat
  if (entry.noRecipeReason) meta.noRecipeReason = entry.noRecipeReason
  fs.writeFileSync(path.join(dir, 'meta.yaml'), yaml.dump(meta, { lineWidth: 120 }))
}

export function writeYaml(rel, value) {
  const file = path.join(root, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, yaml.dump(value, { lineWidth: 120, noRefs: true }))
}
