import { readFile } from 'node:fs/promises'
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app'
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore'

const projectId = process.env.FIREBASE_PROJECT_ID
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON

if (!projectId) {
  throw new Error('Set FIREBASE_PROJECT_ID before seeding Firestore.')
}

const credential = serviceAccount
  ? cert(JSON.parse(serviceAccount))
  : applicationDefault()

initializeApp({ credential, projectId })

const seed = JSON.parse(await readFile(new URL('../firebase/seed.firestore.json', import.meta.url), 'utf8'))
const db = getFirestore()
const batch = db.batch()

function asFirestoreValue(key, value) {
  if (value === 'SERVER_TIMESTAMP') return FieldValue.serverTimestamp()
  if (key === 'deadlineAt' || key === 'startsAt' || key === 'dueAt') return value ? Timestamp.fromDate(new Date(value)) : null
  return value
}

for (const [collectionName, documents] of Object.entries(seed)) {
  for (const [id, data] of Object.entries(documents)) {
    const values = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, asFirestoreValue(key, value)]))
    batch.set(db.collection(collectionName).doc(id), values, { merge: true })
  }
}

await batch.commit()
console.log('Firestore seed completed.')
