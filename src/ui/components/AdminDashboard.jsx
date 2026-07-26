import { useMemo } from 'react'
import { focusLabel } from '../../backend/data/focusAreas'
import { Icon } from './Icon'
import '../styles/admin.css'

function words(text) {
  return (text || '').toLowerCase().match(/[a-z]{4,}/g) || []
}

/** Which mHub activity a donor's stated focus best overlaps with -- a plain
 * keyword match, not the tag-based scoring collaboratorMatching.js uses,
 * since donor opportunities don't carry mHub's focus-area vocabulary. */
function bestMatchingActivity(donor, activities) {
  const donorWords = new Set(words(`${donor.focus || ''} ${donor.description || ''}`))
  if (!donorWords.size) return null

  let best = null
  let bestScore = 0
  for (const activity of activities) {
    const score = words(`${activity.title || ''} ${activity.type || ''} ${activity.description || activity.copy || ''}`)
      .filter((word) => donorWords.has(word)).length
    if (score > bestScore) {
      bestScore = score
      best = activity
    }
  }
  return best
}

export function AdminDashboard({ collaborators, donors, activities, isSampleData }) {
  const donorMatches = useMemo(
    () => new Map(donors.map((donor) => [donor.id || donor.name, bestMatchingActivity(donor, activities)])),
    [donors, activities],
  )

  return (
    <section className="admin">
      <div className="section-heading">
        <div>
          <p className="eyebrow">WORKSPACE ADMIN</p>
          <h2>Admin dashboard</h2>
        </div>
      </div>

      <p className="admin-intro">
        A read-only view of everything registered in mHub -- every collaborator in the partner
        directory, every donor on file and the mHub project their focus best matches, and every
        activity the team has published.
      </p>

      {isSampleData && (
        <div className="admin-notice">
          <Icon name="alert" />
          <p>
            <strong>Sample data.</strong> Collaborators are still showing placeholders because nothing
            real has been saved to Firestore yet.
          </p>
        </div>
      )}

      <div className="admin-stats" aria-label="Workspace totals">
        <div className="admin-stat">
          <strong>{collaborators.length}</strong>
          <p>Collaborators</p>
        </div>
        <div className="admin-stat">
          <strong>{donors.length}</strong>
          <p>Donors</p>
        </div>
        <div className="admin-stat">
          <strong>{activities.length}</strong>
          <p>Activities &amp; projects</p>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-head">
          <p className="eyebrow">{collaborators.length} {collaborators.length === 1 ? 'COLLABORATOR' : 'COLLABORATORS'}</p>
        </div>
        {collaborators.length === 0 ? (
          <p className="admin-empty">No collaborators registered yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Focus areas</th>
                  <th>Regions</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {collaborators.map((collaborator) => (
                  <tr key={collaborator.id || collaborator.name}>
                    <td>
                      <strong>{collaborator.name}</strong>
                      {collaborator.summary && <span className="admin-cell-sub">{collaborator.summary}</span>}
                    </td>
                    <td>{(collaborator.focusTags || []).map(focusLabel).join(', ') || '—'}</td>
                    <td>{(collaborator.regions || []).join(', ') || '—'}</td>
                    <td>{collaborator.contactEmail || collaborator.website || '—'}</td>
                  </tr>
                ))}
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
