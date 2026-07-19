import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'

// Dashboard is the landing page, so it stays eagerly loaded — everything else
// only needs to load once someone actually navigates there, keeping the first
// paint from having to wait on JS (Recharts, the parser, etc.) it doesn't need yet.
const Sessions = lazy(() => import('./pages/Sessions'))
const Import = lazy(() => import('./pages/Import'))
const LiveSession = lazy(() => import('./pages/LiveSession'))
const Journal = lazy(() => import('./pages/Journal'))
const FocusPlan = lazy(() => import('./pages/FocusPlan'))
const FearLadders = lazy(() => import('./pages/FearLadders'))
const HierarchyView = lazy(() => import('./pages/HierarchyView'))
const SessionDetail = lazy(() => import('./pages/SessionDetail'))
const Settings = lazy(() => import('./pages/Settings'))
const Help = lazy(() => import('./pages/Help'))
const FlareGuidePage = lazy(() => import('./pages/FlareGuide'))
const TherapistSummary = lazy(() => import('./pages/TherapistSummary'))

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/live" element={<LiveSession />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/focus-plan" element={<FocusPlan />} />
          <Route path="/ladders" element={<FearLadders />} />
          <Route path="/import" element={<Import />} />
          <Route path="/hierarchy/:name" element={<HierarchyView />} />
          <Route path="/session/:id" element={<SessionDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} />
          <Route path="/flare-guide" element={<FlareGuidePage />} />
          <Route path="/summary" element={<TherapistSummary />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
