import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { Layout } from './components/Layout'
import { isLang } from './i18n'
import { Decide } from './routes/Decide'
import { Glossary } from './routes/Glossary'
import { Home } from './routes/Home'
import { PhenomenonIndex, PhenomenonPage } from './routes/Phenomena'
import { RecipeIndex, RecipePage } from './routes/Recipes'
import { TimelineChapter, TimelineIndex } from './routes/Timeline'
import './styles.css'

function ToPhenomena() {
  const { lang } = useParams()
  return <Navigate to={isLang(lang) ? `/${lang}/phenomena` : '/en'} replace />
}

function LangGate() {
  const { lang } = useParams()
  if (!isLang(lang)) return <Navigate to="/en" replace />
  return <Layout lang={lang} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Routes>
        <Route path="/" element={<Navigate to="/en" replace />} />
        <Route path="/:lang" element={<LangGate />}>
          <Route index element={<Home />} />
          <Route path="timeline" element={<TimelineIndex />} />
          <Route path="timeline/:slug" element={<TimelineChapter />} />
          <Route path="phenomena" element={<PhenomenonIndex />} />
          <Route path="phenomena/:id" element={<PhenomenonPage />} />
          <Route path="lab" element={<ToPhenomena />} />
          <Route path="lab/:widget" element={<ToPhenomena />} />
          <Route path="recipes" element={<RecipeIndex />} />
          <Route path="recipes/:id" element={<RecipePage />} />
          <Route path="decide" element={<Decide />} />
          <Route path="glossary" element={<Glossary />} />
        </Route>
        <Route path="*" element={<Navigate to="/en" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
