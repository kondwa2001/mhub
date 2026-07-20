import { addDoc, collection, doc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db, hasFirebaseConfig } from './firebaseConfig'

// Use the Firebase SDK so Firestore security rules and Firebase Authentication
// are applied automatically to every request.
export async function getCollection(collectionName) {
  if (!hasFirebaseConfig || !db) return []
  const snapshot = await getDocs(collection(db, collectionName))
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
}

export async function saveOpportunity(opportunity) {
  if (!hasFirebaseConfig || !db) return { ...opportunity }
  const { id, ...data } = opportunity
  if (!id) throw new Error('An opportunity id is required')
  await setDoc(doc(db, 'opportunities', id), data, { merge: true })
  return { id, ...data }
}

export async function createActivity(activity) {
  const dueAt = activity.dueAt instanceof Date ? activity.dueAt : new Date(activity.dueAt)
  if (!activity.title?.trim() || Number.isNaN(dueAt.getTime())) {
    throw new Error('An activity title and due date are required.')
  }

  if (!hasFirebaseConfig || !db) {
    return { id: `local-${Date.now()}`, ...activity, dueAt, startsAt: dueAt, status: 'upcoming' }
  }

  const record = await addDoc(collection(db, 'activities'), {
    title: activity.title.trim(),
    type: activity.type?.trim() || 'Activity',
    description: activity.description?.trim() || '',
    dueAt,
    startsAt: dueAt,
    status: 'upcoming',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return { id: record.id, ...activity, dueAt, startsAt: dueAt, status: 'upcoming' }
}

export async function createContactRequest({ donorId, donorName, message, user }) {
  if (!donorId || !user?.uid) throw new Error('Please sign in before sending a contact request.')
  if (!hasFirebaseConfig || !db) return `local-${Date.now()}`
  const request = await addDoc(collection(db, 'contactRequests'), {
    donorId, donorName, message: message.trim(), requesterId: user.uid,
    requesterName: user.name || '', requesterEmail: user.email || '',
    status: 'new', createdAt: serverTimestamp(),
  })
  return request.id
}

export function subscribeToNotifications(userId, onChange) {
  if (!userId || !hasFirebaseConfig || !db) {
    onChange([])
    return () => {}
  }
  const notifications = query(collection(db, 'users', userId, 'notifications'), orderBy('createdAt', 'desc'), limit(30))
  return onSnapshot(notifications, (snapshot) => {
    onChange(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
  }, () => onChange([]))
}

export async function markNotificationRead(userId, notificationId) {
  if (!userId || !notificationId || !hasFirebaseConfig || !db) return
  await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), { read: true })
}
