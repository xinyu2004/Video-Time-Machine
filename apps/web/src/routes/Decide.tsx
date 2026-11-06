import { useState } from 'react'
import { Link } from 'react-router-dom'
import { phenomenon, tree } from '../content/load'
import type { DecideChoice } from '../content/types'
import { useI18n, useLang } from '../i18n'

function sectionsOf(choices: DecideChoice[]) {
  const sections: { label?: DecideChoice['group']; choices: DecideChoice[] }[] = []
  for (const choice of choices) {
    const current = sections[sections.length - 1]
    if (!current || choice.group) sections.push({ label: choice.group, choices: [choice] })
    else current.choices.push(choice)
  }
  return sections
}

export function Decide() {
  const lang = useLang()
  const i18n = useI18n()
  const data = tree()
  const [nodeId, setNodeId] = useState(data.start)
  const node = data.nodes[nodeId]
  const sections = sectionsOf(node.choices)
  return (
    <main className="page phenomenon-index">
      <h1>{i18n.nav.decide}</h1>
      <p className="lede">{lang === 'zh' ? '看见一个样子，问到原因。' : 'You see a look. Ask why.'}</p>
      <p>{node.q[lang]}</p>
      {sections.map((section) => (
        <section key={section.label?.[lang] ?? 'open'}>
          {section.label ? <h2>{section.label[lang]}</h2> : null}
          <ul className="tracks">
            {section.choices.map((choice) => {
              const essay = choice.leaf ? phenomenon(lang, choice.leaf) : undefined
              const line = (
                <span className="track-line">
                  <strong>{choice.label[lang]}</strong>
                  {essay ? <small>{essay.title}</small> : null}
                </span>
              )
              return (
                <li key={choice.label[lang]}>
                  {choice.leaf ? (
                    <Link className="track" to={`/${lang}/phenomena/${choice.leaf}`}>{line}</Link>
                  ) : (
                    <button className="track" type="button" onClick={() => choice.next && setNodeId(choice.next)}>
                      {line}
                    </button>
                  )}
                  {essay ? (
                    <span className="track-peek" aria-hidden="true">
                      <strong>{essay.title}</strong>
                      <small>{essay.summary}</small>
                    </span>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
      {nodeId !== data.start ? (
        <button type="button" className="back" onClick={() => setNodeId(data.start)}>
          {lang === 'zh' ? '回到起点' : 'Start over'}
        </button>
      ) : null}
    </main>
  )
}
