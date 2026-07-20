import { useState } from 'react'
import { CollaboratorMatch } from './CollaboratorMatch'
import { CollaboratorDirectory } from './CollaboratorDirectory'
import { Icon } from './Icon'
import '../styles/collaborators.css'

export function CollaboratorsPage({ activities, collaborators, isSampleData, onCollaboratorAdded }) {
  const [view, setView] = useState('match')

  return (
    <section className="collab">
      <div className="section-heading">
        <div>
          <p className="eyebrow">PARTNERSHIPS</p>
          <h2>Collaborators</h2>
        </div>
      </div>

      <div className="collab-views" role="tablist" aria-label="Collaborator views">
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
          Directory
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
