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

/** Year order of the eight chapters on the dial. The bottom pager uses TIMELINE_WALK. */
const CHAPTER_YEAR: Record<string, number> = {
  film: 1893,
  mains: 1936,
  raster: 1941,
  ntsc: 1953,
  pal: 1967,
  bt601: 1982,
  'hd-uhd': 1990,
  compression: 1995,
}

export type TimelineChapter = {
  slug: string
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
  const time = path.match(/content\/timeline\/(zh|en)\/([a-z0-9-]+)\.mdx$/)
  if (time) {
    const lang = time[1] as Lang
    const slug = time[2]
    const list = timeline.get(lang) ?? []
    list.push({
      slug,
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
  list.sort((a, b) => (CHAPTER_YEAR[a.slug] ?? 9999) - (CHAPTER_YEAR[b.slug] ?? 9999))
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

/**
 * Bottom prev/next. One stop per page, in year order, so the film thread
 * (hand crank, 24 fps, pulldown, IMAX) sits among the chapters.
 */
const TIMELINE_WALK: Array<{ kind: 'timeline' | 'phenomena'; slug: string }> = [
  { kind: 'timeline', slug: 'film' },
  { kind: 'phenomena', slug: 'hand-crank' },
  { kind: 'phenomena', slug: 'twenty-four' },
  { kind: 'timeline', slug: 'mains' },
  { kind: 'timeline', slug: 'raster' },
  { kind: 'timeline', slug: 'ntsc' },
  { kind: 'phenomena', slug: 'composite-leftovers' },
  { kind: 'timeline', slug: 'pal' },
  { kind: 'phenomena', slug: 'film-to-60' },
  { kind: 'phenomena', slug: 'film-to-50' },
  { kind: 'phenomena', slug: 'imax-film' },
  { kind: 'timeline', slug: 'bt601' },
  { kind: 'timeline', slug: 'hd-uhd' },
  { kind: 'timeline', slug: 'compression' },
  { kind: 'phenomena', slug: 'parameter-sets' },
  { kind: 'phenomena', slug: 'imax-digital' },
  { kind: 'phenomena', slug: 'transfer-curves' },
  { kind: 'phenomena', slug: 'bt2100-boundary' },
]

export type TimelineStop = { key: string; href: string; title: string }

export function timelineStops(lang: Lang): TimelineStop[] {
  return TIMELINE_WALK.map((stop) => {
    if (stop.kind === 'timeline') {
      const item = chapter(lang, stop.slug)
      return { key: `timeline/${stop.slug}`, href: `/${lang}/timeline/${stop.slug}`, title: item?.title ?? stop.slug }
    }
    const item = phenomenon(lang, stop.slug)
    return { key: `phenomena/${stop.slug}`, href: `/${lang}/phenomena/${stop.slug}`, title: item?.title ?? stop.slug }
  })
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
