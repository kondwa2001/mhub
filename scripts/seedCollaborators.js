/**
 * Bulk-load the collaborator directory into Firestore.
 *
 *   node --env-file=.env.local scripts/seedCollaborators.js collaborators.json
 *   node --env-file=.env.local scripts/seedCollaborators.js collaborators.json --dry-run
 *   node --env-file=.env.local scripts/seedCollaborators.js collaborators.json --allow-missing-tags
 *
 * The input file is a JSON array of records:
 *
 *   [
 *     {
 *       "name": "Example Foundation",
 *       "summary": "What they bring to a partnership.",
 *       "focusTags": ["digital-skills", "youth"],
 *       "supportTypes": ["funding", "mentorship"],
 *       "regions": ["Malawi", "Africa"],
 *       "website": "https://example.org",
 *       "contactEmail": "partnerships@example.org"
 *     }
 *   ]
 *
 * Every record is validated against mHub's focus areas BEFORE anything is
 * written, and the run aborts on the first invalid record. A partially seeded
 * directory is worse than an empty one, because the gap is invisible.
 *
 * This uses the same public web config and Firebase client SDK as the app, so
 * Firestore security rules apply exactly as they do in the browser. If your
 * rules require an authenticated user (they should), set SEED_EMAIL and
 * SEED_PASSWORD in the env file and the script signs in first.
 *
 * --allow-missing-tags skips the "needs at least one focusTags entry" check.
 * Use it only for a bulk import of confirmed real organisations whose focus
 * areas genuinely aren't known yet (e.g. a partner-logo list with no
 * descriptions) -- every tag that IS present is still validated. Records
 * seeded this way won't appear in donor matching until someone who knows the
 * partnership adds focus areas through the app's "Add collaborator" form.
 */
import { readFileSync } from 'node:fs'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { addDoc, collection, getDocs, getFirestore, serverTimestamp } from 'firebase/firestore'
import { isFocusArea, isSupportType } from '../src/backend/data/focusAreas.js'

const [, , inputPath, ...flags] = process.argv
const dryRun = flags.includes('--dry-run')
const allowMissingTags = flags.includes('--allow-missing-tags')

if (!inputPath) {
  console.error('Usage: node --env-file=.env.local scripts/seedCollaborators.js <file.json> [--dry-run]')
  process.exit(1)
}

/** Validate one record. Returns a list of human-readable problems. */
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

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

if (!firebaseConfig.projectId) {
  console.error('No Firebase project configured. Run with: node --env-file=.env.local scripts/seedCollaborators.js …')
  process.exit(1)
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

if (process.env.SEED_EMAIL && process.env.SEED_PASSWORD) {
  await signInWithEmailAndPassword(getAuth(app), process.env.SEED_EMAIL, process.env.SEED_PASSWORD)
  console.log(`Signed in as ${process.env.SEED_EMAIL}.`)
}

// Refuse to double-seed: running this twice should not silently duplicate the
// whole directory.
const existing = await getDocs(collection(db, 'collaborators'))
if (!existing.empty) {
  console.error(`The collaborators collection already holds ${existing.size} record(s).`)
  console.error('Delete them first, or add the remaining records through the app instead.')
  process.exit(1)
}

let written = 0
for (const record of records) {
  await addDoc(collection(db, 'collaborators'), {
    name: record.name.trim(),
    summary: record.summary?.trim() || '',
    focusTags: record.focusTags || [],
    supportTypes: record.supportTypes || [],
    regions: record.regions || [],
    website: record.website?.trim() || '',
    contactEmail: record.contactEmail?.trim() || '',
    logo: record.logo?.trim() || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  written += 1
  console.log(`  wrote ${record.name}`)
}

console.log(`\nSeeded ${written} collaborator(s) into Firestore.`)
process.exit(0)
