import { useEffect, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import {
  subscribeRoom,
  ensurePresence,
  castVote,
  removeVoter,
  reveal,
  resetRound,
  finishRound,
  grantAdmin,
  revokeAdmin,
  setSpectating,
  setTicket,
} from '../room.js'
import { CARD_BACK_LOGO } from '../cardBack.js'
import Results from './Results.jsx'

// Aufdeck-Sweep: gesamt ~2s (unabhängig von der Anzahl), pro Karte ein Flip.
const REVEAL_TOTAL_MS = 2000
const FLIP_MS = 500

// Häufigster Wert (Modus) – Default-Vorschlag für die Einigung.
function computeMode(values) {
  if (!values.length) return ''
  const counts = {}
  for (const v of values) counts[v] = (counts[v] || 0) + 1
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
}

// Refinement-Log: pro abgeschlossener Runde eine Zeile
// (Ticket · Schätzungen ohne Namen · Einigung). Als PNG in die Zwischenablage kopierbar.
function RefinementSheet({ sheet }) {
  const captureRef = useRef(null)
  const [copied, setCopied] = useState(false)

  if (!Array.isArray(sheet) || sheet.length === 0) return null

  async function copyPng() {
    const canvas = await html2canvas(captureRef.current, {
      scale: 2,
      backgroundColor: '#0f172a',
      useCORS: true,
    })
    canvas.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ])
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // Fallback: Download
        const a = document.createElement('a')
        a.href = canvas.toDataURL('image/png')
        a.download = 'refinement-sheet.png'
        a.click()
      }
    }, 'image/png')
  }

  return (
    <div className="sheet">
      <button className="btn btn--ghost sheet__copy" onClick={copyPng}>
        {copied ? '✓ Kopiert!' : '📷 Als PNG kopieren'}
      </button>
      <div className="sheet__capture" ref={captureRef}>
        <h2 className="sheet__title">📋 Refinement-Sheet</h2>
        <div className="sheet__rows">
          <div className="sheet__row sheet__row--head">
            <span>Ticket</span>
            <span>Schätzungen</span>
            <span>Einigung</span>
          </div>
          {sheet.map((row, i) => (
            <div className="sheet__row" key={i}>
              <span className="sheet__ticket">{row.ticket || '—'}</span>
              <div className="sheet__cards">
                {(row.estimates || []).map((v, j) => (
                  <span className="mini-card" key={j}>
                    {v}
                  </span>
                ))}
              </div>
              <span className="sheet__agreed">{row.agreed || '–'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

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
  const [agreed, setAgreed] = useState('') // vom Admin gewählte Einigung ('' = Default = Modus)
  const [ticketDraft, setTicketDraft] = useState('')
  const ticketFocused = useRef(false)

  // Ticket-Feld mit dem Raum synchronisieren, solange nicht gerade getippt wird
  useEffect(() => {
    if (!ticketFocused.current) setTicketDraft(room?.ticket ?? '')
  }, [room?.ticket])

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

  // Abgegebene Schätzungen (ohne Namen), sortiert nach Skalen-Reihenfolge → fürs Sheet & Modus
  const castValues = estimators
    .map((n) => votes[n])
    .filter((v) => v !== null)
    .sort((a, b) => scale.values.indexOf(a) - scale.values.indexOf(b))
  const mode = computeMode(castValues)
  const effectiveAgreed = agreed || mode

  // Gestaffelte Aufdeck-Verzögerung links → rechts, gesamt ~REVEAL_TOTAL_MS
  const revealDelay = (i) =>
    estimators.length <= 1
      ? 0
      : (i / (estimators.length - 1)) * (REVEAL_TOTAL_MS - FLIP_MS)

  function commitTicket() {
    ticketFocused.current = false
    const next = ticketDraft.trim()
    if (next !== (room.ticket || '')) setTicket(code, next)
  }

  function handleFinish() {
    finishRound(code, {
      sheet: room.sheet,
      entry: { ticket: (room.ticket || '').trim(), estimates: castValues, agreed: effectiveAgreed },
      names: present,
      round,
    })
    setAgreed('')
  }

  function handleReEstimate() {
    resetRound(code, present, round)
    setAgreed('')
  }

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
          {isAdmin ? (
            <input
              className="ticket-input"
              value={ticketDraft}
              placeholder={`Runde ${round}`}
              title="Ticket-Key eintragen (optional)"
              onFocus={() => (ticketFocused.current = true)}
              onChange={(e) => setTicketDraft(e.target.value)}
              onBlur={commitTicket}
              onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
            />
          ) : (
            <span className="ticket-static">{room.ticket || `Runde ${round}`}</span>
          )}
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

        {/* Aktion: Admin deckt auf / schließt Runde ab */}
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
              <div className="finish-actions">
                <label className="agree">
                  Einigung:
                  <select
                    className="agree__select"
                    value={effectiveAgreed}
                    onChange={(e) => setAgreed(e.target.value)}
                  >
                    <option value="">–</option>
                    {scale.values.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="btn btn--primary" onClick={handleFinish}>
                  Übernehmen &amp; nächstes Ticket
                </button>
                <button className="btn btn--ghost" onClick={handleReEstimate}>
                  Nochmal schätzen
                </button>
              </div>
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

      {/* Refinement-Log */}
      <RefinementSheet sheet={room.sheet} />
    </div>
  )
}
