/**
 * Bulk-load the collaborator directory into Firestore using a service
 * account, bypassing client-side security rules entirely (admin SDK writes
 * are never rules-checked). Use this instead of seedCollaborators.js when
 * there's no signed-in app user with the admin custom claim available yet.
 *
 *   node scripts/seedCollaboratorsAdmin.mjs <file.json> <service-account.json> [--dry-run] [--allow-missing-tags]
 */
import { readFileSync } from 'node:fs'
import { cert, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { isFocusArea, isSupportType } from '../src/backend/data/focusAreas.js'

const [, , inputPath, serviceAccountPath, ...flags] = process.argv
const dryRun = flags.includes('--dry-run')
const allowMissingTags = flags.includes('--allow-missing-tags')

if (!inputPath || !serviceAccountPath) {
  console.error('Usage: node scripts/seedCollaboratorsAdmin.mjs <collaborators.json> <service-account.json> [--dry-run] [--allow-missing-tags]')
  process.exit(1)
}

function problemsWith(record, index) {
  const where = `record ${index + 1}${record?.name ? ` (${record.name})` : ''}`
  const problems = []

  if (!record || typeof record !== 'object') return [`${where}: not an object`]
  if (!record.name?.trim()) problems.push(`${where}: missing "name"`)

  const tags = Array.isArray(record.focusTags) ? record.focusTags : []
  if (!tags.length && !allowMissingTags) problems.push(`${where}: needs at least one focusTags entry`)
  for (const tag of tags) {
    if (!isFocusArea(tag)) problems.push(`${where}: "${tag}" is not one of mHub's focus areas`)
  }

  const support = Array.isArray(record.supportTypes) ? record.supportTypes : []
  for (const type of support) {
    if (!isSupportType(type)) problems.push(`${where}: "${type}" is not a known support type`)
  }

  return problems
}

let records
try {
  records = JSON.parse(readFileSync(inputPath, 'utf8'))
} catch (error) {
  console.error(`Could not read ${inputPath}: ${error.message}`)
  process.exit(1)
}

if (!Array.isArray(records)) {
  console.error('The input file must contain a JSON array of collaborator records.')
  process.exit(1)
}

const problems = records.flatMap(problemsWith)
if (problems.length) {
  console.error(`Refusing to seed -- ${problems.length} problem(s) found:\n`)
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}

console.log(`${records.length} record(s) validated against mHub's focus areas.`)
if (allowMissingTags) {
  const untagged = records.filter((record) => !record.focusTags?.length)
  if (untagged.length) console.log(`${untagged.length} record(s) have no focus areas and won't appear in donor matching until tagged.`)
}

if (dryRun) {
  for (const record of records) console.log(`  would write: ${record.name} [${(record.focusTags || []).join(', ') || 'untagged'}]`)
  console.log('\nDry run -- nothing written.')
  process.exit(0)
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))
initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id })
const db = getFirestore()

const existing = await db.collection('collaborators').get()
if (!existing.empty) {
  console.error(`The collaborators collection already holds ${existing.size} record(s).`)
  console.error('Delete them first, or add the remaining records through the app instead.')
  process.exit(1)
}

const batch = db.batch()
for (const record of records) {
  const ref = db.collection('collaborators').doc()
  batch.set(ref, {
    name: record.name.trim(),
    summary: record.summary?.trim() || '',
    collaborationFit: record.collaborationFit?.trim() || '',
    focusTags: record.focusTags || [],
    supportTypes: record.supportTypes || [],
    regions: record.regions || [],
    website: record.website?.trim() || '',
    contactEmail: record.contactEmail?.trim() || '',
    logo: record.logo?.trim() || '',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })
}
await batch.commit()

console.log(`\nSeeded ${records.length} collaborator(s) into Firestore.`)
process.exit(0)
