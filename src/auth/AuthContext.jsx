import { useEffect, useState } from 'react'
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut as firebaseSignOut, updateProfile } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { SessionContext } from './sessionContext'
import { auth, db, hasFirebaseConfig } from '../backend/firebase/firebaseConfig'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasFirebaseConfig || !auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? { uid: firebaseUser.uid, name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'MHub member', email: firebaseUser.email } : null)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!hasFirebaseConfig || !auth) {
      setLoading(false)
    }
  }, [])

  const register = async ({ name, email, password }) => {
    if (!hasFirebaseConfig || !auth || !db) {
      const localUser = { uid: 'local-demo-user', name: name.trim() || 'Demo user', email: email.trim() || 'demo@example.com' }
      setUser(localUser)
      return localUser
    }

    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(credential.user, { displayName: name })
    await setDoc(doc(db, 'users', credential.user.uid), { displayName: name, email: credential.user.email, photoURL: null, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true })
    return credential.user
  }

  const signIn = async ({ email, password }) => {
    if (!hasFirebaseConfig || !auth) {
      const localUser = { uid: 'local-demo-user', name: email.split('@')[0] || 'Demo user', email }
      setUser(localUser)
      return localUser
    }

    const credential = await signInWithEmailAndPassword(auth, email, password)
    return credential.user
  }

  const resetPassword = async ({ email }) => {
    if (!hasFirebaseConfig || !auth) {
      return { ok: true }
    }

    await sendPasswordResetEmail(auth, email)
    return { ok: true }
  }

  const signOut = async () => {
    if (!hasFirebaseConfig || !auth) {
      setUser(null)
      return
    }

    await firebaseSignOut(auth)
  }

  return <SessionContext.Provider value={{ user, loading, register, signIn, resetPassword, signOut }}>{children}</SessionContext.Provider>
}
