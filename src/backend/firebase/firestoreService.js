import { collection, doc, getDocs, setDoc } from 'firebase/firestore'
import { db } from './firebaseConfig'

// Use the Firebase SDK so Firestore security rules and Firebase Authentication
// are applied automatically to every request.
export async function getCollection(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName))
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
}

export async function saveOpportunity(opportunity) {
  const { id, ...data } = opportunity
  if (!id) throw new Error('An opportunity id is required')
  await setDoc(doc(db, 'opportunities', id), data, { merge: true })
  return { id, ...data }
}
