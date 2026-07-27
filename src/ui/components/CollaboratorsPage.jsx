import { useState } from 'react'
import { CollaboratorMatch } from './CollaboratorMatch'
import { CollaboratorDirectory } from './CollaboratorDirectory'
import { Icon } from './Icon'
import '../styles/collaborators.css'

export function CollaboratorsPage({ activities, collaborators, isSampleData, onCollaboratorAdded }) {
  // Directory first: it's the unfiltered list of every donor on file. "Match a
  // project" only shows donors that share a focus tag with a chosen activity,
  // so landing there by default hid real records (many have no tags yet).
  const [view, setView] = useState('directory')

  return (
    <section className="collab">
      <div className="section-heading">
        <div>
          <p className="eyebrow">PARTNERSHIPS</p>
          <h2>Donors</h2>
        </div>
      </div>

      <div className="collab-views" role="tablist" aria-label="Donor views">
        <button
          role="tab"
          aria-selected={view === 'match'}
          className={view === 'match' ? 'collab-view active' : 'collab-view'}
          onClick={() => setView('match')}
        >
          <Icon name="target" />
          Match a project
        </button>
        <button
          role="tab"
          aria-selected={view === 'directory'}
          className={view === 'directory' ? 'collab-view active' : 'collab-view'}
          onClick={() => setView('directory')}
        >
          <Icon name="grid" />
          Donors
        </button>
      </div>

      {view === 'match' ? (
        <CollaboratorMatch activities={activities} collaborators={collaborators} isSampleData={isSampleData} />
      ) : (
        <CollaboratorDirectory
          collaborators={collaborators}
          isSampleData={isSampleData}
          onAdded={onCollaboratorAdded}
        />
      )}
    </section>
  )
}
