import { Link } from 'react-router'
import Header from '../components/Header'

const options = [
  {
    to: '/challenges',
    title: 'Find challenge',
    description: 'Browse open challenges and submit your solution.',
  },
  {
    to: '/create',
    title: 'Create challenge',
    description: 'Build a reference solution and set up a timed challenge.',
  },
  {
    to: '/code',
    title: 'Code now',
    description: 'Open the editor and start coding. No challenge needed.',
  },
]

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <Header />

      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:py-20">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">
          Frontend coding challenges
        </h2>
        <p className="mt-2 text-gray-400">
          Build with HTML, CSS and JavaScript. See the result live.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {options.map((option) => (
            <Link
              key={option.to}
              to={option.to}
              className="rounded-lg border border-gray-800 p-5 hover:border-gray-600 hover:bg-gray-900"
            >
              <h3 className="font-medium text-white">{option.title} →</h3>
              <p className="mt-1 text-sm text-gray-400">{option.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}

export default HomePage
