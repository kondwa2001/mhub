import { firebaseConfig } from './firebaseConfig'

const root = () => `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`

// REST keeps the client lightweight; route writes through secure Cloud Functions in production.
export async function getCollection(collection) {
  if (!firebaseConfig.projectId) return []
  const response = await fetch(`${root()}/${collection}`)
  if (!response.ok) throw new Error('Could not load Firestore data')
  return response.json()
}

export async function saveOpportunity(opportunity, token) {
  if (!firebaseConfig.projectId) throw new Error('Add Firebase values to .env.local first')
  const response = await fetch(`${root()}/opportunities?documentId=${opportunity.id}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fields: Object.fromEntries(Object.entries(opportunity).map(([key, value]) => [key, { stringValue: String(value) }])) }),
  })
  if (!response.ok) throw new Error('Could not save opportunity')
  return response.json()
}
