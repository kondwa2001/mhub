import { useState } from 'react'
import { SessionContext } from './sessionContext'
const storageKey = 'mhub-opportunity-user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) : null
  })
  const signIn = () => {
    // Replace with signInWithPassword() from firebaseAuth.js when Firebase Auth is configured.
    const demoUser = { name: 'MHub team', email: 'team@mhubmw.com' }
    localStorage.setItem(storageKey, JSON.stringify(demoUser)); setUser(demoUser)
  }
  const signOut = () => { localStorage.removeItem(storageKey); setUser(null) }
  return <SessionContext.Provider value={{ user, signIn, signOut }}>{children}</SessionContext.Provider>
}
