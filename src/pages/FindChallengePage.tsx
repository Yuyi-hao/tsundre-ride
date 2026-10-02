import { Link } from 'react-router'
import Header from '../components/Header'

// No backend yet, so there is nothing to list. This page shows the empty state for now.
function FindChallengePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <Header />

      <main className="mx-auto w-full max-w-4xl px-4 py-12">
        <h2 className="text-2xl font-semibold text-white">Find a challenge</h2>
        <p className="mt-2 text-gray-400">Open challenges you can join will show up here.</p>

        <div className="mt-8 rounded-lg border border-dashed border-gray-800 px-4 py-12 text-center">
          <p className="text-gray-300">No challenges yet.</p>
          <Link
            to="/create"
            className="mt-4 inline-block rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            Create a challenge
          </Link>
        </div>
      </main>
    </div>
  )
}

export default FindChallengePage
