import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// HINWEIS ZUR SICHERHEIT:
// Der Firebase-Web-Config ist KEIN Geheimnis – er identifiziert nur das Projekt
// und landet bauartbedingt im ausgelieferten Bundle (jede Firebase-Web-App zeigt
// diese Werte im Browser). Die Auslagerung in .env ist reine Hygiene (nicht im
// Quellcode/Git, pro Umgebung austauschbar) – der eigentliche Schutz kommt aus den
// Firestore-Security-Rules und der API-Key-Beschränkung (HTTP-Referrer) in der
// Google Cloud Console, nicht aus dem "Verstecken" dieser Werte.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
  measurementId: import.meta.env.VITE_FB_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
