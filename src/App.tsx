import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Sessions from './pages/Sessions'
import Import from './pages/Import'
import LiveSession from './pages/LiveSession'
import Journal from './pages/Journal'
import FocusPlan from './pages/FocusPlan'
import FearLadders from './pages/FearLadders'
import HierarchyView from './pages/HierarchyView'
import SessionDetail from './pages/SessionDetail'
import Settings from './pages/Settings'
import Help from './pages/Help'

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
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
