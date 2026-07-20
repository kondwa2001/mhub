import { addDoc, collection, doc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db, hasFirebaseConfig } from './firebaseConfig'
import { isFocusArea, normaliseFocusTags, normaliseSupportTypes } from '../data/focusAreas'

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

/** Read the collaborator directory, discarding any tag that is not one of
 * mHub's focus areas. Records written before a vocabulary change stay readable;
 * their stale tags are simply ignored rather than breaking the ranking. */
export async function getCollaborators() {
  const records = await getCollection('collaborators')
  return records.map((record) => ({
    ...record,
    focusTags: normaliseFocusTags(record.focusTags),
    supportTypes: normaliseSupportTypes(record.supportTypes),
    regions: Array.isArray(record.regions) ? record.regions : [record.regions].filter(Boolean),
  }))
}

/** Write a collaborator, enforcing that the database only ever holds
 * organisations described in mHub's own terms.
 *
 * A record must carry at least one focus area, and every tag must come from
 * the vocabulary -- an unrecognised tag is rejected outright rather than
 * quietly dropped, so a typo in an import script surfaces instead of silently
 * producing a collaborator that can never match anything. */
export async function saveCollaborator(collaborator) {
  const name = collaborator?.name?.trim()
  if (!name) throw new Error('A collaborator name is required.')

  const tags = Array.isArray(collaborator.focusTags) ? collaborator.focusTags : []
  const unknown = tags.filter((tag) => !isFocusArea(tag))
  if (unknown.length) {
    throw new Error(`Not one of mHub's focus areas: ${unknown.join(', ')}`)
  }
  if (!tags.length) {
    throw new Error('Tag the collaborator with at least one mHub focus area before saving.')
  }

  const record = {
    name,
    summary: collaborator.summary?.trim() || '',
    focusTags: normaliseFocusTags(tags),
    supportTypes: normaliseSupportTypes(collaborator.supportTypes),
    regions: (collaborator.regions || []).filter(Boolean),
    website: collaborator.website?.trim() || '',
    contactEmail: collaborator.contactEmail?.trim() || '',
    updatedAt: serverTimestamp(),
  }

  if (!hasFirebaseConfig || !db) return { id: collaborator.id || `local-${Date.now()}`, ...record }

  if (collaborator.id) {
    await setDoc(doc(db, 'collaborators', collaborator.id), record, { merge: true })
    return { id: collaborator.id, ...record }
  }
  const created = await addDoc(collection(db, 'collaborators'), { ...record, createdAt: serverTimestamp() })
  return { id: created.id, ...record }
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
