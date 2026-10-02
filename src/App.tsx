import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router'
import CodingWorkspace from './pages/codingWorkspace'
import FindChallengePage from './pages/FindChallengePage'
import HomePage from './pages/HomePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/challenges" element={<FindChallengePage />} />
        {/* Different keys so switching between these two routes starts a fresh workspace */}
        <Route path="/create" element={<CodingWorkspace key="create" startWithChallengeForm />} />
        <Route path="/code" element={<CodingWorkspace key="code" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
