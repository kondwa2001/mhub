/**
 * Delete donor records from the `collaborators` collection that carry no
 * real information -- no summary, no fit-for-mHub note, no focus tags, no
 * website, and no contact email. These are typically test entries created
 * with just a name and region and never filled in.
 *
 *   node scripts/removeIncompleteDonors.mjs <service-account.json> [--dry-run]
 *
 * Always run with --dry-run first to see exactly what would be deleted.
 */
import { readFileSync } from 'node:fs'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const [, , serviceAccountPath, ...flags] = process.argv
const dryRun = flags.includes('--dry-run')

if (!serviceAccountPath) {
  console.error('Usage: node scripts/removeIncompleteDonors.mjs <service-account.json> [--dry-run]')
  process.exit(1)
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))
initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id })
const db = getFirestore()

function isEmpty(record) {
  return !record.summary?.trim()
    && !record.collaborationFit?.trim()
    && !(record.focusTags || []).length
    && !record.website?.trim()
    && !record.contactEmail?.trim()
}

const snapshot = await db.collection('collaborators').get()
const incomplete = snapshot.docs.filter((doc) => isEmpty(doc.data()))

console.log(`${snapshot.size} donor(s) total, ${incomplete.length} with no information.\n`)

if (!incomplete.length) {
  console.log('Nothing to delete.')
  process.exit(0)
}

for (const doc of incomplete) {
  console.log(`  - ${doc.data().name || '(unnamed)'} [${doc.id}]`)
}

if (dryRun) {
  console.log('\nDry run -- nothing deleted.')
  process.exit(0)
}

const batch = db.batch()
for (const doc of incomplete) batch.delete(doc.ref)
await batch.commit()

console.log(`\nDeleted ${incomplete.length} donor(s).`)
process.exit(0)
