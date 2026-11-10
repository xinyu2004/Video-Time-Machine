import type { ComponentType } from 'react'

export type Removability = 'prevent' | 'invert' | 'attenuate' | 'baked'
export type Group = 'interlace' | 'progressive' | 'flicker' | 'color' | 'clean'
export type CaveatKind = 'refresh' | 'crt' | 'mechanism' | 'phase'

export type Frontmatter = {
  title?: string
  summary?: string
  order?: number
}

export type MdxModule = {
  default: ComponentType
  frontmatter?: Frontmatter
}

export type PhenomenonMeta = {
  id: string
  group: Group
  era: string
  removability: Removability
  tags: string[]
  related: string[]
  labWidgets: string[]
  recipeIds: string[]
  displayCaveat?: CaveatKind
  noRecipeReason?: { zh: string; en: string }
}

export type RecipeSample = {
  id: string
  zh: string
  en: string
}

export type Recipe = {
  id: string
  title: { zh: string; en: string }
  requires: string[]
  minVersion?: string
  diagnose: string
  fix: string
  avoid: string
  samples?: RecipeSample[]
}

export type DecideChoice = {
  label: { zh: string; en: string }
  group?: { zh: string; en: string }
  next?: string
  leaf?: string
}

export type DecideNode = {
  q: { zh: string; en: string }
  choices: DecideChoice[]
}

export type DecideTree = {
  start: string
  nodes: Record<string, DecideNode>
}
