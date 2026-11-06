import { useEffect, useState } from 'react'
import { Scope } from './Scope'
import { useI18n, useLang } from '../i18n'

type Manifest = { count: number; zh?: string; en?: string }

function sampleUrl(id: string, file: string) {
  return `${import.meta.env.BASE_URL}media/generated/${id}/${file}`
}

export function FrameCompare({ samples = 'adjacent-weave,adjacent-bob,adjacent-yadif,adjacent-bwdif' }: { samples?: string }) {
  const i18n = useI18n()
  const lang = useLang()
  const ids = samples.split(',').map((item) => item.trim()).filter(Boolean)
  const [frame, setFrame] = useState(0)
  const [meta, setMeta] = useState<Record<string, Manifest>>({})

  useEffect(() => {
    let cancelled = false
    Promise.all(
      ids.map(async (id) => {
        const response = await fetch(sampleUrl(id, 'manifest.json'))
        if (!response.ok) return [id, { count: 0 }] as const
        const body = (await response.json()) as Manifest
        return [id, body] as const
      }),
    ).then((pairs) => {
      if (cancelled) return
      setMeta(Object.fromEntries(pairs.filter((pair): pair is readonly [string, Manifest] => pair[1] !== undefined)))
    })
    return () => {
      cancelled = true
    }
  }, [samples])

  const max = Math.max(0, ...Object.values(meta).map((item) => item.count))
  const shown = max === 0 ? 0 : frame % max

  return (
    <Scope
      caveat="diagram"
      controls={
        max > 1 ? (
          <>
            <button type="button" onClick={() => setFrame((n) => (n + max - 1) % max)}>{i18n.lab.step}</button>
            <span>{i18n.frames.frame} {shown + 1}/{max}</span>
          </>
        ) : null
      }
    >
      <div className="sheet">
        {ids.map((id) => {
          const item = meta[id]
          const count = item?.count ?? 0
          const caption = (lang === 'zh' ? item?.zh : item?.en) || id
          return (
            <figure key={id}>
              {count > 0 ? (
                <img src={sampleUrl(id, `frame-${String(shown).padStart(2, '0')}.png`)} alt={caption} />
              ) : (
                <p className="missing">{i18n.frames.missing}</p>
              )}
              <figcaption>{caption}</figcaption>
            </figure>
          )
        })}
      </div>
    </Scope>
  )
}
