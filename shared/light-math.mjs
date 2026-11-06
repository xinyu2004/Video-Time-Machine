/** Lamp flicker vs frame rate. Shared by the lab and the node check. */

export function aliasHz(frequency, sampleRate) {
  if (!(sampleRate > 0)) return Number.NaN
  const k = Math.round(frequency / sampleRate)
  return Math.abs(frequency - k * sampleRate)
}

export function exposureSeconds(rate, shutterDegrees) {
  return shutterDegrees / 360 / rate
}

export function nearlyInteger(value) {
  return Math.abs(value - Math.round(value)) < 1e-3
}

/**
 * @param {{ mains: number, harmonic: number, rate: number, shutter: number, shutterKind: 'global' | 'rolling' }} input
 */
export function analyzeLight(input) {
  const fLamp = input.mains * input.harmonic
  const exposure = exposureSeconds(input.rate, input.shutter)
  const cycles = exposure * fLamp
  const integerExposure = nearlyInteger(cycles)
  const rateDivides = nearlyInteger(fLamp / input.rate)
  const alias = aliasHz(fLamp, input.rate)
  let verdict = 'global-flicker'
  let post = 'attenuate'
  if (integerExposure) {
    verdict = 'stable'
    post = 'prevent'
  } else if (rateDivides && input.shutterKind === 'global') {
    verdict = 'stable'
    post = 'prevent'
  } else if (rateDivides && input.shutterKind === 'rolling') {
    verdict = 'frozen-bands'
    post = 'baked'
  } else if (input.shutterKind === 'rolling') {
    verdict = 'rolling-bands'
    post = 'baked'
  }
  return { fLamp, exposure, cycles, integerExposure, rateDivides, alias, verdict, post }
}

export const LIGHT_PRESETS = [
  { id: 'pal50', mains: 50, harmonic: 2, rate: 50, shutter: 180, shutterKind: 'global' },
  { id: 'pal60', mains: 60, harmonic: 2, rate: 50, shutter: 180, shutterKind: 'global' },
  { id: 'ntsc60', mains: 60, harmonic: 2, rate: 60, shutter: 180, shutterKind: 'global' },
  { id: 'ntsc50', mains: 50, harmonic: 2, rate: 60, shutter: 180, shutterKind: 'global' },
  { id: 'ntsc5994', mains: 60, harmonic: 2, rate: 60000 / 1001, shutter: 180, shutterKind: 'rolling' },
  { id: 'p24eu', mains: 50, harmonic: 2, rate: 24, shutter: 180, shutterKind: 'global' },
  { id: 'p24eu172', mains: 50, harmonic: 2, rate: 24, shutter: 172.8, shutterKind: 'global' },
  { id: 'p24us', mains: 60, harmonic: 2, rate: 24, shutter: 180, shutterKind: 'rolling' },
  { id: 'p24us144', mains: 60, harmonic: 2, rate: 24, shutter: 144, shutterKind: 'rolling' },
]
