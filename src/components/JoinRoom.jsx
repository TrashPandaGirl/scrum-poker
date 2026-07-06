import { useState } from 'react'
import { validName, loadName, NAME_MAX } from '../name.js'

// Fokussierter Beitreten-Screen für den Einstieg über einen Einladungslink.
// Ein Ziel: diesem Raum beitreten. Name vorbelegt → bei wiederkehrenden Nutzern 1 Tap.
export default function JoinRoom({ code, onEnter, onCancel }) {
  const [name, setName] = useState(loadName())
  const [error, setError] = useState('')

  function submit(e) {
    e.preventDefault()
    const n = name.trim()
    if (!validName(n)) {
      return setError('Bitte gib einen Namen ein (max. 24 Zeichen).')
    }
    onEnter(code, n)
  }

  return (
    <div className="join">
      <div className="join__card">
        <p className="join__eyebrow">Du wurdest eingeladen zu</p>
        <p className="join__code">{code}</p>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="join-name">Dein Name</label>
            <input
              id="join-name"
              type="text"
              value={name}
              maxLength={NAME_MAX}
              autoFocus
              placeholder="z.B. Jana"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn--primary join__submit">
            Raum beitreten
          </button>
        </form>
        {error && <p className="error">{error}</p>}
        <button type="button" className="linklike" onClick={onCancel}>
          Stattdessen einen neuen Raum erstellen
        </button>
      </div>
    </div>
  )
}
