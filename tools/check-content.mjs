import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import { analyzeLight } from '../shared/light-math.mjs'

const root = path.resolve(import.meta.dirname, '..')
const errors = []
const fail = (message) => errors.push(message)

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

function frontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null
  return yaml.load(match[1])
}

const removability = new Set(['prevent', 'invert', 'attenuate', 'baked'])
const groups = new Set(['interlace', 'progressive', 'flicker', 'color', 'clean'])
const widgets = new Set(['Alternator', 'MainsMap', 'ChromaPhase', 'Raster', 'DividerChain', 'FieldLoom', 'DisplayPath', 'Pulldown', 'LightBeat', 'TemporalWindow', 'GamutStack', 'ToneMap', 'FrameCompare', 'FilmGate', 'HandCrank', 'ImaxGauge', 'ParameterSets'])

const phenDir = path.join(root, 'content/phenomena')
const ids = fs.readdirSync(phenDir).filter((name) => fs.statSync(path.join(phenDir, name)).isDirectory())
const recipeDir = path.join(root, 'content/recipes')
const recipeIds = new Set(fs.readdirSync(recipeDir).filter((name) => name.endsWith('.yaml')).map((name) => name.replace(/\.yaml$/, '')))

for (const id of ids) {
  for (const lang of ['zh', 'en']) {
    const file = path.join(phenDir, id, `${lang}.mdx`)
    if (!fs.existsSync(file)) fail(`missing ${id}/${lang}.mdx`)
    else {
      const fm = frontmatter(read(`content/phenomena/${id}/${lang}.mdx`))
      if (!fm?.title) fail(`${id}/${lang}.mdx missing title`)
      const text = read(`content/phenomena/${id}/${lang}.mdx`)
      if (text.includes('/zh/') || text.includes('/en/')) fail(`${id}/${lang}.mdx has a hard-coded locale path`)
    }
  }
  const metaPath = path.join(phenDir, id, 'meta.yaml')
  if (!fs.existsSync(metaPath)) {
    fail(`missing ${id}/meta.yaml`)
    continue
  }
  const meta = yaml.load(read(`content/phenomena/${id}/meta.yaml`))
  if (meta.id !== id) fail(`${id} meta id is ${meta.id}`)
  if (!groups.has(meta.group)) fail(`${id} bad group`)
  if (!removability.has(meta.removability)) fail(`${id} bad removability`)
  for (const related of meta.related ?? []) {
    if (!ids.includes(related)) fail(`${id} related missing ${related}`)
  }
  for (const widget of meta.labWidgets ?? []) {
    if (!widgets.has(widget)) fail(`${id} unknown widget ${widget}`)
  }
  const recipes = meta.recipeIds ?? []
  if (recipes.length === 0) {
    if (!meta.noRecipeReason?.zh || !meta.noRecipeReason?.en) fail(`${id} needs recipeIds or noRecipeReason in both languages`)
  }
  for (const recipeId of recipes) {
    if (!recipeIds.has(recipeId)) fail(`${id} missing recipe ${recipeId}`)
  }
}

for (const lang of ['zh', 'en']) {
  const dir = path.join(root, 'content/timeline', lang)
  if (!fs.existsSync(dir)) fail(`missing timeline ${lang}`)
}
const zhSlugs = fs.readdirSync(path.join(root, 'content/timeline/zh')).sort()
const enSlugs = fs.readdirSync(path.join(root, 'content/timeline/en')).sort()
if (zhSlugs.join() !== enSlugs.join()) fail(`timeline slug mismatch ${zhSlugs} vs ${enSlugs}`)
for (const name of zhSlugs) {
  for (const lang of ['zh', 'en']) {
    const fm = frontmatter(read(`content/timeline/${lang}/${name}`))
    if (!fm?.title || !fm.summary) fail(`timeline ${lang}/${name} frontmatter`)
  }
}

for (const lang of ['zh', 'en']) {
  if (!fs.existsSync(path.join(root, 'content/glossary', `${lang}.mdx`))) fail(`missing glossary ${lang}`)
}

for (const file of fs.readdirSync(recipeDir)) {
  const recipe = yaml.load(read(`content/recipes/${file}`))
  if (!recipe.id || !recipe.diagnose || !recipe.fix || !recipe.avoid) fail(`recipe ${file} missing fields`)
  if (!recipe.title?.zh || !recipe.title?.en) fail(`recipe ${file} title`)
  if (!recipe.requires?.length) fail(`recipe ${file} requires`)
  for (const sample of recipe.samples ?? []) {
    if (!sample.id || !sample.command || !sample.zh || !sample.en) fail(`sample in ${file} incomplete`)
  }
}

const tree = yaml.load(read('content/decide/tree.yaml'))
if (!tree.nodes?.[tree.start]) fail('decision tree has no start')
for (const [id, node] of Object.entries(tree.nodes)) {
  if (!node.q?.zh || !node.q?.en) fail(`tree ${id} question`)
  for (const choice of node.choices ?? []) {
    if (choice.leaf && !ids.includes(choice.leaf)) fail(`tree leaf missing ${choice.leaf}`)
    if (choice.next && !tree.nodes[choice.next]) fail(`tree next missing ${choice.next}`)
    if (!choice.leaf && !choice.next) fail(`tree choice in ${id} goes nowhere`)
  }
}

const pal50 = analyzeLight({ mains: 50, harmonic: 2, rate: 50, shutter: 180, shutterKind: 'global' })
const pal60 = analyzeLight({ mains: 60, harmonic: 2, rate: 50, shutter: 180, shutterKind: 'global' })
const pal60frame = analyzeLight({ mains: 60, harmonic: 2, rate: 25, shutter: 180, shutterKind: 'global' })
const slow = analyzeLight({ mains: 60, harmonic: 2, rate: 60000 / 1001, shutter: 180, shutterKind: 'rolling' })
const eu = analyzeLight({ mains: 50, harmonic: 2, rate: 24, shutter: 180, shutterKind: 'global' })
const euFix = analyzeLight({ mains: 50, harmonic: 2, rate: 24, shutter: 172.8, shutterKind: 'global' })
const us = analyzeLight({ mains: 60, harmonic: 2, rate: 24, shutter: 180, shutterKind: 'rolling' })
const usFix = analyzeLight({ mains: 60, harmonic: 2, rate: 24, shutter: 144, shutterKind: 'rolling' })
const shutter150 = analyzeLight({ mains: 60, harmonic: 2, rate: 25, shutter: 150, shutterKind: 'rolling' })

function near(actual, expected, name) {
  if (Math.abs(actual - expected) > 0.02) fail(`${name}: ${actual} != ${expected}`)
}
if (pal50.verdict !== 'stable' || !pal50.integerExposure) fail('PAL 50 Hz lamp should be stable')
near(pal60.alias, 20, 'PAL 60 Hz lamp at 50 Hz')
near(pal60frame.alias, 5, '120 Hz at 25 fps')
near(slow.alias, 120 / 1001, '59.94 vs 120 Hz')
near(eu.alias, 4, '24 fps vs 100 Hz')
if (!euFix.integerExposure) fail('172.8° should be an integer exposure')
if (us.verdict !== 'frozen-bands') fail('24 fps 180° on 120 Hz should freeze bands')
if (!usFix.integerExposure || usFix.verdict !== 'stable') fail('144° should clear 120 Hz bands')
if (!shutter150.integerExposure) fail('150° at 25 fps should cover 120 Hz')

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log(`content ok: ${ids.length} phenomena, ${recipeIds.size} recipes, ${zhSlugs.length} chapters`)
