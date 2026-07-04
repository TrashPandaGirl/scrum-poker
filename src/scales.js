// `?` = unsicher, `☕` = Pause/kann-ich-nicht-schätzen.
// Diese Extras werden JEDER Skala automatisch angehängt (Presets wie Custom).
export const EXTRAS = ['?', '☕']

// Presets ohne Extras – die kommen via withExtras() dazu.
export const PRESET_SCALES = {
  fibonacci: {
    label: 'Fibonacci',
    values: ['0', '1', '2', '3', '5', '8', '13', '21'],
  },
  fibonacciAdj: {
    label: 'Fibonacci adj',
    values: ['1', '2', '3', '5', '8', '13', '21', '34'],
  },
  tshirt: {
    label: 'T-Shirt Sizes',
    values: ['XS', 'S', 'M', 'L', 'XL'],
  },
  powers: {
    label: 'Power of Two',
    values: ['0', '1', '2', '4', '8', '16', '32', '64'],
  },
}

// Werte, die nicht in die numerische Auswertung einfließen.
export const NON_NUMERIC = new Set(EXTRAS)

// Hängt `?` und `☕` an eine Werteliste an (ohne Duplikate).
export function withExtras(values) {
  const base = values.filter((v) => !EXTRAS.includes(v))
  return [...base, ...EXTRAS]
}

// Parst eine kommagetrennte Custom-Eingabe zu einer bereinigten Werteliste.
export function parseCustomScale(input) {
  const values = input
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
  // Duplikate entfernen, Reihenfolge erhalten
  return [...new Set(values)]
}

export function isNumeric(value) {
  return !NON_NUMERIC.has(value) && !Number.isNaN(Number(value))
}
