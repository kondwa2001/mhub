import { useMemo, useState } from 'react'
import { FOCUS_AREAS, SUPPORT_TYPES, focusLabel } from '../../backend/data/focusAreas'
import { projectFromActivity, projectFromBrief, rankCollaborators } from '../../backend/matching/collaboratorMatching'
import { Icon } from './Icon'

const scoreBand = (score) => (score >= 75 ? 'strong' : score >= 50 ? 'fair' : 'weak')
const bandLabel = (score) => (score >= 75 ? 'Strong fit' : score >= 50 ? 'Possible fit' : 'Weak fit')

export function CollaboratorMatch({ activities, collaborators, isSampleData }) {
  const [mode, setMode] = useState('activity')
  const [activityIndex, setActivityIndex] = useState(0)
  const [brief, setBrief] = useState('')
  const [briefTitle, setBriefTitle] = useState('')
  const [supportTypes, setSupportTypes] = useState([])
  // null means "follow whatever the project text implies"; an array means the
  // user has taken manual control of the tags.
  const [tagOverride, setTagOverride] = useState(null)

  const selectedActivity = activities[activityIndex]

  const inferred = useMemo(() => {
    if (mode === 'activity') return projectFromActivity(selectedActivity || {})
    return projectFromBrief({ title: briefTitle, brief, supportTypes })
  }, [mode, selectedActivity, briefTitle, brief, supportTypes])

  const project = useMemo(
    () => ({ ...inferred, tags: tagOverride ?? inferred.tags, supportTypes }),
    [inferred, tagOverride, supportTypes]
  )

  const results = useMemo(() => rankCollaborators(project, collaborators), [project, collaborators])

  const toggleTag = (id) => {
    const current = tagOverride ?? inferred.tags
    setTagOverride(current.includes(id) ? current.filter((tag) => tag !== id) : [...current, id])
  }

  const toggleSupport = (id) => {
    setSupportTypes((current) => (current.includes(id) ? current.filter((type) => type !== id) : [...current, id]))
  }

  const switchMode = (next) => {
    setMode(next)
    setTagOverride(null)
  }

  const hasProject = mode === 'activity' ? Boolean(selectedActivity) : Boolean(brief.trim() || project.tags.length)

  return (
    <>
      <p className="collab-intro">
        Rank the organisations in your directory by how well they fit funding or partnering on a
        piece of mHub work. Matching is based on shared focus areas, so every result explains itself.
      </p>

      {isSampleData && (
        <div className="collab-notice">
          <Icon name="alert" />
          <p>
            <strong>Sample data.</strong> These results rank placeholder organisations, not real mHub
            partners. Add real donors in the Directory tab before relying on any of this.
          </p>
        </div>
      )}

      <div className="collab-modes" role="tablist" aria-label="Project source">
        <button
          role="tab"
          aria-selected={mode === 'activity'}
          className={mode === 'activity' ? 'collab-mode active' : 'collab-mode'}
          onClick={() => switchMode('activity')}
        >
          <Icon name="calendar" />
          Use an activity
        </button>
        <button
          role="tab"
          aria-selected={mode === 'brief'}
          className={mode === 'brief' ? 'collab-mode active' : 'collab-mode'}
          onClick={() => switchMode('brief')}
        >
          <Icon name="spark" />
          Describe a project
        </button>
      </div>

      <div className="collab-form">
        {mode === 'activity' ? (
          <label className="collab-field">
            <span>Activity</span>
            <select
              value={activityIndex}
              onChange={(event) => {
                setActivityIndex(Number(event.target.value))
                setTagOverride(null)
              }}
            >
              {activities.map((activity, index) => (
                <option key={activity.id || activity.title} value={index}>
                  {activity.title}
                </option>
              ))}
            </select>
            {selectedActivity && <small>{selectedActivity.description || selectedActivity.copy}</small>}
          </label>
        ) : (
          <>
            <label className="collab-field">
              <span>Project name</span>
              <input
                value={briefTitle}
                onChange={(event) => setBriefTitle(event.target.value)}
                placeholder="e.g. Rural digital skills roadshow"
              />
            </label>
            <label className="collab-field">
              <span>What is the project about?</span>
              <textarea
                rows="4"
                value={brief}
                onChange={(event) => {
                  setBrief(event.target.value)
                  setTagOverride(null)
                }}
                placeholder="Describe the work, who it reaches, and what you need from a partner…"
              />
              <small>Focus areas are picked up from this text. Adjust them below if anything is off.</small>
            </label>
          </>
        )}

        <fieldset className="collab-field">
          <legend>Focus areas</legend>
          <div className="collab-chips">
            {FOCUS_AREAS.map((area) => (
              <button
                key={area.id}
                type="button"
                aria-pressed={project.tags.includes(area.id)}
                className={project.tags.includes(area.id) ? 'collab-chip active' : 'collab-chip'}
                onClick={() => toggleTag(area.id)}
              >
                {area.label}
              </button>
            ))}
          </div>
          {tagOverride && (
            <button type="button" className="collab-reset" onClick={() => setTagOverride(null)}>
              Reset to suggested
            </button>
          )}
        </fieldset>

        <fieldset className="collab-field">
          <legend>Support needed (optional)</legend>
          <div className="collab-chips">
            {SUPPORT_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                aria-pressed={supportTypes.includes(type.id)}
                className={supportTypes.includes(type.id) ? 'collab-chip active' : 'collab-chip'}
                onClick={() => toggleSupport(type.id)}
              >
                {type.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="collab-results">
        <p className="eyebrow">
          {results.length} {results.length === 1 ? 'MATCH' : 'MATCHES'}
        </p>

        {!hasProject && <p className="collab-empty">Choose an activity or describe a project to see matches.</p>}

        {hasProject && !project.tags.length && (
          <p className="collab-empty">
            No focus areas picked up from this project yet. Pick one or more above to match against
            the directory.
          </p>
        )}

        {hasProject && project.tags.length > 0 && results.length === 0 && (
          <p className="collab-empty">
            No donor in the directory works in these focus areas. Widen the focus areas, or add
            a donor that covers this work.
          </p>
        )}

        <div className="collab-list">
          {results.map(({ collaborator, score, matchedTags, missingTags, reasons }) => (
            <article className="collab-card" key={collaborator.id || collaborator.name}>
              <div className="collab-card-head">
                <div>
                  <h3>{collaborator.name}</h3>
                  {collaborator.summary && <p>{collaborator.summary}</p>}
                  {collaborator.collaborationFit && <p className="collab-fit">{collaborator.collaborationFit}</p>}
                </div>
                <div className={`collab-score ${scoreBand(score)}`}>
                  <strong>{score}</strong>
                  <span>{bandLabel(score)}</span>
                </div>
              </div>

              <div className="collab-tags">
                {matchedTags.map((tag) => (
                  <span className="collab-tag matched" key={tag}>
                    {focusLabel(tag)}
                  </span>
                ))}
                {missingTags.map((tag) => (
                  <span className="collab-tag missing" key={tag}>
                    {focusLabel(tag)}
                  </span>
                ))}
              </div>

              <ul className="collab-reasons">
                {reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>

              {(collaborator.regions?.length > 0 || collaborator.supportTypes?.length > 0) && (
                <div className="collab-meta">
                  {collaborator.regions?.length > 0 && <span>{collaborator.regions.join(' · ')}</span>}
                  {collaborator.supportTypes?.length > 0 && (
                    <span>
                      {collaborator.supportTypes
                        .map((type) => SUPPORT_TYPES.find((entry) => entry.id === type)?.label || type)
                        .join(' · ')}
                    </span>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </>
  )
}
