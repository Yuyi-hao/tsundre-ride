import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router'
import ChallengeDetailPage from './pages/ChallengeDetailPage'
import CodingWorkspace from './pages/codingWorkspace'
import FindChallengePage from './pages/FindChallengePage'
import HomePage from './pages/HomePage'
import SolveChallengePage from './pages/SolveChallengePage'
import SubmissionPage from './pages/SubmissionPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/challenges" element={<FindChallengePage />} />
        <Route path="/challenges/:slug" element={<ChallengeDetailPage />} />
        <Route path="/challenges/:slug/solve" element={<SolveChallengePage />} />
        <Route path="/challenges/:slug/submissions/:submissionSlug" element={<SubmissionPage />} />
        {/* Different keys so switching between these two routes starts a fresh workspace */}
        <Route path="/create" element={<CodingWorkspace key="create" startWithChallengeForm />} />
        <Route path="/code" element={<CodingWorkspace key="code" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
