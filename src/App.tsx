import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Import from './pages/Import'
import LiveSession from './pages/LiveSession'
import Journal from './pages/Journal'
import HierarchyView from './pages/HierarchyView'
import SessionDetail from './pages/SessionDetail'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/live" element={<LiveSession />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/import" element={<Import />} />
          <Route path="/hierarchy/:name" element={<HierarchyView />} />
          <Route path="/session/:id" element={<SessionDetail />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
