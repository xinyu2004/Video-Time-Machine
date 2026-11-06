import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { chapter, phenomenon } from '../content/load'
import type { CaveatKind } from '../content/types'
import { useI18n, useLang } from '../i18n'
import {
  Alternator,
  ChromaPhase,
  DisplayPath,
  DividerChain,
  FieldLoom,
  FrameCompare,
  GamutStack,
  LightBeat,
  MainsMap,
  Pulldown,
  Raster,
  TemporalWindow,
  ToneMap,
} from '../lab'

export function TLink({ slug, children }: { slug: string; children?: ReactNode }) {
  const lang = useLang()
  const item = chapter(lang, slug)
  return <Link to={`/${lang}/timeline/${slug}`}>{children ?? item?.title ?? slug}</Link>
}

export function PLink({ id, children }: { id: string; children?: ReactNode }) {
  const lang = useLang()
  const item = phenomenon(lang, id)
  return <Link to={`/${lang}/phenomena/${id}`}>{children ?? item?.title ?? id}</Link>
}

export function Caveat({ kind = 'diagram' }: { kind?: CaveatKind }) {
  const i18n = useI18n()
  return <p className="caveat">{i18n.caveat[kind]}</p>
}

export function SignalChain() {
  const i18n = useI18n()
  return (
    <ol className="signal">
      {i18n.chain.map((label) => (
        <li key={label}>{label}</li>
      ))}
    </ol>
  )
}

export const mdxComponents = {
  TLink,
  PLink,
  Caveat,
  SignalChain,
  Alternator,
  ChromaPhase,
  MainsMap,
  Raster,
  DividerChain,
  FieldLoom,
  DisplayPath,
  Pulldown,
  LightBeat,
  TemporalWindow,
  GamutStack,
  ToneMap,
  FrameCompare,
}
