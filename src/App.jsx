import { useEffect, useState } from 'react'
import Home from './components/Home.jsx'
import Room from './components/Room.jsx'

const STORAGE_KEY = 'scrumPoker.session'

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function App() {
  // session = { code, name } | null
  const [session, setSession] = useState(loadSession)

  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [session])

  const handleEnter = (code, name) => setSession({ code, name })
  const handleLeave = () => setSession(null)

  return (
    <div className="app">
      <header className="app__header">
        <h1>🃏 Scrum Poker</h1>
      </header>
      {session ? (
        <Room
          code={session.code}
          name={session.name}
          onLeave={handleLeave}
        />
      ) : (
        <Home onEnter={handleEnter} />
      )}
      <footer className="app__footer">
        Echtzeit-Schätzungen fürs Team · Raumcode teilen zum Beitreten
      </footer>
    </div>
  )
}
