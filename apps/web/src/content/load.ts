import yaml from 'js-yaml'
import type { DecideTree, MdxModule, PhenomenonMeta, Recipe } from './types'
import type { Lang } from '../i18n'

const mdxModules = import.meta.glob('../../../../content/**/*.mdx', { eager: true }) as Record<string, MdxModule>
const metaModules = import.meta.glob('../../../../content/phenomena/*/meta.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>
const recipeModules = import.meta.glob('../../../../content/recipes/*.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>
const treeModule = import.meta.glob('../../../../content/decide/tree.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function fileOf(path: string): string {
  return path.split('/').pop() ?? path
}

export type TimelineChapter = {
  slug: string
  order: number
  title: string
  summary: string
  Component: MdxModule['default']
}

export type PhenomenonDoc = {
  meta: PhenomenonMeta
  title: string
  summary: string
  Component: MdxModule['default']
}

const timeline = new Map<Lang, TimelineChapter[]>()
const phenomena = new Map<Lang, Map<string, PhenomenonDoc>>()
const glossaries = new Map<Lang, MdxModule>()

for (const [path, mod] of Object.entries(mdxModules)) {
  const time = path.match(/content\/timeline\/(zh|en)\/(\d+)-([a-z0-9-]+)\.mdx$/)
  if (time) {
    const lang = time[1] as Lang
    const order = Number(mod.frontmatter?.order ?? time[2])
    const slug = time[3]
    const list = timeline.get(lang) ?? []
    list.push({
      slug,
      order,
      title: mod.frontmatter?.title ?? slug,
      summary: mod.frontmatter?.summary ?? '',
      Component: mod.default,
    })
    timeline.set(lang, list)
    continue
  }
  const phen = path.match(/content\/phenomena\/([a-z0-9-]+)\/(zh|en)\.mdx$/)
  if (phen) {
    const id = phen[1]
    const lang = phen[2] as Lang
    const bag = phenomena.get(lang) ?? new Map()
    const meta = phenomenaMeta().get(id)
    if (!meta) continue
    bag.set(id, {
      meta,
      title: mod.frontmatter?.title ?? id,
      summary: mod.frontmatter?.summary ?? '',
      Component: mod.default,
    })
    phenomena.set(lang, bag)
    continue
  }
  const gloss = path.match(/content\/glossary\/(zh|en)\.mdx$/)
  if (gloss) glossaries.set(gloss[1] as Lang, mod)
}

function phenomenaMeta(): Map<string, PhenomenonMeta> {
  const map = new Map<string, PhenomenonMeta>()
  for (const [path, raw] of Object.entries(metaModules)) {
    const meta = yaml.load(raw) as PhenomenonMeta
    const dir = path.match(/phenomena\/([a-z0-9-]+)\/meta\.yaml$/)
    if (dir) map.set(dir[1], meta)
  }
  return map
}

const metaCache = phenomenaMeta()

for (const lang of ['zh', 'en'] as const) {
  const list = timeline.get(lang) ?? []
  list.sort((a, b) => a.order - b.order)
  timeline.set(lang, list)
}

const recipes = new Map<string, Recipe>()
for (const [path, raw] of Object.entries(recipeModules)) {
  const recipe = yaml.load(raw) as Recipe
  recipes.set(recipe.id || fileOf(path).replace(/\.yaml$/, ''), recipe)
}

let decideTree: DecideTree | null = null
for (const raw of Object.values(treeModule)) {
  decideTree = yaml.load(raw) as DecideTree
}

export function chapters(lang: Lang): TimelineChapter[] {
  return timeline.get(lang) ?? []
}

export function chapter(lang: Lang, slug: string): TimelineChapter | undefined {
  return chapters(lang).find((item) => item.slug === slug)
}

export function phenomenonList(lang: Lang): PhenomenonDoc[] {
  return [...(phenomena.get(lang)?.values() ?? [])].sort((a, b) => a.title.localeCompare(b.title, lang))
}

export function phenomenon(lang: Lang, id: string): PhenomenonDoc | undefined {
  return phenomena.get(lang)?.get(id)
}

export function phenomenonMeta(id: string): PhenomenonMeta | undefined {
  return metaCache.get(id)
}

export function recipe(id: string): Recipe | undefined {
  return recipes.get(id)
}

export function recipeList(): Recipe[] {
  return [...recipes.values()].sort((a, b) => a.id.localeCompare(b.id))
}

export function glossary(lang: Lang): MdxModule | undefined {
  return glossaries.get(lang)
}

export function tree(): DecideTree {
  if (!decideTree) throw new Error('missing content/decide/tree.yaml')
  return decideTree
}
