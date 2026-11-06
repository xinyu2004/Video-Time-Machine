import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import yaml from 'js-yaml'

const root = path.resolve(import.meta.dirname, '..')
const recipeDir = path.join(root, 'content/recipes')

try {
  execFileSync('ffmpeg', ['-hide_banner', '-version'], { stdio: 'ignore' })
} catch {
  console.error('ffmpeg is not on PATH')
  process.exit(1)
}

let count = 0
for (const file of fs.readdirSync(recipeDir)) {
  const recipe = yaml.load(fs.readFileSync(path.join(recipeDir, file), 'utf8'))
  for (const sample of recipe.samples ?? []) {
    const outDir = path.join(root, 'media/generated', sample.id)
    fs.rmSync(outDir, { recursive: true, force: true })
    fs.mkdirSync(outDir, { recursive: true })
    console.log('render', sample.id)
    execFileSync('bash', ['-lc', sample.command], { cwd: root, stdio: 'inherit' })
    const frames = fs.readdirSync(outDir).filter((name) => name.endsWith('.png')).sort()
    if (frames.length === 0) {
      console.error(`no frames for ${sample.id}`)
      process.exit(1)
    }
    fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify({ count: frames.length, zh: sample.zh, en: sample.en }, null, 2))
    count += 1
  }
}
console.log(`rendered ${count} samples`)
