import { useEffect, useState } from 'react'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, updateProfile } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { SessionContext } from './sessionContext'
import { auth, db, hasFirebaseConfig, firebaseConfig } from '../backend/firebase/firebaseConfig'

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

  const register = async ({ name, email, password, organization }) => {
    if (!hasFirebaseConfig || !auth || !db) {
      const localUser = { uid: 'local-demo-user', name: name.trim() || 'Demo user', email: email.trim() || 'demo@example.com', organization: organization?.trim() || '' }
      setUser(localUser)
      return localUser
    }

    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(credential.user, { displayName: name })
    await setDoc(doc(db, 'users', credential.user.uid), {
      displayName: name,
      email: credential.user.email,
      organization: organization?.trim() || null,
      photoURL: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true })
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
    const normalizedEmail = email?.trim()

    if (!normalizedEmail) {
      const error = new Error('Email is required')
      error.code = 'auth/missing-email'
      throw error
    }

    if (!hasFirebaseConfig || !auth) {
      return { ok: true, demoMode: true }
    }

    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${firebaseConfig.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestType: 'PASSWORD_RESET', email: normalizedEmail }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = data?.error?.message || 'Unable to send reset email'
      const error = new Error(message)
      const codeMap = {
        EMAIL_NOT_FOUND: 'auth/user-not-found',
        INVALID_EMAIL: 'auth/invalid-email',
        MISSING_EMAIL: 'auth/missing-email',
        TOO_MANY_ATTEMPTS_TRY_LATER: 'auth/too-many-requests',
        OPERATION_NOT_ALLOWED: 'auth/operation-not-allowed',
        INVALID_API_KEY: 'auth/api-key-not-valid',
        USER_DISABLED: 'auth/user-disabled',
      }
      error.code = codeMap[message] || message || 'auth/reset-failed'
      throw error
    }

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
