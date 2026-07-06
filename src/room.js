import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  deleteField,
  arrayUnion,
  arrayRemove,
  FieldPath,
} from 'firebase/firestore'
import { db } from './firebase'

const COLLECTION = 'pokerRooms'

// Ein einzelner Vote-Schlüssel als FieldPath – so wird der Name literal behandelt
// (Punkte/Sonderzeichen zerschießen sonst den Feldpfad und verschachteln die Daten).
function votePath(name) {
  return new FieldPath('votes', name)
}

// 4-stelliger, gut lesbarer Raumcode (keine leicht verwechselbaren Zeichen).
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function generateRoomCode() {
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  }
  return code
}

function roomRef(code) {
  return doc(db, COLLECTION, code)
}

export async function createRoom(code, scale, creatorName) {
  await setDoc(roomRef(code), {
    scale, // { label, values }
    revealed: false,
    votes: { [creatorName]: null }, // { name: value | null } (null = noch nicht gewählt)
    admins: [creatorName], // Namen mit Aufdeck-/Verwaltungsrechten; Ersteller ist Admin
    spectators: [creatorName], // Namen die NICHT schätzen; Ersteller (SM/PO) ist default Zuschauer
    round: 1,
    ticket: '', // optionaler Jira-Key der aktuellen Runde
    sheet: [], // Refinement-Log: [{ ticket, estimates:[...], agreed }]
    createdAt: serverTimestamp(),
  })
}

// Live-Abo auf einen Raum. onData bekommt die Raumdaten oder null (existiert nicht).
export function subscribeRoom(code, onData) {
  return onSnapshot(roomRef(code), (snap) => {
    onData(snap.exists() ? snap.data() : null)
  })
}

// Meldet einen Teilnehmer an, ohne eine bestehende Stimme zu überschreiben
// (wichtig bei Reload/Reconnect). Gibt false zurück, wenn der Raum nicht existiert.
export async function ensurePresence(code, name) {
  const snap = await getDoc(roomRef(code))
  if (!snap.exists()) return false
  const votes = snap.data().votes || {}
  if (!(name in votes)) {
    await updateDoc(roomRef(code), votePath(name), null)
  }
  return true
}

export async function castVote(code, name, value) {
  await updateDoc(roomRef(code), votePath(name), String(value))
}

export async function removeVoter(code, name) {
  await updateDoc(
    roomRef(code),
    votePath(name),
    deleteField(),
    'admins',
    arrayRemove(name),
    'spectators',
    arrayRemove(name),
  )
}

// Wechselt zwischen Schätzer und Zuschauer. Als Zuschauer wird die Stimme geleert.
export async function setSpectating(code, name, spectating) {
  if (spectating) {
    await updateDoc(
      roomRef(code),
      'spectators',
      arrayUnion(name),
      votePath(name),
      null,
    )
  } else {
    await updateDoc(roomRef(code), 'spectators', arrayRemove(name))
  }
}

export async function reveal(code) {
  await updateDoc(roomRef(code), { revealed: true })
}

// Setzt den Ticket-Key der aktuellen Runde (leer = keiner).
export async function setTicket(code, ticket) {
  await updateDoc(roomRef(code), { ticket })
}

export async function grantAdmin(code, name) {
  await updateDoc(roomRef(code), { admins: arrayUnion(name) })
}

export async function revokeAdmin(code, name) {
  await updateDoc(roomRef(code), { admins: arrayRemove(name) })
}

// Nochmal schätzen: Stimmen leeren, Ticket bleibt (z.B. bei Uneinigkeit).
export async function resetRound(code, names, round) {
  const clearedVotes = {}
  for (const name of names) clearedVotes[name] = null
  await updateDoc(roomRef(code), {
    votes: clearedVotes,
    revealed: false,
    round: (round || 1) + 1,
  })
}

// Runde abschließen: Ergebnis ins Refinement-Sheet loggen, Ticket leeren, nächste Runde.
export async function finishRound(code, { sheet, entry, names, round }) {
  const clearedVotes = {}
  for (const name of names) clearedVotes[name] = null
  await updateDoc(roomRef(code), {
    sheet: [...(sheet || []), entry],
    votes: clearedVotes,
    revealed: false,
    round: (round || 1) + 1,
    ticket: '',
  })
}
