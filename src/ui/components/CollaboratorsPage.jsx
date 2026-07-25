import { CollaboratorMatch } from './CollaboratorMatch'
import '../styles/collaborators.css'

export function CollaboratorsPage({ activities, collaborators, isSampleData }) {
  return (
    <section className="collab">
      <div className="section-heading">
        <div>
          <p className="eyebrow">PARTNERSHIPS</p>
          <h2>Find a collaborator</h2>
        </div>
      </div>

      <CollaboratorMatch activities={activities} collaborators={collaborators} isSampleData={isSampleData} />
    </section>
  )
}
