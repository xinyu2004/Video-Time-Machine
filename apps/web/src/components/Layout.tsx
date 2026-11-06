import { MDXProvider } from '@mdx-js/react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { mdxComponents } from './mdx'
import { text, type Lang } from '../i18n'

const links = ['timeline', 'phenomena', 'decide', 'glossary'] as const

export function Layout({ lang }: { lang: Lang }) {
  const i18n = text(lang)
  const other: Lang = lang === 'zh' ? 'en' : 'zh'
  const { pathname } = useLocation()
  const swapped = pathname.replace(/^\/(zh|en)/, `/${other}`)
  return (
    <MDXProvider components={mdxComponents}>
      <div className="shell">
        <header className="top">
          <Link to={`/${lang}`} className="brand">{i18n.siteName}</Link>
          <nav>
            {links.map((key) => (
              <NavLink key={key} to={`/${lang}/${key}`}>{i18n.nav[key]}</NavLink>
            ))}
          </nav>
          <Link className="lang" to={swapped}>{other.toUpperCase()}</Link>
        </header>
        <Outlet context={{ lang }} />
      </div>
    </MDXProvider>
  )
}
