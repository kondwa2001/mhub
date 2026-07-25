/**
 * Sync collaborator field edits from the JSON file into Firestore, matching
 * existing documents by name. Use this instead of seedCollaboratorsAdmin.mjs
 * once the collection is already populated -- that script refuses to touch a
 * non-empty collection, this one is built for exactly that case: the JSON
 * file is treated as the source of truth and its curatable fields overwrite
 * whatever is already stored, without creating new documents or touching
 * `logo`/`createdAt`.
 *
 *   node scripts/updateCollaboratorsAdmin.mjs <file.json> <service-account.json> [--dry-run]
 */
import { readFileSync } from 'node:fs'
import { cert, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { isFocusArea, isSupportType } from '../src/backend/data/focusAreas.js'

const [, , inputPath, serviceAccountPath, ...flags] = process.argv
const dryRun = flags.includes('--dry-run')

if (!inputPath || !serviceAccountPath) {
  console.error('Usage: node scripts/updateCollaboratorsAdmin.mjs <collaborators.json> <service-account.json> [--dry-run]')
  process.exit(1)
}

function problemsWith(record, index) {
  const where = `record ${index + 1}${record?.name ? ` (${record.name})` : ''}`
  const problems = []
  if (!record?.name?.trim()) problems.push(`${where}: missing "name"`)
  for (const tag of record.focusTags || []) {
    if (!isFocusArea(tag)) problems.push(`${where}: "${tag}" is not one of mHub's focus areas`)
  }
  for (const type of record.supportTypes || []) {
    if (!isSupportType(type)) problems.push(`${where}: "${type}" is not a known support type`)
  }
  return problems
}

const records = JSON.parse(readFileSync(inputPath, 'utf8'))
const problems = records.flatMap(problemsWith)
if (problems.length) {
  console.error(`Refusing to update -- ${problems.length} problem(s) found:\n`)
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))
initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id })
const db = getFirestore()

const existing = await db.collection('collaborators').get()
const byName = new Map(existing.docs.map((doc) => [doc.data().name?.trim(), doc]))

const matched = []
const unmatched = []
for (const record of records) {
  const doc = byName.get(record.name.trim())
  if (doc) matched.push([record, doc])
  else unmatched.push(record.name)
}

console.log(`${matched.length} record(s) matched an existing document by name.`)
if (unmatched.length) {
  console.log(`${unmatched.length} record(s) had no matching document and will be skipped: ${unmatched.join(', ')}`)
}

if (dryRun) {
  for (const [record] of matched) console.log(`  would update: ${record.name}`)
  console.log('\nDry run -- nothing written.')
  process.exit(0)
}

const batch = db.batch()
for (const [record] of matched) {
  batch.update(byName.get(record.name.trim()).ref, {
    summary: record.summary?.trim() || '',
    collaborationFit: record.collaborationFit?.trim() || '',
    focusTags: record.focusTags || [],
    supportTypes: record.supportTypes || [],
    regions: record.regions || [],
    website: record.website?.trim() || '',
    contactEmail: record.contactEmail?.trim() || '',
    updatedAt: FieldValue.serverTimestamp(),
  })
}
await batch.commit()

console.log(`\nUpdated ${matched.length} collaborator(s) in Firestore.`)
process.exit(0)
