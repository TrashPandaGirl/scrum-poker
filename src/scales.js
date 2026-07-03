// Vordefinierte Skalen. `?` = unsicher, `☕` = Pause/kann-ich-nicht-schätzen.
export const PRESET_SCALES = {
  fibonacci: {
    label: 'Fibonacci',
    values: ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'],
  },
  tshirt: {
    label: 'T-Shirt',
    values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?', '☕'],
  },
  powers: {
    label: 'Zweierpotenzen',
    values: ['0', '1', '2', '4', '8', '16', '32', '64', '?', '☕'],
  },
}

// Werte, die nicht in die numerische Auswertung einfließen.
export const NON_NUMERIC = new Set(['?', '☕'])

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
