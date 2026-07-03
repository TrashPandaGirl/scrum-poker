import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Wiederverwendung des bestehenden Firebase-Projekts (epicscrummasterkastl).
// Scrum Poker legt seine Daten in einer eigenen Collection `pokerRooms` ab.
const firebaseConfig = {
  apiKey: 'AIzaSyBC8qWgsBkrKWbNGWuKH68-hjdeokzVWk8',
  authDomain: 'epicscrummasterkastl.firebaseapp.com',
  projectId: 'epicscrummasterkastl',
  storageBucket: 'epicscrummasterkastl.firebasestorage.app',
  messagingSenderId: '735716212941',
  appId: '1:735716212941:web:5c753934f6b5da5d20a984',
  measurementId: 'G-VFQPPRJLGN',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
