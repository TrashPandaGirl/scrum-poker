import { Component } from 'react'

// Fängt Render-Fehler ab, damit ein einzelner fehlerhafter Zustand nie die ganze
// App weißschießt. Bietet stattdessen eine Wiederherstellungs-Ansicht.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('App-Fehler abgefangen:', error, info)
  }

  handleReset = () => {
    // Session verwerfen, damit man aus einem kaputten Raum wieder rauskommt
    try {
      localStorage.removeItem('scrumPoker.session')
    } catch {
      /* ignore */
    }
    window.location.href = window.location.pathname
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="crash">
        <h2>Ups – da ist etwas schiefgelaufen.</h2>
        <p>
          Die Ansicht konnte nicht geladen werden. Du kommst mit einem Klick zurück
          zur Startseite.
        </p>
        <div className="crash__actions">
          <button className="btn btn--primary" onClick={this.handleReset}>
            Zurück zur Startseite
          </button>
          <button className="btn" onClick={() => window.location.reload()}>
            Neu laden
          </button>
        </div>
      </div>
    )
  }
}
