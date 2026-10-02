import { useState } from 'react'
import { Link } from 'react-router'
import Header from '../components/Header'

// GIPHY's classic "typing cat". Falls back to a code snippet card if it can't load.
const HERO_GIF = 'https://media.giphy.com/media/13HgwGsXF0aiGY/200.gif'

const features = [
  {
    icon: '🧩',
    title: 'Challenges',
    description: 'Build UI from requirements. Timed, shareable, and made by the community.',
    glow: 'from-blue-500/20',
  },
  {
    icon: '⚡',
    title: 'Live Preview',
    description: 'See changes instantly on desktop and mobile while you type.',
    glow: 'from-amber-500/20',
  },
  {
    icon: '🌱',
    title: 'Learn by Building',
    description: 'Practice through real projects with plain HTML, CSS and JavaScript.',
    glow: 'from-emerald-500/20',
  },
]

const steps = [
  { title: 'Pick a challenge', description: 'Browse open challenges or create your own.' },
  { title: 'Build it', description: 'Code in the browser with a live preview beside you.' },
  { title: 'Submit', description: 'Save a draft, polish it, then submit when it is ready.' },
]

function HeroVisual() {
  const [gifFailed, setGifFailed] = useState(false)

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-blue-600/30 via-fuchsia-500/20 to-amber-400/20 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl">
        <div className="flex items-center gap-1.5 border-b border-gray-800 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-2 font-mono text-xs text-gray-500">me_debugging.gif</span>
        </div>
        {gifFailed ? (
          <pre className="p-5 font-mono text-sm leading-relaxed text-gray-300">
            <span className="text-fuchsia-400">while</span> (!works) {'{\n'}
            {'  '}<span className="text-blue-400">tryAgain</span>()
            {'\n}'}
            {'\n'}
            <span className="text-gray-500">// it works on my machine™</span>
          </pre>
        ) : (
          <img
            src={HERO_GIF}
            alt="A cat typing furiously on a keyboard"
            loading="lazy"
            onError={() => setGifFailed(true)}
            className="aspect-[4/3] w-full object-cover"
          />
        )}
      </div>
    </div>
  )
}

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-white">
      <Header>
        <Link to="/challenges" className="text-sm text-gray-400 hover:text-white">
          Challenges
        </Link>
        <Link
          to="/create"
          className="shrink-0 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
        >
          Create challenge
        </Link>
      </Header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-24 md:grid-cols-2">
            <div>
              <span className="inline-block rounded-full border border-gray-800 bg-gray-900 px-3 py-1 font-mono text-xs text-gray-400">
                &lt;html&gt; · css · js
              </span>
              <h2 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">
                Build.{' '}
                <span className="bg-gradient-to-r from-fuchsia-400 to-amber-300 bg-clip-text text-transparent">
                  Break.
                </span>{' '}
                Learn.
              </h2>
              <p className="mt-5 max-w-md text-lg text-gray-400">
                Practice frontend development by building real interfaces.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/code"
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500"
                >
                  Start Coding →
                </Link>
                <Link
                  to="/challenges"
                  className="rounded-xl border border-gray-700 bg-gray-900 px-5 py-3 text-sm font-semibold text-gray-200 hover:border-gray-500 hover:text-white"
                >
                  Explore Challenges
                </Link>
              </div>
            </div>
            <HeroVisual />
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-4 sm:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={`rounded-2xl border border-gray-800 bg-gradient-to-b ${feature.glow} to-gray-900/40 p-6 transition-colors hover:border-gray-600`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-950/70 text-2xl">
                  {feature.icon}
                </div>
                <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-2xl font-semibold sm:text-3xl">How it works</h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600/20 font-mono text-sm font-semibold text-blue-300">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-gray-400">{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-4">
          <div className="relative overflow-hidden rounded-3xl border border-gray-800 bg-gradient-to-br from-blue-600/20 via-gray-900 to-fuchsia-600/20 px-6 py-12 text-center">
            <h2 className="text-2xl font-semibold sm:text-3xl">Ready to ship something?</h2>
            <p className="mt-2 text-gray-400">No sign-up. Open the editor and start typing.</p>
            <Link
              to="/code"
              className="mt-6 inline-block rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-950 hover:bg-gray-200"
            >
              Start Coding
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-gray-500 sm:flex-row">
          <span className="font-mono">tsundre~ride</span>
          <nav className="flex gap-5">
            <Link to="/challenges" className="hover:text-gray-300">Challenges</Link>
            <Link to="/create" className="hover:text-gray-300">Create</Link>
            <Link to="/code" className="hover:text-gray-300">Editor</Link>
          </nav>
          <span>Built for practice. GIF via GIPHY.</span>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
