// Auswertung der aufgedeckten Stimmen: Verteilung + Konsens (ohne Durchschnitt).
export default function Results({ votes }) {
  const cast = Object.entries(votes).filter(([, v]) => v !== null)
  if (cast.length === 0) {
    return <p className="results__empty">Keine Stimmen abgegeben.</p>
  }

  // Verteilung nach Wert (in Vote-Reihenfolge der Vorkommen)
  const counts = {}
  for (const [, v] of cast) counts[v] = (counts[v] || 0) + 1
  const distribution = Object.entries(counts).sort((a, b) => b[1] - a[1])

  const uniqueValues = new Set(cast.map(([, v]) => v))
  const consensus = uniqueValues.size === 1

  const maxCount = distribution[0][1]

  return (
    <div className="results">
      <div className="results__summary">
        {consensus ? (
          <span className="badge badge--consensus">✅ Konsens: {distribution[0][0]}</span>
        ) : (
          <span className="badge">{uniqueValues.size} verschiedene Werte</span>
        )}
      </div>

      <div className="results__bars">
        {distribution.map(([value, count]) => (
          <div key={value} className="results__bar-row">
            <span className="results__bar-label">{value}</span>
            <div className="results__bar-track">
              <div
                className="results__bar-fill"
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <span className="results__bar-count">{count}×</span>
          </div>
        ))}
      </div>
    </div>
  )
}
