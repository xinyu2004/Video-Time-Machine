/**
 * Check that the site and the sample recipes can run.
 * Does not install anything, and does not compare with the latest release.
 * Versions below the ones we tried are warnings. Exit 1 only when a required tool is missing.
 */

import { execFileSync } from 'node:child_process'

const TRIED_NODE = [22, 0]
const TRIED_FFMPEG = [6, 1]
const REQUIRED_FILTERS = ['bwdif', 'colorspace', 'deflicker']
const OPTIONAL_FILTERS = ['zscale']

const yellow = process.env.NO_COLOR ? (text) => text : (text) => `\x1b[33m${text}\x1b[0m`
const warnings = []
const blockers = []

function versionAtLeast(got, min) {
  for (let i = 0; i < min.length; i += 1) {
    const a = got[i] ?? 0
    const b = min[i]
    if (a > b) return true
    if (a < b) return false
  }
  return true
}

function parseVersion(text) {
  const match = text.match(/(\d+)\.(\d+)(?:\.(\d+))?/)
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)]
}

function note(line) {
  warnings.push(line)
}

function block(line) {
  blockers.push(line)
}

const nodeVersion = parseVersion(process.version)
console.log(`node ${process.version}`)
if (!nodeVersion || !versionAtLeast(nodeVersion, TRIED_NODE)) {
  note(`Node ${process.version} is older than the Node 22 we tried. The site may still run.`)
}

let ffmpegVersionText = ''
try {
  ffmpegVersionText = execFileSync('ffmpeg', ['-hide_banner', '-version'], { encoding: 'utf8' })
} catch {
  block('ffmpeg is not on PATH. npm run samples needs it.')
}

if (ffmpegVersionText) {
  const firstLine = ffmpegVersionText.split('\n')[0]
  console.log(firstLine)
  const ffmpegVersion = parseVersion(firstLine)
  if (!ffmpegVersion) {
    note('Could not read the FFmpeg version. Commands were tried on 6.1 and 8.0.')
  } else if (!versionAtLeast(ffmpegVersion, TRIED_FFMPEG)) {
    note(`This FFmpeg is older than the 6.1 we tried. Samples may still render.`)
  }

  let filterList = ''
  try {
    filterList = execFileSync('ffmpeg', ['-hide_banner', '-filters'], { encoding: 'utf8' })
  } catch {
    block('ffmpeg -filters failed, so the recipe filters could not be checked.')
  }
  if (filterList) {
    for (const name of REQUIRED_FILTERS) {
      if (new RegExp(`\\b${name}\\b`).test(filterList)) console.log(`filter ${name}`)
      else block(`ffmpeg has no ${name} filter. The interlace, matrix, and deflicker recipes need it.`)
    }
    for (const name of OPTIONAL_FILTERS) {
      if (new RegExp(`\\b${name}\\b`).test(filterList)) console.log(`filter ${name}`)
      else note('ffmpeg has no zscale filter (that build needs libzimg). This repo’s commands use colorspace for the matrix change.')
    }
  }
}

if (warnings.length) {
  console.log(yellow('\nNote:'))
  for (const line of warnings) console.log(yellow(`- ${line}`))
}

if (blockers.length) {
  console.log(yellow('\nCannot run the samples:'))
  for (const line of blockers) console.log(yellow(`- ${line}`))
  console.log(yellow('\nnpm run doctor does not install these.'))
  process.exit(1)
}

console.log(warnings.length ? yellow('prerequisites ok, with notes above') : 'prerequisites ok')
