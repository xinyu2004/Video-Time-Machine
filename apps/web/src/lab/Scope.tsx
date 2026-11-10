import type { ReactNode } from 'react'
import { useI18n } from '../i18n'
import type { CaveatKind } from '../content/types'

export function Scope({
  caveat,
  controls,
  children,
}: {
  caveat?: CaveatKind
  controls?: ReactNode
  children: ReactNode
}) {
  const i18n = useI18n()
  return (
    <figure className="scope">
      {caveat ? <p className="caveat">{i18n.caveat[caveat]}</p> : null}
      {controls ? <div className="controls">{controls}</div> : null}
      {children}
    </figure>
  )
}

export function useReduceMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
