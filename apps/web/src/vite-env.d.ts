/// <reference types="vite/client" />

declare module '@vtm/light' {
  export type ShutterKind = 'global' | 'rolling'
  export type LightInput = {
    mains: number
    harmonic: number
    rate: number
    shutter: number
    shutterKind: ShutterKind
  }
  export type LightVerdict = 'stable' | 'frozen-bands' | 'rolling-bands' | 'global-flicker'
  export type LightPost = 'prevent' | 'attenuate' | 'baked'
  export function aliasHz(frequency: number, sampleRate: number): number
  export function exposureSeconds(rate: number, shutterDegrees: number): number
  export function nearlyInteger(value: number): boolean
  export function analyzeLight(input: LightInput): {
    fLamp: number
    exposure: number
    cycles: number
    integerExposure: boolean
    rateDivides: boolean
    alias: number
    verdict: LightVerdict
    post: LightPost
  }
  export const LIGHT_PRESETS: Array<LightInput & { id: string }>
}

declare module '*.mdx' {
  import type { ComponentType } from 'react'
  export const frontmatter: {
    title?: string
    summary?: string
    order?: number
  }
  const Component: ComponentType
  export default Component
}
