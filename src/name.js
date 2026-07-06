// Namensregeln + Persistenz des zuletzt genutzten Namens (für Prefill).
export const NAME_MAX = 24
const NAME_KEY = 'scrumPoker.name'

// Firestore-Map-Keys dürfen nicht leer sein und nicht dem reservierten
// Muster __...__ entsprechen. Länge fürs Layout begrenzt.
export function validName(name) {
  const n = (name || '').trim()
  if (n.length < 1 || n.length > NAME_MAX) return false
  if (/^__.*__$/.test(n)) return false
  return true
}

export function rememberName(name) {
  try {
    localStorage.setItem(NAME_KEY, name)
  } catch {
    /* ignore */
  }
}

export function loadName() {
  try {
    return localStorage.getItem(NAME_KEY) || ''
  } catch {
    return ''
  }
}
