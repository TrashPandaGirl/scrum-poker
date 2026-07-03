import { useState } from 'react'
import { PRESET_SCALES, parseCustomScale } from '../scales.js'
import { createRoom, generateRoomCode } from '../room.js'

export default function Home({ onEnter }) {
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [scaleKey, setScaleKey] = useState('fibonacci')
  const [customInput, setCustomInput] = useState('1, 2, 3, 5, 8, ?')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const trimmedName = name.trim()

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    if (!trimmedName) return setError('Bitte gib deinen Namen ein.')

    let scale
    if (scaleKey === 'custom') {
      const values = parseCustomScale(customInput)
      if (values.length < 2) {
        return setError('Custom-Skala braucht mindestens 2 Werte (kommagetrennt).')
      }
      scale = { label: 'Custom', values }
    } else {
      scale = PRESET_SCALES[scaleKey]
    }

    setBusy(true)
    try {
      const code = generateRoomCode()
      await createRoom(code, scale, trimmedName)
      onEnter(code, trimmedName)
    } catch (err) {
      console.error(err)
      setError('Raum konnte nicht erstellt werden. Nochmal versuchen?')
      setBusy(false)
    }
  }

  function handleJoin(e) {
    e.preventDefault()
    setError('')
    if (!trimmedName) return setError('Bitte gib deinen Namen ein.')
    const code = joinCode.trim().toUpperCase()
    if (code.length < 4) return setError('Bitte gültigen Raumcode eingeben.')
    onEnter(code, trimmedName)
  }

  return (
    <div className="home">
      <div className="field">
        <label htmlFor="name">Dein Name</label>
        <input
          id="name"
          type="text"
          value={name}
          maxLength={24}
          placeholder="z.B. Jana"
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="home__cards">
        <form className="card-panel" onSubmit={handleCreate}>
          <h2>Neuen Raum erstellen</h2>

          <div className="field">
            <label htmlFor="scale">Skala</label>
            <select
              id="scale"
              value={scaleKey}
              onChange={(e) => setScaleKey(e.target.value)}
            >
              {Object.entries(PRESET_SCALES).map(([key, s]) => (
                <option key={key} value={key}>
                  {s.label} ({s.values.slice(0, 5).join(', ')}…)
                </option>
              ))}
              <option value="custom">Eigene Reihe…</option>
            </select>
          </div>

          {scaleKey === 'custom' && (
            <div className="field">
              <label htmlFor="custom">Werte (kommagetrennt)</label>
              <input
                id="custom"
                type="text"
                value={customInput}
                placeholder="1, 2, 3, 5, 8, ?"
                onChange={(e) => setCustomInput(e.target.value)}
              />
            </div>
          )}

          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? 'Erstelle…' : 'Raum erstellen'}
          </button>
        </form>

        <form className="card-panel" onSubmit={handleJoin}>
          <h2>Raum beitreten</h2>
          <div className="field">
            <label htmlFor="code">Raumcode</label>
            <input
              id="code"
              type="text"
              value={joinCode}
              maxLength={4}
              placeholder="ABCD"
              className="code-input"
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            />
          </div>
          <button type="submit" className="btn">
            Beitreten
          </button>
        </form>
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  )
}
