import { useEffect, useState } from 'react'
import {
  subscribeRoom,
  ensurePresence,
  castVote,
  removeVoter,
  reveal,
  resetRound,
  grantAdmin,
  revokeAdmin,
  setSpectating,
} from '../room.js'
import { CARD_BACK_LOGO } from '../cardBack.js'
import Results from './Results.jsx'

// Aufdeck-Sweep: gesamt ~2s (unabhängig von der Anzahl), pro Karte ein Flip.
const REVEAL_TOTAL_MS = 2000
const FLIP_MS = 500

// Eine gespielte Karte in der Tischmitte: verdeckt (Logo-Rückseite) → Flip zur Zahl.
function PlayCard({ value, revealed, delay }) {
  return (
    <div className={`pcard ${revealed ? 'pcard--revealed' : ''}`}>
      <div className="pcard__inner" style={{ transitionDelay: `${delay}ms` }}>
        <div className="pcard__face pcard__back">
          <img src={CARD_BACK_LOGO} alt="" draggable="false" />
        </div>
        <div className="pcard__face pcard__front">{value}</div>
      </div>
    </div>
  )
}

export default function Room({ code, name, onLeave }) {
  const [room, setRoom] = useState(undefined) // undefined = lädt, null = existiert nicht
  const [copied, setCopied] = useState(false)

  // Präsenz anmelden + Live-Abo
  useEffect(() => {
    let unsub = () => {}
    let cancelled = false

    ensurePresence(code, name).then((exists) => {
      if (cancelled) return
      if (!exists) {
        setRoom(null)
        return
      }
      unsub = subscribeRoom(code, setRoom)
    })

    return () => {
      cancelled = true
      unsub()
    }
  }, [code, name])

  async function handleLeave() {
    try {
      await removeVoter(code, name)
    } catch {
      /* egal – lokal trotzdem verlassen */
    }
    onLeave()
  }

  function copyCode() {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  if (room === undefined) {
    return <p className="loading">Verbinde mit Raum {code}…</p>
  }

  if (room === null) {
    return (
      <div className="room-missing">
        <p>
          Raum <strong>{code}</strong> existiert nicht (mehr).
        </p>
        <button className="btn" onClick={onLeave}>
          Zurück
        </button>
      </div>
    )
  }

  const { scale, votes, revealed, round } = room
  const spectators = Array.isArray(room.spectators) ? room.spectators : []
  const admins = Array.isArray(room.admins) ? room.admins : null
  const adminsDefined = admins && admins.length > 0
  const isAdmin = adminsDefined ? admins.includes(name) : true

  const present = Object.keys(votes)
  const estimators = present
    .filter((n) => !spectators.includes(n))
    .sort((a, b) => a.localeCompare(b))
  const spectatorList = present
    .filter((n) => spectators.includes(n))
    .sort((a, b) => a.localeCompare(b))

  const iAmSpectator = spectators.includes(name)
  const myVote = votes[name] ?? null
  const votedCount = estimators.filter((n) => votes[n] !== null).length

  // Nur Schätzer-Stimmen in die Auswertung
  const estimatorVotes = Object.fromEntries(estimators.map((n) => [n, votes[n]]))

  // Gestaffelte Aufdeck-Verzögerung links → rechts, gesamt ~REVEAL_TOTAL_MS
  const revealDelay = (i) =>
    estimators.length <= 1
      ? 0
      : (i / (estimators.length - 1)) * (REVEAL_TOTAL_MS - FLIP_MS)

  function toggleAdmin(pName, pIsAdmin) {
    if (pIsAdmin) {
      if (admins.length <= 1) return // letzten Admin nicht entziehen
      revokeAdmin(code, pName)
    } else {
      grantAdmin(code, pName)
    }
  }

  function crownFor(pName) {
    const pIsAdmin = adminsDefined && admins.includes(pName)
    const isLastAdmin = pIsAdmin && admins.length <= 1
    if (isAdmin) {
      return (
        <button
          className={`crown-btn ${pIsAdmin ? 'crown-btn--active' : ''}`}
          disabled={isLastAdmin}
          title={
            pIsAdmin
              ? isLastAdmin
                ? 'Letzter Admin – Rechte nicht entziehbar'
                : 'Admin-Rechte entziehen'
              : 'Zum Admin machen (darf aufdecken)'
          }
          onClick={() => toggleAdmin(pName, pIsAdmin)}
        >
          👑
        </button>
      )
    }
    return pIsAdmin ? (
      <span className="crown-badge" title="Admin (darf aufdecken)">
        👑
      </span>
    ) : null
  }

  return (
    <div className="room">
      <div className="room__bar">
        <div className="room__code" onClick={copyCode} title="Zum Kopieren klicken">
          Raum <strong>{code}</strong>
          <span className="room__copy">{copied ? '✓ kopiert' : '📋'}</span>
        </div>
        <div className="room__meta">
          <span>Runde {round}</span>
          <span>· {scale.label}</span>
          <span>· {votedCount}/{estimators.length} 🃏</span>
        </div>
        <div className="room__bar-right">
          <label className="switch" title="Schätzt du mit oder schaust du nur zu?">
            <input
              type="checkbox"
              checked={!iAmSpectator}
              onChange={() => setSpectating(code, name, !iAmSpectator)}
            />
            <span className="switch__track"><span className="switch__thumb" /></span>
            <span className="switch__label">
              {iAmSpectator ? 'Ich schätze nicht' : 'Ich schätze mit'}
            </span>
          </label>
          <button className="btn btn--ghost" onClick={handleLeave}>
            Verlassen
          </button>
        </div>
      </div>

      {/* Pokertisch */}
      <div className="table">
        <div className="table__felt">
          {estimators.length === 0 ? (
            <p className="table__empty">Warte auf Schätzer…</p>
          ) : (
            <div className="seats">
              {estimators.map((pName, i) => {
                const voted = votes[pName] !== null
                const crown = crownFor(pName)
                return (
                  <div className="seat" key={pName}>
                    <div className="seat__slot">
                      {voted ? (
                        <PlayCard
                          value={votes[pName]}
                          revealed={revealed}
                          delay={revealDelay(i)}
                        />
                      ) : (
                        <div className="seat__empty" />
                      )}
                      {crown && <div className="seat__crown">{crown}</div>}
                    </div>
                    <div className="seat__label">
                      <span
                        className="seat__name"
                        title={pName === name ? `${pName} (du)` : pName}
                      >
                        {pName}
                        {pName === name && ' (du)'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Aktion: Admin deckt auf / neue Runde */}
        <div className="table__actions">
          {isAdmin ? (
            !revealed ? (
              <button
                className="btn btn--primary"
                disabled={votedCount === 0}
                onClick={() => reveal(code)}
              >
                Aufdecken
              </button>
            ) : (
              <button
                className="btn btn--primary"
                onClick={() => resetRound(code, present, round)}
              >
                Neue Runde
              </button>
            )
          ) : (
            <p className="room__hint">
              {revealed
                ? 'Warte auf den Admin für die nächste Runde…'
                : '🔒 Nur Admins können aufdecken'}
            </p>
          )}
        </div>
      </div>

      {/* Zuschauer */}
      {spectatorList.length > 0 && (
        <div className="spectators">
          <span className="spectators__title">👁 Zuschauer:</span>
          {spectatorList.map((pName) => (
            <span className="spectator-chip" key={pName}>
              {crownFor(pName)}
              {pName}
              {pName === name && ' (du)'}
            </span>
          ))}
        </div>
      )}

      {/* Auswertung */}
      {revealed && (
        <div className="table__results">
          <Results votes={estimatorVotes} />
        </div>
      )}

      {/* Eigene Kartenhand */}
      {iAmSpectator ? (
        <p className="hand-note">
          👁 Du bist Zuschauer. Über den Schalter oben rechts kannst du mitschätzen.
        </p>
      ) : (
        <div className="hand">
          {scale.values.map((value, i) => {
            const n = scale.values.length
            const mid = (n - 1) / 2
            const rot = (i - mid) * 3
            const ty = Math.abs(i - mid) * 5
            return (
              <button
                key={value}
                className={`hand-card ${myVote === value ? 'hand-card--picked' : ''}`}
                style={{ '--rot': `${rot}deg`, '--ty': `${ty}px`, zIndex: i }}
                disabled={revealed}
                onClick={() => castVote(code, name, value)}
              >
                {value}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
