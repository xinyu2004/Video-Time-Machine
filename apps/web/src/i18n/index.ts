import { useOutletContext } from 'react-router-dom'
import zh, { type Dict } from './zh'
import en from './en'

export type Lang = 'zh' | 'en'
export type { Dict }

const tables: Record<Lang, Dict> = { zh, en }

export function isLang(value: string | undefined): value is Lang {
  return value === 'zh' || value === 'en'
}

export function useLang(): Lang {
  const ctx = useOutletContext<{ lang: Lang } | null>()
  return ctx?.lang ?? 'en'
}

export function useI18n(): Dict {
  return tables[useLang()]
}

export function text(lang: Lang): Dict {
  return tables[lang]
}
