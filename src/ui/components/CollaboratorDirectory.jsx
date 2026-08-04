import { SUPPORT_TYPES, focusLabel, hasFocusArea } from '../../backend/data/focusAreas'
import { Icon } from './Icon'

const supportLabel = (id) => SUPPORT_TYPES.find((type) => type.id === id)?.label || id

export function CollaboratorDirectory({ collaborators, isSampleData }) {
  // A donor with no focus area can't be matched against any project, so it
  // has nothing useful to show here -- same rule the admin workspace applies.
  const visibleDonors = collaborators.filter(hasFocusArea)

  return (
    <div className="collab-directory">
      {isSampleData && (
        <div className="collab-notice">
          <Icon name="alert" />
          <p>
            <strong>Sample data.</strong> These are placeholder organisations, not real mHub partners.
            An administrator can add real donors from the admin workspace.
          </p>
        </div>
      )}

      <div className="collab-directory-head">
        <p className="eyebrow">
          {visibleDonors.length} {visibleDonors.length === 1 ? 'DONOR' : 'DONORS'}
        </p>
      </div>

      <div className="collab-list">
        {visibleDonors.map((collaborator) => (
          <article className="collab-card" key={collaborator.id || collaborator.name}>
            <div className="collab-card-head">
              <div>
                <h3>{collaborator.name}</h3>
                {collaborator.summary && <p>{collaborator.summary}</p>}
                {collaborator.collaborationFit && <p className="collab-fit">{collaborator.collaborationFit}</p>}
              </div>
            </div>
            <div className="collab-tags">
              {(collaborator.focusTags || []).map((tag) => (
                <span className="collab-tag matched" key={tag}>
                  {focusLabel(tag)}
                </span>
              ))}
            </div>
            {(collaborator.regions?.length > 0 || collaborator.supportTypes?.length > 0 || collaborator.contactEmail) && (
              <div className="collab-meta">
                {collaborator.regions?.length > 0 && <span>{collaborator.regions.join(' · ')}</span>}
                {collaborator.supportTypes?.length > 0 && (
                  <span>{collaborator.supportTypes.map(supportLabel).join(' · ')}</span>
                )}
                {collaborator.contactEmail && <span><a href={`mailto:${collaborator.contactEmail}`}>{collaborator.contactEmail}</a></span>}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
