import { useMemo, useState } from 'react'
import { FOCUS_AREAS, SUPPORT_TYPES, focusLabel, hasFocusArea } from '../../backend/data/focusAreas'
import { saveCollaborator } from '../../backend/firebase/firestoreService'
import { Icon } from './Icon'
import '../styles/admin.css'
import '../styles/collaborators.css'

const EMPTY_COLLABORATOR = {
  name: '',
  summary: '',
  collaborationFit: '',
  website: '',
  contactEmail: '',
  regions: '',
  focusTags: [],
  supportTypes: [],
}

function words(text) {
  return (text || '').toLowerCase().match(/[a-z]{4,}/g) || []
}

/** Plain keyword overlap -- not the tag-based scoring collaboratorMatching.js
 * uses, since donor opportunities don't carry mHub's focus-area vocabulary
 * and this needs to compare across activities, donors, and collaborators
 * with one shared method. */
function bestByWordOverlap(queryText, candidates, candidateText) {
  const queryWords = new Set(words(queryText))
  if (!queryWords.size) return null

  let best = null
  let bestScore = 0
  for (const candidate of candidates) {
    const score = words(candidateText(candidate)).filter((word) => queryWords.has(word)).length
    if (score > bestScore) {
      bestScore = score
      best = candidate
    }
  }
  return best
}

/** Which mHub activity a donor's stated focus best overlaps with. */
function bestMatchingActivity(donor, activities) {
  return bestByWordOverlap(
    `${donor.focus || ''} ${donor.description || ''}`,
    activities,
    (activity) => `${activity.title || ''} ${activity.type || ''} ${activity.description || activity.copy || ''}`,
  )
}

const collaboratorQueryText = (collaborator) =>
  `${(collaborator.focusTags || []).map(focusLabel).join(' ')} ${collaborator.summary || ''} ${collaborator.collaborationFit || ''}`

/** Which mHub activity best overlaps with a collaborator's focus areas and description. */
function bestMatchingActivityForCollaborator(collaborator, activities) {
  return bestByWordOverlap(
    collaboratorQueryText(collaborator),
    activities,
    (activity) => `${activity.title || ''} ${activity.type || ''} ${activity.description || activity.copy || ''}`,
  )
}

/** Which donor on file best overlaps with a collaborator's focus areas and description. */
function bestMatchingDonorForCollaborator(collaborator, donors) {
  return bestByWordOverlap(
    collaboratorQueryText(collaborator),
    donors,
    (donor) => `${donor.name || ''} ${donor.focus || ''} ${donor.description || ''}`,
  )
}

/** The donor-add form itself, shown under the collaborators panel head once
 * an admin opens it with the "Add donor" toggle. */
function DonorForm({ onAdded, onDone }) {
  const [form, setForm] = useState(EMPTY_COLLABORATOR)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const setField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const toggle = (field, id) =>
    setForm((current) => ({
      ...current,
      [field]: current[field].includes(id) ? current[field].filter((v) => v !== id) : [...current[field], id],
    }))

  const submit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.name.trim()) return setError('Give the donor a name.')
    if (!form.focusTags.length) return setError('Pick at least one mHub focus area.')

    setSaving(true)
    try {
      const record = await saveCollaborator({
        ...form,
        regions: form.regions.split(',').map((region) => region.trim()).filter(Boolean),
      })
      onAdded(record)
      onDone(record.name)
    } catch (saveError) {
      setError(saveError?.message || 'Could not save this donor. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="collab-form" onSubmit={submit}>
      <label className="collab-field">
        <span>Name</span>
        <input value={form.name} onChange={setField('name')} placeholder="Organisation name" />
      </label>

      <label className="collab-field">
        <span>What they do</span>
        <textarea
          rows="3"
          value={form.summary}
          onChange={setField('summary')}
          placeholder="One or two lines on what this organisation brings to a partnership…"
        />
      </label>

      <label className="collab-field">
        <span>Fit for mHub</span>
        <textarea
          rows="2"
          value={form.collaborationFit}
          onChange={setField('collaborationFit')}
          placeholder="Why this organisation is a good match for mHub specifically…"
        />
      </label>

      <fieldset className="collab-field">
        <legend>Focus areas</legend>
        <div className="collab-chips">
          {FOCUS_AREAS.map((area) => (
            <button
              key={area.id}
              type="button"
              aria-pressed={form.focusTags.includes(area.id)}
              className={form.focusTags.includes(area.id) ? 'collab-chip active' : 'collab-chip'}
              onClick={() => toggle('focusTags', area.id)}
            >
              {area.label}
            </button>
          ))}
        </div>
        <small>Only mHub&rsquo;s focus areas can be stored. At least one is required.</small>
      </fieldset>

      <fieldset className="collab-field">
        <legend>What they can offer</legend>
        <div className="collab-chips">
          {SUPPORT_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              aria-pressed={form.supportTypes.includes(type.id)}
              className={form.supportTypes.includes(type.id) ? 'collab-chip active' : 'collab-chip'}
              onClick={() => toggle('supportTypes', type.id)}
            >
              {type.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="collab-field">
        <span>Regions</span>
        <input value={form.regions} onChange={setField('regions')} placeholder="Malawi, Africa" />
        <small>Comma separated.</small>
      </label>

      <div className="collab-field-row">
        <label className="collab-field">
          <span>Website</span>
          <input value={form.website} onChange={setField('website')} placeholder="https://" />
        </label>
        <label className="collab-field">
          <span>Contact email</span>
          <input value={form.contactEmail} onChange={setField('contactEmail')} placeholder="name@example.org" />
        </label>
      </div>

      {error && <p className="collab-error">{error}</p>}

      <button className="collab-submit" disabled={saving}>
        <Icon name="save" />
        {saving ? 'Saving…' : 'Save donor'}
      </button>
    </form>
  )
}

export function AdminDashboard({ collaborators, donors, activities, isSampleData, onCollaboratorAdded }) {
  const [addDonorOpen, setAddDonorOpen] = useState(false)
  const [savedDonor, setSavedDonor] = useState('')

  // A collaborator with no focus area can't be matched against anything, so
  // it's excluded from every donor count and list here -- the same rule the
  // member-facing directory applies.
  const visibleCollaborators = useMemo(() => collaborators.filter(hasFocusArea), [collaborators])

  const donorMatches = useMemo(
    () => new Map(donors.map((donor) => [donor.id || donor.name, bestMatchingActivity(donor, activities)])),
    [donors, activities],
  )
  const collaboratorActivityMatches = useMemo(
    () => new Map(visibleCollaborators.map((collaborator) => [collaborator.id || collaborator.name, bestMatchingActivityForCollaborator(collaborator, activities)])),
    [visibleCollaborators, activities],
  )
  const collaboratorDonorMatches = useMemo(
    () => new Map(visibleCollaborators.map((collaborator) => [collaborator.id || collaborator.name, bestMatchingDonorForCollaborator(collaborator, donors)])),
    [visibleCollaborators, donors],
  )

  const closeDonorForm = (name) => {
    setAddDonorOpen(false)
    setSavedDonor(name)
  }

  return (
    <section className="admin">
      <div className="section-heading">
        <div>
          <p className="eyebrow">WORKSPACE ADMIN</p>
          <h2>Overview</h2>
        </div>
      </div>

      <p className="admin-intro">
        Everything registered in mHub -- every collaborator in the partner directory (added here),
        every donor on file and the mHub project their focus best matches, and every activity the
        team has published.
      </p>

      {isSampleData && (
        <div className="admin-notice">
          <Icon name="alert" />
          <p>
            <strong>Sample data.</strong> Collaborators are still showing placeholders until a real
            one is added below.
          </p>
        </div>
      )}

      <div className="admin-stats" aria-label="Workspace totals">
        <div className="admin-stat">
          <strong>{visibleCollaborators.length}</strong>
          <p>Collaborators</p>
        </div>
        <div className="admin-stat">
          {/* Same partner directory the member side counts as "Potential
              donors" -- keeps the two Overview screens showing one number
              instead of this stat quietly counting the separate, unused
              opportunities collection. */}
          <strong>{visibleCollaborators.length}</strong>
          <p>Donors</p>
        </div>
        <div className="admin-stat">
          <strong>{activities.length}</strong>
          <p>Activities &amp; projects</p>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-head">
          <p className="eyebrow">{visibleCollaborators.length} {visibleCollaborators.length === 1 ? 'COLLABORATOR' : 'COLLABORATORS'}</p>
          <button
            className="collab-add"
            onClick={() => { setAddDonorOpen((current) => !current); setSavedDonor('') }}
          >
            <Icon name={addDonorOpen ? 'chevron' : 'spark'} />
            {addDonorOpen ? 'Cancel' : 'Add donor'}
          </button>
        </div>

        {savedDonor && !addDonorOpen && (
          <div className="collab-notice success">
            <Icon name="check" />
            <p>{savedDonor} added to the directory.</p>
          </div>
        )}

        {addDonorOpen && <DonorForm onAdded={onCollaboratorAdded} onDone={closeDonorForm} />}

        {visibleCollaborators.length === 0 ? (
          <p className="admin-empty">No collaborators registered yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Focus areas</th>
                  <th>Regions</th>
                  <th>Best-matching activity</th>
                  <th>Best-matching donor</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {visibleCollaborators.map((collaborator) => {
                  const key = collaborator.id || collaborator.name
                  const activityMatch = collaboratorActivityMatches.get(key)
                  const donorMatch = collaboratorDonorMatches.get(key)
                  return (
                    <tr key={key}>
                      <td>
                        <strong>{collaborator.name}</strong>
                        {collaborator.summary && <span className="admin-cell-sub">{collaborator.summary}</span>}
                      </td>
                      <td>{(collaborator.focusTags || []).map(focusLabel).join(', ') || '—'}</td>
                      <td>{(collaborator.regions || []).join(', ') || '—'}</td>
                      <td>{activityMatch ? activityMatch.title : '—'}</td>
                      <td>{donorMatch ? donorMatch.name : '—'}</td>
                      <td>{collaborator.contactEmail || collaborator.website || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-panel">
        <div className="admin-panel-head">
          <p className="eyebrow">{donors.length} {donors.length === 1 ? 'DONOR' : 'DONORS'}</p>
        </div>
        {donors.length === 0 ? (
          <p className="admin-empty">No donors registered yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Focus</th>
                  <th>Best-matching mHub project</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {donors.map((donor) => {
                  const match = donorMatches.get(donor.id || donor.name)
                  return (
                    <tr key={donor.id || donor.name}>
                      <td><strong>{donor.name}</strong></td>
                      <td>{donor.focus || '—'}</td>
                      <td>{match ? match.title : 'No current match'}</td>
                      <td>{donor.status === 'open' || (!donor.status && donor.deadline !== 'Closed') ? 'Open' : donor.deadline || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-panel">
        <div className="admin-panel-head">
          <p className="eyebrow">{activities.length} {activities.length === 1 ? 'ACTIVITY' : 'ACTIVITIES'}</p>
        </div>
        {activities.length === 0 ? (
          <p className="admin-empty">No activities published yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr key={activity.id || activity.title}>
                    <td><strong>{activity.title}</strong></td>
                    <td>{activity.type || '—'}</td>
                    <td>{activity.description || activity.copy || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
