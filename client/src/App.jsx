import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell.jsx';
import Overview from './pages/Overview.jsx';
import Meetings from './pages/Meetings.jsx';
import ExecutiveIntelligence from './pages/ExecutiveIntelligence.jsx';
import RisksEscalations from './pages/RisksEscalations.jsx';
import Projects from './pages/Projects.jsx';
import KnowledgeGraph from './pages/KnowledgeGraph.jsx';
import Memory from './pages/Memory.jsx';
import Analytics from './pages/Analytics.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Overview />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/executive-intelligence" element={<ExecutiveIntelligence />} />
          <Route path="/risks" element={<RisksEscalations />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/graph" element={<KnowledgeGraph />} />
          <Route path="/memory" element={<Memory />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
