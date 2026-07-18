import { useEffect, useRef, useState } from 'react'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, updateProfile } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { SessionContext } from './sessionContext'
import { auth, db } from '../backend/firebase/firebaseConfig'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const registeringRef = useRef(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!registeringRef.current) {
        setUser(firebaseUser ? { uid: firebaseUser.uid, name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'MHub member', email: firebaseUser.email } : null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const register = async ({ name, email, password }) => {
    registeringRef.current = true
    setUser(null)
    let accountCreated = false
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      accountCreated = true
      await updateProfile(credential.user, { displayName: name })
      await setDoc(doc(db, 'users', credential.user.uid), { displayName: name, email: credential.user.email, photoURL: null, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true })
    } finally {
      try {
        if (accountCreated) await firebaseSignOut(auth)
      } finally {
        registeringRef.current = false
        setUser(null)
      }
    }
  }

  const signIn = ({ email, password }) => signInWithEmailAndPassword(auth, email, password)
  const signOut = () => firebaseSignOut(auth)

  return <SessionContext.Provider value={{ user, loading, register, signIn, signOut }}>{children}</SessionContext.Provider>
}
