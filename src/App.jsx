import { useEffect, useState } from 'react'
import Home from './components/Home.jsx'
import Room from './components/Room.jsx'
import JoinRoom from './components/JoinRoom.jsx'
import { rememberName } from './name.js'

const STORAGE_KEY = 'scrumPoker.session'

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function readRoomParam() {
  const r = new URLSearchParams(window.location.search).get('room')
  return r ? r.trim().toUpperCase() : null
}

// ?room= aus der URL entfernen, ohne neu zu laden (damit Reload/Verlassen sauber ist)
function clearRoomParam() {
  window.history.replaceState({}, '', window.location.pathname)
}

export default function App() {
  // session = { code, name } | null
  const [session, setSession] = useState(loadSession)
  // Raum aus einem Einladungslink; hat Vorrang vor der gecachten Session
  const [linkRoom, setLinkRoom] = useState(readRoomParam)

  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [session])

  function handleEnter(code, name) {
    rememberName(name)
    setSession({ code, name })
    setLinkRoom(null)
    clearRoomParam()
  }

  function handleLeave() {
    setSession(null)
    setLinkRoom(null)
    clearRoomParam()
  }

  function handleCancelJoin() {
    setLinkRoom(null)
    clearRoomParam()
  }

  // Der Link gewinnt: liegt ein ?room= vor und sind wir nicht schon in genau
  // diesem Raum, zeigen wir den Beitreten-Screen – nicht den gecachten Raum.
  const showJoin = linkRoom && !(session && session.code === linkRoom)

  let content
  if (showJoin) {
    content = (
      <JoinRoom code={linkRoom} onEnter={handleEnter} onCancel={handleCancelJoin} />
    )
  } else if (session) {
    content = (
      <Room code={session.code} name={session.name} onLeave={handleLeave} />
    )
  } else {
    content = <Home onEnter={handleEnter} />
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>🃏 Scrum Poker</h1>
      </header>
      {content}
      <footer className="app__footer">
        Echtzeit-Schätzungen fürs Team · Raumcode teilen zum Beitreten
      </footer>
    </div>
  )
}
